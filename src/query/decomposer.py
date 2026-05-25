"""
LLM-based query decomposition.

Breaks complex multi-part questions into simpler sub-questions
that can be answered independently and then synthesised.
"""

from __future__ import annotations

import re

from src.generation.base import BaseLLM
from src.generation.prompts import DECOMPOSE_PROMPT
from src.utils.logger import get_logger

log = get_logger(__name__)


class QueryDecomposer:
    """
    Decomposes a complex question into simpler sub-questions using
    an LLM.

    Args:
        llm: The LLM to use for decomposition.
    """

    def __init__(self, llm: BaseLLM) -> None:
        self.llm = llm

    def decompose(self, query: str) -> list[str]:
        """
        Break *query* into self-contained sub-questions.

        Returns 2–5 sub-questions. Falls back to ``[query]`` if
        parsing fails.
        """
        prompt = DECOMPOSE_PROMPT.format(query=query)

        log.debug(f"Decomposing query: {query!r}")
        response = self.llm.generate(prompt)
        sub_queries = self._parse_sub_queries(response)

        if not sub_queries:
            log.warning("Decomposition produced no sub-queries; using original")
            return [query]

        log.info(f"Decomposed into {len(sub_queries)} sub-question(s)")
        return sub_queries

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _parse_sub_queries(text: str) -> list[str]:
        """Parse numbered sub-questions from LLM output."""
        lines = text.strip().split("\n")
        queries: list[str] = []
        for line in lines:
            cleaned = re.sub(r"^\d+[.)]\s*", "", line.strip())
            if cleaned and len(cleaned) > 5:
                queries.append(cleaned)
        return queries[:5]  # Cap at 5
