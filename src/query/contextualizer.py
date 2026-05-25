"""
Query Contextualizer — rewrites follow-up queries into standalone queries.

When a user asks a follow-up question like "What is his role?", the
retrieval system can't find relevant documents because "his" is
ambiguous without conversation context.

This module uses the LLM to rewrite such queries into fully
self-contained questions: "What is Sitharaj's role?"
"""

from __future__ import annotations

from typing import Optional

from src.generation.base import BaseLLM
from src.utils.logger import get_logger

log = get_logger(__name__)

CONTEXTUALIZE_PROMPT = """\
Given the following conversation history and a follow-up question, \
rewrite the follow-up question as a standalone question that can be \
understood without the conversation history. Resolve all pronouns \
(he, she, it, they, his, her, etc.) and references to their actual \
entities from the conversation.

If the follow-up question is already standalone and self-contained, \
return it unchanged.

Conversation history:
{history}

Follow-up question: {question}

Standalone question (respond with ONLY the rewritten question, nothing else):"""


class QueryContextualizer:
    """
    Rewrites follow-up queries into standalone queries using LLM
    and conversation history.

    Args:
        llm: Language model to use for rewriting.
    """

    def __init__(self, llm: BaseLLM) -> None:
        self.llm = llm

    def contextualize(
        self,
        question: str,
        chat_history: list[dict[str, str]],
    ) -> str:
        """
        Rewrite *question* into a standalone query using *chat_history*.

        If there's no history or the question appears standalone,
        returns the original question.

        Args:
            question: The user's current (possibly follow-up) question.
            chat_history: Prior conversation turns as
                ``[{"role": "user"|"assistant", "content": "..."}]``.

        Returns:
            A standalone question suitable for retrieval.
        """
        if not chat_history:
            return question

        # Build a readable history string
        history_str = self._format_history(chat_history)

        prompt = CONTEXTUALIZE_PROMPT.format(
            history=history_str,
            question=question,
        )

        try:
            rewritten = self.llm.generate(prompt).strip()
            # Remove quotes if the LLM wraps the output
            if rewritten.startswith('"') and rewritten.endswith('"'):
                rewritten = rewritten[1:-1]
            if rewritten.startswith("'") and rewritten.endswith("'"):
                rewritten = rewritten[1:-1]

            log.info(
                f"Contextualized query: {question!r} → {rewritten!r}"
            )
            return rewritten or question
        except Exception as e:
            log.warning(f"Query contextualization failed: {e}; using original query")
            return question

    @staticmethod
    def _format_history(
        chat_history: list[dict[str, str]],
        max_turns: int = 10,
    ) -> str:
        """
        Format chat history into a readable string.

        Only the last *max_turns* turns are included to keep
        the prompt size reasonable.
        """
        recent = chat_history[-max_turns * 2 :]  # Each turn has 2 messages
        lines: list[str] = []
        for msg in recent:
            role = msg.get("role", "user").capitalize()
            content = msg.get("content", "")
            # Truncate very long messages
            if len(content) > 500:
                content = content[:500] + "..."
            lines.append(f"{role}: {content}")
        return "\n".join(lines)
