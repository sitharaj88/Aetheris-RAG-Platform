import React from "react";
import Link from "next/link";
import {
  Activity,
  Timer,
  FileText,
  Cpu,
  ArrowRight,
  Radio,
  BarChart3,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  RefreshCw,
  Zap,
  AlertTriangle,
  ScrollText,
} from "lucide-react";

export default function ObservabilityPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Activity className="h-4 w-4" /> Observability & Tracing
      </div>
      <h1>Execution Tracing & Observability</h1>
      <p className="text-text-secondary leading-relaxed">
        In production RAG systems, understanding <strong>what happened</strong> and <strong>why</strong> during each query is as important as the answer itself. Veridia ships with built-in structured logging, real-time SSE trace event broadcasting, per-strategy execution timelines, and fine-grained timing breakdowns — enabling you to debug retrieval quality, diagnose latency regressions, and optimize every stage of the pipeline without external APM tooling.
      </p>

      {/* ──────────────── SECTION 1: LOGGING ARCHITECTURE ──────────────── */}
      <h2>
        <ScrollText className="h-5 w-5 text-accent-cyan" />
        Logging Architecture
      </h2>
      <p>
        Veridia uses <strong>Loguru</strong> as its primary logging framework, replacing Python's standard <code>logging</code> module with a zero-config, human-readable logger that supports structured fields, automatic exception tracing, and built-in rotation policies.
      </p>

      <h3>Log Format</h3>
      <p>
        Every log line emitted by the backend follows a consistent four-field structure, making it trivial to parse with <code>grep</code>, <code>jq</code>, or any log aggregation tool:
      </p>

      <pre>
        <code>{`# Log format: TIMESTAMP | LEVEL | MODULE | MESSAGE
2026-05-31 14:32:08.421 | INFO     | src.retrieval.hybrid_retriever | Fused 10 dense + 10 sparse → 10 candidates (RRF k=60)
2026-05-31 14:32:08.892 | DEBUG    | src.retrieval.reranker         | Reranked 10 → top 5 chunks (ms-marco-MiniLM-L-6-v2)
2026-05-31 14:32:09.104 | WARNING  | src.strategies.corrective_rag  | Grader flagged 2/5 chunks as IRRELEVANT — triggering query rewrite
2026-05-31 14:32:11.340 | INFO     | src.generation.response        | Stream complete: 142 tokens in 2231ms (strategy=corrective)
2026-05-31 14:32:11.341 | ERROR    | src.strategies.agentic_rag     | Tool call failed: Ollama connection refused on localhost:11434`}</code>
      </pre>

      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Timestamp</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            ISO 8601 timestamp with millisecond precision. All timestamps use the server's local timezone. Useful for correlating logs against SSE trace events and frontend request timings.
          </p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Level</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Standard severity levels: <code>DEBUG</code>, <code>INFO</code>, <code>WARNING</code>, <code>ERROR</code>, <code>CRITICAL</code>. Production environments should filter at <code>INFO</code> or above to reduce disk I/O.
          </p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Module</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            The fully-qualified Python module path (e.g. <code>src.retrieval.reranker</code>). This lets you instantly locate which component emitted the log and filter by pipeline stage.
          </p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Message</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Human-readable description of the event, often enriched with inline metrics (counts, timings, model names). Structured enough for parsing but readable enough for terminal debugging.
          </p>
        </div>
      </div>

      <h3>Log Rotation Configuration</h3>
      <p>
        Loguru is configured with automatic file rotation to prevent unbounded disk growth. The backend writes all logs to a single rotating file:
      </p>

      <div className="my-4 overflow-x-auto border border-border-muted rounded-xl bg-bg-surface">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-muted bg-bg-elevated/40 text-text-secondary">
              <th className="p-3 font-semibold">Setting</th>
              <th className="p-3 font-semibold">Value</th>
              <th className="p-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted text-text-secondary">
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">File Path</td>
              <td className="p-3 font-mono text-accent-cyan">logs/veridia.log</td>
              <td className="p-3">Relative to the project root. Created automatically on first startup if the directory doesn't exist.</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">Rotation Size</td>
              <td className="p-3 font-mono text-accent-cyan">10 MB</td>
              <td className="p-3">When the active log file exceeds 10 MB, it is rotated to a timestamped archive and a fresh file is started.</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">Retention</td>
              <td className="p-3 font-mono text-accent-cyan">7 days</td>
              <td className="p-3">Archived log files older than 7 days are automatically purged to reclaim disk space.</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary font-mono">Compression</td>
              <td className="p-3 font-mono text-accent-cyan">zip</td>
              <td className="p-3">Rotated files are compressed with zip to minimize storage footprint for older logs.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <pre>
        <code>{`# Loguru configuration in src/core/logging.py
from loguru import logger
import sys

logger.remove()  # Remove default stderr handler

# Console output (colorized, for development)
logger.add(sys.stderr, level="DEBUG", colorize=True,
           format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                  "<level>{level: <8}</level> | "
                  "<cyan>{name}</cyan> | "
                  "<level>{message}</level>")

# File output (structured, for production)
logger.add("logs/veridia.log",
           rotation="10 MB",
           retention="7 days",
           compression="zip",
           level="INFO",
           format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name: <40} | {message}")`}</code>
      </pre>

      <div className="doc-alert doc-alert-tip">
        <strong>Pro Tip:</strong> Use <code>tail -f logs/veridia.log | grep &quot;strategy=&quot;</code> to live-monitor which reasoning strategy is being triggered for incoming queries. Pair this with the SSE trace events below for full-stack observability.
      </div>

      {/* ──────────────── SECTION 2: SSE TRACE EVENTS ──────────────── */}
      <h2>
        <Radio className="h-5 w-5 text-accent-cyan" />
        SSE Trace Events
      </h2>
      <p>
        When streaming responses via <code>POST /api/query/stream</code>, the backend emits structured Server-Sent Events (SSE) that carry not only the generated tokens, but also real-time execution traces. These trace events give the frontend — and any monitoring consumer — full visibility into what the pipeline is doing at each step.
      </p>

      <h3>Event Types</h3>
      <p>
        The SSE stream emits four distinct event types, each serving a specific observability purpose:
      </p>

      <div className="my-6 space-y-4">
        {/* event: trace */}
        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-md border bg-purple-500/10 text-purple-400 border-purple-500/20">
              event: trace
            </span>
            <span className="text-sm font-semibold text-text-primary">Execution Step Updates</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed mb-3">
            Emitted whenever the pipeline enters a new processing stage. Each trace event includes a <code>step</code> identifier and a human-readable <code>message</code>. The frontend uses these to render a live execution timeline showing the user what the system is currently doing.
          </p>
          <div className="flex flex-wrap gap-2">
            {["retriever", "reranker", "grader", "rewriter", "generator", "reflector", "router"].map((step) => (
              <span key={step} className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-elevated border border-border-muted text-text-muted">
                step: {step}
              </span>
            ))}
          </div>
        </div>

        {/* event: token */}
        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-md border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
              event: token
            </span>
            <span className="text-sm font-semibold text-text-primary">Streamed Response Tokens</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Individual tokens from the LLM response, streamed as they are generated. The frontend appends each token to the message buffer, enabling real-time character-by-character rendering. Each event carries a single <code>token</code> string field.
          </p>
        </div>

        {/* event: sources */}
        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              event: sources
            </span>
            <span className="text-sm font-semibold text-text-primary">Retrieved Document Citations</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Emitted once, after the retrieval and reranking stages complete. Contains an array of source documents with <code>document_id</code>, <code>filename</code>, <code>chunk_text</code>, and <code>relevance_score</code> for each citation. The frontend renders these as expandable source cards below the response.
          </p>
        </div>

        {/* event: done */}
        <div className="p-5 bg-bg-surface border border-border-muted rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-md border bg-amber-500/10 text-amber-400 border-amber-500/20">
              event: done
            </span>
            <span className="text-sm font-semibold text-text-primary">Completion with Timing Metadata</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            The final event in every stream. Signals that the generation is complete and carries the full <code>timing</code> object with per-stage latency breakdowns, plus <code>strategy_used</code> to confirm which reasoning strategy was actually executed (especially useful when using Adaptive routing).
          </p>
        </div>
      </div>

      <h3>Example SSE Event Stream</h3>
      <p>
        Below is a complete SSE stream captured during a Corrective RAG query. Note the interleaving of trace events with token emissions:
      </p>

      <pre>
        <code>{`event: trace
data: {"step": "retriever", "message": "Executing hybrid search (dense + BM25)..."}

event: trace
data: {"step": "reranker", "message": "Cross-encoder reranking 10 → 5 chunks (ms-marco-MiniLM-L-6-v2)"}

event: trace
data: {"step": "grader", "message": "Evaluating chunk relevance: 4/5 RELEVANT, 1/5 IRRELEVANT"}

event: trace
data: {"step": "rewriter", "message": "Relevance threshold met — skipping query rewrite"}

event: sources
data: {"sources": [{"document_id": "e2a89c42", "filename": "architecture.md", "chunk_text": "The platform uses a hybrid retrieval...", "relevance_score": 0.9412}, {"document_id": "f7b31d08", "filename": "chunking_guide.pdf", "chunk_text": "Contextual chunking prepends a document...", "relevance_score": 0.8831}]}

event: trace
data: {"step": "generator", "message": "Streaming response from qwen2.5:7b (temperature=0.1)"}

event: token
data: {"token": "The "}

event: token
data: {"token": "platform "}

event: token
data: {"token": "uses "}

event: token
data: {"token": "hybrid "}

event: token
data: {"token": "retrieval "}

event: token
data: {"token": "combining "}

event: token
data: {"token": "dense "}

event: token
data: {"token": "vector "}

event: token
data: {"token": "search "}

event: token
data: {"token": "with "}

event: token
data: {"token": "BM25 "}

event: token
data: {"token": "sparse "}

event: token
data: {"token": "matching..."}

event: done
data: {"timing": {"retrieval_ms": 245.3, "reranking_ms": 189.7, "grading_ms": 312.4, "generation_ms": 2104.8, "total_ms": 2891.5}, "strategy_used": "corrective", "tokens_generated": 142}`}</code>
      </pre>

      <div className="doc-alert doc-alert-note">
        <strong>SSE Protocol:</strong> Each event is separated by a blank line (<code>\n\n</code>). The <code>event:</code> field specifies the event type, and the <code>data:</code> field contains a JSON payload. Clients should use <code>EventSource</code> or a fetch-based SSE reader to consume the stream.
      </div>

      {/* ──────────────── SECTION 3: STRATEGY EXECUTION TIMELINE ──────────────── */}
      <h2>
        <Cpu className="h-5 w-5 text-accent-cyan" />
        Strategy Execution Timeline
      </h2>
      <p>
        Each reasoning strategy follows a distinct execution path with different internal steps. Understanding these paths is critical for interpreting trace events and optimizing latency. Below is the execution timeline for each strategy:
      </p>

      {/* Naive RAG */}
      <div className="my-6 p-5 bg-bg-surface border border-border-muted rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary block">Naive RAG</span>
            <span className="text-[10px] text-text-muted">Fastest path — 3 pipeline stages</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "Hybrid Retrieval", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { label: "Cross-Encoder Rerank", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            { label: "LLM Generation", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <span className={`text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border ${step.color}`}>
                {step.label}
              </span>
              {i < 2 && <ArrowRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* HyDE */}
      <div className="my-6 p-5 bg-bg-surface border border-border-muted rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary block">HyDE (Hypothetical Document Embeddings)</span>
            <span className="text-[10px] text-text-muted">Adds hypothetical document synthesis — 4 stages</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "Hypothetical Doc Generation", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { label: "Embedding & Retrieval", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { label: "Cross-Encoder Rerank", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            { label: "LLM Generation", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <span className={`text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border ${step.color}`}>
                {step.label}
              </span>
              {i < 3 && <ArrowRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Corrective RAG */}
      <div className="my-6 p-5 bg-bg-surface border border-border-muted rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary block">Corrective RAG (CRAG)</span>
            <span className="text-[10px] text-text-muted">Adds grading & conditional rewrite — 4-6 stages</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "Hybrid Retrieval", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { label: "Cross-Encoder Rerank", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            { label: "Chunk Grading", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
            { label: "Query Rewrite?", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { label: "Re-Retrieval?", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { label: "LLM Generation", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <span className={`text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border ${step.color}`}>
                {step.label}
              </span>
              {i < 5 && <ArrowRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-text-muted mt-3 m-0">
          Steps marked with <strong>?</strong> are conditional — only executed when the grader determines insufficient relevant chunks.
        </p>
      </div>

      {/* Self-RAG */}
      <div className="my-6 p-5 bg-bg-surface border border-border-muted rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary block">Self-Reflective RAG (Self-RAG)</span>
            <span className="text-[10px] text-text-muted">Adds self-reflection loop — 5-7 stages</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "Retrieval Decision", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { label: "Hybrid Retrieval", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { label: "Cross-Encoder Rerank", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            { label: "LLM Generation", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
            { label: "Grounding Check", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
            { label: "Answer Quality Check", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { label: "Retry Loop?", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <span className={`text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border ${step.color}`}>
                {step.label}
              </span>
              {i < 6 && <ArrowRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-text-muted mt-3 m-0">
          If the grounding or quality check fails, the pipeline loops back to retrieval with reformulated queries. Max 3 retry iterations.
        </p>
      </div>

      {/* Agentic RAG */}
      <div className="my-6 p-5 bg-bg-surface border border-border-muted rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary block">Agentic RAG</span>
            <span className="text-[10px] text-text-muted">Multi-step closed-loop planning — variable stages</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "Query Planning", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
            { label: "Tool: dense_search", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { label: "Tool: bm25_search", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            { label: "Context Accumulation", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
            { label: "Sub-Question?", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { label: "Final Generation", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <span className={`text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border ${step.color}`}>
                {step.label}
              </span>
              {i < 5 && <ArrowRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-text-muted mt-3 m-0">
          The agent autonomously decides which tools to call and how many iterations to run. Trace events reveal every tool invocation and sub-question in real time.
        </p>
      </div>

      {/* Adaptive Router */}
      <div className="my-6 p-5 bg-bg-surface border border-border-muted rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary block">Adaptive RAG Router</span>
            <span className="text-[10px] text-text-muted">Classifies query complexity, then delegates — 1 + N stages</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "Query Classification", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
            { label: "Route → Strategy", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { label: "Delegated Execution", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <span className={`text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg border ${step.color}`}>
                {step.label}
              </span>
              {i < 2 && <ArrowRight className="h-3.5 w-3.5 text-text-muted flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-text-muted mt-3 m-0">
          The <code>router</code> trace step reports which strategy was selected. All subsequent trace events come from the delegated strategy.
        </p>
      </div>

      {/* ──────────────── SECTION 4: PERFORMANCE METRICS ──────────────── */}
      <h2>
        <BarChart3 className="h-5 w-5 text-accent-cyan" />
        Performance Metrics
      </h2>
      <p>
        Every query response (both synchronous and streaming) includes a <code>timing</code> object that breaks down latency across pipeline stages. Understanding these metrics is critical for identifying bottlenecks and optimizing your deployment.
      </p>

      <h3>Timing Breakdown</h3>
      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary font-mono">retrieval_ms</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Stage 1</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Time spent executing hybrid search: includes dense vector search against ChromaDB, sparse BM25 lexical matching, and Reciprocal Rank Fusion. Typical range: <strong>100–400ms</strong>.
          </p>
          <div className="mt-3 p-2 rounded-lg bg-bg-elevated text-[10px] text-text-muted font-mono">
            Optimization: Reduce <code>n_results</code> or limit collections to shrink candidate pool.
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary font-mono">reranking_ms</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Stage 2</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Time spent in the Cross-Encoder neural reranker (ms-marco-MiniLM-L-6-v2). Scales linearly with the number of candidate chunks. Typical range: <strong>80–300ms</strong>.
          </p>
          <div className="mt-3 p-2 rounded-lg bg-bg-elevated text-[10px] text-text-muted font-mono">
            Optimization: Feed fewer candidates (top 5 instead of top 10) to the reranker.
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary font-mono">generation_ms</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border-cyan-500/20">Stage 3</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Time for the LLM to generate the full response. Dominated by model size and hardware (CPU vs GPU). This is almost always the largest timing component. Typical range: <strong>1,000–8,000ms</strong>.
          </p>
          <div className="mt-3 p-2 rounded-lg bg-bg-elevated text-[10px] text-text-muted font-mono">
            Optimization: Use a smaller model, enable GPU offloading, or reduce max_tokens.
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary font-mono">total_ms</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border-amber-500/20">End-to-End</span>
          </div>
          <p className="text-xs text-text-secondary m-0 leading-relaxed">
            Wall-clock time from request receipt to final token emission. Includes all pipeline stages plus any strategy-specific overhead (grading, reflection, agent loops). This is the metric users experience.
          </p>
          <div className="mt-3 p-2 rounded-lg bg-bg-elevated text-[10px] text-text-muted font-mono">
            Target: Under 3 seconds for Naive RAG; under 6 seconds for reflective strategies.
          </div>
        </div>
      </div>

      <h3>Interpreting Timing for Optimization</h3>
      <p>
        Use the timing breakdown to diagnose where your query latency is concentrated:
      </p>

      <div className="my-4 overflow-x-auto border border-border-muted rounded-xl bg-bg-surface">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-muted bg-bg-elevated/40 text-text-secondary">
              <th className="p-3 font-semibold">Symptom</th>
              <th className="p-3 font-semibold">Dominant Metric</th>
              <th className="p-3 font-semibold">Likely Cause</th>
              <th className="p-3 font-semibold">Remediation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted text-text-secondary">
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary">Slow first response</td>
              <td className="p-3 font-mono text-accent-cyan">retrieval_ms &gt; 500</td>
              <td className="p-3">Large collection with 1000+ chunks; cold ChromaDB cache</td>
              <td className="p-3">Split into smaller collections; warm the cache with a test query on startup</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary">High reranking latency</td>
              <td className="p-3 font-mono text-accent-cyan">reranking_ms &gt; 400</td>
              <td className="p-3">Too many candidates being passed to the cross-encoder</td>
              <td className="p-3">Reduce <code>top_k</code> from 10 to 5 in retriever config</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary">Response feels slow</td>
              <td className="p-3 font-mono text-accent-cyan">generation_ms &gt; 5000</td>
              <td className="p-3">Large model running on CPU only; long response requested</td>
              <td className="p-3">Switch to a quantized model (Q4_K_M); enable GPU layers in Ollama</td>
            </tr>
            <tr className="hover:bg-bg-hover/20">
              <td className="p-3 font-semibold text-text-primary">Total much larger than sum</td>
              <td className="p-3 font-mono text-accent-cyan">total_ms ≫ sum of stages</td>
              <td className="p-3">Strategy-specific overhead (grading, reflection, agent tool calls)</td>
              <td className="p-3">Check trace events for unexpected retry loops; consider switching to Naive RAG for simple queries</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="doc-alert doc-alert-important">
        <strong>Baseline First:</strong> Before optimizing, establish a baseline by running 10 identical queries with Naive RAG and recording the median <code>total_ms</code>. This gives you a clean reference point before adding strategy-specific overhead from CRAG, Self-RAG, or Agentic loops.
      </div>

      <div className="doc-alert doc-alert-warning">
        <strong>GPU Memory:</strong> If <code>generation_ms</code> is inconsistent (e.g. 2s → 12s → 3s), check whether Ollama is swapping model layers between GPU and CPU. Use <code>ollama ps</code> to verify model residency and <code>OLLAMA_NUM_GPU=999</code> to force full GPU offloading.
      </div>

      {/* ──────────────── NAVIGATION ──────────────── */}
      <div className="mt-8 flex justify-between">
        <Link
          href="/strategies/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-muted text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to Strategies
        </Link>
        <Link
          href="/frontend/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent-start to-accent-end text-white font-medium hover:shadow-glow transition-all"
        >
          <span>Continue to Frontend UI</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
