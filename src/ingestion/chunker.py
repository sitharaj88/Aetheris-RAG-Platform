"""
Chunking strategies for the Veridia RAG ingestion pipeline.

Provides four strategies accessible via the ``get_chunker`` factory:

- **FixedSizeChunker** – character-level fixed window with overlap.
- **RecursiveChunker** – hierarchical splitting (paragraphs → lines →
  sentences → words) similar to LangChain's ``RecursiveCharacterTextSplitter``.
- **SemanticChunker** – splits where embedding cosine-similarity between
  consecutive sentences drops below a threshold.
- **MarkdownChunker** – structure-aware splitting on headings and code fences.
"""

from __future__ import annotations

import re
import uuid
from abc import ABC, abstractmethod
from enum import Enum
from typing import TYPE_CHECKING, Optional

from src.generation.base import BaseLLM
from src.models import Chunk, Document
from src.utils.logger import get_logger
from src.utils.text import split_sentences

if TYPE_CHECKING:
    from src.embedding.base import BaseEmbedder

log = get_logger(__name__)


# ---------------------------------------------------------------------------
# Strategy enum
# ---------------------------------------------------------------------------

class ChunkingStrategy(str, Enum):
    """Available chunking strategies."""

    FIXED = "fixed"
    RECURSIVE = "recursive"
    SEMANTIC = "semantic"
    MARKDOWN = "markdown"
    CONTEXTUAL = "contextual"


# ---------------------------------------------------------------------------
# Abstract base
# ---------------------------------------------------------------------------

class BaseChunker(ABC):
    """Interface every chunker must implement."""

    @abstractmethod
    def chunk(self, document: Document) -> list[Chunk]:
        """Split *document* into a list of ``Chunk`` objects."""
        ...


# ---------------------------------------------------------------------------
# Fixed-size chunker
# ---------------------------------------------------------------------------

class FixedSizeChunker(BaseChunker):
    """
    Split text into fixed-size character windows with overlap.

    Args:
        chunk_size: Maximum characters per chunk.
        chunk_overlap: Number of overlapping characters between chunks.
    """

    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk(self, document: Document) -> list[Chunk]:
        text = document.content
        chunks: list[Chunk] = []
        start = 0
        idx = 0

        while start < len(text):
            end = start + self.chunk_size
            chunk_text = text[start:end]

            chunks.append(
                Chunk(
                    id=str(uuid.uuid4()),
                    content=chunk_text,
                    document_id=document.id,
                    metadata={
                        **document.metadata,
                        "chunk_index": idx,
                        "chunk_strategy": ChunkingStrategy.FIXED.value,
                        "start_char": start,
                        "end_char": min(end, len(text)),
                    },
                )
            )
            start += self.chunk_size - self.chunk_overlap
            idx += 1

        log.debug(f"FixedSizeChunker produced {len(chunks)} chunk(s)")
        return chunks


# ---------------------------------------------------------------------------
# Recursive chunker
# ---------------------------------------------------------------------------

class RecursiveChunker(BaseChunker):
    """
    Hierarchical text splitter inspired by LangChain's
    ``RecursiveCharacterTextSplitter``.

    Splitting order: ``\\n\\n`` → ``\\n`` → sentence boundaries → words.
    Falls back to character-level split for very long tokens.
    """

    SEPARATORS = ["\n\n", "\n", ". ", " "]

    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk(self, document: Document) -> list[Chunk]:
        pieces = self._split_recursive(document.content, self.SEPARATORS)
        merged = self._merge_pieces(pieces)
        chunks: list[Chunk] = []

        for idx, text in enumerate(merged):
            chunks.append(
                Chunk(
                    id=str(uuid.uuid4()),
                    content=text,
                    document_id=document.id,
                    metadata={
                        **document.metadata,
                        "chunk_index": idx,
                        "chunk_strategy": ChunkingStrategy.RECURSIVE.value,
                    },
                )
            )

        log.debug(f"RecursiveChunker produced {len(chunks)} chunk(s)")
        return chunks

    # -- helpers --------------------------------------------------------

    def _split_recursive(self, text: str, separators: list[str]) -> list[str]:
        """Recursively split *text* using progressively finer separators."""
        if len(text) <= self.chunk_size:
            return [text] if text.strip() else []

        if not separators:
            # Last resort: hard cut
            return [text[i:i + self.chunk_size] for i in range(0, len(text), self.chunk_size)]

        sep = separators[0]
        remaining_seps = separators[1:]
        parts = text.split(sep)

        result: list[str] = []
        for part in parts:
            part_with_sep = part + sep if sep != " " else part + " "
            if len(part_with_sep.strip()) == 0:
                continue
            if len(part_with_sep) <= self.chunk_size:
                result.append(part_with_sep.rstrip())
            else:
                result.extend(self._split_recursive(part_with_sep.rstrip(), remaining_seps))

        return result

    def _merge_pieces(self, pieces: list[str]) -> list[str]:
        """Merge small adjacent pieces up to *chunk_size*, with overlap."""
        if not pieces:
            return []

        merged: list[str] = []
        current = pieces[0]

        for piece in pieces[1:]:
            candidate = current + "\n" + piece
            if len(candidate) <= self.chunk_size:
                current = candidate
            else:
                merged.append(current.strip())
                # Overlap: keep tail of current
                if self.chunk_overlap > 0:
                    overlap_text = current[-self.chunk_overlap:]
                    current = overlap_text + "\n" + piece
                else:
                    current = piece

        if current.strip():
            merged.append(current.strip())

        return merged


