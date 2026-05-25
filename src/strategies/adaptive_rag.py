"""
Adaptive RAG strategy selector.

Uses the query router to classify complexity and dispatches to
the most appropriate strategy automatically.
"""

from __future__ import annotations

from typing import Generator, Optional

from src.models import QueryComplexity, QueryResult
from src.query.router import QueryRouter
from src.strategies.agentic_rag import AgenticRAGStrategy
from src.strategies.base import BaseRAGStrategy
from src.strategies.corrective_rag import CorrectiveRAGStrategy
from src.strategies.naive_rag import NaiveRAGStrategy
from src.utils.logger import get_logger

log = get_logger(__name__)


class AdaptiveRAGStrategy(BaseRAGStrategy):
    """
    Automatically selects the best strategy based on query complexity.

    Routing:
      - SIMPLE   → NaiveRAG
      - MODERATE  → CorrectiveRAG
      - COMPLEX   → AgenticRAG

    Args:
        router: Query complexity classifier.
        naive: NaiveRAG strategy instance.
        corrective: CorrectiveRAG strategy instance.
        agentic: AgenticRAG strategy instance.
    """

    def __init__(
        self,
        router: QueryRouter,
        naive: NaiveRAGStrategy,
        corrective: CorrectiveRAGStrategy,
        agentic: AgenticRAGStrategy,
    ) -> None:
        self.router = router
        self._strategies: dict[str, BaseRAGStrategy] = {
            "naive": naive,
            "corrective": corrective,
            "agentic": agentic,
        }

    def query(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> QueryResult:
        strategy_name = self.router.route(question)
        strategy = self._strategies.get(strategy_name, self._strategies["naive"])

        log.info(f"AdaptiveRAG routed to: {strategy_name}")
        result = strategy.query(question, chat_history=chat_history, **kwargs)
        result.strategy_used = f"adaptive→{strategy_name}"
        return result

    def query_stream(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> Generator[dict[str, Any], None, None]:
        yield {"type": "trace", "step": "routing", "message": "Evaluating query complexity for adaptive routing"}
        strategy_name = self.router.route(question)
        yield {"type": "trace", "step": "routing", "message": f"Adaptive router routed query to '{strategy_name}' strategy"}

        strategy = self._strategies.get(strategy_name, self._strategies["naive"])
        yield from strategy.query_stream(question, chat_history=chat_history, **kwargs)
