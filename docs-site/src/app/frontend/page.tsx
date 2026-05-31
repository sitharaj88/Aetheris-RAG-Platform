import React from "react";
import Link from "next/link";
import {
  Monitor,
  Layout,
  Palette,
  Zap,
  Upload,
  ArrowRight,
  Layers,
  Shield,
  Sun,
  Moon,
  MessageSquare,
  FolderOpen,
  FileText,
  Trash2,
  Plus,
  Radio,
  Code,
  Server,
  Globe,
} from "lucide-react";

export default function FrontendPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Monitor className="h-4 w-4" /> Frontend Architecture
      </div>
      <h1>Chat UI & Frontend Architecture</h1>
      <p className="text-text-secondary leading-relaxed">
        The Veridia RAG Platform ships with a full-featured <strong>Next.js 16</strong> frontend application (React 19) that provides a conversational chat interface, real-time SSE streaming display, document management, collection switching, and strategy selection. This page documents the component architecture, BFF proxy pattern, theme system, and the real-time streaming implementation that power the user experience.
      </p>

      {/* ──────────────── SECTION 1: COMPONENT ARCHITECTURE ──────────────── */}
      <h2>
        <Layout className="h-5 w-5 text-accent-cyan" />
        Component Architecture
      </h2>
      <p>
        The frontend is designed as a <strong>single-page application</strong> with all primary UI logic housed in a single monolithic page component (<code>page.tsx</code>, approximately ~53KB). This deliberate design choice keeps the state management simple and avoids prop-drilling across deep component trees — the entire chat state, sidebar state, and streaming state live in a single React component scope.
      </p>

      <div className="my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Chat Interface</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Full conversation thread with message history, auto-scrolling, and markdown rendering. User messages and assistant responses are displayed in distinct visual styles with timestamps.
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <FolderOpen className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Document Sidebar</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            A collapsible sidebar panel listing all ingested documents in the current collection. Supports file upload, deletion, and shows per-document chunk counts and file sizes.
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Collection Switcher</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            A dropdown selector for switching between ChromaDB collections. Changing collections updates the document list and scopes all queries to that collection's vector space.
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Strategy Selector</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Displays all available reasoning strategies (Naive, HyDE, CRAG, Self-RAG, Agentic, Adaptive) with icons and descriptions. Selected strategy is passed to the streaming query endpoint.
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Radio className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Trace Panel</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Renders real-time execution trace events (retriever, grader, rewriter steps) as an inline timeline below each assistant response, giving users transparency into the reasoning process.
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Source Citations</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Expandable citation cards appear below each response showing source documents, chunk excerpts, and relevance scores. Users can trace exactly which documents informed each answer.
          </p>
        </div>
      </div>

      <div className="doc-alert doc-alert-note">
        <strong>Design Decision:</strong> The monolithic <code>page.tsx</code> approach was chosen deliberately for this project. With all state co-located in one component, there is zero risk of context synchronization bugs between chat, sidebar, and streaming state. For larger teams, consider refactoring into feature-sliced components with Zustand or Jotai.
      </div>

      {/* ──────────────── SECTION 2: BFF PROXY PATTERN ──────────────── */}
      <h2>
        <Shield className="h-5 w-5 text-accent-cyan" />
        BFF Proxy Pattern
      </h2>
      <p>
        The frontend never communicates directly with the Python FastAPI backend. Instead, all requests are routed through <strong>Next.js API route handlers</strong> (located in <code>frontend-next/src/app/api/</code>) acting as a Backend-for-Frontend (BFF) proxy layer. This architecture provides CORS isolation, SSE stream buffering, and payload normalization.
      </p>

      <h3>Why BFF?</h3>
      <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
            <Globe className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm font-semibold text-text-primary block">CORS Isolation</span>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed m-0">
            Browser requests go to the same origin (<code>/api/*</code>), eliminating cross-origin issues. The FastAPI backend on port 8000 is never exposed to the browser.
          </p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
            <Server className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm font-semibold text-text-primary block">SSE Stream Proxying</span>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed m-0">
            The BFF fetches the SSE stream from FastAPI and re-emits it to the browser, handling chunked transfer encoding and proper <code>Content-Type: text/event-stream</code> headers.
          </p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
            <Upload className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm font-semibold text-text-primary block">File Upload Proxying</span>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed m-0">
            FormData file uploads from the browser are received by the BFF, which reconstructs the multipart payload and forwards it to FastAPI's <code>/api/ingest</code> endpoint.
          </p>
        </div>
      </div>

      <h3>BFF Route Handler Example</h3>
      <p>
        Each Next.js API route follows a consistent pattern: receive the browser request, forward it to the backend, and pipe the response back. Here's the SSE streaming proxy:
      </p>

      <pre>
        <code>{`// frontend-next/src/app/api/query/stream/route.ts
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Forward the request to FastAPI backend
  const response = await fetch(\`\${BACKEND_URL}/api/query/stream\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Proxy the SSE stream back to the browser
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}`}</code>
      </pre>

      <pre>
        <code>{`// frontend-next/src/app/api/ingest/route.ts — File upload proxy
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  // Pass through the FormData directly — Next.js handles the boundary
  const formData = await req.formData();

  const response = await fetch(\`\${BACKEND_URL}/api/ingest\`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}`}</code>
      </pre>

      <div className="doc-alert doc-alert-tip">
        <strong>Remote Deployment:</strong> To point the BFF at a remote backend, set the <code>BACKEND_URL</code> environment variable in your Next.js deployment. For example: <code>BACKEND_URL=https://api.veridia.internal</code>.
      </div>

      {/* ──────────────── SECTION 3: THEME SYSTEM ──────────────── */}
      <h2>
        <Palette className="h-5 w-5 text-accent-cyan" />
        Theme System
      </h2>
      <p>
        Veridia features a polished dark/light mode theme system built on CSS custom properties (variables). The theme toggle persists user preference to <code>localStorage</code> and respects the system's <code>prefers-color-scheme</code> media query on first visit.
      </p>

      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dark Mode Card */}
        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-text-primary block">Dark Mode</span>
              <span className="text-[10px] text-text-muted">Deep cosmic midnight palette</span>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "--bg-deep", value: "#07090E", desc: "Page background" },
              { label: "--bg-surface", value: "#0E1119", desc: "Card surfaces" },
              { label: "--text-primary", value: "#E4E0DA", desc: "Headings & labels" },
              { label: "--accent-cyan", value: "#3DD6B6", desc: "Links & highlights" },
            ].map((v, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px]">
                <div className="h-5 w-5 rounded border border-border-light flex-shrink-0" style={{ backgroundColor: v.value }} />
                <span className="font-mono text-text-muted w-28 flex-shrink-0">{v.label}</span>
                <span className="font-mono text-accent-cyan flex-shrink-0">{v.value}</span>
                <span className="text-text-secondary">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Light Mode Card */}
        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-text-primary block">Light Mode</span>
              <span className="text-[10px] text-text-muted">Warm parchment cream palette</span>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "--bg-deep", value: "#F5F2ED", desc: "Page background" },
              { label: "--bg-surface", value: "#FFFFFF", desc: "Card surfaces" },
              { label: "--text-primary", value: "#1A1814", desc: "Headings & labels" },
              { label: "--accent-cyan", value: "#1BA88D", desc: "Links & highlights" },
            ].map((v, i) => (
              <div key={i} className="flex items-center gap-3 text-[11px]">
                <div className="h-5 w-5 rounded border border-border-light flex-shrink-0" style={{ backgroundColor: v.value }} />
                <span className="font-mono text-text-muted w-28 flex-shrink-0">{v.label}</span>
                <span className="font-mono text-accent-cyan flex-shrink-0">{v.value}</span>
                <span className="text-text-secondary">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h3>Theme Toggle Implementation</h3>
      <p>
        The theme system uses a class-based approach, toggling a <code>.dark</code> class on the root <code>&lt;html&gt;</code> element. All color tokens are defined as CSS custom properties that change based on the class presence:
      </p>

      <pre>
        <code>{`// Theme detection and toggle logic (simplified)
function initTheme() {
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem("veridia-theme");
  
  // 2. Fall back to system preference
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  // 3. Apply the resolved theme
  const isDark = saved ? saved === "dark" : systemDark;
  document.documentElement.classList.toggle("dark", isDark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("veridia-theme", isDark ? "dark" : "light");
}`}</code>
      </pre>

      <pre>
        <code>{`/* CSS variable architecture in globals.css */
:root {
  /* Light mode — warm parchment cream */
  --bg-deep: #F5F2ED;
  --bg-surface: #ffffff;
  --text-primary: #1A1814;
  --accent-cyan: #1BA88D;
}

:root.dark, html.dark {
  /* Dark mode — deep cosmic midnight */
  --bg-deep: #07090E;
  --bg-surface: #0E1119;
  --text-primary: #E4E0DA;
  --accent-cyan: #3DD6B6;
}

/* Components use tokens, never hardcoded colors */
.metric-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
}`}</code>
      </pre>

      <div className="doc-alert doc-alert-important">
        <strong>No Hardcoded Colors:</strong> All UI components use CSS custom property tokens (<code>var(--bg-surface)</code>, <code>var(--text-primary)</code>) instead of hardcoded hex values. This ensures automatic theme adaptation across the entire interface when the class toggles.
      </div>

      {/* ──────────────── SECTION 4: REAL-TIME STREAMING ──────────────── */}
      <h2>
        <Zap className="h-5 w-5 text-accent-cyan" />
        Real-Time Streaming
      </h2>
      <p>
        The chat interface consumes Server-Sent Events (SSE) from the BFF proxy to deliver real-time, token-by-token response rendering. The streaming implementation handles four distinct event types, progressively building the response while simultaneously displaying execution traces and citations.
      </p>

      <h3>SSE Consumption Flow</h3>
      <div className="my-6 space-y-4">
        {[
          {
            step: "1. Initiate Stream",
            module: "fetch() with ReadableStream",
            details: "The frontend sends a POST request to /api/query/stream via the BFF and reads the response body as a ReadableStream. A TextDecoder converts the byte stream into text chunks.",
            color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
          },
          {
            step: "2. Parse SSE Events",
            module: "Custom SSE parser",
            details: "Incoming text is split by double newlines (\\n\\n) to extract individual events. Each event's 'event:' and 'data:' fields are parsed to determine the type and JSON payload.",
            color: "bg-purple-500/10 text-purple-500 border-purple-500/30",
          },
          {
            step: "3. Route by Event Type",
            module: "Event handler switch",
            details: "trace → appended to the execution timeline array; token → concatenated to the growing response string; sources → stored as citation objects; done → finalize response with timing metadata.",
            color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
          },
          {
            step: "4. Render Progressively",
            module: "React state updates",
            details: "Each state update triggers a re-render. Tokens are displayed character-by-character via string concatenation. A CSS blinking cursor animation on the last character creates the typing effect.",
            color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
          },
        ].map((node, index) => (
          <div key={index} className="p-4 bg-bg-surface border border-border-muted rounded-xl flex items-start gap-4">
            <div className={`flex-shrink-0 h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold mt-1 ${node.color}`}>
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

      <h3>Streaming Code Example</h3>
      <pre>
        <code>{`// Simplified SSE consumption in the chat component
async function streamQuery(query: string, strategy: string) {
  setIsStreaming(true);
  let responseText = "";
  const traces: TraceEvent[] = [];

  const response = await fetch("/api/query/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, strategy, collection: activeCollection }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\\n\\n");
    buffer = events.pop() || ""; // Keep incomplete event in buffer

    for (const event of events) {
      const typeMatch = event.match(/^event: (.+)$/m);
      const dataMatch = event.match(/^data: (.+)$/m);
      if (!typeMatch || !dataMatch) continue;

      const type = typeMatch[1];
      const data = JSON.parse(dataMatch[1]);

      switch (type) {
        case "trace":
          traces.push(data);
          setTraceEvents([...traces]);
          break;
        case "token":
          responseText += data.token;
          setCurrentResponse(responseText);
          break;
        case "sources":
          setCitations(data.sources);
          break;
        case "done":
          setTiming(data.timing);
          setStrategyUsed(data.strategy_used);
          break;
      }
    }
  }

  setIsStreaming(false);
  addMessage({ role: "assistant", content: responseText, sources: citations });
}`}</code>
      </pre>

      <h3>Trace Event Display</h3>
      <p>
        During streaming, trace events are rendered as an animated timeline below the growing response. Each step appears with a pulsing indicator while active and a checkmark when complete:
      </p>

      <div className="my-4 p-4 bg-bg-surface border border-border-muted rounded-xl">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-3">Live Execution Timeline (example render)</span>
        <div className="space-y-2">
          {[
            { step: "retriever", msg: "Executing hybrid search (dense + BM25)...", done: true },
            { step: "reranker", msg: "Cross-encoder reranking 10 → 5 chunks", done: true },
            { step: "grader", msg: "Evaluating chunk relevance: 4/5 RELEVANT", done: true },
            { step: "generator", msg: "Streaming response from qwen2.5:7b...", done: false },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${t.done ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400 animate-pulse"}`}>
                {t.done ? "✓" : "●"}
              </div>
              <span className="font-mono text-text-muted w-16 flex-shrink-0">{t.step}</span>
              <span className="text-text-secondary">{t.msg}</span>
            </div>
          ))}
        </div>
      </div>

      <h3>Citation Rendering</h3>
      <p>
        Source citations are displayed as expandable cards below each response. Each card shows the filename, a preview of the matched chunk text, and the relevance score as a visual bar:
      </p>

      <div className="my-4 p-4 bg-bg-surface border border-border-muted rounded-xl space-y-3">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">Source Citations (example render)</span>
        {[
          { file: "architecture.md", score: 0.94, text: "The platform uses a hybrid retrieval pipeline combining dense vector search with sparse BM25 lexical matching..." },
          { file: "chunking_guide.pdf", score: 0.88, text: "Contextual chunking prepends a document-level summary to each chunk, improving retrieval relevance by 15-20%..." },
        ].map((src, i) => (
          <div key={i} className="p-3 bg-bg-elevated border border-border-light rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-xs font-semibold text-text-primary">{src.file}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-bg-hover overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${src.score * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-emerald-400">{src.score.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-text-secondary m-0 leading-relaxed line-clamp-2">{src.text}</p>
          </div>
        ))}
      </div>

      {/* ──────────────── SECTION 5: DOCUMENT MANAGEMENT ──────────────── */}
      <h2>
        <Upload className="h-5 w-5 text-accent-cyan" />
        Document Management
      </h2>
      <p>
        The document management sidebar provides a complete interface for uploading, organizing, and deleting documents across collections. All operations are proxied through the BFF to the FastAPI backend.
      </p>

      <h3>File Upload Flow</h3>
      <div className="my-6 space-y-4">
        {[
          {
            step: "1. File Selection",
            icon: <FileText className="h-4 w-4" />,
            details: "Users click the upload button or drag-and-drop files onto the sidebar. Accepted formats: PDF, DOCX, Markdown (.md), and source code files. Multiple files can be selected simultaneously.",
            color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
          },
          {
            step: "2. FormData Construction",
            icon: <Code className="h-4 w-4" />,
            details: "The frontend constructs a FormData object with the selected files and the active collection name. File sizes and names are validated client-side before submission.",
            color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
          },
          {
            step: "3. BFF Proxy Upload",
            icon: <Shield className="h-4 w-4" />,
            details: "The FormData is sent to /api/ingest via the BFF proxy, which forwards it to the FastAPI backend. A progress indicator displays during the upload and processing phase.",
            color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
          },
          {
            step: "4. Ingestion Processing",
            icon: <Zap className="h-4 w-4" />,
            details: "The backend runs the full ingestion pipeline: text extraction, OCR fallback, contextual chunking, embedding generation, and ChromaDB indexing. The response includes chunk counts and processing time.",
            color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          },
          {
            step: "5. UI Refresh",
            icon: <Monitor className="h-4 w-4" />,
            details: "On successful ingestion, the sidebar refreshes the document list to show the newly uploaded file with its chunk count. A toast notification confirms the upload with the number of chunks created.",
            color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          },
        ].map((node, index) => (
          <div key={index} className="p-4 bg-bg-surface border border-border-muted rounded-xl flex items-start gap-4">
            <div className={`flex-shrink-0 h-8 w-8 rounded-lg border flex items-center justify-center mt-0.5 ${node.color}`}>
              {node.icon}
            </div>
            <div>
              <span className="font-semibold text-text-primary text-sm block">{node.step}</span>
              <p className="text-xs text-text-secondary m-0 mt-1">{node.details}</p>
            </div>
          </div>
        ))}
      </div>

      <h3>Collection Management</h3>
      <p>
        Collections provide isolated document workspaces. The frontend supports creating, switching, and deleting collections:
      </p>

      <div className="my-4 overflow-x-auto border border-border-muted rounded-xl bg-bg-surface">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-muted bg-bg-elevated/40 text-text-secondary">
              <th className="p-3 font-semibold">Action</th>
              <th className="p-3 font-semibold">UI Element</th>
              <th className="p-3 font-semibold">API Route</th>
              <th className="p-3 font-semibold">Behavior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted text-text-secondary">
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold text-text-primary">Create</span>
                </div>
              </td>
              <td className="p-3 font-mono text-accent-cyan text-[11px]">+ New Collection button</td>
              <td className="p-3 font-mono text-[11px]">POST /api/collections</td>
              <td className="p-3">Opens a modal for name input. Creates the collection and switches to it.</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-semibold text-text-primary">Switch</span>
                </div>
              </td>
              <td className="p-3 font-mono text-accent-cyan text-[11px]">Dropdown selector</td>
              <td className="p-3 font-mono text-[11px]">GET /api/collections</td>
              <td className="p-3">Updates active collection state. Refreshes document list and scopes queries.</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                  <span className="font-semibold text-text-primary">Delete</span>
                </div>
              </td>
              <td className="p-3 font-mono text-accent-cyan text-[11px]">Trash icon on collection</td>
              <td className="p-3 font-mono text-[11px]">DELETE /api/collections/&#123;name&#125;</td>
              <td className="p-3">Requires confirmation. Deletes all docs/chunks. Cannot delete &quot;default&quot;.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Document Listing & Deletion</h3>
      <p>
        The sidebar lists all documents in the active collection, showing filename, chunk count, file size, and ingestion date. Each document row has a delete button that triggers a confirmation dialog:
      </p>

      <pre>
        <code>{`// Document deletion flow
async function deleteDocument(docId: string) {
  const confirmed = window.confirm("Delete this document and all its chunks?");
  if (!confirmed) return;

  await fetch(\`/api/documents/\${docId}?collection=\${activeCollection}\`, {
    method: "DELETE",
  });

  // Refresh the document list
  await refreshDocuments();
  
  // Show success toast
  showToast("Document deleted successfully", "success");
}`}</code>
      </pre>

      <div className="doc-alert doc-alert-warning">
        <strong>Irreversible Operation:</strong> Document deletion permanently removes all associated chunks from ChromaDB and triggers a background re-index of the BM25 sparse retriever. This cannot be undone — the original files must be re-uploaded if needed.
      </div>

      {/* ──────────────── NAVIGATION ──────────────── */}
      <div className="mt-8 flex justify-between">
        <Link
          href="/observability/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Observability
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
