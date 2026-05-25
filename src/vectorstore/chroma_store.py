"""
ChromaDB vector store implementation.

Provides persistent, embedded vector storage using ChromaDB with
cosine similarity search and metadata filtering.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

import chromadb

from src.models import Chunk, RetrievalResult
from src.utils.logger import get_logger
from src.vectorstore.base import BaseVectorStore

log = get_logger(__name__)


class ChromaVectorStore(BaseVectorStore):
    """
    ChromaDB-backed vector store with persistent storage.

    Args:
        persist_dir: Directory for ChromaDB on-disk storage.
        collection_name: Name of the default collection to use.
    """

    def __init__(
        self,
        persist_dir: str = "./data/chromadb",
        collection_name: str = "default_collection",
    ) -> None:
        self.persist_dir = persist_dir
        self.collection_name = collection_name

        # Ensure persistence directory exists
        Path(persist_dir).mkdir(parents=True, exist_ok=True)

        log.info(f"Initialising ChromaDB at {persist_dir}")
        self._client = chromadb.PersistentClient(path=persist_dir)
        self._collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        log.info(
            f"ChromaDB collection '{collection_name}' ready — "
            f"{self._collection.count()} existing vectors"
        )

    # ------------------------------------------------------------------ #
    # BaseVectorStore implementation
    # ------------------------------------------------------------------ #

    def add(self, chunks: list[Chunk]) -> None:
        """Upsert chunks with their embeddings and metadata."""
        if not chunks:
            return

        ids: list[str] = []
        embeddings: list[list[float]] = []
        documents: list[str] = []
        metadatas: list[dict[str, Any]] = []

        for chunk in chunks:
            if chunk.embedding is None:
                log.warning(f"Skipping chunk {chunk.id} — no embedding")
                continue
            ids.append(chunk.id)
            embeddings.append(chunk.embedding)
            documents.append(chunk.content)
            
            # Ensure document_id is preserved in metadata
            meta = dict(chunk.metadata)
            if chunk.document_id:
                meta["document_id"] = chunk.document_id
                
            # ChromaDB metadata values must be str, int, float, or bool
            metadatas.append(self._sanitise_metadata(meta))

        if not ids:
            return

        # Chroma supports upsert natively
        self._collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )
        log.info(f"Upserted {len(ids)} chunk(s) into '{self.collection_name}'")

    def search(
        self,
        query_embedding: list[float],
        top_k: int = 10,
        filter: Optional[dict[str, Any]] = None,
    ) -> list[RetrievalResult]:
        """Search for similar chunks using cosine similarity."""
        query_params: dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": min(top_k, self._collection.count() or top_k),
            "include": ["documents", "metadatas", "distances"],
        }
        if filter:
            query_params["where"] = filter

        if self._collection.count() == 0:
            return []

        results = self._collection.query(**query_params)

        retrieval_results: list[RetrievalResult] = []
        if results and results["ids"] and results["ids"][0]:
            for i, chunk_id in enumerate(results["ids"][0]):
                content = results["documents"][0][i] if results["documents"] else ""
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                # ChromaDB returns cosine *distance*; convert to similarity
                distance = results["distances"][0][i] if results["distances"] else 0.0
                similarity = 1.0 - distance

                chunk = Chunk(
                    id=chunk_id,
                    content=content,
                    metadata=metadata,
                    document_id=metadata.get("document_id", ""),
                )
                retrieval_results.append(
                    RetrievalResult(
                        chunk=chunk,
                        score=similarity,
                        source=metadata.get("source", ""),
                    )
                )

        return retrieval_results

    def delete(self, ids: list[str]) -> None:
        """Delete chunks by their IDs."""
        if not ids:
            return
        self._collection.delete(ids=ids)
        log.info(f"Deleted {len(ids)} chunk(s) from '{self.collection_name}'")

    def get_collection_stats(self) -> dict[str, Any]:
        """Return collection metadata and document count."""
        return {
            "collection_name": self.collection_name,
            "count": self._collection.count(),
            "persist_dir": self.persist_dir,
        }

    def get_all_chunks(self) -> list[Chunk]:
        """Retrieve every chunk in the collection (for BM25 index building)."""
        count = self._collection.count()
        if count == 0:
            return []

        results = self._collection.get(
            include=["documents", "metadatas"],
        )

        chunks: list[Chunk] = []
        for i, chunk_id in enumerate(results["ids"]):
            content = results["documents"][i] if results["documents"] else ""
            metadata = results["metadatas"][i] if results["metadatas"] else {}
            chunks.append(
                Chunk(
                    id=chunk_id,
                    content=content,
                    metadata=metadata,
                    document_id=str(metadata.get("document_id", "")),
                )
            )
        return chunks

    # ------------------------------------------------------------------ #
    # Collection management
    # ------------------------------------------------------------------ #

    def switch_collection(self, name: str) -> None:
        """Switch to a different collection (create if needed)."""
        self._collection = self._client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )
        self.collection_name = name
        log.info(f"Switched to collection '{name}'")

    def list_collections(self) -> list[str]:
        """List all collection names in this ChromaDB instance."""
        return [c.name for c in self._client.list_collections()]

    def delete_collection(self, name: str) -> None:
        """Delete an entire collection."""
        self._client.delete_collection(name=name)
        log.info(f"Deleted collection '{name}'")

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _sanitise_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
        """
        Convert metadata values to types ChromaDB accepts
        (str, int, float, bool).  Lists and nested dicts are serialised
        to strings.
        """
        clean: dict[str, Any] = {}
        for key, value in metadata.items():
            if isinstance(value, (str, int, float, bool)):
                clean[key] = value
            elif value is None:
                clean[key] = ""
            else:
                clean[key] = str(value)
        return clean
