"""
Cross-encoder re-ranker.

Scores each (query, candidate) pair using a cross-encoder model
and returns the top-k results sorted by relevance.
"""

from __future__ import annotations

from typing import Any

from src.models import RetrievalResult
from src.utils.logger import get_logger

log = get_logger(__name__)


class CrossEncoderReranker:
    """
    Re-ranks retrieval results using a cross-encoder model.

    The model is loaded lazily on first use and cached for reuse.

    Args:
        model_name: HuggingFace cross-encoder model ID.
        top_k: Number of results to keep after re-ranking.
    """

    def __init__(
        self,
        model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
        top_k: int = 5,
    ) -> None:
        self.model_name = model_name
        self.top_k = top_k
        self._model: Any | None = None

    def _load_model(self) -> Any:
        """Lazily load the cross-encoder model."""
        if self._model is None:
            from sentence_transformers import CrossEncoder

            log.info(f"Loading cross-encoder: {self.model_name}")
            self._model = CrossEncoder(self.model_name)
            log.info("Cross-encoder loaded")
        return self._model

    def rerank(
        self,
        query: str,
        results: list[RetrievalResult],
        top_k: int | None = None,
    ) -> list[RetrievalResult]:
        """
        Re-rank *results* with respect to *query*.

        Args:
            query: The original user query.
            results: Candidate retrieval results to re-rank.
            top_k: Override instance-level top_k.

        Returns:
            Top-k results sorted by cross-encoder score (descending).
        """
        if not results:
            return []

        k = top_k or self.top_k
        model = self._load_model()

        # Build (query, passage) pairs
        pairs = [[query, r.chunk.content] for r in results]

        log.debug(f"Re-ranking {len(pairs)} candidate(s)")
        scores = model.predict(pairs)

        # Pair scores with results and sort
        scored = sorted(
            zip(scores, results),
            key=lambda x: float(x[0]),
            reverse=True,
        )

        reranked: list[RetrievalResult] = []
        for score, result in scored[:k]:
            reranked.append(
                RetrievalResult(
                    chunk=result.chunk,
                    score=float(score),
                    source=result.source,
                )
            )

        log.debug(f"Re-ranking kept top {len(reranked)} result(s)")
        return reranked
