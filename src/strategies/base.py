"""
Abstract base class for RAG strategies.

Every strategy (naive, corrective, self-RAG, …) implements this
interface so the pipeline can swap them transparently.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Generator, Optional

from src.models import QueryResult


class BaseRAGStrategy(ABC):
    """Interface for RAG query strategies."""

    @abstractmethod
    def query(
        self,
        question: str,
        chat_history: Optional[list[dict[str, str]]] = None,
        **kwargs: object,
    ) -> QueryResult:
        """
        Execute the RAG strategy and return a structured result.

        Args:
            question: The user's question.
            chat_history: Optional prior conversation turns.
            **kwargs: Strategy-specific parameters.
        """
        ...

    @abstractmethod
    def query_stream(
        self,
        question: str,
        chat_history: Optional[list[dict[str, str]]] = None,
        **kwargs: object,
    ) -> Generator[dict[str, Any], None, None]:
        """
        Execute the strategy and stream trace, sources, and answer tokens.

        Args:
            question: The user's question.
            chat_history: Optional prior conversation turns.

        Yields:
            Dictionaries representing trace steps, sources, or text tokens.
        """
        ...

