"""
Corrective RAG (CRAG) strategy.

After retrieval, uses the LLM to evaluate each document's relevance.
Irrelevant documents are discarded.  If too few relevant documents
remain, the query is rewritten and retrieval is retried.
"""

from __future__ import annotations

from typing import Generator, Optional

from src.generation.base import BaseLLM
from src.generation.prompts import RAG_SYSTEM_PROMPT, RAG_USER_PROMPT, RELEVANCE_CHECK_PROMPT
from src.generation.response import ResponseFormatter
from src.models import QueryResult, RetrievalResult
from src.query.contextualizer import QueryContextualizer
from src.query.rewriter import QueryRewriter
from src.retrieval.hybrid_retriever import HybridRetriever
from src.retrieval.reranker import CrossEncoderReranker
from src.strategies.base import BaseRAGStrategy
from src.utils.logger import get_logger

log = get_logger(__name__)


class CorrectiveRAGStrategy(BaseRAGStrategy):
    """
    CRAG: Corrective Retrieval-Augmented Generation.

    Pipeline:
        1. Retrieve candidates.
        2. Evaluate each candidate's relevance with the LLM.
        3. Keep only RELEVANT / AMBIGUOUS documents.
        4. If insufficient, rewrite the query and re-retrieve.
        5. Generate from filtered, high-quality context.

    Args:
        retriever: Hybrid retriever.
        reranker: Optional cross-encoder reranker.
        llm: Language model.
        query_rewriter: LLM-based query rewriter.
        top_k: Target number of context documents.
        min_relevant: Minimum relevant docs before triggering rewrite.
    """

    def __init__(
        self,
        retriever: HybridRetriever,
        reranker: Optional[CrossEncoderReranker],
        llm: BaseLLM,
        query_rewriter: QueryRewriter,
        top_k: int = 5,
        min_relevant: int = 2,
        contextualizer: Optional[QueryContextualizer] = None,
    ) -> None:
        self.retriever = retriever
        self.reranker = reranker
        self.llm = llm
        self.query_rewriter = query_rewriter
        self.top_k = top_k
        self.min_relevant = min_relevant
        self.contextualizer = contextualizer

    def query(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> QueryResult:
        log.info(f"CorrectiveRAG: {question!r}")

        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)

        # 1. Initial retrieval
        results = self.retriever.retrieve(search_query, top_k=self.top_k * 2)
        if self.reranker and results:
            results = self.reranker.rerank(search_query, results, top_k=self.top_k)

        # 2. Evaluate relevance
        relevant_results = self._filter_relevant(question, results)
        log.info(f"CRAG: {len(relevant_results)}/{len(results)} docs deemed relevant")

        # 3. Re-retrieve if not enough relevant docs
        rewritten = False
        if len(relevant_results) < self.min_relevant:
            log.info("CRAG: Insufficient relevant docs — rewriting query")
            new_queries = self.query_rewriter.rewrite(question)
            for alt_query in new_queries:
                extra = self.retriever.retrieve(alt_query, top_k=self.top_k)
                if self.reranker:
                    extra = self.reranker.rerank(question, extra, top_k=self.top_k)
                extra_relevant = self._filter_relevant(question, extra)
                relevant_results.extend(extra_relevant)
                if len(relevant_results) >= self.min_relevant:
                    break
            rewritten = True

        # Deduplicate by chunk ID
        seen: set[str] = set()
        unique: list[RetrievalResult] = []
        for r in relevant_results:
            if r.chunk.id not in seen:
                seen.add(r.chunk.id)
                unique.append(r)
        relevant_results = unique[: self.top_k]

        # Robust Fallback: If no docs were deemed relevant, use the original retrieved results!
        if not relevant_results:
            log.warning("CRAG: No relevant docs found after filtering; falling back to original retrieved candidates.")
            seen_ids = set()
            for r in results:
                if r.chunk.id not in seen_ids:
                    seen_ids.add(r.chunk.id)
                    relevant_results.append(r)
            relevant_results = relevant_results[: self.top_k]

        # 4. Generate
        context = ResponseFormatter.format_context(relevant_results)
        prompt = RAG_USER_PROMPT.format(context=context, query=question)
        answer = self.llm.generate(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history)

        return QueryResult(
            answer=answer,
            sources=relevant_results,
            strategy_used="corrective",
            metadata={
                "query_rewritten": rewritten,
                "relevant_count": len(relevant_results),
            },
        )

    def query_stream(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> Generator[dict[str, Any], None, None]:
        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)
            yield {"type": "trace", "step": "contextualize", "message": f"Contextualized query: '{search_query}'"}

        yield {"type": "trace", "step": "retrieval", "message": "Initiating hybrid search (dense + sparse)"}
        results = self.retriever.retrieve(search_query, top_k=self.top_k * 2)
        yield {"type": "trace", "step": "retrieval", "message": f"Retrieved {len(results)} candidate chunks"}

        if self.reranker and results:
            yield {"type": "trace", "step": "rerank", "message": "Re-ranking candidates with cross-encoder"}
            results = self.reranker.rerank(search_query, results, top_k=self.top_k)
            yield {"type": "trace", "step": "rerank", "message": f"Kept top {len(results)} reranked candidates"}

        yield {"type": "trace", "step": "corrective", "message": "Evaluating document relevance"}
        relevant_results = self._filter_relevant(question, results)
        yield {"type": "trace", "step": "corrective", "message": f"{len(relevant_results)}/{len(results)} docs deemed relevant"}

        if len(relevant_results) < self.min_relevant:
            yield {"type": "trace", "step": "corrective", "message": "Insufficient relevant docs — rewriting query"}
            new_queries = self.query_rewriter.rewrite(question)
            for alt_query in new_queries:
                yield {"type": "trace", "step": "corrective", "message": f"Retrieving extra documents for: '{alt_query}'"}
                extra = self.retriever.retrieve(alt_query, top_k=self.top_k)
                extra_relevant = self._filter_relevant(question, extra)
                relevant_results.extend(extra_relevant)
                if len(relevant_results) >= self.min_relevant:
                    break

        seen: set[str] = set()
        unique: list[RetrievalResult] = []
        for r in relevant_results:
            if r.chunk.id not in seen:
                seen.add(r.chunk.id)
                unique.append(r)
        
        # Robust Fallback: If no docs were deemed relevant, use the original retrieved results!
        if not unique:
            yield {"type": "trace", "step": "corrective", "message": "Relevance filter rejected all documents; falling back to original retrieval results"}
            seen_ids = set()
            for r in results:
                if r.chunk.id not in seen_ids:
                    seen_ids.add(r.chunk.id)
                    unique.append(r)
        
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

        yield {"type": "trace", "step": "generation", "message": f"Generating answer using {getattr(self.llm, 'model', 'local LLM')}"}
        for token in self.llm.generate_stream(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history):
            yield {"type": "token", "token": token}

    # ------------------------------------------------------------------ #
    # Relevance filtering
    # ------------------------------------------------------------------ #

    def _filter_relevant(
        self, query: str, results: list[RetrievalResult]
    ) -> list[RetrievalResult]:
        """
        Use the LLM to classify each result as RELEVANT, IRRELEVANT,
        or AMBIGUOUS.  Keep RELEVANT and AMBIGUOUS.
        """
        relevant: list[RetrievalResult] = []
        for result in results:
            verdict = self._check_relevance(query, result.chunk.content)
            if verdict in ("RELEVANT", "AMBIGUOUS"):
                relevant.append(result)
        return relevant

    def _check_relevance(self, query: str, document: str) -> str:
        """Ask the LLM whether *document* is relevant to *query*."""
        prompt = RELEVANCE_CHECK_PROMPT.format(query=query, document=document[:1000])
        response = self.llm.generate(prompt).strip().upper()

        for label in ("RELEVANT", "IRRELEVANT", "AMBIGUOUS"):
            if label in response:
                return label
        return "AMBIGUOUS"
