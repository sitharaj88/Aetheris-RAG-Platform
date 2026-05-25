"""
Ollama LLM implementation.

Communicates with a local Ollama server via the ``ollama`` Python
package, supporting both single-shot and streaming generation.
"""

from __future__ import annotations

from typing import Generator, Optional

import ollama

from src.generation.base import BaseLLM
from src.utils.logger import get_logger

log = get_logger(__name__)


class OllamaLLM(BaseLLM):
    """
    LLM provider backed by a local Ollama instance.

    Args:
        host: Ollama server URL (e.g. ``http://localhost:11434``).
        model: Model name (e.g. ``llama3.1:8b``).
        temperature: Sampling temperature.
        max_tokens: Maximum number of tokens to generate.
    """

    def __init__(
        self,
        host: str = "http://localhost:11434",
        model: str = "llama3.1:8b",
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> None:
        self.host = host
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._client = ollama.Client(host=host)

    # ------------------------------------------------------------------ #
    # Health
    # ------------------------------------------------------------------ #

    def is_available(self) -> bool:
        """Check whether the Ollama server is reachable."""
        try:
            self._client.list()
            return True
        except Exception as exc:
            log.warning(f"Ollama not available at {self.host}: {exc}")
            return False

    # ------------------------------------------------------------------ #
    # BaseLLM implementation
    # ------------------------------------------------------------------ #

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        """Generate a full response (blocking)."""
        messages = self._build_messages(prompt, system_prompt, chat_history)

        try:
            response = self._client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": self.temperature,
                    "num_predict": self.max_tokens,
                },
            )
            content = response["message"]["content"]
            log.debug(f"Ollama generated {len(content)} chars")
            return content
        except Exception as exc:
            log.error(f"Ollama generation failed: {exc}")
            raise RuntimeError(
                f"LLM generation failed. Is Ollama running at {self.host}? Error: {exc}"
            ) from exc

    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> Generator[str, None, None]:
        """Stream tokens one chunk at a time."""
        messages = self._build_messages(prompt, system_prompt, chat_history)

        try:
            stream = self._client.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": self.temperature,
                    "num_predict": self.max_tokens,
                },
                stream=True,
            )
            for chunk in stream:
                token = chunk["message"]["content"]
                if token:
                    yield token
        except Exception as exc:
            log.error(f"Ollama streaming failed: {exc}")
            raise RuntimeError(
                f"LLM streaming failed. Is Ollama running at {self.host}? Error: {exc}"
            ) from exc

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _build_messages(
        prompt: str,
        system_prompt: Optional[str],
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> list[dict[str, str]]:
        """
        Build the Ollama chat message list.

        If chat_history is provided, inserts it between the system
        prompt and the current user message to give the LLM
        conversational context.
        """
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # Insert conversation history
        if chat_history:
            for msg in chat_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": prompt})
        return messages

