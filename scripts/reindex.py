"""
Re-index utility.

Changing the embedding model or its dimension (e.g. switching to
Qwen3-Embedding) invalidates every existing ChromaDB collection — vectors of
the old dimension can no longer be searched against new query vectors, and
there is no in-place migration. This script performs a clean rebuild:

    1. (optional) wipe the ChromaDB persist directory + BM25 indexes
    2. re-ingest every document under ``data/raw`` through the current pipeline
       (which embeds with the now-configured model and rebuilds the BM25 index)

Usage:
    python -m scripts.reindex                # re-ingest data/raw into default collection
    python -m scripts.reindex --wipe         # delete the vector store first (full rebuild)
    python -m scripts.reindex --source docs  # re-ingest from a custom directory

Run this after editing the ``embedding`` section of config.yaml.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from src.config.settings import get_settings
from src.pipeline import RAGPipeline
from src.utils.logger import get_logger

log = get_logger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Re-index documents after an embedding change.")
    parser.add_argument(
        "--source",
        default="data/raw",
        help="Directory of source documents to re-ingest (default: data/raw)",
    )
    parser.add_argument(
        "--wipe",
        action="store_true",
        help="Delete the ChromaDB persist directory before re-ingesting (full rebuild)",
    )
    args = parser.parse_args()

    settings = get_settings()
    persist_dir = Path(settings.vectorstore.persist_dir)
    source = Path(args.source)

    log.info(f"Embedding provider={settings.embedding.provider} model={settings.embedding.model_name}")

    if args.wipe and persist_dir.exists():
        log.warning(f"Wiping vector store at {persist_dir}")
        shutil.rmtree(persist_dir)

    if not source.exists():
        log.error(f"Source directory not found: {source.resolve()}")
        raise SystemExit(1)

    pipeline = RAGPipeline(settings)
    log.info(f"Re-ingesting documents from {source.resolve()} ...")
    stats = pipeline.ingest(source)

    log.info(
        f"Re-index complete: {stats.total_documents} docs, "
        f"{stats.total_chunks} chunks in {stats.elapsed_seconds:.1f}s. "
        f"Failed: {stats.failed_files or 'none'}"
    )
    health = pipeline.health_check()
    log.info(f"Vector store stats: {health.get('vector_store')}")


if __name__ == "__main__":
    main()
