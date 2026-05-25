import React from "react";
import Link from "next/link";
import { Sparkles, Activity, ShieldCheck, Cpu, ArrowRight } from "lucide-react";

export default function StrategiesPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Sparkles className="h-4 w-4" /> Reasoning & Strategies
      </div>
      <h1>SOTA Reflective RAG Strategies</h1>
      <p className="text-text-secondary leading-relaxed">
        To guarantee grounded generations and solve multi-step reasoning, RAG Intelligence moves past simple retrieval. It offers 6 distinct reasoning strategies implemented in <code>src/strategies/</code>.
      </p>

      <h2>1. Naive RAG</h2>
      <p>
        The standard baseline strategy. It maps the query, performs hybrid dense-sparse search, reranks candidate documents, constructs the prompt, and completes generation.
      </p>

      <h2>2. HyDE (Hypothetical Document Embeddings)</h2>
      <p>
        Queries often lack overlapping keywords or semantic contexts of the target answer. The HyDE strategy generates a hypothetical mock answer document first, embeds it, and uses that mock embedding to query ChromaDB:
      </p>
      <div className="p-3.5 bg-bg-surface border border-border-muted rounded-lg font-mono text-xs my-2 text-text-secondary">
        User Query → [LLM Synthesis] → Mock Hypothetical Doc → [SentenceTransformer] → Embedding Vector → ChromaDB Retrieval
      </div>

      <h2>3. Corrective RAG (CRAG)</h2>
      <p>
        CRAG introduces document validation. It grades the relevance of each retrieved chunk against the query using a local LLM prompt:
      </p>
      <ul>
        <li><strong>RELEVANT:</strong> The chunk is kept.</li>
        <li><strong>IRRELEVANT:</strong> The chunk is discarded.</li>
        <li><strong>AMBIGUOUS:</strong> The chunk is marked for query expansion.</li>
      </ul>
      <p>
        If the number of relevant chunks is low, CRAG triggers query rewrite modules to execute broader search iterations.
      </p>

      <h2>4. Self-Reflective RAG (Self-RAG)</h2>
      <p>
        Self-RAG is a self-reflective framework. It generates text and critiques its own response using LLM self-reflection markers:
      </p>
      <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <span className="font-semibold text-white text-xs block">1. Retrieval Decision</span>
          <p className="text-[10px] text-text-secondary mt-1 m-0">Decides whether retrieving documents is required to answer the query.</p>
        </div>
        <div className="metric-card">
          <span className="font-semibold text-white text-xs block">2. Grounding Check</span>
          <p className="text-[10px] text-text-secondary mt-1 m-0">Critiques if the generated text is strictly supported by the document chunks.</p>
        </div>
        <div className="metric-card">
          <span className="font-semibold text-white text-xs block">3. Answer Quality</span>
          <p className="text-[10px] text-text-secondary mt-1 m-0">Evaluates whether the response actually answers the user's intent.</p>
        </div>
      </div>

      <h2>5. Agentic RAG</h2>
      <p>
        Agentic RAG operates as a closed loop. The LLM is equipped with search tools (<code>dense_search</code>, <code>bm25_search</code>, and <code>query_rewrite</code>) and executes multi-step planning. It queries, reads results, reformulates sub-questions, and accumulates context over multiple iterations until it determines the context is sufficient.
      </p>

      <h2>6. Adaptive RAG Router</h2>
      <p>
        Adaptive RAG routes incoming queries dynamically based on a query routing classifier:
      </p>
      <pre>
        <code>{`# Routing logic inside src/query/router.py
# Simple fact recall queries → Naive RAG
# Context-sensitive queries → Corrective RAG
# Multi-hop or logical queries → Agentic RAG`}</code>
      </pre>

      <h2>Grounding Prompt (Self-Reflection Check)</h2>
      <p>
        To prevent hallucination, the generation module critiques answers using this validation check:
      </p>
      <pre>
        <code>{`SELF_REFLECT_PROMPT = """
You are a grader evaluating if an AI response is fully grounded in the provided context.
Compare the response to the context. If any fact in the response is not mentioned in the context, evaluate it as NOT_GROUNDED.
Output only 'GROUNDED' or 'NOT_GROUNDED'.

Context:
{context}

Response:
{response}
"""`}</code>
      </pre>

      <div className="mt-8 flex justify-between">
        <Link 
          href="/retrieval/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Retrieval
        </Link>
        <Link 
          href="/setup/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-start to-accent-end text-white font-medium hover:shadow-glow transition-all"
        >
          <span>Continue to Setup</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
