"""
Hybrid retriever combining dense and sparse search via
Reciprocal Rank Fusion (RRF).

RRF score for a document *d* across *N* ranked lists:

    RRF(d) = Σ  1 / (k + rank_i(d))   for i in 1..N

where *k* is a smoothing constant (default 60).
"""

from __future__ import annotations

from typing import Optional

from src.models import RetrievalResult
from src.retrieval.dense_retriever import DenseRetriever
from src.retrieval.sparse_retriever import SparseRetriever
from src.utils.logger import get_logger

log = get_logger(__name__)


class HybridRetriever:
    """
    Fuses dense (vector) and sparse (BM25) retrieval results using RRF.

    Args:
        dense_retriever: Dense vector retriever.
        sparse_retriever: BM25 sparse retriever.
        dense_weight: Multiplicative weight for dense RRF scores.
        sparse_weight: Multiplicative weight for sparse RRF scores.
        rrf_k: RRF smoothing constant (default 60).
    """

    def __init__(
        self,
        dense_retriever: DenseRetriever,
        sparse_retriever: SparseRetriever,
        dense_weight: float = 0.6,
        sparse_weight: float = 0.4,
        rrf_k: int = 60,
    ) -> None:
        self.dense_retriever = dense_retriever
        self.sparse_retriever = sparse_retriever
        self.dense_weight = dense_weight
        self.sparse_weight = sparse_weight
        self.rrf_k = rrf_k

    def retrieve(
        self,
        query: str,
        top_k: int = 10,
        filter: Optional[dict[str, object]] = None,
    ) -> list[RetrievalResult]:
        """
        Run both retrievers and fuse results with weighted RRF.

        Args:
            query: The search query.
            top_k: Number of fused results to return.
            filter: Optional metadata filter (dense only).
        """
        # Fetch more candidates than needed so RRF has enough to work with
        fetch_k = top_k * 3

        log.debug(f"Hybrid retrieval: query={query!r}, top_k={top_k}")

        dense_results = self.dense_retriever.retrieve(query, top_k=fetch_k, filter=filter)
        sparse_results = self.sparse_retriever.retrieve(query, top_k=fetch_k)

        fused = self._reciprocal_rank_fusion(dense_results, sparse_results)

        # Return top_k fused results
        fused.sort(key=lambda r: r.score, reverse=True)
        final = fused[:top_k]
        log.debug(f"Hybrid retrieval returned {len(final)} fused result(s)")
        return final

    def _reciprocal_rank_fusion(
        self,
        dense_results: list[RetrievalResult],
        sparse_results: list[RetrievalResult],
    ) -> list[RetrievalResult]:
        """
        Apply weighted RRF to two ranked lists.

        Returns a de-duplicated list of ``RetrievalResult`` with the
        ``score`` field set to the fused RRF score.
        """
        k = self.rrf_k

        # Map chunk_id → (best RetrievalResult, accumulated RRF score)
        scored: dict[str, tuple[RetrievalResult, float]] = {}

        for rank, result in enumerate(dense_results, start=1):
            cid = result.chunk.id
            rrf_score = self.dense_weight * (1.0 / (k + rank))
            if cid in scored:
                existing_result, existing_score = scored[cid]
                scored[cid] = (existing_result, existing_score + rrf_score)
            else:
                scored[cid] = (result, rrf_score)

        for rank, result in enumerate(sparse_results, start=1):
            cid = result.chunk.id
            rrf_score = self.sparse_weight * (1.0 / (k + rank))
            if cid in scored:
                existing_result, existing_score = scored[cid]
                scored[cid] = (existing_result, existing_score + rrf_score)
            else:
                scored[cid] = (result, rrf_score)

        # Build output list with fused scores
        fused: list[RetrievalResult] = []
        for result, rrf_score in scored.values():
            fused.append(
                RetrievalResult(
                    chunk=result.chunk,
                    score=rrf_score,
                    source=result.source,
                )
            )

        return fused
