"""
Query router — classifies query complexity and routes to the
appropriate RAG strategy.
"""

from __future__ import annotations

from src.generation.base import BaseLLM
from src.generation.prompts import QUERY_ROUTER_PROMPT
from src.models import QueryComplexity
from src.utils.logger import get_logger

log = get_logger(__name__)


class QueryRouter:
    """
    Classifies a query's complexity using an LLM and returns the
    appropriate ``QueryComplexity`` level.

    Args:
        llm: The LLM used for classification.
    """

    def __init__(self, llm: BaseLLM) -> None:
        self.llm = llm

    def classify(self, query: str) -> QueryComplexity:
        """
        Classify *query* as SIMPLE, MODERATE, or COMPLEX.

        Falls back to MODERATE on parse failure.
        """
        prompt = QUERY_ROUTER_PROMPT.format(query=query)

        log.debug(f"Routing query: {query!r}")
        response = self.llm.generate(prompt).strip().upper()

        # Extract the classification from the response
        for complexity in QueryComplexity:
            if complexity.value.upper() in response:
                log.info(f"Query classified as {complexity.value}")
                return complexity

        log.warning(f"Could not parse complexity from: {response!r}; defaulting to MODERATE")
        return QueryComplexity.MODERATE

    def route(self, query: str) -> str:
        """
        Classify the query and return the recommended strategy name.

        Returns:
            One of: ``"naive"``, ``"corrective"``, ``"agentic"``.
        """
        complexity = self.classify(query)

        strategy_map = {
            QueryComplexity.SIMPLE: "naive",
            QueryComplexity.MODERATE: "corrective",
            QueryComplexity.COMPLEX: "agentic",
        }

        strategy = strategy_map[complexity]
        log.info(f"Routing {complexity.value} query → {strategy} strategy")
        return strategy
