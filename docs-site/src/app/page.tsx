import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Terminal, 
  ArrowRight, 
  CheckCircle, 
  Hammer,
  HardDrive,
  Blocks,
  LayoutDashboard,
  FileInput,
  Search,
  GitFork,
  BookOpen,
  Wrench,
  FolderTree
} from "lucide-react";

export default function Home() {
  const stack = [
    { name: "Next.js 16", desc: "Powers the frontend dashboard and streaming Backend-for-Frontend (BFF) proxy routes.", category: "Frontend & BFF" },
    { name: "Tailwind CSS v4", desc: "Sleek, responsive dark-glassmorphic styling compiled with Turbopack.", category: "Frontend & BFF" },
    { name: "FastAPI", desc: "Asynchronous Python web framework orchestrating the RAG retrieval core.", category: "Backend Microservice" },
    { name: "Ollama", desc: "Local LLM orchestrator running generative models (Qwen 2.5/Llama 3.1) and embeddings locally.", category: "Machine Learning Core" },
    { name: "ChromaDB", desc: "Local vector database persisting document chunk embeddings on disk.", category: "Vector Store" },
    { name: "SentenceTransformers", desc: "Extracts local dense representations and Cross-Encoder neural re-ranking scores.", category: "Machine Learning Core" },
    { name: "Rank-BM25", desc: "Computes traditional lexical keyword scores for hybrid Reciprocal Rank Fusion.", category: "Retrieval" },
    { name: "RapidOCR", desc: "Local ONNX OCR parser fallback to extract text from scanned, image-based PDFs.", category: "Ingestion" },
  ];

  const navCards = [
    { 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      title: "Architecture", 
      desc: "HLD/LLD system topology, data flows, and interface diagrams.", 
      href: "/architecture/",
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20"
    },
    { 
      icon: <FileInput className="h-5 w-5" />, 
      title: "Ingestion & Chunking", 
      desc: "PDF/DOCX parsing, OCR fallback, and contextual chunk strategies.", 
      href: "/chunking/",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    { 
      icon: <Search className="h-5 w-5" />, 
      title: "Retrieval & Reranking", 
      desc: "Hybrid dense-sparse fusion, RRF formulas, and cross-encoder scoring.", 
      href: "/retrieval/",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20"
    },
    { 
      icon: <GitFork className="h-5 w-5" />, 
      title: "RAG Strategies", 
      desc: "Naive, CRAG, Self-RAG, and Multi-Hop agentic routing loops.", 
      href: "/strategies/",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    { 
      icon: <BookOpen className="h-5 w-5" />, 
      title: "API Reference", 
      desc: "Full endpoint spec — query, ingest, stream, and collection routes.", 
      href: "/api-reference/",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    },
    { 
      icon: <Wrench className="h-5 w-5" />, 
      title: "Setup & Install", 
      desc: "Environment setup, config.yaml reference, and troubleshooting.", 
      href: "/setup/",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
  ];

  const differentiators = [
    {
      icon: <Hammer className="h-6 w-6" />,
      title: "No LangChain. No LlamaIndex.",
      subtitle: "100% hand-built from scratch",
      description: "Every component — from the recursive chunker to the hybrid retriever to the self-reflective generation loop — is written from first principles. No opaque framework abstractions. You can read, understand, and modify every line of the pipeline.",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20"
    },
    {
      icon: <HardDrive className="h-6 w-6" />,
      title: "Local-First Architecture",
      subtitle: "Runs entirely on your machine",
      description: "All inference happens through Ollama. All embeddings are computed locally with SentenceTransformers. All vectors are stored in a local ChromaDB instance. No API keys, no cloud bills, no data leaving your network.",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20"
    },
    {
      icon: <Blocks className="h-6 w-6" />,
      title: "Production-Grade Abstractions",
      subtitle: "ABC interfaces, lazy init, Pydantic validation",
      description: "Every retriever, chunker, and strategy implements a formal ABC interface. Models use lazy initialization for memory efficiency. All API I/O is validated through Pydantic schemas. The codebase is designed to be extended, not forked.",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20"
    }
  ];

  return (
    <div>
      {/* Premium Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-border-light bg-bg-surface/40 backdrop-blur-md p-6 md:p-8 mb-8 mt-4 shadow-sm">
        <div className="absolute top-0 right-0 h-[200px] w-[200px] bg-accent-start/8 rounded-full blur-[60px]" />
        <div className="absolute bottom-0 left-0 h-[150px] w-[150px] bg-accent-cyan/8 rounded-full blur-[50px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3 text-accent-cyan text-[11px] font-bold tracking-widest uppercase">
            <Sparkles className="h-4 w-4" /> Technical Documentation
          </div>
          <h1 className="border-none mt-0 pt-0 mb-3 text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-text-primary via-accent-start to-accent-cyan bg-clip-text text-transparent">
            Veridia RAG Platform
          </h1>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl mt-0 mb-6">
            Welcome to the technical documentation site for Veridia RAG — a state-of-the-art, local-first Retrieval-Augmented Generation system. This documentation covers the architecture, strategies, mathematical formulations, and step-by-step procedures powering the application.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/setup/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-start to-accent-start/80 hover:shadow-glow text-white font-semibold text-xs md:text-sm transition-all"
            >
              <Terminal className="h-4 w-4" />
              <span>Get Started</span>
            </Link>
            <Link 
              href="/architecture/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated/80 hover:bg-bg-hover text-text-primary border border-border-light text-xs md:text-sm font-semibold transition-all"
            >
              <span>System Architecture</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="doc-alert doc-alert-note">
        <strong>What is Veridia?</strong> A fully open-source RAG platform that combines contextual chunking, hybrid dense-sparse retrieval, cross-encoder reranking, and self-reflective generation — all running locally with Ollama. No cloud dependencies. No API keys. No framework lock-in.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* WHY VERIDIA? */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Why Veridia?</h2>
      <p>
        Most RAG tutorials wrap LangChain calls around OpenAI endpoints and call it a day. Veridia takes a fundamentally different approach — every component is built from scratch with production patterns, and the entire system runs on your local hardware.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-6">
        {differentiators.map((d) => (
          <div key={d.title} className="metric-card flex flex-col">
            <div className={`h-11 w-11 rounded-xl ${d.bg} ${d.color} border ${d.border} flex items-center justify-center mb-4`}>
              {d.icon}
            </div>
            <h3 className="text-text-primary text-base font-bold mt-0 mb-0.5">{d.title}</h3>
            <span className="text-xs font-mono text-accent-cyan mb-2">{d.subtitle}</span>
            <p className="text-xs text-text-secondary m-0 leading-relaxed flex-grow">{d.description}</p>
          </div>
        ))}
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* TECHNOLOGICAL STACK */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Technological Stack</h2>
      <p>
        The platform decouples the ingestion pipeline and local ML execution from the chat interface using a hybrid Next.js + Python FastAPI design. Each technology was chosen for a specific reason — no unnecessary dependencies.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        {stack.map((tech) => (
          <div key={tech.name} className="metric-card">
            <span className="text-[10px] text-accent-cyan font-mono uppercase font-bold tracking-wider">{tech.category}</span>
            <h3 className="text-text-primary text-base font-semibold mt-1 mb-2">{tech.name}</h3>
            <p className="text-xs text-text-secondary m-0 leading-relaxed">{tech.desc}</p>
          </div>
        ))}
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* QUICK NAVIGATION */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Quick Navigation</h2>
      <p>
        Jump to any section of the documentation. Each page provides deep dives into implementation details, mathematical formulations, code references, and configuration options.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
        {navCards.map((card) => (
          <Link key={card.title} href={card.href} className="group no-underline">
            <div className="metric-card h-full flex flex-col">
              <div className={`h-10 w-10 rounded-lg ${card.bg} ${card.color} border ${card.border} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <h3 className="text-text-primary text-sm font-bold mt-0 mb-1 group-hover:text-accent-cyan transition-colors">{card.title}</h3>
              <p className="text-xs text-text-secondary m-0 leading-relaxed flex-grow">{card.desc}</p>
              <span className="text-[11px] text-accent-cyan font-semibold mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Read more <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* CORE TECHNIQUES */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Core Techniques Implemented</h2>
      <p>
        Veridia RAG Platform moves beyond standard vector matching to solve real-world context constraints and hallucinations:
      </p>

      <ul className="space-y-4 my-6">
        <li className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Contextual Chunking:</strong> Using a local LLM to inject global document context into individual chunk embeddings, minimizing search ambiguity.
          </div>
        </li>
        <li className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Dense-Sparse Hybrid Search:</strong> Fusing semantic vector similarities with BM25 keyword rankings via Reciprocal Rank Fusion (RRF).
          </div>
        </li>
        <li className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Cross-Encoder Neural Reranking:</strong> Evaluating the top retrieved candidates against the question using a neural scoring transformer.
          </div>
        </li>
        <li className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Self-Reflective RAG (Self-RAG):</strong> LLM-based verification checks to critique generations for correctness and contextual grounding.
          </div>
        </li>
        <li className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Agentic Query Routing:</strong> Adaptive strategies routing simple prompts to Naive pipelines, moderate queries to Corrective RAG (CRAG), and complex tasks to Multi-hop loops.
          </div>
        </li>
      </ul>

      {/* ──────────────────────────────────────────────── */}
      {/* PROJECT STRUCTURE */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Project Directory Structure</h2>
      <p>
        The repository is organized into clear, purpose-driven directories. The Python <code>src/</code> directory contains the RAG core, while <code>frontend-next/</code> houses the Next.js chat interface.
      </p>

      <pre>
        <code>{`veridia-rag/
├── config.yaml                  # Global configuration (models, chunking, retrieval)
├── .env.example                 # Environment variable template
├── pyproject.toml               # Python project definition & dependencies
│
├── src/                         # ── Python RAG Core ──
│   ├── api/                     # FastAPI route handlers (ingest, query, stream)
│   ├── config/                  # Pydantic settings loader & YAML parser
│   ├── embedding/               # SentenceTransformer embedding service
│   ├── generation/              # Ollama LLM client & response builder
│   ├── ingestion/               # Document loaders, OCR fallback, chunkers
│   ├── models.py                # Pydantic schemas (Chunk, QueryResult, etc.)
│   ├── pipeline.py              # Main RAG orchestrator (ties all stages)
│   ├── query/                   # Multi-query rewriter & query analyzer
│   ├── retrieval/               # Dense, sparse, hybrid retrievers & reranker
│   ├── strategies/              # Naive, CRAG, Self-RAG, Multi-Hop strategies
│   ├── utils/                   # Logging, timing, and helper utilities
│   └── vectorstore/             # ChromaDB adapter with lazy initialization
│
├── frontend-next/               # ── Next.js 16 Chat Interface ──
│   ├── src/app/                 # App Router pages & API route handlers
│   ├── src/components/          # React chat UI, citation viewer, sidebar
│   └── tailwind.config.ts       # Tailwind v4 design token configuration
│
├── docs-site/                   # ── This Documentation Site ──
│   └── src/app/                 # Next.js pages for each doc section
│
├── .github/workflows/           # CI/CD GitHub Actions (lint, test, deploy)
├── test_e2e_api.py              # End-to-end API integration tests
└── test_diagnostic.py           # Model & connectivity diagnostic tests`}</code>
</pre>

      <div className="doc-alert doc-alert-tip">
        <strong>Quick Tip:</strong> Select the menu options in the left sidebar to explore the exact file pathways, configuration overrides, mathematical formulas, and CI/CD manual workflow scripts.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* AUTHOR & LICENSE */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Author & License</h2>
      <p>
        Veridia RAG Platform is designed, developed, and maintained by **Sitharaj Seenivasan**. Feel free to connect, contribute, or support the project.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="metric-card flex flex-col justify-between">
          <div>
            <h3 className="text-text-primary text-base font-bold mt-0 mb-2">Sitharaj Seenivasan</h3>
            <p className="text-xs text-text-secondary m-0 leading-relaxed mb-4">
              Creator and Lead Developer of Veridia RAG. Specializing in AI/RAG system architecture, backend engineering, and local-first machine learning pipelines.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border-light pt-3 mt-auto">
            <a href="https://sitharaj.in" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent-cyan hover:text-accent-start transition-colors no-underline">
              Website
            </a>
            <a href="https://github.com/sitharaj88" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent-cyan hover:text-accent-start transition-colors no-underline">
              GitHub
            </a>
            <a href="https://linkedin.com/in/sitharaj08" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent-cyan hover:text-accent-start transition-colors no-underline">
              LinkedIn
            </a>
            <a href="https://buymeacoffee.com/stharaj08" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent-cyan hover:text-accent-start transition-colors no-underline">
              Buy Me A Coffee
            </a>
          </div>
        </div>

        <div className="metric-card flex flex-col justify-between">
          <div>
            <h3 className="text-text-primary text-base font-bold mt-0 mb-2">MIT License</h3>
            <p className="text-xs text-text-secondary m-0 leading-relaxed mb-4">
              This platform is open-source and licensed under the permissive MIT License. You are free to modify, distribute, and use it for commercial and private purposes, provided the original copyright notice is retained.
            </p>
          </div>
          <div className="border-t border-border-light pt-3 mt-auto">
            <span className="text-[10px] font-mono text-text-muted">Copyright &copy; 2026 Sitharaj Seenivasan</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ──────────────────────────────────────────────── */}
      <div className="mt-8 flex justify-end">
        <Link 
          href="/architecture/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-start to-accent-end text-white font-semibold hover:shadow-glow transition-all"
        >
          <span>Get Started — Architecture Overview</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
