"""Generation module for Veridia RAG — LLM interface, prompts, and response formatting."""

from src.generation.base import BaseLLM
from src.generation.ollama_llm import OllamaLLM
from src.generation.prompts import (
    DECOMPOSE_PROMPT,
    HYDE_PROMPT,
    QUERY_REWRITE_PROMPT,
    RAG_SYSTEM_PROMPT,
    RAG_USER_PROMPT,
    RELEVANCE_CHECK_PROMPT,
    SELF_REFLECT_PROMPT,
)
from src.generation.response import ResponseFormatter

__all__ = [
    "BaseLLM",
    "DECOMPOSE_PROMPT",
    "HYDE_PROMPT",
    "OllamaLLM",
    "QUERY_REWRITE_PROMPT",
    "RAG_SYSTEM_PROMPT",
    "RAG_USER_PROMPT",
    "RELEVANCE_CHECK_PROMPT",
    "ResponseFormatter",
    "SELF_REFLECT_PROMPT",
]
