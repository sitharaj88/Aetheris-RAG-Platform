"""
HyDE — Hypothetical Document Embeddings.

Generates a hypothetical answer document via the LLM, embeds it,
and uses that embedding for retrieval. This often improves recall
because the hypothetical document lives in the same semantic space
as real corpus documents.
"""

from __future__ import annotations

from src.embedding.base import BaseEmbedder
from src.generation.base import BaseLLM
from src.generation.prompts import HYDE_PROMPT
from src.utils.logger import get_logger

log = get_logger(__name__)


class HyDEGenerator:
    """
    Hypothetical Document Embedding generator.

    Args:
        llm: LLM for generating hypothetical documents.
        embedder: Embedding model for encoding the hypothetical document.
    """

    def __init__(self, llm: BaseLLM, embedder: BaseEmbedder) -> None:
        self.llm = llm
        self.embedder = embedder

    def generate_embedding(self, query: str) -> list[float]:
        """
        Generate a hypothetical document for *query* and return its
        embedding vector.

        The embedding can be used directly with a dense retriever for
        improved recall.
        """
        prompt = HYDE_PROMPT.format(query=query)

        log.debug(f"Generating hypothetical document for: {query!r}")
        hypothetical_doc = self.llm.generate(prompt)
        log.debug(f"Hypothetical doc ({len(hypothetical_doc)} chars): {hypothetical_doc[:100]}…")

        embedding = self.embedder.embed(hypothetical_doc)
        return embedding

    def generate_document(self, query: str) -> str:
        """Generate and return the hypothetical document text (for debugging)."""
        prompt = HYDE_PROMPT.format(query=query)
        return self.llm.generate(prompt)
