import React from "react";
import Link from "next/link";
import { 
  Terminal, 
  Settings, 
  Play, 
  ArrowRight, 
  ArrowLeft,
  AlertTriangle, 
  CheckCircle2,
  Info,
  Download,
  Server,
  HardDrive,
  FileCode,
  GitBranch
} from "lucide-react";

export default function SetupPage() {
  const envVars = [
    { name: "OLLAMA_HOST", default: "http://localhost:11434", description: "Base URL for the Ollama inference server. Change if running Ollama on a remote machine or non-default port." },
    { name: "OLLAMA_MODEL", default: "llama3.1:8b", description: "Default generation model name. Must be pre-pulled via `ollama pull`. Alternatives: qwen2.5:3b, mistral:7b, gemma2:9b." },
    { name: "OLLAMA_TEMPERATURE", default: "0.1", description: "Sampling temperature for generation. Lower values (0.0–0.3) produce more deterministic outputs; higher values increase creativity." },
    { name: "OLLAMA_MAX_TOKENS", default: "2048", description: "Maximum number of tokens the LLM will generate per response. Increase for longer answers." },
    { name: "EMBEDDING_MODEL", default: "all-MiniLM-L6-v2", description: "SentenceTransformers model for embedding. Loaded locally on first use. Alternatives: all-mpnet-base-v2 (768d), bge-small-en-v1.5." },
    { name: "EMBEDDING_DIMENSION", default: "384", description: "Output vector dimension. Must match the chosen embedding model's output size (e.g., 384 for MiniLM, 768 for mpnet)." },
    { name: "CHROMA_PERSIST_DIR", default: "./data/chromadb", description: "Filesystem path where ChromaDB persists vector collections. Use an absolute path in production." },
    { name: "CHROMA_COLLECTION_NAME", default: "default_collection", description: "Name of the ChromaDB collection to read/write. Change to isolate document sets across projects." },
    { name: "CHUNK_SIZE", default: "512", description: "Target character count per text chunk. Smaller chunks improve precision; larger chunks preserve context." },
    { name: "CHUNK_OVERLAP", default: "50", description: "Number of overlapping characters between adjacent chunks. Prevents information loss at chunk boundaries." },
    { name: "RETRIEVAL_TOP_K", default: "10", description: "Number of candidates returned by the hybrid retriever before reranking." },
    { name: "RERANK_TOP_K", default: "5", description: "Number of final chunks passed to the LLM after cross-encoder reranking." },
    { name: "LOG_LEVEL", default: "INFO", description: "Python logging level. Options: DEBUG, INFO, WARNING, ERROR, CRITICAL." },
    { name: "LOG_FILE", default: "logs/veridia.log", description: "Path to the log output file. Directory is created automatically if it doesn't exist." },
  ];

  const configParams = [
    { section: "embedding", param: "model_name", type: "string", default: "all-MiniLM-L6-v2", description: "HuggingFace model ID for SentenceTransformers embeddings." },
    { section: "embedding", param: "dimension", type: "int", default: "384", description: "Output embedding vector dimension. Must match model output." },
    { section: "embedding", param: "batch_size", type: "int", default: "64", description: "Number of chunks embedded per batch. Increase for GPU acceleration." },
    { section: "embedding", param: "normalize", type: "bool", default: "true", description: "L2-normalize vectors before storage. Required for cosine similarity." },
    { section: "chunking", param: "strategy", type: "string", default: "contextual", description: "Chunking algorithm: fixed, recursive, semantic, markdown, or contextual." },
    { section: "chunking", param: "chunk_size", type: "int", default: "512", description: "Target chunk size in characters." },
    { section: "chunking", param: "chunk_overlap", type: "int", default: "50", description: "Character overlap between adjacent chunks." },
    { section: "chunking", param: "semantic_threshold", type: "float", default: "0.5", description: "Cosine similarity threshold for semantic chunking boundary detection." },
    { section: "retrieval", param: "top_k", type: "int", default: "10", description: "Number of candidate chunks returned by hybrid retrieval." },
    { section: "retrieval", param: "similarity_threshold", type: "float", default: "0.3", description: "Minimum cosine similarity score to include a result." },
    { section: "retrieval", param: "dense_weight", type: "float", default: "0.6", description: "Weight for dense (vector) retrieval in hybrid fusion." },
    { section: "retrieval", param: "sparse_weight", type: "float", default: "0.4", description: "Weight for sparse (BM25) retrieval in hybrid fusion." },
    { section: "retrieval", param: "rrf_k", type: "int", default: "60", description: "RRF smoothing constant. Higher values reduce impact of top-ranked outliers." },
    { section: "reranking", param: "enabled", type: "bool", default: "true", description: "Toggle cross-encoder reranking on/off." },
    { section: "reranking", param: "model_name", type: "string", default: "cross-encoder/ms-marco-MiniLM-L-6-v2", description: "HuggingFace cross-encoder model for neural reranking." },
    { section: "reranking", param: "top_k", type: "int", default: "5", description: "Number of reranked results passed to the generation stage." },
    { section: "generation", param: "ollama_host", type: "string", default: "http://127.0.0.1:11434", description: "Ollama server base URL." },
    { section: "generation", param: "model", type: "string", default: "qwen2.5:3b", description: "Ollama model tag for text generation." },
    { section: "generation", param: "temperature", type: "float", default: "0.1", description: "LLM sampling temperature." },
    { section: "generation", param: "max_tokens", type: "int", default: "2048", description: "Maximum generation token count." },
    { section: "generation", param: "stream", type: "bool", default: "true", description: "Enable Server-Sent Events (SSE) streaming for responses." },
    { section: "vectorstore", param: "persist_dir", type: "string", default: "./data/chromadb", description: "Directory for ChromaDB persistence files." },
    { section: "vectorstore", param: "collection_name", type: "string", default: "default_collection", description: "Default ChromaDB collection name." },
    { section: "logging", param: "level", type: "string", default: "INFO", description: "Application log level." },
    { section: "logging", param: "file", type: "string", default: "logs/veridia.log", description: "Log file output path." },
    { section: "logging", param: "rotation", type: "string", default: "10 MB", description: "Log file rotation size threshold." },
    { section: "logging", param: "retention", type: "string", default: "7 days", description: "How long rotated log files are kept." },
    { section: "ingestion", param: "supported_extensions", type: "list", default: "(see below)", description: "File extensions accepted for ingestion: .pdf, .docx, .md, .txt, .py, .js, .ts, .java, .c, .cpp, .go, .rs, .html, .css, .json, .yaml, .yml, .toml" },
    { section: "ingestion", param: "max_file_size_mb", type: "int", default: "50", description: "Maximum file upload size in megabytes." },
  ];

  const troubleshooting = [
    {
      error: "Connection refused — Ollama not reachable on port 11434",
      symptoms: "HTTPConnectionPool(host='127.0.0.1', port=11434): Max retries exceeded / Connection refused",
      causes: [
        "Ollama service is not running",
        "Ollama is bound to a different host or port",
        "Firewall blocking the port"
      ],
      fixes: [
        "Start Ollama: run `ollama serve` in a separate terminal",
        "Verify with: `curl http://127.0.0.1:11434` — should return \"Ollama is running\"",
        "Check the OLLAMA_HOST environment variable matches the running instance",
        "On Linux, check systemd: `systemctl status ollama`"
      ]
    },
    {
      error: "ChromaDB permission or locking errors",
      symptoms: "PermissionError: [Errno 13] Permission denied: './data/chromadb' / sqlite3.OperationalError: database is locked",
      causes: [
        "The persist directory doesn't exist or isn't writable",
        "Another process holds a lock on the SQLite database file",
        "Running multiple uvicorn workers writing to the same collection"
      ],
      fixes: [
        "Ensure the directory exists: `mkdir -p data/chromadb`",
        "Check permissions: `chmod -R 755 data/chromadb`",
        "Kill orphan processes: `lsof data/chromadb/chroma.sqlite3`",
        "Use `--workers 1` with uvicorn (ChromaDB's SQLite backend is single-writer)"
      ]
    },
    {
      error: "Model not found — Ollama returns 404",
      symptoms: "model 'qwen2.5:3b' not found / 404 Not Found from Ollama API",
      causes: [
        "The model hasn't been pulled yet",
        "Model name/tag is misspelled in config.yaml or .env",
        "Ollama storage was cleared"
      ],
      fixes: [
        "Pull the model: `ollama pull qwen2.5:3b`",
        "List available models: `ollama list`",
        "Check spelling — tags are case-sensitive (e.g., `llama3.1:8b` not `Llama3.1:8B`)",
        "Verify OLLAMA_MODEL in .env matches an installed model exactly"
      ]
    },
    {
      error: "CORS errors in the browser console",
      symptoms: "Access-Control-Allow-Origin header missing / CORS policy: No 'Access-Control-Allow-Origin' header is present",
      causes: [
        "Browser is making requests directly to the FastAPI backend instead of through the Next.js BFF proxy",
        "FastAPI CORS middleware is not configured"
      ],
      fixes: [
        "Ensure all frontend requests go through /api/* routes — the BFF proxy handles CORS automatically",
        "If calling FastAPI directly, add CORS middleware in src/api/app.py",
        "Check that the Next.js dev server is running (port 3000) and proxying to port 8000",
        "Verify NEXT_PUBLIC_API_URL is not set to the FastAPI port directly"
      ]
    },
    {
      error: "SentenceTransformers / PyTorch import errors",
      symptoms: "ModuleNotFoundError: No module named 'sentence_transformers' / ImportError: torch not found",
      causes: [
        "Python dependencies not installed",
        "Wrong virtual environment activated",
        "Incompatible Python version"
      ],
      fixes: [
        "Activate the venv: `source .venv/bin/activate` (Linux/Mac) or `.venv\\Scripts\\activate` (Windows)",
        "Reinstall: `pip install -e .` from the project root",
        "Verify Python version: `python --version` (requires 3.11+)",
        "Check pip target: `which pip` should point to .venv/bin/pip"
      ]
    },
    {
      error: "Out of memory (OOM) during embedding or generation",
      symptoms: "RuntimeError: CUDA out of memory / Killed (signal 9) / MemoryError",
      causes: [
        "Model too large for available RAM/VRAM",
        "Embedding batch size too high",
        "Multiple models loaded simultaneously"
      ],
      fixes: [
        "Use a smaller generation model: `qwen2.5:3b` (2GB) instead of `llama3.1:8b` (5GB)",
        "Reduce embedding.batch_size in config.yaml (try 16 or 32)",
        "Close other GPU-intensive applications",
        "On CPU-only systems, ensure Ollama is configured for CPU inference"
      ]
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Terminal className="h-4 w-4" /> Setup & Run Guide
      </div>
      <h1>Installation & Local Deployment</h1>
      <p className="text-text-secondary leading-relaxed">
        Deploying the hybrid RAG application involves starting the Ollama inference model, launching the Python FastAPI core, and starting the Next.js frontend wrapper. This guide covers everything from prerequisites to troubleshooting common errors.
      </p>

      {/* ──────────────────────────────────────────────── */}
      {/* PREREQUISITES */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Prerequisites</h2>
      <p>
        Before starting, ensure the following tools are installed on your system. All components run locally — no cloud accounts or API keys required.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="metric-card flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <FileCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-text-primary text-sm font-bold mt-0 mb-1">Python 3.11+</h3>
            <p className="text-xs text-text-secondary m-0">Required for FastAPI, SentenceTransformers, and all ML dependencies. Verify: <code>python --version</code></p>
          </div>
        </div>
        <div className="metric-card flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center flex-shrink-0">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-text-primary text-sm font-bold mt-0 mb-1">Node.js 20+</h3>
            <p className="text-xs text-text-secondary m-0">Powers the Next.js 16 frontend and BFF proxy. Verify: <code>node --version</code></p>
          </div>
        </div>
        <div className="metric-card flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-text-primary text-sm font-bold mt-0 mb-1">Ollama (installed & running)</h3>
            <p className="text-xs text-text-secondary m-0">Local LLM inference server. Install from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline">ollama.com</a>. Verify: <code>ollama --version</code></p>
          </div>
        </div>
        <div className="metric-card flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-text-primary text-sm font-bold mt-0 mb-1">Git</h3>
            <p className="text-xs text-text-secondary m-0">For cloning the repository. Verify: <code>git --version</code></p>
          </div>
        </div>
      </div>

      <div className="doc-alert doc-alert-important">
        <strong>System Requirements:</strong> The application needs at least 8GB RAM for running Ollama with <code>qwen2.5:3b</code>. For <code>llama3.1:8b</code>, 16GB is recommended. A CUDA-capable GPU significantly improves performance but is not required — CPU inference works out of the box.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* STEP 1: OLLAMA */}
      {/* ──────────────────────────────────────────────── */}
      <h2>1. Inference Provider (Ollama)</h2>
      <p>
        Install Ollama on your system and download the required models. The RAG system uses one model for generation (default: <code>qwen2.5:3b</code> or <code>llama3.1:8b</code>) and another model for contextual chunking:
      </p>
      <pre>
        <code>{`# Install Ollama (Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull the generation model
ollama pull qwen2.5:3b

# (Optional) Pull a larger model for better quality
ollama pull llama3.1:8b

# Verify that Ollama is listening locally on port 11434
curl http://127.0.0.1:11434
# Expected output: "Ollama is running"

# List installed models
ollama list`}</code>
      </pre>

      <div className="doc-alert doc-alert-tip">
        <strong>Model Selection:</strong> Use <code>qwen2.5:3b</code> (~2GB) for faster responses on limited hardware. Use <code>llama3.1:8b</code> (~5GB) for higher quality generation and better contextual understanding. Both models support streaming.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* STEP 2: BACKEND */}
      {/* ──────────────────────────────────────────────── */}
      <h2>2. Backend Core Configuration</h2>
      <p>
        Clone the repository, set up a virtual environment, and install all dependencies:
      </p>
      <pre>
        <code>{`# Clone the repository
git clone https://github.com/your-org/veridia-rag.git
cd veridia-rag

# Create virtual environment
python -m venv .venv

# Activate — choose your platform:
# Linux / macOS:
source .venv/bin/activate

# Windows (PowerShell):
.venv\\Scripts\\Activate.ps1

# Windows (CMD):
.venv\\Scripts\\activate.bat

# Install with development packages in editable mode
pip install -e .`}</code>
      </pre>

      <div className="doc-alert doc-alert-note">
        <strong>First Run Note:</strong> The first time the backend starts, SentenceTransformers will download the embedding model (<code>all-MiniLM-L6-v2</code>, ~80MB) and the cross-encoder model (<code>ms-marco-MiniLM-L-6-v2</code>, ~80MB) from HuggingFace. These are cached locally in <code>~/.cache/huggingface/</code> for subsequent runs.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* ENV CONFIGURATION */}
      {/* ──────────────────────────────────────────────── */}
      <h3>Environment Configuration (.env)</h3>
      <p>
        Create a <code>.env</code> file in the root workspace directory. Environment variables override corresponding <code>config.yaml</code> values at runtime. Copy from the provided template:
      </p>
      <pre>
        <code>{`# Copy the example template
cp .env.example .env

# Edit with your preferred values
# nano .env`}</code>
      </pre>

      <h4 className="text-text-primary font-semibold mt-6 mb-3">Complete Environment Variable Reference</h4>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left py-3 px-3 text-text-primary font-semibold text-xs uppercase tracking-wider">Variable</th>
              <th className="text-left py-3 px-3 text-text-primary font-semibold text-xs uppercase tracking-wider">Default</th>
              <th className="text-left py-3 px-3 text-text-primary font-semibold text-xs uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody>
            {envVars.map((v, i) => (
              <tr key={v.name} className={`border-b border-border-muted ${i % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-elevated/50'}`}>
                <td className="py-2.5 px-3 font-mono text-xs text-accent-cyan whitespace-nowrap">{v.name}</td>
                <td className="py-2.5 px-3 font-mono text-xs text-text-muted whitespace-nowrap">{v.default}</td>
                <td className="py-2.5 px-3 text-xs text-text-secondary">{v.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* CONFIG.YAML */}
      {/* ──────────────────────────────────────────────── */}
      <h3>Global Configuration (config.yaml)</h3>
      <p>
        The <code>config.yaml</code> file manages chunk sizes, vector dimensions, search weights, model choices, and logging. It is the primary configuration source — environment variables override these values where applicable.
      </p>
      <pre>
        <code>{`# Veridia RAG Configuration
# Override any setting via environment variables or .env file

embedding:
  model_name: "all-MiniLM-L6-v2"
  dimension: 384
  batch_size: 64
  normalize: true

chunking:
  strategy: "contextual"          # fixed, recursive, semantic, markdown, contextual
  chunk_size: 512
  chunk_overlap: 50
  semantic_threshold: 0.5        # for semantic chunking

retrieval:
  top_k: 10
  similarity_threshold: 0.3
  dense_weight: 0.6
  sparse_weight: 0.4
  rrf_k: 60                     # RRF constant

reranking:
  enabled: true
  model_name: "cross-encoder/ms-marco-MiniLM-L-6-v2"
  top_k: 5

generation:
  ollama_host: "http://127.0.0.1:11434"
  model: "qwen2.5:3b"
  temperature: 0.1
  max_tokens: 2048
  stream: true

vectorstore:
  persist_dir: "./data/chromadb"
  collection_name: "default_collection"

logging:
  level: "INFO"
  file: "logs/veridia.log"
  rotation: "10 MB"
  retention: "7 days"

ingestion:
  supported_extensions:
    - ".pdf"
    - ".docx"
    - ".md"
    - ".txt"
    - ".py"
    - ".js"
    - ".ts"
    # ... (18 formats total)
  max_file_size_mb: 50`}</code>
      </pre>

      <h4 className="text-text-primary font-semibold mt-6 mb-3">Complete config.yaml Parameter Reference</h4>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left py-3 px-3 text-text-primary font-semibold text-xs uppercase tracking-wider">Section</th>
              <th className="text-left py-3 px-3 text-text-primary font-semibold text-xs uppercase tracking-wider">Parameter</th>
              <th className="text-left py-3 px-3 text-text-primary font-semibold text-xs uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-3 text-text-primary font-semibold text-xs uppercase tracking-wider">Default</th>
              <th className="text-left py-3 px-3 text-text-primary font-semibold text-xs uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody>
            {configParams.map((p, i) => (
              <tr key={`${p.section}-${p.param}`} className={`border-b border-border-muted ${i % 2 === 0 ? 'bg-bg-surface' : 'bg-bg-elevated/50'}`}>
                <td className="py-2.5 px-3 font-mono text-xs text-purple-400 whitespace-nowrap">{p.section}</td>
                <td className="py-2.5 px-3 font-mono text-xs text-accent-cyan whitespace-nowrap">{p.param}</td>
                <td className="py-2.5 px-3 font-mono text-xs text-text-muted whitespace-nowrap">{p.type}</td>
                <td className="py-2.5 px-3 font-mono text-xs text-text-muted whitespace-nowrap max-w-[140px] truncate">{p.default}</td>
                <td className="py-2.5 px-3 text-xs text-text-secondary">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="doc-alert doc-alert-warning">
        <strong>Dimension Mismatch:</strong> If you change <code>embedding.model_name</code>, you <strong>must</strong> also update <code>embedding.dimension</code> to match the model&apos;s output size. Mismatched dimensions will cause ChromaDB insertion errors. Delete the existing <code>data/chromadb</code> directory and re-ingest all documents after switching models.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* STEP 3: START FASTAPI */}
      {/* ──────────────────────────────────────────────── */}
      <h2>3. Start FastAPI Core</h2>
      <p>
        Launch the FastAPI backend server using uvicorn on port 8000:
      </p>
      <pre>
        <code>{`# Standard launch
python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8000 --reload

# Production launch (single worker, no auto-reload)
python -m uvicorn src.api.app:app --host 0.0.0.0 --port 8000 --workers 1

# Verify the backend is running
curl http://127.0.0.1:8000/health
# Expected: {"status": "healthy"}`}</code>
      </pre>

      <div className="doc-alert doc-alert-note">
        <strong>Single Worker:</strong> ChromaDB uses SQLite under the hood, which supports only one writer at a time. Always use <code>--workers 1</code> with uvicorn. The <code>--reload</code> flag is for development only — it watches for file changes and restarts automatically.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* STEP 4: START NEXTJS */}
      {/* ──────────────────────────────────────────────── */}
      <h2>4. Start Next.js Frontend</h2>
      <p>
        Move into the <code>frontend-next/</code> folder, install packages, and start the development server:
      </p>
      <pre>
        <code>{`cd frontend-next
npm install
npm run dev

# The dashboard starts on http://localhost:3000
# All /api/* requests proxy automatically to port 8000`}</code>
      </pre>

      <div className="doc-alert doc-alert-tip">
        <strong>Dev Ports:</strong> The Next.js dashboard will start on <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="font-semibold underline">http://localhost:3000</a>. All requests to <code>/api/*</code> are proxied automatically to port 8000 via the BFF layer. You should never need to call port 8000 directly from the browser.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* STARTUP CHECKLIST */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Startup Verification Checklist</h2>
      <p>
        After starting all three services, verify everything is connected:
      </p>

      <div className="space-y-3 my-6">
        {[
          { check: "Ollama is responding", command: "curl http://127.0.0.1:11434", expect: "\"Ollama is running\"" },
          { check: "Generation model is available", command: "ollama list", expect: "Shows qwen2.5:3b or your chosen model" },
          { check: "FastAPI backend is healthy", command: "curl http://127.0.0.1:8000/health", expect: "{\"status\": \"healthy\"}" },
          { check: "Next.js frontend loads", command: "Open http://localhost:3000", expect: "Chat interface renders" },
          { check: "API proxy works", command: "Browser DevTools → Network tab", expect: "/api/* requests return 200" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-bg-surface border border-border-muted rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-text-primary text-sm font-semibold">{item.check}</span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <code className="text-xs">{item.command}</code>
                <span className="text-xs text-text-muted">→ {item.expect}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* TROUBLESHOOTING */}
      {/* ──────────────────────────────────────────────── */}
      <h2>Troubleshooting Common Errors</h2>
      <p>
        Below are the most frequently encountered issues during setup and their solutions. Each entry includes the error message, likely causes, and step-by-step fixes.
      </p>

      <div className="space-y-6 my-6">
        {troubleshooting.map((issue, i) => (
          <div key={i} className="border border-border-light rounded-xl overflow-hidden">
            {/* Error Header */}
            <div className="flex items-start gap-3 p-4 bg-bg-elevated border-b border-border-muted">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-text-primary text-sm font-bold m-0">{issue.error}</h3>
                <p className="text-xs text-text-muted m-0 mt-1 font-mono">{issue.symptoms}</p>
              </div>
            </div>
            {/* Body */}
            <div className="p-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">Likely Causes</span>
                <ul className="mt-1.5 space-y-1">
                  {issue.causes.map((c, j) => (
                    <li key={j} className="text-xs text-text-secondary flex items-start gap-2">
                      <span className="text-text-muted mt-0.5">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">Fixes</span>
                <ul className="mt-1.5 space-y-1">
                  {issue.fixes.map((f, j) => (
                    <li key={j} className="text-xs text-text-secondary flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="doc-alert doc-alert-tip">
        <strong>Still stuck?</strong> Run the built-in diagnostic script to check all connections at once: <code>python test_diagnostic.py</code>. It verifies Ollama connectivity, model availability, ChromaDB permissions, and embedding model loading.
      </div>

      {/* ──────────────────────────────────────────────── */}
      {/* NAVIGATION */}
      {/* ──────────────────────────────────────────────── */}
      <div className="mt-8 flex justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Link 
          href="/architecture/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-start to-accent-end text-text-primary font-medium hover:shadow-glow transition-all"
        >
          <span>Continue to Architecture</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
