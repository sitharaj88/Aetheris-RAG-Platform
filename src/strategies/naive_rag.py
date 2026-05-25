"""
Naive RAG strategy — the baseline pipeline.

Retrieve → re-rank → generate.  Simple, fast, and effective for
straightforward factual queries.
"""

from __future__ import annotations

from typing import Generator, Optional

from src.generation.base import BaseLLM
from src.generation.prompts import RAG_SYSTEM_PROMPT, RAG_USER_PROMPT
from src.generation.response import ResponseFormatter
from src.models import QueryResult, RetrievalResult
from src.query.contextualizer import QueryContextualizer
from src.retrieval.hybrid_retriever import HybridRetriever
from src.retrieval.reranker import CrossEncoderReranker
from src.strategies.base import BaseRAGStrategy
from src.utils.logger import get_logger

log = get_logger(__name__)


class NaiveRAGStrategy(BaseRAGStrategy):
    """
    Basic RAG: hybrid retrieval → cross-encoder re-ranking → generation.

    Args:
        retriever: Hybrid retriever (dense + sparse fusion).
        reranker: Cross-encoder re-ranker (optional; skipped if ``None``).
        llm: Language model for answer generation.
        top_k: Number of results to keep after retrieval / re-ranking.
    """

    def __init__(
        self,
        retriever: HybridRetriever,
        reranker: Optional[CrossEncoderReranker],
        llm: BaseLLM,
        top_k: int = 5,
        contextualizer: Optional[QueryContextualizer] = None,
    ) -> None:
        self.retriever = retriever
        self.reranker = reranker
        self.llm = llm
        self.top_k = top_k
        self.contextualizer = contextualizer

    def query(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> QueryResult:
        """Run the naive RAG pipeline."""
        log.info(f"NaiveRAG: {question!r}")

        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)

        # 1. Retrieve
        results = self.retriever.retrieve(search_query, top_k=self.top_k * 2)

        # 2. Re-rank
        if self.reranker and results:
            results = self.reranker.rerank(search_query, results, top_k=self.top_k)
        else:
            results = results[: self.top_k]

        # 3. Generate
        context = ResponseFormatter.format_context(results)
        prompt = RAG_USER_PROMPT.format(context=context, query=question)
        answer = self.llm.generate(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history)

        return QueryResult(
            answer=answer,
            sources=results,
            strategy_used="naive",
            metadata={"num_candidates": len(results)},
        )

    def query_stream(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> Generator[dict[str, Any], None, None]:
        """Stream the naive RAG answer."""
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
        else:
            results = results[: self.top_k]

        yield {"type": "sources", "sources": [
            {
                "document_id": r.chunk.document_id,
                "filename": r.chunk.metadata.get("source", r.source or "unknown"),
                "chunk_text": r.chunk.content[:500],
                "relevance_score": round(r.score, 4),
                "metadata": r.chunk.metadata,
            } for r in results
        ]}

        context = ResponseFormatter.format_context(results)
        prompt = RAG_USER_PROMPT.format(context=context, query=question)

        yield {"type": "trace", "step": "generation", "message": f"Generating answer using {getattr(self.llm, 'model', 'local LLM')}"}
        for token in self.llm.generate_stream(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history):
            yield {"type": "token", "token": token}
