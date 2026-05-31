"""
Text preprocessing for the Veridia RAG ingestion pipeline.

Cleans raw document text, extracts lightweight metadata, and
normalises content before chunking.
"""

from __future__ import annotations

import re

from src.models import Document
from src.utils.logger import get_logger
from src.utils.text import clean_text

log = get_logger(__name__)


class TextPreprocessor:
    """
    Stateless text preprocessor applied to every document before chunking.

    Responsibilities:
    - Whitespace / control-character normalisation
    - Title detection (first heading or first line)
    - Language hint (best-effort, based on file extension)
    """

    # Mapping from file extension to human-readable language name
    _LANG_MAP: dict[str, str] = {
        "py": "python",
        "js": "javascript",
        "ts": "typescript",
        "java": "java",
        "c": "c",
        "cpp": "cpp",
        "go": "go",
        "rs": "rust",
        "rb": "ruby",
        "php": "php",
        "swift": "swift",
        "kt": "kotlin",
        "md": "markdown",
        "html": "html",
        "css": "css",
        "json": "json",
        "yaml": "yaml",
        "yml": "yaml",
        "toml": "toml",
        "txt": "text",
        "pdf": "text",
        "docx": "text",
    }

    def preprocess(self, document: Document) -> Document:
        """
        Return a new ``Document`` with cleaned text and enriched metadata.

        The original object is **not** mutated.
        """
        cleaned = clean_text(document.content)

        # Build enriched metadata
        meta = dict(document.metadata)
        meta["char_count"] = len(cleaned)
        meta["word_count"] = len(cleaned.split())

        # Detect title
        title = self._extract_title(cleaned)
        if title:
            meta["title"] = title

        # Detect language hint from file type
        file_type = meta.get("file_type", "")
        lang = self._LANG_MAP.get(file_type, "")
        if lang:
            meta["language"] = lang

        return Document(
            id=document.id,
            content=cleaned,
            metadata=meta,
            source=document.source,
        )

    def preprocess_batch(self, documents: list[Document]) -> list[Document]:
        """Preprocess a batch of documents."""
        result = []
        for doc in documents:
            try:
                result.append(self.preprocess(doc))
            except Exception as exc:
                log.error(f"Preprocessing failed for {doc.source}: {exc}")
                result.append(doc)  # keep original on failure
        return result

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _extract_title(text: str) -> str:
        """
        Best-effort title extraction.

        Looks for the first Markdown heading (``# Title``) or, failing
        that, uses the first non-empty line.
        """
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            # Markdown heading
            match = re.match(r"^#{1,3}\s+(.+)$", line)
            if match:
                return match.group(1).strip()
            # Fallback: first non-blank line (truncated)
            return line[:120]
        return ""
