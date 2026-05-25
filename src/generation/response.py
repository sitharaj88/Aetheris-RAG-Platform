"""
Response formatting utilities.

Formats raw LLM output into structured responses with inline
citations, source attributions, and confidence scoring.
"""

from __future__ import annotations

import re
from typing import Any

from src.models import RAGResponse, RetrievalResult
from src.utils.logger import get_logger

log = get_logger(__name__)


class ResponseFormatter:
    """
    Converts raw generation output and retrieval results into a
    structured ``RAGResponse``.
    """

    @staticmethod
    def format_context(results: list[RetrievalResult]) -> str:
        """
        Build a numbered context string from retrieval results.

        Each source is labelled ``[1]``, ``[2]``, … so the LLM can
        reference them with inline citations.
        """
        if not results:
            return "No relevant context found."

        parts: list[str] = []
        for idx, result in enumerate(results, start=1):
            source_label = result.source or result.chunk.metadata.get("filename", "unknown")
            parts.append(
                f"[{idx}] (Source: {source_label})\n{result.chunk.content}"
            )
        return "\n\n".join(parts)

    @staticmethod
    def extract_sources(results: list[RetrievalResult]) -> list[dict[str, Any]]:
        """
        Convert retrieval results into serialisable source dicts for
        the API response.
        """
        sources: list[dict[str, Any]] = []
        for idx, result in enumerate(results, start=1):
            sources.append({
                "index": idx,
                "content": result.chunk.content[:300],
                "score": round(result.score, 4),
                "source": result.source or result.chunk.metadata.get("filename", "unknown"),
                "metadata": {
                    k: v for k, v in result.chunk.metadata.items()
                    if k in {"filename", "file_type", "page_num", "section_heading", "chunk_index"}
                },
            })
        return sources

    @staticmethod
    def compute_confidence(results: list[RetrievalResult]) -> float:
        """
        Heuristic confidence score based on retrieval quality.

        Uses the mean of the top-3 scores, normalised to [0, 1].
        """
        if not results:
            return 0.0

        top_scores = sorted([r.score for r in results], reverse=True)[:3]
        avg = sum(top_scores) / len(top_scores)
        # Clamp to [0, 1]
        return max(0.0, min(1.0, avg))

    @classmethod
    def build_response(
        cls,
        answer: str,
        results: list[RetrievalResult],
        strategy_used: str = "",
        timing: dict[str, float] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> RAGResponse:
        """
        Assemble a complete ``RAGResponse``.

        Args:
            answer: Raw LLM output.
            results: Retrieval results used as context.
            strategy_used: Name of the RAG strategy that produced this.
            timing: Performance timing breakdowns.
            metadata: Extra metadata to attach.
        """
        sources = cls.extract_sources(results)
        confidence = cls.compute_confidence(results)

        merged_meta: dict[str, Any] = metadata or {}
        merged_meta["confidence"] = round(confidence, 4)

        return RAGResponse(
            answer=answer,
            sources=sources,
            timing=timing or {},
            strategy_used=strategy_used,
            metadata=merged_meta,
        )
