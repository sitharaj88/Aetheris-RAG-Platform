"""
SentenceTransformer embedding implementation.

Wraps the ``sentence-transformers`` library to produce normalised
dense vectors using a locally-loaded HuggingFace model.
"""

from __future__ import annotations

from typing import Any

from src.embedding.base import BaseEmbedder
from src.utils.logger import get_logger

log = get_logger(__name__)


class SentenceTransformerEmbedder(BaseEmbedder):
    """
    Embedding provider backed by ``sentence-transformers``.

    The model is loaded lazily on first use and cached for the lifetime
    of the instance.

    Args:
        model_name: HuggingFace model identifier (default ``all-MiniLM-L6-v2``).
        batch_size: Number of texts per encoding batch.
        normalize: Whether to L2-normalise output vectors.
    """

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        batch_size: int = 64,
        normalize: bool = True,
    ) -> None:
        self.model_name = model_name
        self.batch_size = batch_size
        self.normalize = normalize
        self._model: Any | None = None
        self._dimension: int | None = None

    # ------------------------------------------------------------------ #
    # Lazy model loading
    # ------------------------------------------------------------------ #

    def _load_model(self) -> Any:
        """Load the SentenceTransformer model (once)."""
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            log.info(f"Loading embedding model: {self.model_name}")
            self._model = SentenceTransformer(self.model_name)
            # Cache dimension
            self._dimension = self._model.get_sentence_embedding_dimension()
            log.info(f"Embedding model loaded — dimension={self._dimension}")
        return self._model

    # ------------------------------------------------------------------ #
    # BaseEmbedder implementation
    # ------------------------------------------------------------------ #

    def embed(self, text: str) -> list[float]:
        """Embed a single text string."""
        model = self._load_model()
        vector = model.encode(
            text,
            normalize_embeddings=self.normalize,
            show_progress_bar=False,
        )
        return vector.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a list of texts in batches.

        Returns a list of vectors in the same order as the input.
        """
        if not texts:
            return []

        model = self._load_model()
        log.debug(f"Embedding batch of {len(texts)} text(s)")

        vectors = model.encode(
            texts,
            batch_size=self.batch_size,
            normalize_embeddings=self.normalize,
            show_progress_bar=False,
        )
        return [v.tolist() for v in vectors]

    @property
    def dimension(self) -> int:
        """Return the embedding vector dimensionality."""
        if self._dimension is None:
            self._load_model()
        assert self._dimension is not None
        return self._dimension
