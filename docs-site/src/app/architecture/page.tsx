"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Cpu, 
  Server, 
  Shield, 
  Layers, 
  Database, 
  Activity, 
  ArrowRight,
  Terminal,
  FileText,
  Globe,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  FolderTree,
  Zap
} from "lucide-react";

export default function ArchitecturePage() {
  const [lldTab, setLldTab] = useState<"ingestion" | "retrieval" | "reflection">("ingestion");

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Cpu className="h-4 w-4" /> System Architecture
      </div>
      <h1>System Architecture & Flow Design</h1>
      <p className="text-text-secondary leading-relaxed">
        The Veridia RAG platform is structured as a <strong>decoupled hybrid full-stack</strong> architecture. This design cleanly separates high-speed user interface execution from intensive machine learning model execution and vector storage, enabling independent scaling and development of each layer.
      </p>

      {/* HIGH-LEVEL DESIGN (HLD) DIAGRAM */}
      <h2>High-Level Design (HLD)</h2>
      <p>
        The following processing flow illustrates how a user query moves through the hybrid retrieval and reranking pipelines to generate a self-reflective response:
      </p>

      <div className="my-8">
        <img 
          src="/images/architecture.png" 
          alt="Veridia RAG Processing Flow Architecture Diagram" 
          className="rounded-2xl border border-border-light shadow-glow w-full max-w-3xl mx-auto"
        />
        <p className="text-center text-xs text-text-muted mt-2 italic">High-level data processing flow — from user query to cited response</p>
      </div>

      {/* TECHNOLOGY CHOICES */}
      <h2>Technology Choices & Rationale</h2>
      <p>
        Every technology in the Veridia stack was chosen for a specific engineering reason. Here's why:
      </p>

      <div className="overflow-x-auto border border-border-muted rounded-xl bg-bg-surface my-6">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-muted bg-bg-elevated/40 text-text-secondary">
              <th className="p-3 font-semibold">Technology</th>
              <th className="p-3 font-semibold">Role</th>
              <th className="p-3 font-semibold">Why This Choice?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted text-text-secondary">
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">FastAPI</td>
              <td className="p-3">Backend API</td>
              <td className="p-3">Native async support, SSE streaming, auto-generated OpenAPI docs, Pydantic integration</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">Next.js 16</td>
              <td className="p-3">Frontend + BFF</td>
              <td className="p-3">Server-side API routes for proxying, React 19, built-in SSE support, Turbopack bundling</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">ChromaDB</td>
              <td className="p-3">Vector Store</td>
              <td className="p-3">Embedded mode (no separate server), SQLite-backed persistence, zero-config setup</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">Ollama</td>
              <td className="p-3">LLM Engine</td>
              <td className="p-3">100% local inference, no API keys, model swapping via config, streaming support</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">SentenceTransformers</td>
              <td className="p-3">Embeddings + Reranking</td>
              <td className="p-3">Local bi-encoder embeddings and cross-encoder reranking without external API calls</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">rank-bm25</td>
              <td className="p-3">Sparse Retrieval</td>
              <td className="p-3">Lightweight Okapi BM25 implementation, captures keyword matches that vectors miss</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-alert doc-alert-tip">
        <strong>No Frameworks:</strong> Veridia is built without LangChain or LlamaIndex. Every component (embedder, vector store, LLM, retriever, strategy) uses abstract base classes so implementations can be swapped cleanly.
      </div>

      <h2>System Interface Topology</h2>
      <p>
        The layout below details the network interaction pathways between the browser client, the Next.js API BFF proxy, the FastAPI RAG service, and local model providers:
      </p>

      <div className="my-8 p-6 bg-bg-surface border border-border-light rounded-2xl shadow-glow overflow-x-auto">
        <div className="min-w-[800px] flex flex-col items-center">
          {/* Node Grid */}
          <div className="flex items-stretch justify-between w-full relative">
            
            {/* 1. Next.js SPA Client */}
            <div className="w-[180px] p-4 rounded-xl bg-bg-elevated border border-border-muted flex flex-col items-center justify-between text-center relative group hover:border-accent-start/50 transition-all">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-text-primary block">Next.js Client</span>
              <span className="text-[10px] text-text-muted mt-1">Browser SPA (React 19)<br/>Chat UI & Citations</span>
              <span className="absolute top-2 right-2 text-[9px] font-mono px-1 rounded bg-indigo-500/10 text-indigo-400">Port 3000</span>
            </div>

            {/* Connecting Arrow Client -> BFF */}
            <div className="flex-1 flex items-center justify-center relative">
              <svg className="w-full h-8 px-2" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M 0 10 L 95 10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-border-light" />
                <polygon points="95,7 100,10 95,13" fill="currentColor" className="text-accent-cyan" />
              </svg>
              <span className="absolute -top-3 text-[9px] font-mono text-text-muted bg-bg-surface px-1.5 py-0.5 rounded border border-border-muted">SSE / JSON</span>
            </div>

            {/* 2. Next.js BFF API Proxy */}
            <div className="w-[180px] p-4 rounded-xl bg-bg-elevated border border-border-muted flex flex-col items-center justify-between text-center relative group hover:border-accent-start/50 transition-all">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-text-primary block">Next.js BFF Proxy</span>
              <span className="text-[10px] text-text-muted mt-1">Node API handlers<br/>CORS & FormData routing</span>
              <span className="absolute top-2 right-2 text-[9px] font-mono px-1 rounded bg-purple-500/10 text-purple-400">Server</span>
            </div>

            {/* Connecting Arrow BFF -> FastAPI */}
            <div className="flex-1 flex items-center justify-center relative">
              <svg className="w-full h-8 px-2" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M 0 10 L 95 10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-border-light" />
                <polygon points="95,7 100,10 95,13" fill="currentColor" className="text-accent-cyan" />
              </svg>
              <span className="absolute -top-3 text-[9px] font-mono text-text-muted bg-bg-surface px-1.5 py-0.5 rounded border border-border-muted">BFF Fetch Proxy</span>
            </div>

            {/* 3. FastAPI Python Core */}
            <div className="w-[180px] p-4 rounded-xl bg-bg-elevated border border-border-muted flex flex-col items-center justify-between text-center relative group hover:border-accent-start/50 transition-all">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-3">
                <Server className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-text-primary block">FastAPI Backend</span>
              <span className="text-[10px] text-text-muted mt-1">Uvicorn Microservice<br/>RAG Orchestration core</span>
              <span className="absolute top-2 right-2 text-[9px] font-mono px-1 rounded bg-cyan-500/10 text-cyan-400">Port 8000</span>
            </div>

          </div>

          {/* Sub-pipelines connections (vertical) */}
          <div className="w-full flex justify-end mt-6 px-16 relative">
            <svg className="h-8 w-24" viewBox="0 0 20 20" fill="none">
              <path d="M 10 0 L 10 15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-border-light" />
              <polygon points="7,15 10,20 13,15" fill="currentColor" className="text-accent-cyan" />
            </svg>
          </div>

          {/* Dual Local AI Engine (Ollama & SQLite/ChromaDB) */}
          <div className="flex justify-between w-2/3 border border-border-muted border-dashed rounded-xl p-4 bg-bg-elevated/40 relative">
            <span className="absolute -top-2.5 left-4 text-[9px] font-bold uppercase tracking-wider text-text-muted px-1.5 bg-bg-surface border border-border-muted rounded">Local Storage & ML Providers</span>
            
            {/* ChromaDB Node */}
            <div className="w-[45%] flex items-center gap-3 p-3 bg-bg-surface border border-border-muted rounded-lg shadow-sm">
              <div className="h-8 w-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-text-primary block">ChromaDB Store</span>
                <span className="text-[9px] text-text-secondary">SQLite-backed vector DB</span>
              </div>
            </div>

            {/* Ollama Node */}
            <div className="w-[45%] flex items-center gap-3 p-3 bg-bg-surface border border-border-muted rounded-lg shadow-sm">
              <div className="h-8 w-8 rounded bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-text-primary block">Ollama LLM Engine</span>
                <span className="text-[9px] text-text-secondary">Local inference host</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PIPELINE DIAGRAMS */}
      <h2>Pipeline Architecture Diagrams</h2>
      <p>
        The following diagrams detail the internal data flow through the ingestion and retrieval pipelines:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div>
          <img 
            src="/images/ingestion_pipeline.png" 
            alt="Veridia RAG Ingestion Pipeline" 
            className="rounded-2xl border border-border-light shadow-glow w-full"
          />
          <p className="text-center text-xs text-text-muted mt-2 italic">Ingestion pipeline — from file upload to vector indexing</p>
        </div>
        <div>
          <img 
            src="/images/retrieval_pipeline.png" 
            alt="Veridia RAG Retrieval Pipeline" 
            className="rounded-2xl border border-border-light shadow-glow w-full"
          />
          <p className="text-center text-xs text-text-muted mt-2 italic">Retrieval pipeline — hybrid search, RRF fusion, and neural reranking</p>
        </div>
      </div>

      {/* PROJECT STRUCTURE */}
      <h2>Project Directory Structure</h2>
      <p>
        The codebase follows a clean, modular structure with abstract base classes for every swappable component:
      </p>
      <pre>
        <code>{`veridia-rag/
├── config.yaml                  # Global configuration (models, chunking, retrieval)
├── pyproject.toml               # Project metadata & dependencies
├── .env.example                 # Environment variable template
├── README.md
├── data/
│   ├── raw/                     # Place source documents here
│   └── chromadb/                # ChromaDB persistence (auto-created)
├── logs/                        # Application logs (auto-created)
├── frontend-next/               # Next.js 16 frontend & BFF proxy
│   └── src/app/
│       ├── page.tsx             # Chat UI (single-page app)
│       └── api/                 # BFF proxy routes (ingest, query, health)
├── docs-site/                   # This documentation site (Next.js static export)
└── src/                         # Python RAG core
    ├── pipeline.py              # Main orchestrator
    ├── models.py                # Pydantic data models
    ├── api/app.py               # FastAPI endpoints
    ├── config/settings.py       # Pydantic settings (YAML + env)
    ├── ingestion/               # Loaders, chunkers, OCR fallback
    ├── embedding/               # SentenceTransformer embedder (ABC)
    ├── vectorstore/             # ChromaDB implementation (ABC)
    ├── retrieval/               # Dense, sparse, hybrid, reranker
    ├── generation/              # Ollama LLM, prompts, response formatter
    ├── query/                   # Rewriter, decomposer, HyDE, router
    ├── strategies/              # Naive, CRAG, Self-RAG, Agentic, Adaptive
    └── utils/                   # Logger, text helpers`}</code>
      </pre>

      {/* LOW-LEVEL DESIGN (LLD) INTERACTIVE TAB EXPLORER */}
      <h2>Low-Level Design (LLD) & Data Flows</h2>
      <p>
        Select a tab below to inspect how data passes step-by-step through each pipeline within the Python RAG core:
      </p>

      {/* Tabs list */}
      <div className="flex border-b border-border-muted my-6 scrollbar-none overflow-x-auto">
        <button
          onClick={() => setLldTab("ingestion")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 flex-shrink-0
            ${lldTab === "ingestion" 
              ? "border-accent-start text-text-primary" 
              : "border-transparent text-text-secondary hover:text-text-primary"}`}
        >
          <FileText className="h-4 w-4" />
          <span>Ingestion & OCR Flow</span>
        </button>
        <button
          onClick={() => setLldTab("retrieval")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 flex-shrink-0
            ${lldTab === "retrieval" 
              ? "border-accent-start text-text-primary" 
              : "border-transparent text-text-secondary hover:text-text-primary"}`}
        >
          <Layers className="h-4 w-4" />
          <span>Retrieval & Rerank Flow</span>
        </button>
        <button
          onClick={() => setLldTab("reflection")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 flex-shrink-0
            ${lldTab === "reflection" 
              ? "border-accent-start text-text-primary" 
              : "border-transparent text-text-secondary hover:text-text-primary"}`}
        >
          <Activity className="h-4 w-4" />
          <span>Self-Reflective Loops</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="my-4 space-y-4">
        
        {/* Tab 1: Ingestion */}
        {lldTab === "ingestion" && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              When documents are uploaded via <code>POST /api/ingest</code>, they progress through the structural loaders and contextual summary generator:
            </p>
            {[
              { step: "1. File Loading", module: "src/ingestion/loader.py", details: "Accepts PDFs, DOCX, MD, or developer code. Normalizes paragraph splits and returns raw text content." },
              { step: "2. Scanned OCR Fallback", module: "rapidocr-onnxruntime", details: "If extracted text length is 0, converts pages to images and extracts layout text with local ONNX models." },
              { step: "3. Document Context Injector", module: "src/ingestion/chunker.py (Contextual)", details: "Takes the first 4,000 characters of the loaded document and calls Ollama to build a 2-sentence overview summary." },
              { step: "4. Recursive Chunker Split", module: "src/ingestion/chunker.py", details: "Divides document text recursively based on character delimiters. Prepends the global summary to the start of each text block." },
              { step: "5. Embedding & Vector Indexing", module: "src/vectorstore/chroma_store.py", details: "Embeds each contextual block with SentenceTransformers (384-dimensions) and persists them in ChromaDB collections." }
            ].map((node, index) => (
              <div key={index} className="p-4 bg-bg-surface border border-border-muted rounded-xl flex items-start gap-4">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-xs font-bold mt-1">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary text-sm">{node.step}</span>
                    <span className="text-[10px] font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-text-muted border border-border-light">{node.module}</span>
                  </div>
                  <p className="text-xs text-text-secondary m-0 mt-1">{node.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Retrieval */}
        {lldTab === "retrieval" && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              The query engine leverages hybrid search (Lexical + Semantic) and neural Cross-Encoders to bypass query phrasing limitations and avoid lost-in-the-middle context issues:
            </p>
            {[
              { step: "1. Query Expansion (Multi-Query)", module: "src/query/rewriter.py", details: "Synthesizes 3 search prompt variations via Ollama, capturing alternate synonyms and phrasing to maximize keyword coverage." },
              { step: "2. Dense Vector Matching", module: "src/retrieval/dense_retriever.py", details: "Embeds the query vector and fetches top 10 candidates from ChromaDB using Cosine Similarity calculations." },
              { step: "3. Sparse Lexical Search", module: "src/retrieval/sparse_retriever.py", details: "Tokenizes query terms and scores candidates against the Okapi BM25 index persisted on disk." },
              { step: "4. Reciprocal Rank Fusion (RRF)", module: "src/retrieval/hybrid_retriever.py", details: "Blends vector ranks and keyword ranks using RRF (constant k=60), outputting a unified, deduplicated list of top 10 candidates." },
              { step: "5. Cross-Encoder Neural Rerank", module: "src/retrieval/reranker.py", details: "Scores document-query pairs directly via ms-marco-MiniLM-L-6-v2, sorting them by absolute relevance and trimming to the top 5 chunks." }
            ].map((node, index) => (
              <div key={index} className="p-4 bg-bg-surface border border-border-muted rounded-xl flex items-start gap-4">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 flex items-center justify-center text-xs font-bold mt-1">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary text-sm">{node.step}</span>
                    <span className="text-[10px] font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-text-muted border border-border-light">{node.module}</span>
                  </div>
                  <p className="text-xs text-text-secondary m-0 mt-1">{node.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Reflection */}
        {lldTab === "reflection" && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Reflective strategies execute multiple checks to grade relevance and verify response correctness before returning to the user:
            </p>
            {[
              { step: "1. CRAG Chunk Grading", module: "src/strategies/corrective_rag.py", details: "Checks retrieved chunks against the query. If poor or irrelevant, discards the chunk. If overall document count is low, rewrites queries for a fallback search." },
              { step: "2. Self-RAG Reflection", module: "src/strategies/self_rag.py", details: "Generates answer tokens, then runs a validation prompt. Grades whether the generated answer is strictly grounded in the document context." },
              { step: "3. Hallucination Guard", module: "src/generation/response.py", details: "Annotates confidence rankings. If answer grounding checks fail, appends a low-confidence banner or triggers retrieval adjustments." }
            ].map((node, index) => (
              <div key={index} className="p-4 bg-bg-surface border border-border-muted rounded-xl flex items-start gap-4">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/30 flex items-center justify-center text-xs font-bold mt-1">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary text-sm">{node.step}</span>
                    <span className="text-[10px] font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-text-muted border border-border-light">{node.module}</span>
                  </div>
                  <p className="text-xs text-text-secondary m-0 mt-1">{node.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <div className="doc-alert doc-alert-important">
        <strong>Decoupling Benefit:</strong> By placing this entire multi-stage LLD core in the Python FastAPI layer, the Next.js frontend has a clean and simple interface, querying only the <code>/api/query/stream</code> endpoint for SSE streams.
      </div>

      <div className="mt-8 flex justify-between">
        <Link 
          href="/setup/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Setup
        </Link>
        <Link 
          href="/chunking/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-start to-accent-end text-white font-medium hover:shadow-glow transition-all"
        >
          <span>Continue to Ingestion</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
