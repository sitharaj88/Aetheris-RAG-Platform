"""
HyDE RAG strategy — Hypothetical Document Embeddings retrieval.

Generates a hypothetical answer via the LLM, embeds it,
performs hybrid dense-sparse retrieval using the hypothetical embedding
and original query, reranks candidates, and generates the final answer.
"""

from __future__ import annotations

from typing import Any, Generator, Optional

from src.generation.base import BaseLLM
from src.generation.prompts import RAG_SYSTEM_PROMPT, RAG_USER_PROMPT
from src.generation.response import ResponseFormatter
from src.models import QueryResult
from src.query.contextualizer import QueryContextualizer
from src.query.hyde import HyDEGenerator
from src.retrieval.hybrid_retriever import HybridRetriever
from src.retrieval.reranker import CrossEncoderReranker
from src.strategies.base import BaseRAGStrategy
from src.utils.logger import get_logger

log = get_logger(__name__)


class HyDERAGStrategy(BaseRAGStrategy):
    """
    RAG strategy using Hypothetical Document Embeddings (HyDE).

    Args:
        retriever: Hybrid retriever instance.
        reranker: Optional cross-encoder reranker.
        llm: LLM instance.
        hyde_generator: HyDE generator instance.
        top_k: Number of final document sources to keep.
    """

    def __init__(
        self,
        retriever: HybridRetriever,
        reranker: Optional[CrossEncoderReranker],
        llm: BaseLLM,
        hyde_generator: HyDEGenerator,
        top_k: int = 5,
        contextualizer: Optional[QueryContextualizer] = None,
    ) -> None:
        self.retriever = retriever
        self.reranker = reranker
        self.llm = llm
        self.hyde_generator = hyde_generator
        self.top_k = top_k
        self.contextualizer = contextualizer

    def query(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> QueryResult:
        log.info(f"HyDERAG: {question!r}")

        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)

        # 1. Generate hypothetical document
        hypothetical_doc = self.hyde_generator.generate_document(search_query)

        # 2. Retrieve dense using hypothetical vector & sparse using contextualized query
        hyde_embedding = self.hyde_generator.embedder.embed(hypothetical_doc)
        dense_results = self.retriever.dense_retriever.retrieve_by_embedding(
            hyde_embedding, top_k=self.top_k * 3
        )
        sparse_results = self.retriever.sparse_retriever.retrieve(
            search_query, top_k=self.top_k * 3
        )

        # 3. Fuse dense and sparse
        fused = self.retriever._reciprocal_rank_fusion(dense_results, sparse_results)
        fused.sort(key=lambda r: r.score, reverse=True)
        results = fused[: self.top_k]

        # 4. Rerank
        if self.reranker and results:
            results = self.reranker.rerank(question, results, top_k=self.top_k)

        # 5. Generate
        context = ResponseFormatter.format_context(results)
        prompt = RAG_USER_PROMPT.format(context=context, query=question)
        answer = self.llm.generate(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history)

        return QueryResult(
            answer=answer,
            sources=results,
            strategy_used="hyde",
            metadata={"num_candidates": len(results)},
        )

    def query_stream(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> Generator[dict[str, Any], None, None]:
        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)
            yield {"type": "trace", "step": "contextualize", "message": f"Contextualized query: '{search_query}'"}

        yield {"type": "trace", "step": "hyde", "message": "Generating hypothetical answer document..."}
        hypothetical_doc = self.hyde_generator.generate_document(search_query)
        yield {"type": "trace", "step": "hyde", "message": f"Hypothetical document generated ({len(hypothetical_doc)} chars)"}

        yield {"type": "trace", "step": "retrieval", "message": "Embedding hypothetical document for dense search"}
        hyde_embedding = self.hyde_generator.embedder.embed(hypothetical_doc)

        yield {"type": "trace", "step": "retrieval", "message": "Retrieving dense candidates via HyDE & sparse candidates via query"}
        dense_results = self.retriever.dense_retriever.retrieve_by_embedding(
            hyde_embedding, top_k=self.top_k * 3
        )
        sparse_results = self.retriever.sparse_retriever.retrieve(
            search_query, top_k=self.top_k * 3
        )

        fused = self.retriever._reciprocal_rank_fusion(dense_results, sparse_results)
        fused.sort(key=lambda r: r.score, reverse=True)
        results = fused[: self.top_k]
        yield {"type": "trace", "step": "retrieval", "message": f"Retrieved {len(results)} candidate chunks"}

        if self.reranker and results:
            yield {"type": "trace", "step": "rerank", "message": "Re-ranking candidates with cross-encoder"}
            results = self.reranker.rerank(question, results, top_k=self.top_k)
            yield {"type": "trace", "step": "rerank", "message": f"Kept top {len(results)} reranked candidates"}

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