# ---------------------------------------------------------------------------
# Semantic chunker
# ---------------------------------------------------------------------------

class SemanticChunker(BaseChunker):
    """
    Split text at points where the cosine similarity between
    consecutive sentence embeddings drops below *threshold*.

    Requires an ``BaseEmbedder`` instance for computing embeddings.
    """

    def __init__(
        self,
        embedder: Optional["BaseEmbedder"] = None,
        threshold: float = 0.5,
        chunk_size: int = 512,
    ) -> None:
        self.embedder = embedder
        self.threshold = threshold
        self.chunk_size = chunk_size

    def chunk(self, document: Document) -> list[Chunk]:
        from src.utils.text import cosine_similarity as cos_sim

        if self.embedder is None:
            log.warning("SemanticChunker has no embedder; falling back to RecursiveChunker")
            return RecursiveChunker(chunk_size=self.chunk_size).chunk(document)

        sentences = split_sentences(document.content)
        if len(sentences) <= 1:
            return [
                Chunk(
                    id=str(uuid.uuid4()),
                    content=document.content,
                    document_id=document.id,
                    metadata={
                        **document.metadata,
                        "chunk_index": 0,
                        "chunk_strategy": ChunkingStrategy.SEMANTIC.value,
                    },
                )
            ]

        # Embed all sentences in a batch
        embeddings = self.embedder.embed_batch(sentences)

        # Find breakpoints where similarity drops
        breakpoints: list[int] = []
        for i in range(len(embeddings) - 1):
            sim = cos_sim(embeddings[i], embeddings[i + 1])
            if sim < self.threshold:
                breakpoints.append(i + 1)

        # Build chunks from breakpoints
        segments: list[str] = []
        prev = 0
        for bp in breakpoints:
            segment = " ".join(sentences[prev:bp])
            segments.append(segment)
            prev = bp
        segments.append(" ".join(sentences[prev:]))

        # Merge tiny segments
        merged = self._merge_short_segments(segments)

        chunks: list[Chunk] = []
        for idx, text in enumerate(merged):
            chunks.append(
                Chunk(
                    id=str(uuid.uuid4()),
                    content=text.strip(),
                    document_id=document.id,
                    metadata={
                        **document.metadata,
                        "chunk_index": idx,
                        "chunk_strategy": ChunkingStrategy.SEMANTIC.value,
                    },
                )
            )

        log.debug(f"SemanticChunker produced {len(chunks)} chunk(s)")
        return chunks

    def _merge_short_segments(self, segments: list[str], min_len: int = 80) -> list[str]:
        """Merge segments shorter than *min_len* into their neighbours."""
        if not segments:
            return []

        merged: list[str] = [segments[0]]
        for seg in segments[1:]:
            if len(merged[-1]) < min_len:
                merged[-1] = merged[-1] + " " + seg
            else:
                merged.append(seg)
        return merged


# ---------------------------------------------------------------------------
# Markdown chunker
# ---------------------------------------------------------------------------

class MarkdownChunker(BaseChunker):
    """
    Structure-aware Markdown splitter.

    Splits on headings (``#``, ``##``, ``###``) and fenced code blocks
    while preserving document structure in chunk metadata.
    """

    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 50) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk(self, document: Document) -> list[Chunk]:
        sections = self._split_by_headers(document.content)

        chunks: list[Chunk] = []
        for idx, (heading, body) in enumerate(sections):
            # If a section is too large, sub-split with RecursiveChunker
            if len(body) > self.chunk_size:
                sub_doc = Document(
                    id=document.id,
                    content=body,
                    metadata=document.metadata,
                    source=document.source,
                )
                sub_chunker = RecursiveChunker(self.chunk_size, self.chunk_overlap)
                sub_chunks = sub_chunker.chunk(sub_doc)
                for sc in sub_chunks:
                    sc.metadata["section_heading"] = heading
                    sc.metadata["chunk_strategy"] = ChunkingStrategy.MARKDOWN.value
                chunks.extend(sub_chunks)
            else:
                if not body.strip():
                    continue
                chunks.append(
                    Chunk(
                        id=str(uuid.uuid4()),
                        content=body.strip(),
                        document_id=document.id,
                        metadata={
                            **document.metadata,
                            "chunk_index": idx,
                            "section_heading": heading,
                            "chunk_strategy": ChunkingStrategy.MARKDOWN.value,
                        },
                    )
                )

        # Re-number chunk indices
        for i, c in enumerate(chunks):
            c.metadata["chunk_index"] = i

        log.debug(f"MarkdownChunker produced {len(chunks)} chunk(s)")
        return chunks

    @staticmethod
    def _split_by_headers(text: str) -> list[tuple[str, str]]:
        """
        Split Markdown text into ``(heading, body)`` pairs.

        Lines that match ``^#{1,4}\\s+`` start a new section.
        """
        header_re = re.compile(r"^(#{1,4})\s+(.+)$", re.MULTILINE)
        matches = list(header_re.finditer(text))

        if not matches:
            return [("", text)]

        sections: list[tuple[str, str]] = []

        # Text before first heading
        if matches[0].start() > 0:
            preamble = text[: matches[0].start()]
            if preamble.strip():
                sections.append(("", preamble))

        for i, m in enumerate(matches):
            heading = m.group(2).strip()
            start = m.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            body = text[start:end]
            sections.append((heading, body))

        return sections


