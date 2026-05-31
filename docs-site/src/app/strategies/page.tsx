import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Activity,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ArrowLeftRight,
  Brain,
  Search,
  FileCheck,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  Route,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  GitBranch,
  Workflow,
} from "lucide-react";

export default function StrategiesPage() {
  return (
    <div>
      {/* Category Label */}
      <div className="flex items-center gap-2 mb-2 text-accent-cyan text-sm font-semibold tracking-wider uppercase">
        <Sparkles className="h-4 w-4" /> Reasoning &amp; Strategies
      </div>
      <h1>SOTA Reflective RAG Strategies</h1>
      <p className="text-text-secondary leading-relaxed">
        To guarantee grounded generations and solve multi-step reasoning, Veridia RAG Intelligence moves past simple retrieval.
        It offers <strong>6 distinct reasoning strategies</strong> implemented in <code>src/strategies/</code>, each designed for
        different accuracy, latency, and hallucination-guard tradeoffs. The Adaptive Router automatically selects the optimal
        strategy at runtime — but you can also force any strategy via the API.
      </p>

      {/* ─── Strategy Flow Diagram ─── */}
      <div className="my-8">
        <img
          src="/images/strategies_flow.png"
          alt="Veridia RAG Strategy Routing"
          className="rounded-2xl border border-border-light shadow-glow w-full max-w-3xl mx-auto"
        />
        <p className="text-center text-text-muted text-xs mt-3">
          End-to-end strategy routing flow — from query ingestion through adaptive selection to grounded generation.
        </p>
      </div>

      {/* ─── Comparison Table ─── */}
      <h2>Strategy Comparison Matrix</h2>
      <p className="text-text-secondary text-sm mb-4">
        Use this matrix to quickly evaluate which strategy fits your workload. Latency and accuracy are relative
        measures based on benchmark testing across diverse query types.
      </p>
      <div className="overflow-x-auto my-6 rounded-xl border border-border-muted">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-elevated text-text-primary text-left">
              <th className="px-4 py-3 font-semibold">Strategy</th>
              <th className="px-4 py-3 font-semibold">Latency</th>
              <th className="px-4 py-3 font-semibold">Accuracy</th>
              <th className="px-4 py-3 font-semibold">Hallucination Guard</th>
              <th className="px-4 py-3 font-semibold">Best For</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            <tr className="border-t border-border-muted hover:bg-bg-hover transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-text-primary">Naive</td>
              <td className="px-4 py-3"><span className="text-green-400 font-semibold">Low</span></td>
              <td className="px-4 py-3">Medium</td>
              <td className="px-4 py-3"><span className="text-text-muted">None</span></td>
              <td className="px-4 py-3">Simple factual queries</td>
            </tr>
            <tr className="border-t border-border-muted hover:bg-bg-hover transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-text-primary">HyDE</td>
              <td className="px-4 py-3"><span className="text-yellow-400 font-semibold">Medium</span></td>
              <td className="px-4 py-3">High</td>
              <td className="px-4 py-3"><span className="text-text-muted">None</span></td>
              <td className="px-4 py-3">Conceptual / abstract queries</td>
            </tr>
            <tr className="border-t border-border-muted hover:bg-bg-hover transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-text-primary">CRAG</td>
              <td className="px-4 py-3"><span className="text-yellow-400 font-semibold">Medium</span></td>
              <td className="px-4 py-3">High</td>
              <td className="px-4 py-3"><span className="text-green-400">Yes — document grading</span></td>
              <td className="px-4 py-3">When retrieval quality varies</td>
            </tr>
            <tr className="border-t border-border-muted hover:bg-bg-hover transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-text-primary">Self-RAG</td>
              <td className="px-4 py-3"><span className="text-orange-400 font-semibold">High</span></td>
              <td className="px-4 py-3">Very High</td>
              <td className="px-4 py-3"><span className="text-green-400">Yes — self-reflection</span></td>
              <td className="px-4 py-3">Critical accuracy tasks</td>
            </tr>
            <tr className="border-t border-border-muted hover:bg-bg-hover transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-text-primary">Agentic</td>
              <td className="px-4 py-3"><span className="text-orange-400 font-semibold">High</span></td>
              <td className="px-4 py-3">Very High</td>
              <td className="px-4 py-3"><span className="text-green-400">Yes — multi-step</span></td>
              <td className="px-4 py-3">Complex multi-hop reasoning</td>
            </tr>
            <tr className="border-t border-border-muted hover:bg-bg-hover transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-accent-cyan">Adaptive</td>
              <td className="px-4 py-3"><span className="text-blue-400 font-semibold">Variable</span></td>
              <td className="px-4 py-3">Optimal</td>
              <td className="px-4 py-3"><span className="text-green-400">Automatic</span></td>
              <td className="px-4 py-3">Production default</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STRATEGY 1 — Naive RAG
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><Search className="h-5 w-5 text-accent-cyan" /> 1. Naive RAG</h2>
      <p className="text-text-secondary">
        The standard baseline strategy. It follows a linear pipeline without any self-correction or hallucination
        checks. Ideal for straightforward factual lookups where the corpus has high coverage.
      </p>

      <h3>Step-by-Step Flow</h3>
      <div className="my-4 space-y-2">
        {[
          "User submits a natural-language query to the /query endpoint.",
          "The query is encoded via SentenceTransformer into a dense embedding vector.",
          "Hybrid search executes: dense vector similarity (ChromaDB) + sparse keyword (BM25) in parallel.",
          "Candidate chunks are merged and deduplicated by document ID.",
          "A cross-encoder reranker scores and reorders the top-K chunks by relevance.",
          "The top chunks are injected into the system prompt template alongside the user query.",
          "The LLM generates a response grounded in the provided context.",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs text-text-secondary m-0">{step}</p>
          </div>
        ))}
      </div>

      <h3>When to Use</h3>
      <ul className="text-sm text-text-secondary">
        <li>FAQ bots with well-curated, high-coverage knowledge bases</li>
        <li>Internal documentation search where documents closely match query terms</li>
        <li>Low-latency applications where speed matters more than reflection</li>
      </ul>

      <h3>API Example</h3>
      <pre>
        <code>{`curl -X POST http://localhost:8000/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What is the default chunk size?",
    "strategy": "naive",
    "top_k": 5
  }'`}</code>
      </pre>

      {/* ═══════════════════════════════════════════════════════════════════
          STRATEGY 2 — HyDE
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><Brain className="h-5 w-5 text-accent-cyan" /> 2. HyDE (Hypothetical Document Embeddings)</h2>
      <p className="text-text-secondary">
        Queries often lack overlapping keywords or semantic context with the target answer. The HyDE strategy
        bridges this <strong>semantic gap</strong> by first generating a hypothetical answer document, embedding
        that document, and using the resulting vector to retrieve real chunks from ChromaDB.
      </p>

      <div className="p-3.5 bg-bg-surface border border-border-muted rounded-lg font-mono text-xs my-4 text-text-secondary">
        User Query → [LLM Synthesis] → Mock Hypothetical Doc → [SentenceTransformer] → Embedding Vector → ChromaDB Retrieval → Rerank → Generate
      </div>

      <h3>Step-by-Step Flow</h3>
      <div className="my-4 space-y-2">
        {[
          "User submits a query (e.g., \"Explain the benefits of recursive chunking\").",
          "The LLM generates a plausible but hypothetical answer document (~150-300 tokens).",
          "The hypothetical document is encoded via SentenceTransformer into a dense vector.",
          "ChromaDB similarity search is executed using the hypothetical document's embedding (not the query's).",
          "Retrieved real chunks are reranked against the original user query.",
          "Top chunks + original query are sent to the LLM for final generation.",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs text-text-secondary m-0">{step}</p>
          </div>
        ))}
      </div>

      <h3>When to Use</h3>
      <ul className="text-sm text-text-secondary">
        <li>Abstract or conceptual questions (e.g., &quot;How does attention work in transformers?&quot;)</li>
        <li>Queries phrased very differently from how the answer is written in documents</li>
        <li>Research-style questions where the answer spans multiple concepts</li>
      </ul>

      <h3>API Example</h3>
      <pre>
        <code>{`curl -X POST http://localhost:8000/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Explain the benefits of semantic chunking over fixed-size chunking",
    "strategy": "hyde",
    "top_k": 5
  }'`}</code>
      </pre>

      {/* ═══════════════════════════════════════════════════════════════════
          STRATEGY 3 — Corrective RAG (CRAG)
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent-cyan" /> 3. Corrective RAG (CRAG)</h2>
      <p className="text-text-secondary">
        CRAG introduces <strong>document validation</strong> as a post-retrieval quality gate. After retrieving chunks, a
        grading LLM evaluates each chunk&apos;s relevance to the query. Irrelevant chunks are discarded, and if too few relevant
        chunks survive, the system triggers automatic query rewriting and re-retrieval.
      </p>

      <h3>Document Grading Classifications</h3>
      <div className="my-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="font-semibold text-text-primary text-xs">RELEVANT</span>
          </div>
          <p className="text-[10px] text-text-secondary m-0">The chunk directly addresses the query and is kept for context injection.</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="font-semibold text-text-primary text-xs">IRRELEVANT</span>
          </div>
          <p className="text-[10px] text-text-secondary m-0">The chunk does not address the query and is permanently discarded.</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="h-4 w-4 text-yellow-400" />
            <span className="font-semibold text-text-primary text-xs">AMBIGUOUS</span>
          </div>
          <p className="text-[10px] text-text-secondary m-0">The chunk is tangential — marked for query expansion and broader re-search.</p>
        </div>
      </div>

      <h3>Step-by-Step Flow</h3>
      <div className="my-4 space-y-2">
        {[
          "User query is encoded and hybrid search retrieves the initial candidate chunks.",
          "Each chunk is evaluated by a grading LLM prompt: RELEVANT / IRRELEVANT / AMBIGUOUS.",
          "Irrelevant chunks are discarded. Ambiguous chunks are flagged.",
          "If the ratio of relevant chunks falls below the threshold (default: 40%), a query rewrite is triggered.",
          "The rewritten query executes a fresh retrieval cycle with expanded search terms.",
          "Surviving relevant chunks from all iterations are merged and deduplicated.",
          "The final chunk set is injected into the prompt for grounded generation.",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs text-text-secondary m-0">{step}</p>
          </div>
        ))}
      </div>

      <div className="doc-alert doc-alert-tip">
        <strong>Pro Tip:</strong> CRAG is especially effective when your knowledge base contains a mix of highly relevant and tangentially related documents. The grading step acts as a quality filter that prevents noisy context from degrading generation quality.
      </div>

      <h3>When to Use</h3>
      <ul className="text-sm text-text-secondary">
        <li>Knowledge bases with uneven coverage or mixed document quality</li>
        <li>Domains where irrelevant context causes significant hallucination risk</li>
        <li>When you need a balance between Naive speed and Self-RAG rigor</li>
      </ul>

      <h3>API Example</h3>
      <pre>
        <code>{`curl -X POST http://localhost:8000/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the CRAG grading thresholds?",
    "strategy": "corrective",
    "top_k": 8
  }'`}</code>
      </pre>

      {/* ═══════════════════════════════════════════════════════════════════
          STRATEGY 4 — Self-RAG
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><Activity className="h-5 w-5 text-accent-cyan" /> 4. Self-Reflective RAG (Self-RAG)</h2>
      <p className="text-text-secondary">
        Self-RAG is a <strong>self-reflective framework</strong> that goes beyond document grading. The LLM generates text and then
        critiques its own response using three distinct self-reflection markers. If any marker fails, the system loops back to
        retrieval or regeneration — ensuring the final output is grounded, relevant, and useful.
      </p>

      <h3>Self-Reflection Markers</h3>
      <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <span className="font-semibold text-text-primary text-xs block">1. Retrieval Decision</span>
          <p className="text-[10px] text-text-secondary mt-1 m-0">Decides whether retrieving documents is required to answer the query, or if the LLM&apos;s parametric knowledge is sufficient.</p>
        </div>
        <div className="metric-card">
          <span className="font-semibold text-text-primary text-xs block">2. Grounding Check</span>
          <p className="text-[10px] text-text-secondary mt-1 m-0">Critiques if every claim in the generated text is strictly supported by the retrieved document chunks. No extrapolation allowed.</p>
        </div>
        <div className="metric-card">
          <span className="font-semibold text-text-primary text-xs block">3. Answer Quality</span>
          <p className="text-[10px] text-text-secondary mt-1 m-0">Evaluates whether the response actually answers the user&apos;s intent — not just related information, but a direct answer.</p>
        </div>
      </div>

      <h3>Step-by-Step Flow</h3>
      <div className="my-4 space-y-2">
        {[
          "The Retrieval Decision marker evaluates the query: does it require external knowledge?",
          "If retrieval is needed, hybrid search retrieves and reranks candidate chunks.",
          "The LLM generates an initial response using the retrieved context.",
          "The Grounding Check marker evaluates: is every claim in the response supported by the chunks?",
          "If NOT_GROUNDED, the system rewrites the response or triggers re-retrieval with expanded queries.",
          "The Answer Quality marker evaluates: does the response actually answer the user's question?",
          "If quality is insufficient, the system loops back (max 3 iterations) before returning the best response.",
          "The final grounded and quality-checked response is returned to the user.",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs text-text-secondary m-0">{step}</p>
          </div>
        ))}
      </div>

      <div className="doc-alert doc-alert-warning">
        <strong>Latency Consideration:</strong> Self-RAG involves multiple LLM calls per query (retrieval decision + generation + grounding check + quality check, potentially looped). Expect 2–4× latency compared to Naive RAG. Use this strategy where accuracy is non-negotiable.
      </div>

      <h3>When to Use</h3>
      <ul className="text-sm text-text-secondary">
        <li>Medical, legal, or financial domains where incorrect answers carry real consequences</li>
        <li>Customer-facing applications where hallucinated responses damage trust</li>
        <li>Compliance-critical systems that require verifiable, grounded outputs</li>
      </ul>

      <h3>API Example</h3>
      <pre>
        <code>{`curl -X POST http://localhost:8000/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the self-reflection markers in Self-RAG?",
    "strategy": "self_reflective",
    "top_k": 5
  }'`}</code>
      </pre>

      {/* ═══════════════════════════════════════════════════════════════════
          STRATEGY 5 — Agentic RAG
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><Cpu className="h-5 w-5 text-accent-cyan" /> 5. Agentic RAG</h2>
      <p className="text-text-secondary">
        Agentic RAG operates as a <strong>closed-loop autonomous agent</strong>. The LLM is equipped with search tools
        (<code>dense_search</code>, <code>bm25_search</code>, and <code>query_rewrite</code>) and executes multi-step planning.
        It queries, reads results, reformulates sub-questions, and accumulates context over multiple iterations until it determines
        the context is sufficient to produce a comprehensive answer.
      </p>

      <h3>Available Agent Tools</h3>
      <div className="my-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-3.5 w-3.5 text-accent-cyan" />
            <span className="font-semibold text-text-primary text-xs">dense_search</span>
          </div>
          <p className="text-[10px] text-text-secondary m-0">Semantic vector similarity search against the ChromaDB collection.</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-accent-cyan" />
            <span className="font-semibold text-text-primary text-xs">bm25_search</span>
          </div>
          <p className="text-[10px] text-text-secondary m-0">Sparse keyword search using BM25 term-frequency scoring.</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="h-3.5 w-3.5 text-accent-cyan" />
            <span className="font-semibold text-text-primary text-xs">query_rewrite</span>
          </div>
          <p className="text-[10px] text-text-secondary m-0">Reformulates the query into sub-questions for broader coverage.</p>
        </div>
      </div>

      <h3>Step-by-Step Flow</h3>
      <div className="my-4 space-y-2">
        {[
          "The agent receives the user query and creates an initial plan of sub-questions.",
          "For each sub-question, the agent selects the best tool (dense_search or bm25_search).",
          "The agent reads the returned chunks and evaluates whether they answer the sub-question.",
          "If a sub-question is not adequately answered, the agent invokes query_rewrite to reformulate.",
          "The reformulated sub-question is searched again (up to max_iterations, default: 5).",
          "The agent accumulates context across all sub-questions into a unified context pool.",
          "Once all sub-questions are resolved (or iteration limit reached), the agent synthesizes a final response.",
          "The comprehensive response addresses the original query with evidence from all accumulated context.",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs text-text-secondary m-0">{step}</p>
          </div>
        ))}
      </div>

      <h3>When to Use</h3>
      <ul className="text-sm text-text-secondary">
        <li>Multi-hop questions requiring information from multiple documents (e.g., &quot;Compare X and Y&quot;)</li>
        <li>Complex reasoning tasks where the answer is not in a single chunk</li>
        <li>Research assistant use-cases that need exhaustive evidence gathering</li>
      </ul>

      <h3>API Example</h3>
      <pre>
        <code>{`curl -X POST http://localhost:8000/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Compare CRAG and Self-RAG strategies in terms of accuracy and latency tradeoffs",
    "strategy": "agentic",
    "top_k": 10,
    "max_iterations": 5
  }'`}</code>
      </pre>

      {/* ═══════════════════════════════════════════════════════════════════
          STRATEGY 6 — Adaptive RAG Router
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><Route className="h-5 w-5 text-accent-cyan" /> 6. Adaptive RAG Router</h2>
      <p className="text-text-secondary">
        Adaptive RAG is the <strong>production default</strong>. Instead of requiring manual strategy selection, it routes incoming
        queries dynamically using a query complexity classifier implemented in <code>src/query/router.py</code>.
      </p>

      <h3>Routing Logic</h3>
      <pre>
        <code>{`# Routing logic inside src/query/router.py

def route_query(query: str) -> str:
    complexity = classify_query_complexity(query)

    if complexity == "simple":
        return "naive"         # Simple fact recall → fastest path
    elif complexity == "conceptual":
        return "hyde"          # Abstract queries → hypothetical bridging
    elif complexity == "context_sensitive":
        return "corrective"    # Needs quality filtering → CRAG
    elif complexity == "critical":
        return "self_reflective"  # High-stakes → self-reflection
    elif complexity == "multi_hop":
        return "agentic"       # Multi-step reasoning → agent loop
    else:
        return "corrective"    # Default fallback → CRAG`}</code>
      </pre>

      <h3>Step-by-Step Flow</h3>
      <div className="my-4 space-y-2">
        {[
          "User submits a query without specifying a strategy (or explicitly sets strategy to \"adaptive\").",
          "The query complexity classifier analyzes lexical and semantic features of the query.",
          "Based on the classification, the router selects the optimal strategy from the strategy registry.",
          "The selected strategy executes its full pipeline (as described above).",
          "The response is returned along with metadata indicating which strategy was selected.",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-start/20 text-accent-cyan flex items-center justify-center font-bold text-xs mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs text-text-secondary m-0">{step}</p>
          </div>
        ))}
      </div>

      <h3>When to Use</h3>
      <ul className="text-sm text-text-secondary">
        <li>Production environments where query types are unpredictable</li>
        <li>When you want optimal latency-accuracy tradeoffs without manual intervention</li>
        <li>Multi-tenant applications serving diverse user populations</li>
      </ul>

      <h3>API Example</h3>
      <pre>
        <code>{`# Adaptive is the default — no strategy param needed
curl -X POST http://localhost:8000/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "How does the adaptive router classify queries?",
    "top_k": 5
  }'

# Or explicitly:
curl -X POST http://localhost:8000/query \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "How does the adaptive router classify queries?",
    "strategy": "adaptive",
    "top_k": 5
  }'`}</code>
      </pre>

      {/* ═══════════════════════════════════════════════════════════════════
          Decision Guide
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-accent-cyan" /> When to Use Which Strategy</h2>
      <p className="text-text-secondary text-sm mb-6">
        Use this decision guide to choose the right strategy for your use case. Each card describes the ideal scenario for the strategy.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Naive */}
        <div className="p-5 rounded-xl bg-bg-surface border border-border-muted hover:border-accent-cyan/40 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-green-400" />
            <span className="font-semibold text-text-primary text-sm">Choose Naive When…</span>
          </div>
          <ul className="text-xs text-text-secondary space-y-1 m-0 pl-4">
            <li>Your queries are straightforward and factual</li>
            <li>Your knowledge base has excellent coverage</li>
            <li>You need the lowest possible latency</li>
            <li>Occasional imprecision is acceptable</li>
          </ul>
        </div>

        {/* HyDE */}
        <div className="p-5 rounded-xl bg-bg-surface border border-border-muted hover:border-accent-cyan/40 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-purple-400" />
            <span className="font-semibold text-text-primary text-sm">Choose HyDE When…</span>
          </div>
          <ul className="text-xs text-text-secondary space-y-1 m-0 pl-4">
            <li>Queries are conceptual or abstractly phrased</li>
            <li>There&apos;s a vocabulary mismatch between queries and documents</li>
            <li>You need better recall without modifying the corpus</li>
            <li>Moderate latency increase is acceptable</li>
          </ul>
        </div>

        {/* CRAG */}
        <div className="p-5 rounded-xl bg-bg-surface border border-border-muted hover:border-accent-cyan/40 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-yellow-400" />
            <span className="font-semibold text-text-primary text-sm">Choose CRAG When…</span>
          </div>
          <ul className="text-xs text-text-secondary space-y-1 m-0 pl-4">
            <li>Your retrieval results are noisy or inconsistent</li>
            <li>You want hallucination guards without full self-reflection</li>
            <li>The corpus contains mixed-quality documents</li>
            <li>You need a solid middle ground between speed and safety</li>
          </ul>
        </div>

        {/* Self-RAG */}
        <div className="p-5 rounded-xl bg-bg-surface border border-border-muted hover:border-accent-cyan/40 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <span className="font-semibold text-text-primary text-sm">Choose Self-RAG When…</span>
          </div>
          <ul className="text-xs text-text-secondary space-y-1 m-0 pl-4">
            <li>Accuracy is absolutely critical (medical, legal, financial)</li>
            <li>You need verifiable, grounded outputs</li>
            <li>Higher latency is an acceptable tradeoff</li>
            <li>Every claim must be traceable to source documents</li>
          </ul>
        </div>

        {/* Agentic */}
        <div className="p-5 rounded-xl bg-bg-surface border border-border-muted hover:border-accent-cyan/40 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-red-400" />
            <span className="font-semibold text-text-primary text-sm">Choose Agentic When…</span>
          </div>
          <ul className="text-xs text-text-secondary space-y-1 m-0 pl-4">
            <li>Questions require synthesizing info from multiple sources</li>
            <li>The answer involves comparing, contrasting, or reasoning across topics</li>
            <li>You&apos;re building a research assistant or analytical tool</li>
            <li>Thoroughness matters more than response time</li>
          </ul>
        </div>

        {/* Adaptive */}
        <div className="p-5 rounded-xl bg-bg-surface border border-border-muted hover:border-accent-cyan/40 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Route className="h-4 w-4 text-accent-cyan" />
            <span className="font-semibold text-text-primary text-sm">Choose Adaptive When…</span>
          </div>
          <ul className="text-xs text-text-secondary space-y-1 m-0 pl-4">
            <li>You don&apos;t know the query distribution in advance</li>
            <li>You want the system to auto-optimize per query</li>
            <li>You&apos;re running a production service with diverse users</li>
            <li>You want to &quot;set and forget&quot; without manual tuning</li>
          </ul>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Grounding Prompt
      ═══════════════════════════════════════════════════════════════════ */}
      <h2 className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-accent-cyan" /> Grounding Prompt (Self-Reflection Check)</h2>
      <p className="text-text-secondary">
        To prevent hallucination, the generation module critiques answers using this validation check. This prompt is used
        by both CRAG and Self-RAG strategies during their respective validation phases:
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

      <div className="doc-alert doc-alert-note">
        <strong>Implementation Detail:</strong> The grounding check runs as a separate LLM call with <code>temperature=0</code> and
        a constrained output space to ensure deterministic binary classification. This adds ~200-400ms per validation cycle.
      </div>

      {/* ─── Navigation ─── */}
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
