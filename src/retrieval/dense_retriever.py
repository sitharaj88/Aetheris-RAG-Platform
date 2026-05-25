"""
Dense (vector) retriever.

Uses the vector store to perform cosine-similarity search on
pre-computed embeddings.
"""

from __future__ import annotations

from typing import Any, Optional

from src.embedding.base import BaseEmbedder
from src.models import RetrievalResult
from src.utils.logger import get_logger
from src.vectorstore.base import BaseVectorStore

log = get_logger(__name__)


class DenseRetriever:
    """
    Retriever that embeds the query and searches the vector store.

    Args:
        embedder: Embedding model for query encoding.
        vector_store: Vector database to search.
        top_k: Number of results to return.
        similarity_threshold: Minimum cosine similarity to include a result.
    """

    def __init__(
        self,
        embedder: BaseEmbedder,
        vector_store: BaseVectorStore,
        top_k: int = 10,
        similarity_threshold: float = 0.0,
    ) -> None:
        self.embedder = embedder
        self.vector_store = vector_store
        self.top_k = top_k
        self.similarity_threshold = similarity_threshold

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        filter: Optional[dict[str, Any]] = None,
    ) -> list[RetrievalResult]:
        """
        Embed *query* and return the top-k most similar chunks.

        Args:
            query: The user's search query.
            top_k: Override instance-level top_k.
            filter: Optional metadata filter passed to the vector store.
        """
        k = top_k or self.top_k
        log.debug(f"Dense retrieval: query={query!r}, top_k={k}")

        query_embedding = self.embedder.embed(query)
        results = self.vector_store.search(
            query_embedding=query_embedding,
            top_k=k,
            filter=filter,
        )

        # Apply similarity threshold
        if self.similarity_threshold > 0:
            results = [r for r in results if r.score >= self.similarity_threshold]

        log.debug(f"Dense retrieval returned {len(results)} result(s)")
        return results

    def retrieve_by_embedding(
        self,
        embedding: list[float],
        top_k: Optional[int] = None,
        filter: Optional[dict[str, Any]] = None,
    ) -> list[RetrievalResult]:
        """Search using a pre-computed embedding vector."""
        k = top_k or self.top_k
        results = self.vector_store.search(
            query_embedding=embedding,
            top_k=k,
            filter=filter,
        )
        if self.similarity_threshold > 0:
            results = [r for r in results if r.score >= self.similarity_threshold]
        return results