# ---------------------------------------------------------------------------
# Contextual chunker
# ---------------------------------------------------------------------------

class ContextualChunker(BaseChunker):
    """
    Anthropic-style Contextual Chunker.

    Generates a 1-2 sentence contextual summary of the entire document
    using the LLM, and prepends this summary to each chunk produced
    by a base chunker (default: RecursiveChunker).
    """

    def __init__(
        self,
        llm: BaseLLM,
        base_chunker: BaseChunker,
        prompt_template: Optional[str] = None,
    ) -> None:
        self.llm = llm
        self.base_chunker = base_chunker
        self.prompt_template = prompt_template or (
            "You are an expert document preprocessor. Given the following document text, "
            "provide a concise 1-2 sentence context summary explaining what this document is about "
            "and who or what it concerns. Do not write a generic summary; focus on the specific content. "
            "Return ONLY the 1-2 sentence summary, and nothing else.\n\n"
            "Document Text:\n{document_text}"
        )

    def chunk(self, document: Document) -> list[Chunk]:
        # 1. Generate document summary context using LLM
        log.info(f"Generating contextual summary for document: {document.source or 'unknown'}...")
        prompt = self.prompt_template.format(document_text=document.content[:4000])  # limit context to first 4k chars
        
        try:
            summary = self.llm.generate(prompt).strip()
            log.debug(f"Generated context summary: {summary!r}")
        except Exception as exc:
            log.error(f"Failed to generate contextual summary: {exc}. Using empty context.")
            summary = ""

        # 2. Get base chunks
        chunks = self.base_chunker.chunk(document)

        # 3. Prepend context to each chunk
        if summary:
            for chunk in chunks:
                chunk.content = f"<Document Context: {summary}>\n{chunk.content}"
                chunk.metadata["has_contextual_summary"] = True
                chunk.metadata["contextual_summary"] = summary
        else:
            for chunk in chunks:
                chunk.metadata["has_contextual_summary"] = False

        return chunks


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def get_chunker(
    strategy: ChunkingStrategy | str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    embedder: Optional["BaseEmbedder"] = None,
    semantic_threshold: float = 0.5,
    llm: Optional[BaseLLM] = None,
) -> BaseChunker:
    """
    Factory function returning the appropriate chunker.

    Args:
        strategy: One of the ``ChunkingStrategy`` variants or its string value.
        chunk_size: Maximum chunk size in characters.
        chunk_overlap: Overlap between consecutive chunks.
        embedder: Required for ``SEMANTIC`` strategy.
        semantic_threshold: Similarity threshold for ``SEMANTIC`` strategy.
        llm: Required for ``CONTEXTUAL`` strategy.
    """
    if isinstance(strategy, str):
        strategy = ChunkingStrategy(strategy.lower())

    if strategy == ChunkingStrategy.FIXED:
        return FixedSizeChunker(chunk_size, chunk_overlap)
    elif strategy == ChunkingStrategy.RECURSIVE:
        return RecursiveChunker(chunk_size, chunk_overlap)
    elif strategy == ChunkingStrategy.SEMANTIC:
        return SemanticChunker(embedder=embedder, threshold=semantic_threshold, chunk_size=chunk_size)
    elif strategy == ChunkingStrategy.MARKDOWN:
        return MarkdownChunker(chunk_size, chunk_overlap)
    elif strategy == ChunkingStrategy.CONTEXTUAL:
        if llm is None:
            raise ValueError("Contextual chunking requires an LLM instance.")
        base_chunker = RecursiveChunker(chunk_size, chunk_overlap)
        return ContextualChunker(llm, base_chunker)
    else:
        raise ValueError(f"Unknown chunking strategy: {strategy}")
