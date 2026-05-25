"""
Agentic RAG strategy.

Implements a tool-using agent loop where the LLM plans which
retrieval tool to call, accumulates context across iterations,
and stops when it has enough information to answer.
"""

from __future__ import annotations

import re
from typing import Generator, Optional

from src.generation.base import BaseLLM
from src.generation.prompts import AGENT_PLAN_PROMPT, RAG_SYSTEM_PROMPT, RAG_USER_PROMPT
from src.generation.response import ResponseFormatter
from src.models import QueryResult, RetrievalResult
from src.query.contextualizer import QueryContextualizer
from src.query.decomposer import QueryDecomposer
from src.query.rewriter import QueryRewriter
from src.retrieval.dense_retriever import DenseRetriever
from src.retrieval.hybrid_retriever import HybridRetriever
from src.retrieval.reranker import CrossEncoderReranker
from src.retrieval.sparse_retriever import SparseRetriever
from src.strategies.base import BaseRAGStrategy
from src.utils.logger import get_logger

log = get_logger(__name__)


class AgenticRAGStrategy(BaseRAGStrategy):
    """
    Agentic RAG with a tool-use planning loop.

    The LLM iteratively decides which tool to invoke:
      - ``vector_search``: dense similarity search
      - ``bm25_search``: keyword search
      - ``query_rewrite``: rewrite the query
      - ``query_decompose``: break into sub-questions
      - ``done``: enough context gathered

    Args:
        retriever: Hybrid retriever.
        dense_retriever: Dense-only retriever (for vector_search tool).
        sparse_retriever: BM25-only retriever (for bm25_search tool).
        reranker: Optional cross-encoder reranker.
        llm: Language model.
        query_rewriter: Query rewriter.
        query_decomposer: Query decomposer.
        top_k: Number of context docs per tool call.
        max_iterations: Maximum agent loop iterations.
    """

    def __init__(
        self,
        retriever: HybridRetriever,
        dense_retriever: DenseRetriever,
        sparse_retriever: SparseRetriever,
        reranker: Optional[CrossEncoderReranker],
        llm: BaseLLM,
        query_rewriter: QueryRewriter,
        query_decomposer: QueryDecomposer,
        top_k: int = 5,
        max_iterations: int = 5,
        contextualizer: Optional[QueryContextualizer] = None,
    ) -> None:
        self.retriever = retriever
        self.dense_retriever = dense_retriever
        self.sparse_retriever = sparse_retriever
        self.reranker = reranker
        self.llm = llm
        self.query_rewriter = query_rewriter
        self.query_decomposer = query_decomposer
        self.top_k = top_k
        self.max_iterations = max_iterations
        self.contextualizer = contextualizer

    def query(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> QueryResult:
        log.info(f"AgenticRAG: {question!r}")

        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)

        all_results: list[RetrievalResult] = []
        context_summary = "No information gathered yet."
        iterations_used = 0

        for iteration in range(1, self.max_iterations + 1):
            iterations_used = iteration

            # Ask the LLM which tool to use
            plan = self._plan_next_step(
                search_query, context_summary, iteration, self.max_iterations
            )
            tool = plan.get("tool", "done").lower()
            tool_input = plan.get("input", search_query)
            reasoning = plan.get("reasoning", "")

            log.info(f"Agent iteration {iteration}: tool={tool}, reasoning={reasoning}")

            if tool == "done":
                break

            # Execute the chosen tool
            new_results = self._execute_tool(tool, tool_input, search_query)
            all_results.extend(new_results)

            # Update context summary for next iteration
            context_summary = self._summarise_context(all_results)

        # Deduplicate
        seen: set[str] = set()
        unique: list[RetrievalResult] = []
        for r in all_results:
            if r.chunk.id not in seen:
                seen.add(r.chunk.id)
                unique.append(r)

        # Re-rank the full set
        if self.reranker and unique:
            unique = self.reranker.rerank(question, unique, top_k=self.top_k)
        else:
            unique = unique[: self.top_k]

        # Generate final answer
        context = ResponseFormatter.format_context(unique)
        prompt = RAG_USER_PROMPT.format(context=context, query=question)
        answer = self.llm.generate(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history)

        return QueryResult(
            answer=answer,
            sources=unique,
            strategy_used="agentic",
            metadata={
                "iterations_used": iterations_used,
                "total_candidates": len(all_results),
            },
        )

    def query_stream(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> Generator[dict[str, Any], None, None]:
        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)
            yield {"type": "trace", "step": "contextualize", "message": f"Contextualized query: '{search_query}'"}

        yield {"type": "trace", "step": "agentic", "message": "Starting multi-step tool-use agent loop"}
        
        all_results: list[RetrievalResult] = []
        context_summary = "No information gathered yet."
        
        for iteration in range(1, self.max_iterations + 1):
            yield {"type": "trace", "step": "agentic", "message": f"Planning step {iteration}/{self.max_iterations}"}
            plan = self._plan_next_step(
                search_query, context_summary, iteration, self.max_iterations
            )
            tool = plan.get("tool", "done").lower()
            tool_input = plan.get("input", search_query)
            reasoning = plan.get("reasoning", "")
            
            yield {"type": "trace", "step": "agentic", "message": f"Selected tool: '{tool}' based on reasoning: '{reasoning}'"}
            
            if tool == "done":
                break
                
            yield {"type": "trace", "step": "agentic", "message": f"Executing tool: '{tool}' with input: '{tool_input}'"}
            new_results = self._execute_tool(tool, tool_input, search_query)
            all_results.extend(new_results)
            context_summary = self._summarise_context(all_results)
            
        seen: set[str] = set()
        unique: list[RetrievalResult] = []
        for r in all_results:
            if r.chunk.id not in seen:
                seen.add(r.chunk.id)
                unique.append(r)
                
        if self.reranker and unique:
            yield {"type": "trace", "step": "rerank", "message": f"Re-ranking final {len(unique)} candidate chunks"}
            unique = self.reranker.rerank(question, unique, top_k=self.top_k)
        else:
            unique = unique[: self.top_k]
            
        yield {"type": "sources", "sources": [
            {
                "document_id": r.chunk.document_id,
                "filename": r.chunk.metadata.get("source", r.source or "unknown"),
                "chunk_text": r.chunk.content[:500],
                "relevance_score": round(r.score, 4),
                "metadata": r.chunk.metadata,
            } for r in unique
        ]}
        
        context = ResponseFormatter.format_context(unique)
        prompt = RAG_USER_PROMPT.format(context=context, query=question)
        
        yield {"type": "trace", "step": "generation", "message": "Streaming final answer from agent synthesis"}
        for token in self.llm.generate_stream(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history):
            yield {"type": "token", "token": token}

    # ------------------------------------------------------------------ #
    # Planning
    # ------------------------------------------------------------------ #

    def _plan_next_step(
        self, query: str, context: str, iteration: int, max_iterations: int
    ) -> dict[str, str]:
        """Ask the LLM to choose the next tool."""
        prompt = AGENT_PLAN_PROMPT.format(
            query=query,
            context=context,
            iteration=iteration,
            max_iterations=max_iterations,
        )
        response = self.llm.generate(prompt)
        return self._parse_plan(response)

    @staticmethod
    def _parse_plan(text: str) -> dict[str, str]:
        """Parse TOOL / INPUT / REASONING from the LLM output."""
        result: dict[str, str] = {"tool": "done", "input": "", "reasoning": ""}
        for line in text.strip().split("\n"):
            line = line.strip()
            upper = line.upper()
            if upper.startswith("TOOL:"):
                result["tool"] = line.split(":", 1)[1].strip().lower()
            elif upper.startswith("INPUT:"):
                result["input"] = line.split(":", 1)[1].strip()
            elif upper.startswith("REASONING:"):
                result["reasoning"] = line.split(":", 1)[1].strip()
        return result

    # ------------------------------------------------------------------ #
    # Tool execution
    # ------------------------------------------------------------------ #

    def _execute_tool(
        self, tool: str, tool_input: str, original_query: str
    ) -> list[RetrievalResult]:
        """Dispatch to the appropriate tool and return new results."""
        if tool == "vector_search":
            return self.dense_retriever.retrieve(
                tool_input or original_query, top_k=self.top_k
            )
        elif tool == "bm25_search":
            return self.sparse_retriever.retrieve(
                tool_input or original_query, top_k=self.top_k
            )
        elif tool == "query_rewrite":
            alt_queries = self.query_rewriter.rewrite(tool_input or original_query)
            results: list[RetrievalResult] = []
            for q in alt_queries[:2]:  # Limit to 2 rewrites
                results.extend(self.retriever.retrieve(q, top_k=self.top_k))
            return results
        elif tool == "query_decompose":
            sub_queries = self.query_decomposer.decompose(tool_input or original_query)
            results = []
            for sq in sub_queries[:3]:  # Limit to 3 sub-queries
                results.extend(self.retriever.retrieve(sq, top_k=3))
            return results
        else:
            log.warning(f"Unknown tool: {tool}")
            return []

    @staticmethod
    def _summarise_context(results: list[RetrievalResult]) -> str:
        """Build a brief summary of gathered context for the planner."""
        if not results:
            return "No information gathered yet."

        summaries: list[str] = []
        seen: set[str] = set()
        for r in results[:10]:
            if r.chunk.id not in seen:
                seen.add(r.chunk.id)
                snippet = r.chunk.content[:150].replace("\n", " ")
                summaries.append(f"- {snippet}…")

        return f"Gathered {len(results)} passage(s):\n" + "\n".join(summaries)
