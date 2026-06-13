"""
Tracing / observability scaffold.

Provides a single :class:`Tracer` abstraction used to wrap pipeline operations
(query, retrieval, rerank, generation) in spans. When observability is disabled
(the default), every method is a cheap no-op so the hot path is unaffected. When
enabled with ``provider: langfuse``, spans are emitted to a self-hosted Langfuse
instance (MIT, OpenTelemetry-native). Langfuse SDK calls are defensively guarded
so a missing dependency or version skew degrades to no-op rather than crashing.

Reference: https://github.com/langfuse/langfuse
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator, Optional

from src.config.settings import ObservabilityConfig
from src.utils.logger import get_logger

log = get_logger(__name__)


class _NoOpSpan:
    """A span that records nothing."""

    def update(self, **_: Any) -> None:  # noqa: D401
        pass

    @contextmanager
    def span(self, _name: str, **_kw: Any) -> Iterator["_NoOpSpan"]:
        yield self


class Tracer:
    """
    Thin tracing facade.

    Usage::

        with tracer.trace("rag_query", input=question) as t:
            with t.span("retrieval"):
                ...
            t.update(output=answer, metadata={"strategy": name})
    """

    def __init__(self, config: ObservabilityConfig) -> None:
        self.config = config
        self.enabled = bool(config.enabled)
        self._client: Any | None = None
        if self.enabled and config.provider == "langfuse":
            self._init_langfuse()

    def _init_langfuse(self) -> None:
        try:
            from langfuse import Langfuse

            self._client = Langfuse(
                host=self.config.host,
                public_key=self.config.public_key,
                secret_key=self.config.secret_key,
            )
            log.info(f"Langfuse tracing enabled @ {self.config.host}")
        except Exception as exc:  # missing dep, bad keys, version skew → no-op
            log.warning(f"Langfuse init failed; tracing disabled: {exc}")
            self.enabled = False
            self._client = None

    @contextmanager
    def trace(
        self,
        name: str,
        input: Any = None,  # noqa: A002 - mirrors Langfuse arg name
        metadata: Optional[dict[str, Any]] = None,
    ) -> Iterator[Any]:
        """Open a top-level trace span. Yields a handle exposing ``update``/``span``."""
        if not self.enabled or self._client is None:
            yield _NoOpSpan()
            return

        span_cm = None
        try:
            # Langfuse v3 OTEL-style API.
            span_cm = self._client.start_as_current_span(
                name=name, input=input, metadata=metadata or {}
            )
            handle = span_cm.__enter__()
        except Exception as exc:
            log.debug(f"Langfuse trace start failed; no-op: {exc}")
            yield _NoOpSpan()
            return

        try:
            yield handle
        finally:
            try:
                if span_cm is not None:
                    span_cm.__exit__(None, None, None)
                self._client.flush()
            except Exception as exc:
                log.debug(f"Langfuse trace finalize failed: {exc}")


def get_tracer(config: ObservabilityConfig) -> Tracer:
    """Build a :class:`Tracer` from the observability config section."""
    return Tracer(config)
