"""FastAPI middleware for request timing, logging, and error handling."""

from __future__ import annotations

import logging
import time
import traceback
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("rag.api")


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Add X-Process-Time header to every response."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Process-Time"] = f"{elapsed_ms:.2f}ms"
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Structured request logging for all API calls."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for static files and health checks to reduce noise
        path = request.url.path
        if path.startswith("/web/") or path == "/api/health":
            return await call_next(request)

        start = time.perf_counter()
        logger.info(
            "→ %s %s",
            request.method,
            path,
        )

        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        log_fn = logger.info if response.status_code < 400 else logger.warning
        log_fn(
            "← %s %s %d (%.1fms)",
            request.method,
            path,
            response.status_code,
            elapsed_ms,
        )
        return response


def install_error_handlers(app: FastAPI) -> None:
    """Install global exception handlers that return clean JSON errors."""

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Not Found",
                "detail": f"The path {request.url.path} was not found.",
                "status_code": 404,
            },
        )

    @app.exception_handler(422)
    async def validation_error_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation Error",
                "detail": str(exc),
                "status_code": 422,
            },
        )

    @app.exception_handler(500)
    async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
        logger.debug(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": "An unexpected error occurred. Check server logs for details.",
                "status_code": 500,
            },
        )

    @app.exception_handler(Exception)
    async def catch_all_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc)
        logger.debug(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "detail": str(exc) if logger.isEnabledFor(logging.DEBUG) else "An unexpected error occurred.",
                "status_code": 500,
            },
        )
