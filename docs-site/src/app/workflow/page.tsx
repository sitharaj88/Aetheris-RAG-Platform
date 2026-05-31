import React from "react";
import Link from "next/link";
import {
  RefreshCw,
  Play,
  Shield,
  Globe,
  ArrowRight,
  GitBranch,
  Server,
  Lock,
  Container,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Workflow,
  Rocket,
  FileCode,
  Cloud,
  Network,
} from "lucide-react";

export default function WorkflowPage() {
  return (
    <div>
      {/* Category Label */}
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <RefreshCw className="h-4 w-4" /> CI/CD Deployment
      </div>
      <h1>GitHub Actions CI/CD Pipeline</h1>
      <p className="text-text-secondary leading-relaxed">
        The documentation site is a static export configuration, meaning it can be built and served as flat HTML/CSS/JS
        files without requiring a Node.js runtime. The deployment pipeline supports <strong>both manual triggers</strong> and{" "}
        <strong>automatic deployment on push</strong> to the <code>main</code> branch when documentation files change.
      </p>

      {/* ─── Trigger Modes ─── */}
      <h2 className="flex items-center gap-2"><Play className="h-5 w-5 text-accent-cyan" /> Trigger Modes</h2>
      <p className="text-text-secondary">
        The workflow is configured with two trigger modes to cover both manual and automated deployment scenarios:
      </p>

      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <Play className="h-4 w-4 text-green-400" />
            <span className="font-semibold text-text-primary text-xs">Manual Trigger (workflow_dispatch)</span>
          </div>
          <p className="text-[10px] text-text-secondary m-0">
            Allows you to trigger the deployment manually from the GitHub Actions tab. Useful for
            deploying specific branches, testing draft documentation, or controlling exactly when updates go live.
          </p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-text-primary text-xs">Push to Main (auto-deploy)</span>
          </div>
          <p className="text-[10px] text-text-secondary m-0">
            Automatically triggers when changes are pushed to the <code>main</code> branch in the <code>docs-site/</code> directory
            or the workflow file itself. Provides continuous deployment for documentation updates.
          </p>
        </div>
      </div>

      {/* ─── Workflow Script ─── */}
      <h2 className="flex items-center gap-2"><FileCode className="h-5 w-5 text-accent-cyan" /> Workflow Script Details</h2>
      <p className="text-text-secondary">
        The workflow is stored in <code>.github/workflows/deploy-docs.yml</code>. It uses the official GitHub Pages deployment
        actions with proper permissions, concurrency controls, and environment configuration:
      </p>
      <pre>
        <code>{`name: Deploy Docs to GitHub Pages

on:
  workflow_dispatch: # Enable manual trigger from the GitHub Actions tab

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'docs-site/package-lock.json'

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Install Dependencies
        run: |
          cd docs-site
          npm ci

      - name: Build Static Site
        run: |
          cd docs-site
          npm run build

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'docs-site/out'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`}</code>
      </pre>

      {/* ─── Workflow Breakdown ─── */}
      <h2>Workflow Breakdown</h2>
      <p className="text-text-secondary text-sm mb-4">
        Here is what each section of the workflow does:
      </p>

      <div className="overflow-x-auto my-6 rounded-xl border border-border-muted">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-elevated text-text-primary text-left">
              <th className="px-4 py-3 font-semibold">Section</th>
              <th className="px-4 py-3 font-semibold">Purpose</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr className="border-t border-border-muted">
              <td className="px-4 py-3 font-mono text-text-primary">on.workflow_dispatch</td>
              <td className="px-4 py-3">Enables the manual &quot;Run workflow&quot; button in the GitHub Actions UI.</td>
            </tr>
            <tr className="border-t border-border-muted">
              <td className="px-4 py-3 font-mono text-text-primary">on.push.paths</td>
              <td className="px-4 py-3">Only triggers on pushes that modify files inside <code>docs-site/</code> or the workflow itself — prevents unnecessary builds from backend changes.</td>
            </tr>
            <tr className="border-t border-border-muted">
              <td className="px-4 py-3 font-mono text-text-primary">permissions</td>
              <td className="px-4 py-3">Grants <code>contents: read</code>, <code>pages: write</code>, and <code>id-token: write</code> for the official GitHub Pages deploy action.</td>
            </tr>
            <tr className="border-t border-border-muted">
              <td className="px-4 py-3 font-mono text-text-primary">concurrency</td>
              <td className="px-4 py-3">Ensures only one deployment runs at a time. <code>cancel-in-progress: false</code> means queued deployments wait rather than cancel.</td>
            </tr>
            <tr className="border-t border-border-muted">
              <td className="px-4 py-3 font-mono text-text-primary">configure-pages</td>
              <td className="px-4 py-3">Official GitHub action that configures the Pages environment and generates deployment metadata.</td>
            </tr>
            <tr className="border-t border-border-muted">
              <td className="px-4 py-3 font-mono text-text-primary">upload-pages-artifact</td>
              <td className="px-4 py-3">Uploads the built <code>docs-site/out</code> directory as a GitHub Pages artifact.</td>
            </tr>
            <tr className="border-t border-border-muted">
              <td className="px-4 py-3 font-mono text-text-primary">deploy-pages</td>
              <td className="px-4 py-3">Deploys the uploaded artifact to the GitHub Pages environment and outputs the live URL.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ─── How to Deploy ─── */}
      <h2 className="flex items-center gap-2"><Rocket className="h-5 w-5 text-accent-cyan" /> How to Deploy Step-by-Step</h2>

      <h3>Option A: Automatic Deployment (Push to Main)</h3>
      <div className="my-6 space-y-3">
        {[
          "Make your documentation changes inside the docs-site/ directory.",
          "Commit and push to the main branch.",
          "The workflow triggers automatically — no manual action needed.",
          "Monitor the deployment progress under the Actions tab in your GitHub repository.",
          "Once the workflow completes, your changes are live at the GitHub Pages URL.",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs text-text-secondary m-0">{step}</p>
          </div>
        ))}
      </div>

      <h3>Option B: Manual Deployment (workflow_dispatch)</h3>
      <div className="my-6 space-y-3">
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">1</div>
          <p className="text-xs text-text-secondary m-0">Push the workflow file and documentation changes to your primary branch (e.g. <code>main</code>).</p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">2</div>
          <p className="text-xs text-text-secondary m-0">Go to your GitHub repository and click the <strong>Actions</strong> tab.</p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">3</div>
          <p className="text-xs text-text-secondary m-0">In the left sidebar, click the <strong>Deploy Docs to GitHub Pages</strong> workflow.</p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">4</div>
          <p className="text-xs text-text-secondary m-0">Click the <strong>Run workflow</strong> dropdown, choose the branch, and click the green <strong>Run workflow</strong> button.</p>
        </div>
      </div>

      <div className="doc-alert doc-alert-important">
        <strong>Repository Pages Setting:</strong> After running the workflow for the first time, go to your GitHub Repository Settings → <strong>Pages</strong> tab. Under <strong>Build and deployment</strong>, set the Source to <strong>GitHub Actions</strong> (not &quot;Deploy from a branch&quot;). This is required because the workflow uses the official <code>actions/deploy-pages@v4</code> action.
      </div>

      <div className="doc-alert doc-alert-tip">
        <strong>Path Filtering Saves Resources:</strong> The <code>paths</code> filter in the push trigger ensures the workflow only runs when documentation files actually change. Backend code changes, README updates, or other non-docs modifications will <em>not</em> trigger a rebuild — saving your GitHub Actions minutes.
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Production Deployment Considerations
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><Cloud className="h-5 w-5 text-accent-cyan" /> Production Deployment Considerations</h2>
      <p className="text-text-secondary">
        While GitHub Pages is excellent for hosting the documentation site, deploying the <strong>Veridia RAG backend</strong> to
        production requires additional configuration. This section covers the key considerations.
      </p>

      {/* Environment Variables */}
      <h3 className="flex items-center gap-2"><Settings className="h-4 w-4 text-accent-cyan" /> Environment Variables for Remote Backend</h3>
      <p className="text-text-secondary text-sm">
        When deploying the backend to a remote server, you need to configure environment variables for the LLM provider,
        vector store, and API settings. Create a <code>.env</code> file or set these in your deployment platform:
      </p>
      <pre>
        <code>{`# ─── LLM Configuration ───
LLM_PROVIDER=groq                          # or "ollama", "openai"
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx      # Required for Groq provider
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx         # Required for OpenAI provider
LLM_MODEL=llama-3.3-70b-versatile         # Model identifier

# ─── Embedding Configuration ───
EMBEDDING_MODEL=all-MiniLM-L6-v2          # SentenceTransformer model
CHROMA_PERSIST_DIR=/data/chromadb          # Persistent storage path

# ─── Server Configuration ───
HOST=0.0.0.0                               # Bind to all interfaces
PORT=8000                                  # API port
WORKERS=4                                  # Uvicorn worker count

# ─── Security ───
API_KEY=your-secure-api-key                # Optional API key for auth
ALLOWED_ORIGINS=https://yourdomain.com     # CORS allowed origins`}</code>
      </pre>

      <div className="doc-alert doc-alert-warning">
        <strong>Secret Management:</strong> Never commit API keys or secrets to version control. Use your deployment platform&apos;s
        secret management (e.g., GitHub Secrets, AWS Secrets Manager, GCP Secret Manager) to inject sensitive values at runtime.
      </div>

      {/* Docker Containerization */}
      <h3 className="flex items-center gap-2"><Server className="h-4 w-4 text-accent-cyan" /> Docker Containerization Overview</h3>
      <p className="text-text-secondary text-sm">
        For reproducible deployments, containerize the RAG backend with Docker. Here is a production-ready Dockerfile pattern:
      </p>
      <pre>
        <code>{`# ─── Stage 1: Build ───
FROM python:3.11-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Stage 2: Runtime ───
FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /install /usr/local
COPY src/ ./src/
COPY data/ ./data/

# Pre-download the embedding model at build time
RUN python -c "from sentence_transformers import SentenceTransformer; \\
    SentenceTransformer('all-MiniLM-L6-v2')"

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \\
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]`}</code>
      </pre>

      <p className="text-text-secondary text-sm mt-3">
        Build and run:
      </p>
      <pre>
        <code>{`# Build the image
docker build -t veridia-rag:latest .

# Run with environment variables
docker run -d \\
  --name veridia-rag \\
  -p 8000:8000 \\
  -v /host/data/chromadb:/data/chromadb \\
  --env-file .env \\
  veridia-rag:latest`}</code>
      </pre>

      <div className="doc-alert doc-alert-note">
        <strong>Persistent Storage:</strong> Mount the ChromaDB directory as a Docker volume (<code>-v</code>) to ensure your vector
        embeddings persist across container restarts. Without this, re-ingestion will be required after every container restart.
      </div>

      {/* CORS Configuration */}
      <h3 className="flex items-center gap-2"><Network className="h-4 w-4 text-accent-cyan" /> CORS Configuration for Production</h3>
      <p className="text-text-secondary text-sm">
        When the documentation site (or any frontend) is hosted on a different domain than the API backend, you need to
        configure Cross-Origin Resource Sharing (CORS). The backend uses FastAPI&apos;s <code>CORSMiddleware</code>:
      </p>
      <pre>
        <code>{`# src/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",           # Production frontend
        "https://docs.yourdomain.com",       # Documentation site
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],           # Restrict to needed methods
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,                            # Cache preflight for 1 hour
)`}</code>
      </pre>

      <div className="doc-alert doc-alert-warning">
        <strong>Security Warning:</strong> Avoid using <code>allow_origins=[&quot;*&quot;]</code> in production. Always explicitly list
        the domains that should have access to your API. Wildcard CORS combined with <code>allow_credentials=True</code> is a
        security vulnerability.
      </div>

      {/* Production checklist */}
      <h3>Production Readiness Checklist</h3>
      <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-bg-surface border border-border-muted">
          <span className="font-semibold text-text-primary text-sm block mb-3">Infrastructure</span>
          <ul className="text-xs text-text-secondary space-y-1.5 m-0 pl-4">
            <li>Configure a reverse proxy (Nginx / Caddy) with TLS</li>
            <li>Set up health check endpoints (<code>/health</code>)</li>
            <li>Configure log aggregation (stdout → your logging stack)</li>
            <li>Set resource limits (CPU/memory) for the container</li>
            <li>Enable persistent volume for ChromaDB data</li>
          </ul>
        </div>
        <div className="p-5 rounded-xl bg-bg-surface border border-border-muted">
          <span className="font-semibold text-text-primary text-sm block mb-3">Security</span>
          <ul className="text-xs text-text-secondary space-y-1.5 m-0 pl-4">
            <li>Rotate API keys on a regular schedule</li>
            <li>Enable rate limiting to prevent abuse</li>
            <li>Restrict CORS origins to known frontends</li>
            <li>Use environment-based secret injection (never hardcode)</li>
            <li>Enable HTTPS-only with HSTS headers</li>
          </ul>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <div className="mt-8 flex justify-between">
        <Link
          href="/setup/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Setup
        </Link>
        <Link
          href="/api-reference/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-start to-accent-end text-white font-medium hover:shadow-glow transition-all"
        >
          <span>Continue to API Reference</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
