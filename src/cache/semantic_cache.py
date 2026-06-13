"""
Semantic answer cache.

Caches previous (query → answer + sources) pairs keyed by the query's embedding.
On a new query we embed it, look up the nearest cached query within the active
collection, and if cosine similarity exceeds a threshold we return the cached
answer — skipping retrieval, reranking, and generation entirely. This is a large
perceived-latency win for repeated or near-duplicate questions and runs fully
locally (reuses the pipeline embedder + a dedicated Chroma collection).

The cache is scoped per knowledge-collection and must be invalidated when new
documents are ingested into that collection.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Optional

from src.embedding.base import BaseEmbedder
from src.utils.logger import get_logger

log = get_logger(__name__)


class SemanticCache:
    """
    Embedding-similarity answer cache backed by a dedicated Chroma collection.

    Args:
        embedder: The pipeline embedder (must match the query embedding space).
        persist_dir: ChromaDB persistence directory (shared with the main store).
        collection_name: Name of the cache collection.
        similarity_threshold: Minimum cosine similarity for a hit (0–1).
        max_entries: Soft cap on cached entries.
    """

    def __init__(
        self,
        embedder: BaseEmbedder,
        persist_dir: str,
        collection_name: str = "_semantic_cache",
        similarity_threshold: float = 0.95,
        max_entries: int = 1000,
    ) -> None:
        self.embedder = embedder
        self.persist_dir = persist_dir
        self.collection_name = collection_name
        self.similarity_threshold = similarity_threshold
        self.max_entries = max_entries
        self._collection: Any | None = None

    def _coll(self) -> Any:
        if self._collection is None:
            import chromadb

            client = chromadb.PersistentClient(path=self.persist_dir)
            self._collection = client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def get(self, query: str, collection: str) -> Optional[dict[str, Any]]:
        """Return a cached ``{answer, sources, metadata}`` or ``None`` on miss."""
        try:
            coll = self._coll()
            if coll.count() == 0:
                return None
            embedding = self.embedder.embed(query)
            res = coll.query(
                query_embeddings=[embedding],
                n_results=1,
                where={"collection": collection},
            )
            docs = res.get("documents") or [[]]
            metas = res.get("metadatas") or [[]]
            dists = res.get("distances") or [[]]
            if not docs[0]:
                return None
            distance = dists[0][0]
            similarity = 1.0 - float(distance)  # cosine distance → similarity
            if similarity < self.similarity_threshold:
                return None
            meta = metas[0][0]
            log.info(f"Semantic cache HIT (sim={similarity:.3f}) for query={query!r}")
            return {
                "answer": meta.get("answer", ""),
                "sources": json.loads(meta.get("sources_json", "[]")),
                "metadata": json.loads(meta.get("extra_json", "{}")),
                "similarity": similarity,
            }
        except Exception as exc:
            log.warning(f"Semantic cache lookup failed (ignored): {exc}")
            return None

    def put(
        self,
        query: str,
        collection: str,
        answer: str,
        sources: list[dict[str, Any]],
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        """Store a query/answer pair. Best-effort; never raises into the caller."""
        if not answer:
            return
        try:
            coll = self._coll()
            embedding = self.embedder.embed(query)
            coll.add(
                ids=[str(uuid.uuid4())],
                embeddings=[embedding],
                documents=[query],
                metadatas=[
                    {
                        "collection": collection,
                        "answer": answer,
                        "sources_json": json.dumps(sources)[:60000],
                        "extra_json": json.dumps(metadata or {}),
                    }
                ],
            )
            if coll.count() > self.max_entries:
                log.debug("Semantic cache over capacity; consider trimming")
        except Exception as exc:
            log.warning(f"Semantic cache store failed (ignored): {exc}")

    def invalidate(self, collection: str) -> None:
        """Drop all cached entries for *collection* (call after ingestion)."""
        try:
            self._coll().delete(where={"collection": collection})
            log.info(f"Semantic cache invalidated for collection={collection}")
        except Exception as exc:
            log.warning(f"Semantic cache invalidation failed (ignored): {exc}")
