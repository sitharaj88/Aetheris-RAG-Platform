"""
Pydantic-based settings management for the Veridia RAG system.

Loads configuration from config.yaml and environment variables,
with env vars taking precedence. Provides a singleton pattern
for global access to settings.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# ---------------------------------------------------------------------------
# Nested config sections
# ---------------------------------------------------------------------------

class EmbeddingConfig(BaseModel):
    """Configuration for the embedding model."""

    provider: str = Field(
        default="sentence_transformers",
        description="Embedding backend: sentence_transformers | qwen3 | openai",
    )
    model_name: str = Field(default="all-MiniLM-L6-v2", description="HuggingFace model ID")
    dimension: int = Field(default=384, description="Embedding vector dimension")
    batch_size: int = Field(default=64, description="Batch size for embedding")
    normalize: bool = Field(default=True, description="L2-normalize embeddings")
    # Qwen3 / Matryoshka: truncate native dims (1024/2560/4096) down to this many.
    # null = use the model's native dimension.
    truncate_dim: int | None = Field(
        default=None,
        description="Matryoshka truncation dimension (null = native)",
    )
    max_seq_length: int | None = Field(
        default=None,
        description="Override max input tokens (Qwen3 supports up to 32K)",
    )
    # Cloud / remote backend options (used by qwen3 'ollama' backend or openai)
    backend: str = Field(
        default="sentence_transformers",
        description="qwen3 sub-backend: sentence_transformers | ollama",
    )
    host: str = Field(
        default="http://127.0.0.1:11434",
        description="Ollama host for qwen3 ollama / embedding backend",
    )
    api_key: str | None = Field(default=None, description="API key for cloud embedding providers")
    base_url: str | None = Field(default=None, description="Base URL for cloud embedding providers")


class ChunkingConfig(BaseModel):
    """Configuration for text chunking."""

    strategy: str = Field(default="recursive", description="Chunking strategy name")
    chunk_size: int = Field(default=512, description="Max characters per chunk")
    chunk_overlap: int = Field(default=50, description="Overlap between consecutive chunks")
    semantic_threshold: float = Field(
        default=0.5,
        description="Cosine-similarity drop threshold for semantic chunking",
    )


class RetrievalConfig(BaseModel):
    """Configuration for the retrieval stage."""

    top_k: int = Field(default=10, description="Number of candidates to retrieve")
    similarity_threshold: float = Field(default=0.3, description="Minimum similarity score")
    dense_weight: float = Field(default=0.6, description="Weight for dense retrieval in RRF")
    sparse_weight: float = Field(default=0.4, description="Weight for sparse retrieval in RRF")
    rrf_k: int = Field(default=60, description="RRF constant k")


class RerankingConfig(BaseModel):
    """Configuration for the re-ranking stage."""

    enabled: bool = Field(default=True, description="Whether to enable re-ranking")
    provider: str = Field(
        default="cross_encoder",
        description="Reranker backend: cross_encoder | qwen3",
    )
    model_name: str = Field(
        default="cross-encoder/ms-marco-MiniLM-L-6-v2",
        description="Cross-encoder model for re-ranking",
    )
    top_k: int = Field(default=5, description="Number of results after re-ranking")


class GenerationConfig(BaseModel):
    """Configuration for the LLM generation stage."""

    provider: str = Field(
        default="ollama",
        description="LLM backend: ollama | litellm",
    )
    ollama_host: str = Field(default="http://127.0.0.1:11434", description="Ollama server URL")
    model: str = Field(default="qwen2.5:3b", description="Ollama model name")
    temperature: float = Field(default=0.1, description="Sampling temperature")
    max_tokens: int = Field(default=2048, description="Maximum tokens to generate")
    stream: bool = Field(default=True, description="Enable streaming responses")
    # LiteLLM backend: a provider-prefixed model id, e.g. "openai/gpt-4o-mini",
    # "anthropic/claude-sonnet-4-6", or "ollama/qwen2.5:3b".
    litellm_model: str = Field(
        default="ollama/qwen2.5:3b",
        description="LiteLLM model id (provider-prefixed)",
    )
    api_key: str | None = Field(default=None, description="API key for cloud LLM via LiteLLM")
    api_base: str | None = Field(default=None, description="API base URL for LiteLLM")


class VectorStoreConfig(BaseModel):
    """Configuration for the vector store."""

    persist_dir: str = Field(default="./data/chromadb", description="ChromaDB persistence path")
    collection_name: str = Field(default="default_collection", description="Default collection")


class LoggingConfig(BaseModel):
    """Configuration for logging."""

    level: str = Field(default="INFO", description="Log level")
    file: str = Field(default="logs/veridia.log", description="Log file path")
    rotation: str = Field(default="10 MB", description="Log rotation size")
    retention: str = Field(default="7 days", description="Log retention period")


class IngestionConfig(BaseModel):
    """Configuration for document ingestion."""

    supported_extensions: list[str] = Field(
        default_factory=lambda: [
            ".pdf", ".docx", ".md", ".txt", ".py", ".js", ".ts", ".java",
            ".c", ".cpp", ".go", ".rs", ".html", ".css", ".json", ".yaml",
            ".yml", ".toml",
        ],
        description="File extensions to process",
    )
    max_file_size_mb: int = Field(default=50, description="Max file size in MB")
    pdf_parser: str = Field(
        default="pymupdf",
        description="PDF parsing backend: pymupdf | mineru (MinerU2.5 service)",
    )
    mineru_url: str | None = Field(
        default=None,
        description="Base URL of an external MinerU2.5 parsing service",
    )


class ObservabilityConfig(BaseModel):
    """Configuration for tracing / observability (Langfuse)."""

    enabled: bool = Field(default=False, description="Enable Langfuse tracing")
    provider: str = Field(default="langfuse", description="Tracing backend: langfuse")
    host: str = Field(default="http://localhost:3000", description="Langfuse host URL")
    public_key: str | None = Field(default=None, description="Langfuse public key")
    secret_key: str | None = Field(default=None, description="Langfuse secret key")


class CacheConfig(BaseModel):
    """Configuration for semantic answer caching."""

    enabled: bool = Field(default=False, description="Enable semantic query cache")
    similarity_threshold: float = Field(
        default=0.95,
        description="Min cosine similarity to count as a cache hit",
    )
    collection_name: str = Field(
        default="_semantic_cache",
        description="Chroma collection used to store cached query/answer pairs",
    )
    max_entries: int = Field(default=1000, description="Max cached entries (LRU-trimmed)")


class SecurityConfig(BaseModel):
    """Configuration for prompt-injection / data-leak guards."""

    enabled: bool = Field(default=False, description="Enable input/output guards")
    scan_input: bool = Field(default=True, description="Scan incoming queries")
    scan_output: bool = Field(default=True, description="Scan generated answers")
    block_on_detection: bool = Field(
        default=False,
        description="If True, raise on detection; else annotate and continue",
    )


# ---------------------------------------------------------------------------
# Root settings
# ---------------------------------------------------------------------------

def _load_yaml_config() -> dict[str, Any]:
    """Load settings from config.yaml if it exists."""
    config_path = Path(os.getenv("RAG_CONFIG_PATH", "config.yaml"))
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
            return data if isinstance(data, dict) else {}
    return {}


class Settings(BaseSettings):
    """
    Root settings object for the Veridia RAG system.

    Priority (highest → lowest):
        1. Environment variables / .env
        2. config.yaml
        3. Field defaults
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Section configs
    embedding: EmbeddingConfig = Field(default_factory=EmbeddingConfig)
    chunking: ChunkingConfig = Field(default_factory=ChunkingConfig)
    retrieval: RetrievalConfig = Field(default_factory=RetrievalConfig)
    reranking: RerankingConfig = Field(default_factory=RerankingConfig)
    generation: GenerationConfig = Field(default_factory=GenerationConfig)
    vectorstore: VectorStoreConfig = Field(default_factory=VectorStoreConfig)
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    ingestion: IngestionConfig = Field(default_factory=IngestionConfig)
    observability: ObservabilityConfig = Field(default_factory=ObservabilityConfig)
    cache: CacheConfig = Field(default_factory=CacheConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)

    def __init__(self, **kwargs: Any) -> None:
        """Merge YAML config with env overrides."""
        yaml_data = _load_yaml_config()
        # YAML values are defaults; kwargs (env) override them.
        # Section names are derived from the model's own fields so that adding
        # a new config section never requires touching a hardcoded whitelist.
        merged: dict[str, Any] = {}
        for section_name in type(self).model_fields:
            yaml_section = yaml_data.get(section_name, {})
            kwarg_section = kwargs.pop(section_name, {})
            if isinstance(yaml_section, dict) and isinstance(kwarg_section, dict):
                merged[section_name] = {**yaml_section, **kwarg_section}
            elif isinstance(kwarg_section, dict) and kwarg_section:
                merged[section_name] = kwarg_section
            elif isinstance(yaml_section, dict) and yaml_section:
                merged[section_name] = yaml_section
        # Pass everything to pydantic
        super().__init__(**{**merged, **kwargs})


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the global singleton Settings instance."""
    return Settings()
