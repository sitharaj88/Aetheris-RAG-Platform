"""
RAGAS evaluation harness.

Runs a golden question set through the live RAG pipeline and scores answer
quality with RAGAS (faithfulness, answer relevancy, context precision/recall).
This is the offline regression gate: capture a baseline first, then re-run after
each upgrade (reranker, embeddings, parsing, GraphRAG) and require metrics not to
regress.

By default the RAGAS judge LLM + embedder point at the SAME local Ollama instance
(via litellm/langchain-ollama) so evaluation stays local-first. A 3B local judge
is noisy — treat scores as directional and use a stronger (optionally cloud) judge
for milestone gates by setting --judge-model / OPENAI_API_KEY.

Dataset format (eval/dataset.jsonl), one JSON object per line:
    {"question": "...", "ground_truth": "...", "collection": "default_collection",
     "strategy": "naive"}

Usage:
    python -m eval.run_ragas
    python -m eval.run_ragas --dataset eval/dataset.jsonl --strategy naive
    python -m eval.run_ragas --judge-model openai/gpt-4o-mini   # cloud judge
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from src.config.settings import get_settings
from src.pipeline import RAGPipeline
from src.utils.logger import get_logger

log = get_logger(__name__)


def load_dataset(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("//"):
                rows.append(json.loads(line))
    return rows


def collect_samples(
    pipeline: RAGPipeline,
    rows: list[dict[str, Any]],
    default_strategy: str,
) -> list[dict[str, Any]]:
    """Run each question through the pipeline and gather RAGAS sample fields."""
    samples: list[dict[str, Any]] = []
    for i, row in enumerate(rows, 1):
        question = row["question"]
        collection = row.get("collection")
        if collection:
            pipeline.switch_collection(collection)
        strategy = row.get("strategy", default_strategy)
        log.info(f"[{i}/{len(rows)}] querying ({strategy}): {question!r}")
        result = pipeline.query(question, strategy=strategy)
        contexts = [r.chunk.content for r in result.sources]
        samples.append(
            {
                "user_input": question,
                "response": result.answer,
                "retrieved_contexts": contexts or ["(no context retrieved)"],
                "reference": row.get("ground_truth", ""),
            }
        )
    return samples


def evaluate_with_ragas(samples: list[dict[str, Any]], judge_model: str, settings: Any) -> Any:
    """Score samples with RAGAS using a litellm-backed judge (local by default)."""
    from datasets import Dataset
    from ragas import evaluate
    from ragas.metrics import (
        answer_relevancy,
        context_precision,
        context_recall,
        faithfulness,
    )

    # Wrap an LLM + embeddings for RAGAS. Prefer langchain-ollama for local;
    # fall back to whatever the installed RAGAS expects.
    llm = None
    embeddings = None
    try:
        from langchain_ollama import ChatOllama, OllamaEmbeddings

        host = settings.generation.ollama_host
        llm = ChatOllama(model=settings.generation.model, base_url=host, temperature=0)
        embeddings = OllamaEmbeddings(model="nomic-embed-text", base_url=host)
        log.info(f"RAGAS judge: local Ollama ({settings.generation.model}) @ {host}")
    except Exception as exc:
        log.warning(f"Could not build local Ollama judge ({exc}); using RAGAS defaults")

    dataset = Dataset.from_list(samples)
    metrics = [faithfulness, answer_relevancy, context_precision, context_recall]
    kwargs: dict[str, Any] = {"metrics": metrics}
    if llm is not None:
        kwargs["llm"] = llm
    if embeddings is not None:
        kwargs["embeddings"] = embeddings
    return evaluate(dataset, **kwargs)


def main() -> None:
    parser = argparse.ArgumentParser(description="RAGAS evaluation of the RAG pipeline.")
    parser.add_argument("--dataset", default="eval/dataset.jsonl")
    parser.add_argument("--strategy", default="naive", help="Default strategy if a row omits one")
    parser.add_argument("--judge-model", default=None, help="Override judge model (e.g. openai/gpt-4o-mini)")
    parser.add_argument("--out", default="eval/results.json", help="Where to write scores")
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        log.error(f"Dataset not found: {dataset_path.resolve()}. See eval/README.md.")
        raise SystemExit(1)

    settings = get_settings()
    pipeline = RAGPipeline(settings)
    rows = load_dataset(dataset_path)
    log.info(f"Loaded {len(rows)} eval rows from {dataset_path}")

    samples = collect_samples(pipeline, rows, args.strategy)

    try:
        scores = evaluate_with_ragas(samples, args.judge_model or settings.generation.model, settings)
    except ImportError as exc:
        log.error(
            f"RAGAS not installed ({exc}). Install eval deps:\n"
            "  pip install ragas datasets langchain-ollama"
        )
        raise SystemExit(1)

    print("\n==== RAGAS scores ====")
    print(scores)
    try:
        df = scores.to_pandas()
        summary = {c: float(df[c].mean()) for c in df.columns if df[c].dtype.kind == "f"}
    except Exception:
        summary = {"raw": str(scores)}

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({
        "embedding_provider": settings.embedding.provider,
        "embedding_model": settings.embedding.model_name,
        "reranking_provider": settings.reranking.provider,
        "generation_model": settings.generation.model,
        "n_samples": len(samples),
        "scores": summary,
    }, indent=2), encoding="utf-8")
    log.info(f"Wrote summary → {out_path}")


if __name__ == "__main__":
    main()
