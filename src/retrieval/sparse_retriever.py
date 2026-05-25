"""
BM25-based sparse retriever.

Builds an in-memory BM25 index from stored chunks and supports
persistence via pickle for fast re-loading.
"""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Optional

import numpy as np
from rank_bm25 import BM25Okapi

from src.models import Chunk, RetrievalResult
from src.utils.logger import get_logger
from src.utils.text import simple_tokenize
from src.vectorstore.base import BaseVectorStore

log = get_logger(__name__)


class SparseRetriever:
    """
    BM25 sparse retriever.

    Maintains a tokenised BM25 index built from all chunks in the
    vector store.  The index can be saved to / loaded from disk so
    it does not need to be rebuilt on every startup.

    Args:
        vector_store: Used to fetch all chunks for index building.
        index_path: Path for persisting the BM25 index (pickle).
    """

    def __init__(
        self,
        vector_store: BaseVectorStore,
        index_path: str = "./data/bm25_index.pkl",
    ) -> None:
        self.vector_store = vector_store
        self.index_path = Path(index_path)
        self._bm25: Optional[BM25Okapi] = None
        self._chunks: list[Chunk] = []
        self._corpus_tokens: list[list[str]] = []

    # ------------------------------------------------------------------ #
    # Index management
    # ------------------------------------------------------------------ #

    def build_index(self) -> None:
        """
        (Re-)build the BM25 index from the vector store contents.

        Call this after ingesting new documents.
        """
        log.info("Building BM25 index from vector store…")
        self._chunks = self.vector_store.get_all_chunks()

        if not self._chunks:
            log.warning("No chunks found — BM25 index is empty")
            self._bm25 = None
            return

        self._corpus_tokens = [simple_tokenize(c.content) for c in self._chunks]
        self._bm25 = BM25Okapi(self._corpus_tokens)
        log.info(f"BM25 index built with {len(self._chunks)} document(s)")

    def save_index(self) -> None:
        """Persist the BM25 index and chunk list to disk."""
        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "bm25": self._bm25,
            "chunks": self._chunks,
            "corpus_tokens": self._corpus_tokens,
        }
        with open(self.index_path, "wb") as fh:
            pickle.dump(data, fh)
        log.info(f"BM25 index saved to {self.index_path}")

    def load_index(self) -> bool:
        """
        Load a persisted BM25 index.

        Returns ``True`` if successful, ``False`` if no saved index exists.
        """
        if not self.index_path.exists():
            log.info("No saved BM25 index found")
            return False

        with open(self.index_path, "rb") as fh:
            data = pickle.load(fh)  # noqa: S301

        self._bm25 = data["bm25"]
        self._chunks = data["chunks"]
        self._corpus_tokens = data["corpus_tokens"]
        log.info(f"BM25 index loaded — {len(self._chunks)} document(s)")
        return True

    def ensure_index(self) -> None:
        """Load from disk or build from scratch if needed."""
        if self._bm25 is not None:
            return
        if not self.load_index():
            self.build_index()

    # ------------------------------------------------------------------ #
    # Retrieval
    # ------------------------------------------------------------------ #

    def retrieve(self, query: str, top_k: int = 10) -> list[RetrievalResult]:
        """
        Score all indexed chunks against *query* with BM25 and return
        the top-k results.
        """
        self.ensure_index()

        if self._bm25 is None or not self._chunks:
            log.warning("BM25 index is empty — returning no results")
            return []

        query_tokens = simple_tokenize(query)
        scores = self._bm25.get_scores(query_tokens)

        # Get top-k indices
        top_indices = np.argsort(scores)[::-1][:top_k]

        results: list[RetrievalResult] = []
        for idx in top_indices:
            score = float(scores[idx])
            if score <= 0:
                continue
            chunk = self._chunks[idx]
            results.append(
                RetrievalResult(
                    chunk=chunk,
                    score=score,
                    source=chunk.metadata.get("source", ""),
                )
            )

        log.debug(f"BM25 retrieval returned {len(results)} result(s)")
        return results
