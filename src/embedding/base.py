"""
Abstract base class for embedding providers.

Every concrete embedder (SentenceTransformer, OpenAI, etc.) must
implement this interface so that the rest of the pipeline stays
provider-agnostic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class BaseEmbedder(ABC):
    """
    Interface for text embedding models.

    Concrete implementations must support single-text and batched
    embedding, as well as report their output dimensionality.
    """

    @abstractmethod
    def embed(self, text: str) -> list[float]:
        """Embed a single piece of text and return its dense vector."""
        ...

    @abstractmethod
    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a batch of texts.

        Implementations should handle internal batching / chunking
        for large lists.
        """
        ...

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Return the dimensionality of the embedding vectors."""
        ...
