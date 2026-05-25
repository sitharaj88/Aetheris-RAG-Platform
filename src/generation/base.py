"""
Abstract base class for LLM providers.

Every concrete LLM backend (Ollama, OpenAI, etc.) must implement
this interface.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generator, Optional


class BaseLLM(ABC):
    """
    Interface for Large Language Model providers.

    Supports both single-shot generation and streaming.
    """

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        """
        Generate a complete response for *prompt*.

        Args:
            prompt: The user / instruction prompt.
            system_prompt: Optional system-level instructions.
            chat_history: Optional prior conversation turns as
                ``[{"role": "user"|"assistant", "content": "..."}]``.

        Returns:
            The full generated text.
        """
        ...

    @abstractmethod
    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> Generator[str, None, None]:
        """
        Stream tokens for *prompt* one chunk at a time.

        Args:
            prompt: The user / instruction prompt.
            system_prompt: Optional system-level instructions.
            chat_history: Optional prior conversation turns.

        Yields:
            Successive text chunks as they are produced.
        """
        ...

