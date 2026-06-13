# Veridia RAG — Modernization

This document summarizes the 2025–2026 upgrades layered onto the platform and how
to enable each. Every upgrade is **config-gated and defaults to the previous
behavior**, so the system runs unchanged until you opt in. Research backing each
item (with citations) lives in the approved plan; key sources are linked inline.

> All toggles live in [`config.yaml`](config.yaml). New config sections are picked
> up automatically — `Settings` derives section names from its own fields, so no
> hardcoded whitelist to maintain.

## Phase 1 — Quick wins (no re-index)

### Qwen3-Reranker  ·  `reranking.provider: qwen3`
Replaces the dated `ms-marco-MiniLM` cross-encoder with Qwen3-Reranker, which
beats BGE-reranker-v2-m3 on every reported metric ([arXiv:2506.05176](https://arxiv.org/abs/2506.05176)).
Runs locally. Re-scores already-retrieved candidates, so **no re-indexing**.
```yaml
reranking:
  provider: "qwen3"
  model_name: "Qwen/Qwen3-Reranker-0.6B"
```
Needs: `pip install transformers torch`.

### Semantic cache  ·  `cache.enabled: true`
Embeds the query, matches against prior queries in the active collection, and
returns the cached answer on a hit — skipping retrieval/rerank/generation. Scoped
per collection; auto-invalidated on ingest. Implemented in
[`src/cache/semantic_cache.py`](src/cache/semantic_cache.py).

### Security guard  ·  `security.enabled: true`
Heuristic prompt-injection (input) and data-leak (output) scanning around the
query path. Defaults to *annotate, don't block* (`block_on_detection: false`).
[`src/security/guard.py`](src/security/guard.py).

### Persistent task state (always on)
Background ingestion task history is now stored in SQLite
([`src/api/task_store.py`](src/api/task_store.py)) instead of an in-memory dict —
restart-safe and threadpool-safe.

## Phase 2 — Retrieval core (re-index required)

### Qwen3-Embedding  ·  `embedding.provider: qwen3`
Replaces `all-MiniLM-L6-v2` (384-dim) with Qwen3-Embedding — No.1 MTEB-multilingual
(70.58), up to 4096-dim, 32K context, Matryoshka-truncatable
([Qwen blog](https://qwenlm.github.io/blog/qwen3-embedding/)).
```yaml
embedding:
  provider: "qwen3"
  model_name: "Qwen/Qwen3-Embedding-0.6B"
  backend: "sentence_transformers"   # or "ollama"
  truncate_dim: 1024                  # cap storage/latency
```
**Changing the embedding model/dimension invalidates every existing ChromaDB
collection.** Re-index after switching:
```bash
python -m scripts.reindex --wipe
```

### LiteLLM backend  ·  `generation.provider: litellm`
One `BaseLLM` for local Ollama **and** cloud (OpenAI, Anthropic, …) via a
provider-prefixed model id. Local stays default.
```yaml
generation:
  provider: "litellm"
  litellm_model: "ollama/qwen2.5:3b"   # or "openai/gpt-4o-mini"
```
Needs: `pip install litellm`.

## Phase 0 — Measurement (do this first)

### RAGAS eval harness
Offline regression gate. Capture a baseline, then re-run after each upgrade.
See [`eval/README.md`](eval/README.md). Build the golden set from your own docs.

### Langfuse tracing  ·  `observability.enabled: true`
Self-hosted, OpenTelemetry-native tracing of retrieval/rerank/generation spans
([github.com/langfuse/langfuse](https://github.com/langfuse/langfuse)). No-op when
disabled. [`src/observability/tracing.py`](src/observability/tracing.py).
```yaml
observability:
  enabled: true
  host: "http://localhost:3000"
  public_key: "pk-..."
  secret_key: "sk-..."
```
Needs: `pip install langfuse` + a self-hosted Langfuse (Docker).

## Not yet implemented (planned, larger lifts)

These are scoped in the approved plan but intentionally deferred — they are larger
architectural changes:

- **MinerU2.5 PDF parsing** (`ingestion.pdf_parser: mineru`) — config + loader hook
  reserved; run MinerU as a separate AGPL service. (Phase 3.1)
- **ColPali/ColQwen visual retrieval** — requires a multi-vector store (Qdrant/
  LanceDB); ChromaDB cannot store multi-vector embeddings. (Phase 3.2)
- **GraphRAG strategy** — router-selectable for multi-hop queries only. (Phase 4.1)
- **A-Mem long-term memory**, **reasoning-model agentic upgrade** — (Phase 4.2/4.3)
- **Auth / Docker / CI** — (Phase 5)
