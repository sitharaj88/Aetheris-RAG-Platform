"""
LiteLLM-backed LLM implementation.

Exposes a single :class:`BaseLLM` that can talk to local Ollama models and a
wide range of cloud providers (OpenAI, Anthropic, etc.) through one interface,
selected by a provider-prefixed model id such as ``ollama/qwen2.5:3b``,
``openai/gpt-4o-mini`` or ``anthropic/claude-sonnet-4-6``. Local stays the
default; cloud is purely opt-in via configuration.

This is also the backend expected by the A-Mem long-term memory component.
"""

from __future__ import annotations

from typing import Any, Generator, Optional

from src.generation.base import BaseLLM
from src.utils.logger import get_logger

log = get_logger(__name__)


class LiteLLMProvider(BaseLLM):
    """
    LLM provider backed by `litellm`.

    Args:
        model: Provider-prefixed model id (e.g. ``ollama/qwen2.5:3b``).
        temperature: Sampling temperature.
        max_tokens: Maximum tokens to generate.
        api_key: Optional API key for cloud providers.
        api_base: Optional API base URL (e.g. the Ollama host for ``ollama/*``).
    """

    def __init__(
        self,
        model: str = "ollama/qwen2.5:3b",
        temperature: float = 0.1,
        max_tokens: int = 2048,
        api_key: Optional[str] = None,
        api_base: Optional[str] = None,
    ) -> None:
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_key = api_key
        self.api_base = api_base

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    def _kwargs(self, messages: list[dict[str, str]], stream: bool) -> dict[str, Any]:
        kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": stream,
        }
        if self.api_key:
            kwargs["api_key"] = self.api_key
        if self.api_base:
            kwargs["api_base"] = self.api_base
        return kwargs

    @staticmethod
    def _build_messages(
        prompt: str,
        system_prompt: Optional[str],
        chat_history: Optional[list[dict[str, str]]],
    ) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if chat_history:
            for msg in chat_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": prompt})
        return messages

    # ------------------------------------------------------------------ #
    # BaseLLM implementation
    # ------------------------------------------------------------------ #

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        import litellm

        messages = self._build_messages(prompt, system_prompt, chat_history)
        try:
            response = litellm.completion(**self._kwargs(messages, stream=False))
            return response["choices"][0]["message"]["content"] or ""
        except Exception as exc:
            log.error(f"LiteLLM generation failed ({self.model}): {exc}")
            raise RuntimeError(f"LLM generation failed via LiteLLM ({self.model}): {exc}") from exc

    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> Generator[str, None, None]:
        import litellm

        messages = self._build_messages(prompt, system_prompt, chat_history)
        try:
            stream = litellm.completion(**self._kwargs(messages, stream=True))
            for chunk in stream:
                token = chunk["choices"][0]["delta"].get("content")
                if token:
                    yield token
        except Exception as exc:
            log.error(f"LiteLLM streaming failed ({self.model}): {exc}")
            raise RuntimeError(f"LLM streaming failed via LiteLLM ({self.model}): {exc}") from exc

    def is_available(self) -> bool:
        """Best-effort availability check via a tiny completion."""
        try:
            self.generate("ping", system_prompt="Reply with 'ok'.")
            return True
        except Exception:
            return False
