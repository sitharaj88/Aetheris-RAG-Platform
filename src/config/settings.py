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

    model_name: str = Field(default="all-MiniLM-L6-v2", description="HuggingFace model ID")
    dimension: int = Field(default=384, description="Embedding vector dimension")
    batch_size: int = Field(default=64, description="Batch size for embedding")
    normalize: bool = Field(default=True, description="L2-normalize embeddings")


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
    model_name: str = Field(
        default="cross-encoder/ms-marco-MiniLM-L-6-v2",
        description="Cross-encoder model for re-ranking",
    )
    top_k: int = Field(default=5, description="Number of results after re-ranking")


class GenerationConfig(BaseModel):
    """Configuration for the LLM generation stage."""

    ollama_host: str = Field(default="http://127.0.0.1:11434", description="Ollama server URL")
    model: str = Field(default="qwen2.5:3b", description="Ollama model name")
    temperature: float = Field(default=0.1, description="Sampling temperature")
    max_tokens: int = Field(default=2048, description="Maximum tokens to generate")
    stream: bool = Field(default=True, description="Enable streaming responses")


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

    def __init__(self, **kwargs: Any) -> None:
        """Merge YAML config with env overrides."""
        yaml_data = _load_yaml_config()
        # YAML values are defaults; kwargs (env) override them
        merged: dict[str, Any] = {}
        for section_name in [
            "embedding", "chunking", "retrieval", "reranking",
            "generation", "vectorstore", "logging", "ingestion",
        ]:
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
