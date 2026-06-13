# RAG Evaluation Harness

Offline regression gate for the Veridia RAG pipeline using [RAGAS](https://docs.ragas.io/).
Capture a **baseline** before changing models, then re-run after each upgrade and
require the metrics not to regress.

## Metrics

- **faithfulness** — is the answer grounded in the retrieved context (no hallucination)?
- **answer_relevancy** — does the answer actually address the question?
- **context_precision** — are the retrieved chunks relevant (signal vs noise)?
- **context_recall** — was the information needed to answer actually retrieved?

## Setup

```bash
pip install ragas datasets langchain-ollama
# Local judge embeddings (recommended): pull a small embed model
ollama pull nomic-embed-text
```

## Build the golden set

Edit [`dataset.jsonl`](dataset.jsonl) — one JSON object per line — using questions
grounded in **your own ingested documents**. Include a mix of:

1. simple fact-retrieval questions,
2. multi-hop questions (these justify GraphRAG, Phase 4.1),
3. questions answerable only from tables/figures (these justify MinerU/ColPali, Phase 3).

## Run

```bash
# Baseline (current config)
python -m eval.run_ragas --out eval/results_baseline.json

# After an upgrade (e.g. provider: qwen3 in config.yaml + re-index)
python -m eval.run_ragas --out eval/results_qwen3.json

# Stronger / cloud judge for milestone gates
python -m eval.run_ragas --judge-model openai/gpt-4o-mini
```

Compare the `scores` block across runs. The local 3B judge is noisy — treat small
deltas as inconclusive and use the cloud judge to confirm milestone improvements.

> Pair this offline gate with **Langfuse** (set `observability.enabled: true` in
> `config.yaml`) for online tracing + LLM-as-judge on live traffic.
