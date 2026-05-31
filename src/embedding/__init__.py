"""Embedding module for Veridia RAG."""

from src.embedding.base import BaseEmbedder
from src.embedding.sentence_transformer import SentenceTransformerEmbedder

__all__ = ["BaseEmbedder", "SentenceTransformerEmbedder"]
