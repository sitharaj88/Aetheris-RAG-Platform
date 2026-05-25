"""
Loguru-based structured logging for the RAG1 system.

Provides module-specific loggers, a performance-timing decorator,
and one-time global configuration.
"""

from __future__ import annotations

import functools
import sys
import time
from pathlib import Path
from typing import Any, Callable

from loguru import logger

_CONFIGURED = False


def setup_logging(
    level: str = "INFO",
    log_file: str = "logs/rag1.log",
    rotation: str = "10 MB",
    retention: str = "7 days",
) -> None:
    """
    Configure loguru sinks (console + file).

    Calling this more than once is a no-op so it is safe to invoke
    at import time from multiple modules.
    """
    global _CONFIGURED  # noqa: PLW0603
    if _CONFIGURED:
        return
    _CONFIGURED = True

    # Remove default handler
    logger.remove()

    # Console sink – coloured, human-readable
    logger.add(
        sys.stderr,
        level=level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
            "<level>{message}</level>"
        ),
        colorize=True,
    )

    # File sink – JSON-like for machine consumption
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    logger.add(
        str(log_path),
        level=level,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation=rotation,
        retention=retention,
        encoding="utf-8",
    )


def get_logger(name: str) -> Any:
    """
    Return a loguru logger bound to the given module *name*.

    Usage::

        log = get_logger(__name__)
        log.info("Starting ingestion …")
    """
    # Lazy-init on first call
    if not _CONFIGURED:
        setup_logging()
    return logger.bind(name=name)


def timed(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator that logs elapsed wall-clock time of *func*.

    Works for both sync and async callables.
    """
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        log = get_logger(func.__module__)
        start = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            elapsed = time.perf_counter() - start
            log.info(f"{func.__qualname__} completed in {elapsed:.3f}s")
            return result
        except Exception:
            elapsed = time.perf_counter() - start
            log.error(f"{func.__qualname__} failed after {elapsed:.3f}s")
            raise

    return wrapper
