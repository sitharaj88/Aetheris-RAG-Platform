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


class Qwen3Reranker:
    """
    Re-ranks results using a Qwen3-Reranker model.

    Unlike a classic cross-encoder, Qwen3-Reranker is a causal LM that judges
    relevance by the probability it assigns to a "yes" token, so it cannot be
    loaded through ``sentence_transformers.CrossEncoder``. This implementation
    uses HuggingFace ``transformers`` directly and exposes the same
    ``rerank(query, results, top_k)`` interface as :class:`CrossEncoderReranker`.

    Runs fully locally. Backed by arXiv:2506.05176.

    Args:
        model_name: HuggingFace model ID (e.g. ``Qwen/Qwen3-Reranker-0.6B``).
        top_k: Number of results to keep after re-ranking.
    """

    _INSTRUCTION = (
        "Given a web search query, retrieve relevant passages that answer the query"
    )
    _PREFIX = (
        "<|im_start|>system\nJudge whether the Document meets the requirements "
        "based on the Query and the Instruct provided. Note that the answer can "
        'only be "yes" or "no".<|im_end|>\n<|im_start|>user\n'
    )
    _SUFFIX = "<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n"

    def __init__(
        self,
        model_name: str = "Qwen/Qwen3-Reranker-0.6B",
        top_k: int = 5,
    ) -> None:
        self.model_name = model_name
        self.top_k = top_k
        self._model: Any | None = None
        self._tokenizer: Any | None = None
        self._token_true: int | None = None
        self._token_false: int | None = None

    def _load_model(self) -> None:
        """Lazily load the Qwen3-Reranker model and tokenizer."""
        if self._model is not None:
            return

        import torch  # noqa: F401  (imported for availability check / dtype)
        from transformers import AutoModelForCausalLM, AutoTokenizer

        log.info(f"Loading Qwen3-Reranker: {self.model_name}")
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_name, padding_side="left")
        self._model = AutoModelForCausalLM.from_pretrained(self.model_name).eval()
        self._token_true = self._tokenizer.convert_tokens_to_ids("yes")
        self._token_false = self._tokenizer.convert_tokens_to_ids("no")
        log.info("Qwen3-Reranker loaded")

    def _format_pair(self, query: str, document: str) -> str:
        return (
            f"{self._PREFIX}<Instruct>: {self._INSTRUCTION}\n"
            f"<Query>: {query}\n<Document>: {document}{self._SUFFIX}"
        )

    def rerank(
        self,
        query: str,
        results: list[RetrievalResult],
        top_k: int | None = None,
    ) -> list[RetrievalResult]:
        """Re-rank *results* by the model's P(yes) relevance score."""
        if not results:
            return []

        import torch

        self._load_model()
        assert self._model is not None and self._tokenizer is not None
        k = top_k or self.top_k

        pairs = [self._format_pair(query, r.chunk.content) for r in results]
        scores: list[float] = []
        with torch.no_grad():
            # Score in small batches to bound memory.
            for start in range(0, len(pairs), 8):
                batch = pairs[start : start + 8]
                inputs = self._tokenizer(
                    batch,
                    padding=True,
                    truncation=True,
                    max_length=4096,
                    return_tensors="pt",
                )
                logits = self._model(**inputs).logits[:, -1, :]
                true_logits = logits[:, self._token_true]
                false_logits = logits[:, self._token_false]
                stacked = torch.stack([false_logits, true_logits], dim=1)
                probs = torch.nn.functional.softmax(stacked, dim=1)[:, 1]
                scores.extend(probs.tolist())

        scored = sorted(zip(scores, results), key=lambda x: float(x[0]), reverse=True)
        reranked = [
            RetrievalResult(chunk=r.chunk, score=float(s), source=r.source)
            for s, r in scored[:k]
        ]
        log.debug(f"Qwen3 re-ranking kept top {len(reranked)} result(s)")
        return reranked


def get_reranker(
    provider: str,
    model_name: str,
    top_k: int,
) -> CrossEncoderReranker | Qwen3Reranker:
    """
    Factory returning a reranker for the configured *provider*.

    Both returned types share the ``rerank(query, results, top_k)`` interface.
    """
    if provider == "qwen3":
        return Qwen3Reranker(model_name=model_name, top_k=top_k)
    if provider not in ("cross_encoder", "", None):
        log.warning(f"Unknown reranker provider '{provider}'; using cross_encoder")
    return CrossEncoderReranker(model_name=model_name, top_k=top_k)
