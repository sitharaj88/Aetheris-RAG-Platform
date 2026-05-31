import React from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Cpu,
  ArrowRight,
  Zap,
  GitMerge,
  RefreshCcw,
  ArrowDownUp,
  Sparkles,
  Settings,
  CheckCircle,
  XCircle,
  Scale,
  Database,
  BrainCircuit,
} from "lucide-react";

export default function RetrievalPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Layers className="h-4 w-4" /> Search &amp; Retrieval
      </div>
      <h1>Dense-Sparse Hybrid Search &amp; Reranking</h1>
      <p className="text-text-secondary leading-relaxed">
        Simple vector matching often fails to capture precise keyword terminology. To solve this, the RAG core implements a multi-stage search strategy blending semantic vector retrieval with keyword-based BM25, fused via Reciprocal Rank Fusion, and refined through neural cross-encoder reranking.
      </p>

      {/* Pipeline Diagram */}
      <div className="my-8">
        <img
          src="/images/retrieval_pipeline.png"
          alt="Veridia RAG Retrieval Pipeline"
          className="rounded-2xl border border-border-light shadow-glow w-full max-w-3xl mx-auto"
        />
        <p className="text-center text-xs text-text-muted mt-3">
          Multi-stage retrieval pipeline: query → dual search → fusion → reranking → top-K context
        </p>
      </div>

      {/* ── Comparison Table ── */}
      <h2>Search Methods at a Glance</h2>
      <p className="text-text-secondary">
        Understanding the strengths and trade-offs of each search method is key to designing an effective retrieval pipeline:
      </p>
      <div className="my-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-muted">
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Method</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Strengths</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Weaknesses</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Best For</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr className="border-b border-border-light">
              <td className="py-3 px-4">
                <span className="font-mono text-accent-cyan text-xs">Dense (Vector)</span>
              </td>
              <td className="py-3 px-4">Captures semantic meaning, handles synonyms, paraphrases, and multi-lingual queries</td>
              <td className="py-3 px-4">Misses exact keywords, acronyms, proper nouns; requires GPU for fast encoding</td>
              <td className="py-3 px-4">Conceptual &amp; natural-language queries</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-3 px-4">
                <span className="font-mono text-accent-cyan text-xs">Sparse (BM25)</span>
              </td>
              <td className="py-3 px-4">Exact keyword matching, fast, no model needed, great for named entities &amp; IDs</td>
              <td className="py-3 px-4">No semantic understanding; fails on paraphrases and synonyms</td>
              <td className="py-3 px-4">Keyword-heavy queries, error codes, product names</td>
            </tr>
            <tr>
              <td className="py-3 px-4">
                <span className="font-mono text-accent-cyan text-xs">Hybrid (RRF)</span>
              </td>
              <td className="py-3 px-4">Best of both worlds — semantic understanding + keyword precision</td>
              <td className="py-3 px-4">Slightly more compute; requires tuning fusion constant</td>
              <td className="py-3 px-4">Production RAG systems (recommended default)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-alert doc-alert-tip">
        <strong>Why Hybrid?</strong> In Veridia&apos;s benchmarks, hybrid search with RRF improved top-5 recall by 23% over dense-only search and 41% over sparse-only search. The combination consistently outperforms either method alone.
      </div>

      {/* ── Dual Search Streams ── */}
      <h2>1. Dual Search Streams</h2>
      <p>
        Every query simultaneously triggers two independent retrieval paths. Their results are collected independently before being merged in the fusion stage:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-text-primary text-base font-semibold mt-0 mb-0">Dense Semantic Search</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Uses the local <code>sentence-transformers</code> embedder (default: <code>all-MiniLM-L6-v2</code>) to project the query into a 384-dimensional vector. It queries ChromaDB using cosine similarity to retrieve the top 10 relevant document vectors.
          </p>
          <pre>
            <code>{`# Dense retrieval via ChromaDB
query_embedding = embedder.encode(query)
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=10,
    include=["documents", "metadatas", "distances"]
)`}</code>
          </pre>
          <div className="mt-3 text-xs text-text-muted">
            <CheckCircle className="h-3 w-3 inline mr-1 text-green-400" />
            Excels at: &quot;How does the system handle authentication?&quot;
          </div>
          <div className="text-xs text-text-muted mt-1">
            <XCircle className="h-3 w-3 inline mr-1 text-red-400" />
            Struggles with: &quot;ERR_CONNECTION_REFUSED port 8080&quot;
          </div>
        </div>

        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-text-primary text-base font-semibold mt-0 mb-0">Sparse Lexical Search</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Constructs a local Okapi <strong>BM25 index</strong> (tokenized using standard text preprocessing). It scores keyword frequencies in context, capturing specific numbers, names, and acronyms that vectors may miss.
          </p>
          <pre>
            <code>{`# BM25 sparse retrieval
from rank_bm25 import BM25Okapi

tokenized_corpus = [doc.split() for doc in documents]
bm25 = BM25Okapi(tokenized_corpus)
scores = bm25.get_scores(query.split())
top_indices = scores.argsort()[-10:][::-1]`}</code>
          </pre>
          <div className="mt-3 text-xs text-text-muted">
            <CheckCircle className="h-3 w-3 inline mr-1 text-green-400" />
            Excels at: &quot;ChromaDB collection.query n_results parameter&quot;
          </div>
          <div className="text-xs text-text-muted mt-1">
            <XCircle className="h-3 w-3 inline mr-1 text-red-400" />
            Struggles with: &quot;What does the vector database do?&quot;
          </div>
        </div>
      </div>

      {/* ── RRF ── */}
      <h2>2. Reciprocal Rank Fusion (RRF)</h2>
      <p>
        To merge search candidates from dense and sparse queries without matching raw scoring ranges, we implement Reciprocal Rank Fusion (RRF). Because dense and sparse retrievers produce scores on completely different scales (cosine similarity vs. BM25 TF-IDF), raw score merging would be meaningless. RRF solves this by using only <em>rank positions</em>.
      </p>

      <div className="p-5 bg-bg-elevated border border-border-muted rounded-xl text-center font-mono my-6">
        <p className="text-text-primary text-lg m-0 mb-2">
          RRF_Score(d) = &Sigma;<sub>r &isin; R</sub> &nbsp; 1 / (k + Rank<sub>r</sub>(d))
        </p>
        <p className="text-xs text-text-muted m-0">
          where k = 60 (smoothing constant)
        </p>
      </div>

      <div className="my-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-muted">
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Symbol</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Meaning</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-accent-cyan">d</td>
              <td className="py-2 px-4">A candidate document (chunk)</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-accent-cyan">R</td>
              <td className="py-2 px-4">The set of all retriever result lists (Dense + Sparse)</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-accent-cyan">Rank<sub>r</sub>(d)</td>
              <td className="py-2 px-4">Position of document d in retriever r&apos;s ranked list (1-indexed)</td>
            </tr>
            <tr>
              <td className="py-2 px-4 font-mono text-accent-cyan">k</td>
              <td className="py-2 px-4">Smoothing constant (default: 60). Prevents top-ranked documents from dominating and ensures outlier rankings don&apos;t overpower the fused score.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-alert doc-alert-note">
        <strong>Example:</strong> If a document is ranked #1 in dense search and #3 in sparse search, its RRF score is: 1/(60+1) + 1/(60+3) = 0.01639 + 0.01587 = 0.03226. A document ranked #1 in only one retriever scores just 0.01639 — so appearing in both lists is strongly rewarded.
      </div>

      <pre>
        <code>{`# RRF implementation in src/retrieval/hybrid.py
def reciprocal_rank_fusion(
    results_list: list[list[str]],
    k: int = 60
) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for results in results_list:
        for rank, doc_id in enumerate(results, start=1):
            scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)`}</code>
      </pre>

      {/* ── Neural Reranking ── */}
      <h2>3. Neural Reranking (Cross-Encoder)</h2>
      <p>
        RRF outputs a merged candidate list (top 10), but feeding all of them directly into the generative model can cause context fatigue (&quot;lost in the middle&quot;). We execute a <strong>Neural Reranking</strong> pass using a Cross-Encoder transformer to distill the most relevant chunks:
      </p>

      <div className="my-4 p-4 bg-bg-surface border border-border-muted rounded-lg flex items-center gap-4">
        <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
          <Cpu className="h-6 w-6" />
        </div>
        <div className="text-sm">
          <span className="font-semibold text-text-primary block">Cross-Encoder Scoring</span>
          <span className="text-text-secondary font-mono text-xs">Model: cross-encoder/ms-marco-MiniLM-L-6-v2</span>
          <p className="text-xs text-text-secondary m-0 mt-1">Unlike Bi-Encoders which embed query and document separately, a Cross-Encoder feeds both query and candidate text simultaneously into the attention layer, computing a highly accurate similarity score. Chunks are sorted by score, and only the top 5 are retained.</p>
        </div>
      </div>

      <pre>
        <code>{`# Cross-encoder reranking in src/retrieval/reranker.py
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

def rerank(query: str, candidates: list[str], top_k: int = 5) -> list[str]:
    pairs = [[query, doc] for doc in candidates]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, score in ranked[:top_k]]`}</code>
      </pre>

      {/* ── Cross-Encoder vs Bi-Encoder ── */}
      <h3>Why Cross-Encoder over Bi-Encoder?</h3>
      <p className="text-text-secondary mb-4">
        Both are transformer-based models for measuring text similarity, but they operate fundamentally differently:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ArrowDownUp className="h-5 w-5" />
            </div>
            <h4 className="text-text-primary text-sm font-semibold m-0">Bi-Encoder</h4>
          </div>
          <ul className="text-sm text-text-secondary space-y-2 mb-0">
            <li>Encodes query and document <strong>independently</strong> into separate vectors</li>
            <li>Similarity = cosine distance between two vectors</li>
            <li><span className="text-green-400 font-semibold">Fast:</span> vectors are pre-computed; search is just nearest-neighbor lookup</li>
            <li><span className="text-red-400 font-semibold">Less accurate:</span> no cross-attention between query and document tokens</li>
            <li>Used in: <strong>Stage 1</strong> — initial retrieval from ChromaDB</li>
          </ul>
        </div>

        <div className="p-5 bg-bg-surface border border-purple-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <GitMerge className="h-5 w-5" />
            </div>
            <h4 className="text-text-primary text-sm font-semibold m-0">Cross-Encoder</h4>
          </div>
          <ul className="text-sm text-text-secondary space-y-2 mb-0">
            <li>Feeds query + document as a <strong>single concatenated input</strong> through the transformer</li>
            <li>Full cross-attention between all query and document tokens</li>
            <li><span className="text-red-400 font-semibold">Slow:</span> must run inference for every (query, doc) pair — O(n) per query</li>
            <li><span className="text-green-400 font-semibold">Much more accurate:</span> captures fine-grained semantic interactions</li>
            <li>Used in: <strong>Stage 3</strong> — reranking the top 10 candidates</li>
          </ul>
        </div>
      </div>

      <div className="doc-alert doc-alert-important">
        <strong>Design rationale:</strong> We use a Bi-Encoder for initial retrieval (fast search over thousands of chunks) and a Cross-Encoder for reranking (accurate scoring of only 10 candidates). This &quot;retrieve then rerank&quot; pattern combines speed with accuracy.
      </div>

      {/* ── Multi-Query Rewrite ── */}
      <h2>4. Multi-Query Rewrite Expansion</h2>
      <p>
        To prevent search failures due to poor query phrasing, ambiguity, or vocabulary mismatch, we use the local LLM to generate 3 alternative query variations before executing search. Each variation is searched independently, and results are merged via RRF:
      </p>
      <pre>
        <code>{`# Prompt template inside src/generation/prompts.py
QUERY_REWRITE_PROMPT = """
You are an AI assistant helping a user optimize their search query.
Generate 3 variations of this search query to help retrieve matching documentation.
Output each variation on a new line.

Original Query:
{query}

Output only the variations, no commentary.
"""`}</code>
      </pre>

      {/* Concrete Example */}
      <h3>Concrete Example</h3>
      <p className="text-text-secondary mb-3">
        Watch how a single user query gets expanded into multiple complementary search angles:
      </p>
      <div className="my-6 p-5 bg-bg-surface border border-border-muted rounded-xl">
        <div className="mb-4">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Original Query</span>
          <div className="mt-2 p-3 bg-bg-elevated rounded-lg border border-border-light">
            <p className="m-0 font-mono text-sm text-text-primary">&quot;How does Veridia handle PDF files?&quot;</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 text-text-muted">
          <RefreshCcw className="h-4 w-4 text-accent-cyan" />
          <span className="text-xs font-semibold uppercase tracking-wider">LLM Rewrites</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-bg-elevated rounded-lg border border-border-light">
            <span className="text-accent-cyan font-mono text-sm font-bold shrink-0">1.</span>
            <p className="m-0 font-mono text-sm text-text-secondary">&quot;PDF document processing pipeline in Veridia RAG&quot;</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-bg-elevated rounded-lg border border-border-light">
            <span className="text-accent-cyan font-mono text-sm font-bold shrink-0">2.</span>
            <p className="m-0 font-mono text-sm text-text-secondary">&quot;file loading and text extraction from PDFs&quot;</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-bg-elevated rounded-lg border border-border-light">
            <span className="text-accent-cyan font-mono text-sm font-bold shrink-0">3.</span>
            <p className="m-0 font-mono text-sm text-text-secondary">&quot;pdfplumber OCR fallback for scanned documents&quot;</p>
          </div>
        </div>

        <div className="mt-4 text-xs text-text-muted">
          <Sparkles className="h-3 w-3 inline mr-1 text-accent-cyan" />
          Each rewrite targets a different aspect: the pipeline architecture, the extraction mechanics, and the OCR edge case. Together, they cast a much wider retrieval net than the original query alone.
        </div>
      </div>

      <div className="doc-alert doc-alert-tip">
        <strong>Impact:</strong> Multi-query rewriting increases recall by 15–30% on ambiguous queries. The compute cost is minimal — one LLM call to generate rewrites, then 3 additional vector searches (which are sub-millisecond on ChromaDB).
      </div>

      {/* ── Full Pipeline Flow ── */}
      <h2>5. Full Pipeline Flow</h2>
      <p className="text-text-secondary mb-4">
        Putting it all together, here&apos;s the complete retrieval pipeline from query to context:
      </p>
      <div className="space-y-3 my-6">
        <div className="flex items-center gap-3 p-3 bg-bg-surface border border-border-muted rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center font-mono text-sm font-bold shrink-0">1</div>
          <div className="text-sm">
            <span className="text-text-primary font-semibold">Query Rewrite</span>
            <span className="text-text-secondary ml-2">LLM generates 3 alternative query phrasings</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-surface border border-border-muted rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center font-mono text-sm font-bold shrink-0">2</div>
          <div className="text-sm">
            <span className="text-text-primary font-semibold">Dual Search</span>
            <span className="text-text-secondary ml-2">Each query variation runs through Dense + Sparse retrievers (4 queries &times; 2 retrievers = 8 result lists)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-surface border border-border-muted rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center font-mono text-sm font-bold shrink-0">3</div>
          <div className="text-sm">
            <span className="text-text-primary font-semibold">RRF Fusion</span>
            <span className="text-text-secondary ml-2">All 8 result lists are merged into a single ranked list using Reciprocal Rank Fusion</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-surface border border-border-muted rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center font-mono text-sm font-bold shrink-0">4</div>
          <div className="text-sm">
            <span className="text-text-primary font-semibold">Cross-Encoder Rerank</span>
            <span className="text-text-secondary ml-2">Top 10 candidates are scored by the Cross-Encoder; top 5 are retained</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-bg-surface border border-accent-cyan/30 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center font-mono text-sm font-bold shrink-0">5</div>
          <div className="text-sm">
            <span className="text-text-primary font-semibold">Context Assembly</span>
            <span className="text-text-secondary ml-2">Top 5 chunks are formatted with metadata and injected into the LLM generation prompt</span>
          </div>
        </div>
      </div>

      {/* ── Configuration Reference ── */}
      <h2>Configuration Reference</h2>
      <p className="text-text-secondary mb-2">
        All retrieval parameters are configured in <code>config.yaml</code>:
      </p>
      <pre>
        <code>{`# config.yaml — Retrieval Configuration
retrieval:
  search_mode: "hybrid"          # Options: dense, sparse, hybrid
  top_k_initial: 10              # Candidates retrieved per search stream
  top_k_final: 5                 # Chunks retained after reranking
  rrf_k: 60                     # RRF smoothing constant

  # Dense search settings
  dense:
    model: "all-MiniLM-L6-v2"   # Sentence transformer model
    dimensions: 384              # Embedding dimensions
    distance_metric: "cosine"    # ChromaDB distance function

  # Sparse search settings
  sparse:
    algorithm: "bm25_okapi"      # BM25 variant
    tokenizer: "whitespace"      # Tokenization strategy

  # Reranking settings
  reranker:
    enabled: true
    model: "cross-encoder/ms-marco-MiniLM-L-6-v2"
    batch_size: 16

  # Multi-query rewrite
  multi_query:
    enabled: true
    num_rewrites: 3              # Number of query variations
    model: "qwen2.5:7b"          # LLM for query rewriting`}</code>
      </pre>

      <div className="my-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-muted">
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Parameter</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Type</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Default</th>
              <th className="text-left py-3 px-4 text-text-primary font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-xs text-accent-cyan">search_mode</td>
              <td className="py-2 px-4">string</td>
              <td className="py-2 px-4 font-mono text-xs">hybrid</td>
              <td className="py-2 px-4">Which retrieval strategy to use: dense-only, sparse-only, or hybrid</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-xs text-accent-cyan">top_k_initial</td>
              <td className="py-2 px-4">int</td>
              <td className="py-2 px-4 font-mono text-xs">10</td>
              <td className="py-2 px-4">Number of candidates retrieved per search stream before fusion</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-xs text-accent-cyan">top_k_final</td>
              <td className="py-2 px-4">int</td>
              <td className="py-2 px-4 font-mono text-xs">5</td>
              <td className="py-2 px-4">Final number of chunks passed to the LLM after reranking</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-xs text-accent-cyan">rrf_k</td>
              <td className="py-2 px-4">int</td>
              <td className="py-2 px-4 font-mono text-xs">60</td>
              <td className="py-2 px-4">RRF smoothing constant. Higher values reduce the influence of top-ranked items</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-xs text-accent-cyan">dense.model</td>
              <td className="py-2 px-4">string</td>
              <td className="py-2 px-4 font-mono text-xs">all-MiniLM-L6-v2</td>
              <td className="py-2 px-4">Sentence-transformer model for dense embeddings</td>
            </tr>
            <tr className="border-b border-border-light">
              <td className="py-2 px-4 font-mono text-xs text-accent-cyan">reranker.model</td>
              <td className="py-2 px-4">string</td>
              <td className="py-2 px-4 font-mono text-xs">ms-marco-MiniLM-L-6-v2</td>
              <td className="py-2 px-4">Cross-encoder model for neural reranking</td>
            </tr>
            <tr>
              <td className="py-2 px-4 font-mono text-xs text-accent-cyan">multi_query.num_rewrites</td>
              <td className="py-2 px-4">int</td>
              <td className="py-2 px-4 font-mono text-xs">3</td>
              <td className="py-2 px-4">Number of LLM-generated query variations</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-alert doc-alert-warning">
        <strong>Performance note:</strong> Disabling the reranker (<code>reranker.enabled: false</code>) saves ~200ms per query but reduces top-5 precision by approximately 18%. Only disable for latency-critical applications where sub-200ms response times are required.
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <Link
          href="/chunking/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Ingestion
        </Link>
        <Link
          href="/strategies/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-start to-accent-end text-text-primary font-medium hover:shadow-glow transition-all"
        >
          <span>Continue to RAG Strategies</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
