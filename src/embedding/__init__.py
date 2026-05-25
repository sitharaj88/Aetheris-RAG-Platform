"""Embedding module for RAG1."""

from src.embedding.base import BaseEmbedder
from src.embedding.sentence_transformer import SentenceTransformerEmbedder

__all__ = ["BaseEmbedder", "SentenceTransformerEmbedder"]
