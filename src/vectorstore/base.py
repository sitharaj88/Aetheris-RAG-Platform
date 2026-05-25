"""
Abstract base class for vector store backends.

Any persistent vector database (Chroma, Qdrant, Pinecone, …)
should implement this interface.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional

from src.models import Chunk, RetrievalResult


class BaseVectorStore(ABC):
    """Interface every vector store backend must implement."""

    @abstractmethod
    def add(self, chunks: list[Chunk]) -> None:
        """
        Upsert chunks (with embeddings) into the store.

        Implementations should handle deduplication by chunk ID.
        """
        ...

    @abstractmethod
    def search(
        self,
        query_embedding: list[float],
        top_k: int = 10,
        filter: Optional[dict[str, Any]] = None,
    ) -> list[RetrievalResult]:
        """
        Retrieve the *top_k* most similar chunks to *query_embedding*.

        Returns results sorted by descending similarity.
        """
        ...

    @abstractmethod
    def delete(self, ids: list[str]) -> None:
        """Delete chunks by their IDs."""
        ...

    @abstractmethod
    def get_collection_stats(self) -> dict[str, Any]:
        """Return metadata about the active collection (count, name, etc.)."""
        ...

    def get_all_chunks(self) -> list[Chunk]:
        """
        Return all chunks in the store.

        Default implementation raises ``NotImplementedError``; override
        in backends that support full scans (needed for BM25 indexing).
        """
        raise NotImplementedError("Full scan not supported by this backend")
