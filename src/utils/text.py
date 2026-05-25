"""
Text processing helpers used throughout the RAG1 system.

Includes tokenisation for BM25, cosine similarity, approximate
token counting, and text truncation utilities.
"""

from __future__ import annotations

import math
import re
from typing import Sequence


def simple_tokenize(text: str) -> list[str]:
    """
    Whitespace + punctuation tokeniser suitable for BM25 indexing.

    Lowercases and strips non-alphanumeric characters at token boundaries.
    """
    tokens = re.findall(r"[a-zA-Z0-9]+(?:['_-][a-zA-Z0-9]+)*", text.lower())
    return tokens


def cosine_similarity(vec_a: Sequence[float], vec_b: Sequence[float]) -> float:
    """
    Compute cosine similarity between two vectors.

    Returns a float in [-1, 1]. Returns 0.0 when either vector has
    zero magnitude.
    """
    if len(vec_a) != len(vec_b):
        raise ValueError(
            f"Vector dimensions must match: {len(vec_a)} != {len(vec_b)}"
        )

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


def token_count(text: str) -> int:
    """
    Approximate token count using the ``≈ words × 1.3`` heuristic.

    This is a rough estimate — use a proper tokeniser when precision
    matters.
    """
    words = len(text.split())
    return int(words * 1.3)


def truncate_text(text: str, max_chars: int = 500, suffix: str = "…") -> str:
    """Truncate *text* to at most *max_chars* characters, appending *suffix*."""
    if len(text) <= max_chars:
        return text
    return text[: max_chars - len(suffix)] + suffix


def clean_text(text: str) -> str:
    """
    Normalise whitespace, remove control characters, and strip leading/
    trailing blanks.
    """
    # Remove control characters except newline and tab
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Collapse multiple blank lines into two newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse multiple spaces/tabs within a line
    text = re.sub(r"[^\S\n]+", " ", text)
    return text.strip()


def split_sentences(text: str) -> list[str]:
    """
    Split *text* into sentences using a simple regex heuristic.

    Handles common abbreviations and decimal numbers reasonably well.
    """
    # Split on sentence-ending punctuation followed by space + capital letter
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)
    return [p.strip() for p in parts if p.strip()]
