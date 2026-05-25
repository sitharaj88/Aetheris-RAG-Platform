"""
LLM-based query rewriting for improved retrieval.

Generates multiple query variations and step-back queries to
increase recall across different retrieval backends.
"""

from __future__ import annotations

import re

from src.generation.base import BaseLLM
from src.generation.prompts import QUERY_REWRITE_PROMPT
from src.utils.logger import get_logger

log = get_logger(__name__)


class QueryRewriter:
    """
    Produces alternative phrasings of a user query to broaden
    retrieval coverage.

    Args:
        llm: The LLM to use for rewriting.
        num_queries: Number of alternative queries to generate.
    """

    def __init__(self, llm: BaseLLM, num_queries: int = 3) -> None:
        self.llm = llm
        self.num_queries = num_queries

    def rewrite(self, query: str) -> list[str]:
        """
        Generate *num_queries* alternative search queries for *query*.

        Returns the list of alternatives (the original query is **not**
        included — the caller should prepend it if needed).
        """
        prompt = QUERY_REWRITE_PROMPT.format(
            query=query,
            num_queries=self.num_queries,
        )

        log.debug(f"Rewriting query: {query!r}")
        response = self.llm.generate(prompt)
        alternatives = self._parse_queries(response)

        log.info(f"Generated {len(alternatives)} alternative queries")
        return alternatives

    def rewrite_with_original(self, query: str) -> list[str]:
        """Return the original query plus the generated alternatives."""
        return [query] + self.rewrite(query)

    def step_back(self, query: str) -> str:
        """
        Generate a broader, more general version of *query*
        (step-back prompting).
        """
        prompt = (
            f"Generate a single, broader version of the following question "
            f"that would help retrieve background information.\n\n"
            f"Original question: {query}\n\n"
            f"Broader question:"
        )
        response = self.llm.generate(prompt)
        broader = response.strip().split("\n")[0].strip()
        log.debug(f"Step-back query: {broader!r}")
        return broader

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _parse_queries(text: str) -> list[str]:
        """Parse numbered lines from the LLM response."""
        lines = text.strip().split("\n")
        queries: list[str] = []
        for line in lines:
            # Strip numbering like "1." or "1)"
            cleaned = re.sub(r"^\d+[.)]\s*", "", line.strip())
            if cleaned:
                queries.append(cleaned)
        return queries
