import React from "react";
import Link from "next/link";
import { Terminal, Settings, Play, ArrowRight } from "lucide-react";

export default function SetupPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Terminal className="h-4 w-4" /> Setup & Run Guide
      </div>
      <h1>Installation & Local Deployment</h1>
      <p className="text-text-secondary leading-relaxed">
        Deploying the hybrid RAG application involves starting the Ollama inference model, launching the Python FastAPI core, and starting the Next.js frontend wrapper.
      </p>

      <h2>1. Inference Provider (Ollama)</h2>
      <p>
        Install Ollama on your system and download the required models. The RAG system uses one model for generation (default: <code>qwen2.5:3b</code> or <code>llama3.1:8b</code>) and another model for contextual chunking:
      </p>
      <pre>
        <code>{`# Pull the generation model
ollama pull qwen2.5:3b

# Verify that Ollama is listening locally on port 11434
curl http://127.0.0.1:11434`}</code>
      </pre>

      <h2>2. Backend Core Configuration</h2>
      <p>
        Set up a virtual environment in the root workspace and install all dependencies:
      </p>
      <pre>
        <code>{`# Create environment
python -m venv .venv
.venv\\Scripts\\activate

# Install with development packages in editable mode
pip install -e .`}</code>
      </pre>

      <h3>Environment Configuration (.env)</h3>
      <p>
        Create a <code>.env</code> file in the root workspace directory:
      </p>
      <pre>
        <code>{`OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
CHROMA_PERSIST_DIR=data/chromadb
LOG_LEVEL=INFO`}</code>
      </pre>

      <h3>Global Configuration (config.yaml)</h3>
      <p>
        The <code>config.yaml</code> file manages chunk sizes, vector dimensions, search weights, and model choices:
      </p>
      <pre>
        <code>{`embedding:
  model_name: "all-MiniLM-L6-v2"
  dimension: 384
chunking:
  strategy: "recursive" # fixed, recursive, semantic, markdown, contextual
  chunk_size: 512
  chunk_overlap: 50
retrieval:
  top_k: 10
  dense_weight: 0.6
  sparse_weight: 0.4
reranking:
  enabled: true
  model_name: "cross-encoder/ms-marco-MiniLM-L-6-v2"
  top_k: 5
generation:
  temperature: 0.1
  max_tokens: 1024`}</code>
      </pre>

      <h2>3. Start FastAPI Core</h2>
      <p>
        Launch the FastAPI backend server using uvicorn on port 8000:
      </p>
      <pre>
        <code>{`python -m uvicorn src.api.app:app --host 127.0.0.1 --port 8000 --reload`}</code>
      </pre>

      <h2>4. Start Next.js Frontend</h2>
      <p>
        Move into the <code>frontend-next/</code> folder, install packages, and start:
      </p>
      <pre>
        <code>{`cd frontend-next
npm install
npm run dev`}</code>
      </pre>

      <div className="doc-alert doc-alert-tip">
        <strong>Dev Ports:</strong> The Next.js dashboard will start on <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">http://localhost:3000</a>. All requests to <code>/api/*</code> are proxied automatically to port 8000.
      </div>

      <div className="mt-8 flex justify-between">
        <Link 
          href="/strategies/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Strategies
        </Link>
        <Link 
          href="/workflow/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-start to-accent-end text-white font-medium hover:shadow-glow transition-all"
        >
          <span>Continue to CI/CD</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
