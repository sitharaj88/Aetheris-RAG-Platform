"""
Core data models for the RAG1 system.

All data structures flowing through the pipeline are defined here
as immutable Pydantic models to ensure validation and serialisation.
"""

from __future__ import annotations

import uuid
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------

class Document(BaseModel):
    """A source document loaded from disk."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str = Field(..., description="Raw text content of the document")
    metadata: dict[str, Any] = Field(default_factory=dict)
    source: str = Field(default="", description="File path or URI of origin")


class Chunk(BaseModel):
    """A text chunk produced by a chunking strategy."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str = Field(..., description="Chunk text")
    metadata: dict[str, Any] = Field(default_factory=dict)
    document_id: str = Field(default="", description="Parent document ID")
    embedding: Optional[list[float]] = Field(default=None, description="Dense vector")


class RetrievalResult(BaseModel):
    """A single retrieval hit with its score."""

    chunk: Chunk
    score: float = Field(default=0.0)
    source: str = Field(default="")


# ---------------------------------------------------------------------------
# Query / Response models
# ---------------------------------------------------------------------------

class RAGStrategyType(str, Enum):
    """Available RAG strategy types."""

    NAIVE = "naive"
    CORRECTIVE = "corrective"
    SELF_RAG = "self_rag"
    AGENTIC = "agentic"
    ADAPTIVE = "adaptive"


class QueryComplexity(str, Enum):
    """Query complexity classification."""

    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


class QueryResult(BaseModel):
    """Result produced by a RAG strategy."""

    answer: str = Field(default="")
    sources: list[RetrievalResult] = Field(default_factory=list)
    strategy_used: str = Field(default="")
    metadata: dict[str, Any] = Field(default_factory=dict)


class RAGRequest(BaseModel):
    """Incoming query request from the API layer."""

    query: str = Field(..., description="User question")
    collection: str = Field(default="default_collection")
    strategy: RAGStrategyType = Field(default=RAGStrategyType.ADAPTIVE)
    top_k: int = Field(default=5, ge=1, le=50)
    stream: bool = Field(default=False)
    filters: dict[str, Any] = Field(default_factory=dict)


class RAGResponse(BaseModel):
    """Outgoing response from the API layer."""

    answer: str = Field(default="")
    sources: list[dict[str, Any]] = Field(default_factory=list)
    timing: dict[str, float] = Field(default_factory=dict)
    token_usage: dict[str, int] = Field(default_factory=dict)
    strategy_used: str = Field(default="")
    metadata: dict[str, Any] = Field(default_factory=dict)


class IngestionStats(BaseModel):
    """Statistics returned after ingesting documents."""

    total_files: int = 0
    total_chunks: int = 0
    total_documents: int = 0
    failed_files: list[str] = Field(default_factory=list)
    elapsed_seconds: float = 0.0
