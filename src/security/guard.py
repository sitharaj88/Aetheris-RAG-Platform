"""
Prompt-injection and data-leak guards for RAG.

A lightweight, dependency-free defensive layer applied around the query path:

* **Input scanning** detects direct prompt-injection attempts in the user query
  (e.g. "ignore previous instructions", attempts to reveal the system prompt).
* **Output scanning** detects likely data leaks in the generated answer
  (e.g. emails, credit-card-like numbers, leaked system-prompt markers).

This is heuristic (regex-based) and intentionally cheap; it is a first line of
defence, not a replacement for a dedicated classifier. It is config-gated and
defaults to *annotate, don't block* so it cannot silently break answers.

Background: indirect prompt injection is a top RAG-agent risk —
https://aquilax.ai/blog/indirect-prompt-injection-rag-agents
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from src.utils.logger import get_logger

log = get_logger(__name__)


# Common direct prompt-injection / jailbreak phrasings.
_INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions",
    r"disregard\s+(?:all\s+)?(?:previous|prior|the)\s+(?:instructions|context|rules)",
    r"forget\s+(?:everything|all\s+previous|your\s+instructions)",
    r"reveal\s+(?:your\s+)?(?:system\s+prompt|instructions|hidden\s+prompt)",
    r"(?:print|show|repeat|output)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions)",
    r"you\s+are\s+now\s+(?:a|an|in)\s+",
    r"developer\s+mode",
    r"\bDAN\b\s+mode",
    r"act\s+as\s+(?:if\s+you\s+are\s+)?(?:an?\s+)?(?:unrestricted|jailbroken)",
]

# Likely sensitive data in outputs.
_LEAK_PATTERNS = {
    "email": r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
    "credit_card": r"\b(?:\d[ -]*?){13,16}\b",
    "system_prompt_marker": r"RAG_SYSTEM_PROMPT|You are a precise, knowledgeable assistant that answers",
    "private_key": r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
}

_INJECTION_RE = [re.compile(p, re.IGNORECASE) for p in _INJECTION_PATTERNS]
_LEAK_RE = {name: re.compile(p, re.IGNORECASE) for name, p in _LEAK_PATTERNS.items()}


@dataclass
class GuardResult:
    """Outcome of a guard scan."""

    flagged: bool = False
    reasons: list[str] = field(default_factory=list)


class SecurityGuard:
    """Heuristic input/output guard.

    Args:
        scan_input: Whether to scan incoming queries.
        scan_output: Whether to scan generated answers.
    """

    def __init__(self, scan_input: bool = True, scan_output: bool = True) -> None:
        self.scan_input_enabled = scan_input
        self.scan_output_enabled = scan_output

    def scan_input(self, text: str) -> GuardResult:
        """Scan a user query for prompt-injection attempts."""
        if not self.scan_input_enabled or not text:
            return GuardResult()
        reasons = [
            f"prompt_injection:{rx.pattern[:40]}"
            for rx in _INJECTION_RE
            if rx.search(text)
        ]
        if reasons:
            log.warning(f"SecurityGuard flagged input: {reasons}")
        return GuardResult(flagged=bool(reasons), reasons=reasons)

    def scan_output(self, text: str) -> GuardResult:
        """Scan a generated answer for likely data leaks."""
        if not self.scan_output_enabled or not text:
            return GuardResult()
        reasons = [f"data_leak:{name}" for name, rx in _LEAK_RE.items() if rx.search(text)]
        if reasons:
            log.warning(f"SecurityGuard flagged output: {reasons}")
        return GuardResult(flagged=bool(reasons), reasons=reasons)
