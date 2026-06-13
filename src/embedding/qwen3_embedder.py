"""
Qwen3-Embedding implementation.

Wraps the Qwen3-Embedding family (0.6B / 4B / 8B) which leads the MTEB
multilingual leaderboard (No.1, 70.58 as of June 2025) and supports up to
32K context with Matryoshka-truncatable dimensions. Runs fully locally via
either ``sentence-transformers`` (HuggingFace weights) or an Ollama GGUF
backend, so the local-first constraint is preserved while cloud remains optional.

Reference: https://qwenlm.github.io/blog/qwen3-embedding/ , arXiv:2506.05176
"""

from __future__ import annotations

import math
from typing import Any

from src.embedding.base import BaseEmbedder
from src.utils.logger import get_logger

log = get_logger(__name__)


def _l2_normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in vector))
    if norm == 0:
        return vector
    return [v / norm for v in vector]


class Qwen3Embedder(BaseEmbedder):
    """
    Embedding provider backed by Qwen3-Embedding.

    Args:
        model_name: HuggingFace / Ollama model id (e.g. ``Qwen/Qwen3-Embedding-0.6B``).
        backend: ``sentence_transformers`` (local HF weights) or ``ollama`` (GGUF).
        batch_size: Texts per encoding batch.
        normalize: L2-normalise output vectors (required for cosine search).
        truncate_dim: Matryoshka truncation dimension (``None`` = native size).
        max_seq_length: Optional override of max input tokens (Qwen3 supports 32K).
        host: Ollama host (used only when ``backend == "ollama"``).
    """

    def __init__(
        self,
        model_name: str = "Qwen/Qwen3-Embedding-0.6B",
        backend: str = "sentence_transformers",
        batch_size: int = 32,
        normalize: bool = True,
        truncate_dim: int | None = None,
        max_seq_length: int | None = None,
        host: str = "http://127.0.0.1:11434",
    ) -> None:
        self.model_name = model_name
        self.backend = backend
        self.batch_size = batch_size
        self.normalize = normalize
        self.truncate_dim = truncate_dim
        self.max_seq_length = max_seq_length
        self.host = host
        self._model: Any | None = None
        self._client: Any | None = None
        self._dimension: int | None = None

    # ------------------------------------------------------------------ #
    # Lazy backend loading
    # ------------------------------------------------------------------ #

    def _load(self) -> None:
        if self.backend == "ollama":
            if self._client is None:
                import ollama

                log.info(f"Using Ollama embedding backend for {self.model_name} @ {self.host}")
                self._client = ollama.Client(host=self.host)
            return

        if self._model is None:
            from sentence_transformers import SentenceTransformer

            log.info(f"Loading Qwen3-Embedding model: {self.model_name}")
            kwargs: dict[str, Any] = {}
            if self.truncate_dim is not None:
                kwargs["truncate_dim"] = self.truncate_dim
            self._model = SentenceTransformer(self.model_name, **kwargs)
            if self.max_seq_length is not None:
                self._model.max_seq_length = self.max_seq_length
            self._dimension = (
                self.truncate_dim or self._model.get_sentence_embedding_dimension()
            )
            log.info(f"Qwen3-Embedding loaded — dimension={self._dimension}")

    def _post(self, vector: list[float]) -> list[float]:
        """Apply Matryoshka truncation (ollama backend) then optional normalize."""
        if self.truncate_dim is not None and len(vector) > self.truncate_dim:
            vector = vector[: self.truncate_dim]
        if self.normalize:
            vector = _l2_normalize(vector)
        return vector

    # ------------------------------------------------------------------ #
    # BaseEmbedder implementation
    # ------------------------------------------------------------------ #

    def embed(self, text: str) -> list[float]:
        self._load()
        if self.backend == "ollama":
            resp = self._client.embed(model=self.model_name, input=text)
            vector = list(resp["embeddings"][0])
            return self._post(vector)

        # sentence-transformers already truncates via truncate_dim; just normalize.
        vector = self._model.encode(
            text, normalize_embeddings=self.normalize, show_progress_bar=False
        )
        return vector.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        self._load()
        if self.backend == "ollama":
            out: list[list[float]] = []
            for start in range(0, len(texts), self.batch_size):
                batch = texts[start : start + self.batch_size]
                resp = self._client.embed(model=self.model_name, input=batch)
                out.extend(self._post(list(v)) for v in resp["embeddings"])
            return out

        vectors = self._model.encode(
            texts,
            batch_size=self.batch_size,
            normalize_embeddings=self.normalize,
            show_progress_bar=False,
        )
        return [v.tolist() for v in vectors]

    @property
    def dimension(self) -> int:
        if self._dimension is None:
            if self.truncate_dim is not None:
                self._dimension = self.truncate_dim
            elif self.backend == "ollama":
                # Probe with a tiny embed call.
                self._dimension = len(self.embed("dimension probe"))
            else:
                self._load()
        assert self._dimension is not None
        return self._dimension
