import React from "react";
import Link from "next/link";
import { Layers, Search, Cpu, ArrowRight } from "lucide-react";

export default function RetrievalPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Layers className="h-4 w-4" /> Search & Retrieval
      </div>
      <h1>Dense-Sparse Hybrid Search & Reranking</h1>
      <p className="text-text-secondary leading-relaxed">
        Simple vector matching often fails to capture precise keyword terminology. To solve this, the RAG core implements a multi-stage search strategy blending semantic vector retrieval with keyword-based BM25.
      </p>

      <h2>1. Dual Search Streams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="p-4 bg-bg-surface border border-border-muted rounded-xl">
          <h3 className="text-white text-base font-semibold mt-0">Dense Semantic Search</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Uses the local <code>sentence-transformers</code> embedder (default: <code>all-MiniLM-L6-v2</code>) to project the query into a 384-dimensional vector. It queries ChromaDB using cosine similarity to retrieve the top 10 relevant document vectors.
          </p>
        </div>
        <div className="p-4 bg-bg-surface border border-border-muted rounded-xl">
          <h3 className="text-white text-base font-semibold mt-0">Sparse Lexical Search</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Constructs a local Okapi <strong>BM25 index</strong> (tokenized using standard text preprocessing). It scores keyword frequencies in context, capturing specific numbers, names, and acronyms that vectors may miss.
          </p>
        </div>
      </div>

      <h2>2. Reciprocal Rank Fusion (RRF)</h2>
      <p>
        To merge search candidates from dense and sparse queries without matching raw scoring ranges, we implement Reciprocal Rank Fusion (RRF). The RRF rank scoring formula is:
      </p>

      <div className="p-5 bg-bg-elevated border border-border-muted rounded-xl text-center font-mono my-4 text-white">
        {"RRF_Score(d) = Σ_{r ∈ R} ( 1 / (60 + Rank_r(d)) )"}
      </div>
      <p className="text-sm text-text-secondary">
        Where $R$ contains both retrieval lists (Dense and Sparse), and $Rank_r(d)$ is the position of document $d$ within retriever $r$. The constant <code>60</code> ensures outlier rankings do not overly dominate the fused score.
      </p>

      <h2>3. Neural Reranking (Cross-Encoder)</h2>
      <p>
        RRF outputs a merged candidate list (top 10), but feeding all of them directly into the generative model can cause context fatigue ("lost in the middle").
      </p>
      <p>
        We execute a <strong>Neural Reranking</strong> pass using a Cross-Encoder transformer:
      </p>

      <div className="my-4 p-4 bg-bg-surface border border-border-muted rounded-lg flex items-center gap-4">
        <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Cpu className="h-6 w-6" />
        </div>
        <div className="text-sm">
          <span className="font-semibold text-white block">Cross-Encoder Scoring</span>
          <span className="text-text-secondary font-mono text-xs">Model: cross-encoder/ms-marco-MiniLM-L-6-v2</span>
          <p className="text-xs text-text-secondary m-0 mt-1">Unlike Bi-Encoders which embed query and document separately, a Cross-Encoder feeds both query and candidate text simultaneously into the attention layer, computing a highly accurate similarity score. Chunks are sorted by score, and only the top 5 are retained.</p>
        </div>
      </div>

      <h2>4. Multi-Query Rewrite Expansion</h2>
      <p>
        To prevent search failures due to poor query phrasing, we use the local LLM to generate 3 alternative query variations before executing search:
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

      <div className="mt-8 flex justify-between">
        <Link 
          href="/chunking/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Ingestion
        </Link>
        <Link 
          href="/strategies/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-start to-accent-end text-white font-medium hover:shadow-glow transition-all"
        >
          <span>Continue to RAG Strategies</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
