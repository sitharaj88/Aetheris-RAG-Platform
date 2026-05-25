"""
Prompt templates for every LLM interaction in the RAG1 system.

All prompts are plain format-strings. Call ``.format(...)`` with the
appropriate keyword arguments before passing to the LLM.
"""

# ---------------------------------------------------------------------------
# Core RAG prompts
# ---------------------------------------------------------------------------

RAG_SYSTEM_PROMPT = """\
You are a precise, knowledgeable assistant that answers questions based \
strictly on the provided context. Follow these rules:

1. ONLY use information from the provided context to answer.
2. If the context does not contain enough information, say so clearly — \
   do NOT make up facts.
3. Cite your sources using bracketed numbers like [1], [2], etc., \
   matching the source numbers in the context.
4. Be concise but thorough.
5. Maintain the same language as the user's question.
6. If the question is ambiguous, address the most likely interpretation \
   and note the ambiguity.
7. You may receive prior conversation history for context. Use it to \
   understand references and pronouns, but always ground your answers \
   in the provided document context.
"""

RAG_USER_PROMPT = """\
Context (use ONLY this information to answer):
{context}

Question: {query}

Provide a well-structured answer with source citations [1], [2], etc.
"""

# ---------------------------------------------------------------------------
# Query rewriting
# ---------------------------------------------------------------------------

QUERY_REWRITE_PROMPT = """\
You are a search-query optimiser. Given a user question, generate \
{num_queries} alternative search queries that would help retrieve the \
most relevant documents. Each alternative should approach the question \
from a different angle or use different keywords.

Original question: {query}

Return ONLY the alternative queries, one per line, numbered 1-{num_queries}. \
Do not add any other text.
"""

# ---------------------------------------------------------------------------
# CRAG relevance evaluation
# ---------------------------------------------------------------------------

RELEVANCE_CHECK_PROMPT = """\
You are a relevance evaluator. Determine whether the following document \
is relevant to the user's query.

Query: {query}

Document:
{document}

Respond with exactly one word: RELEVANT, IRRELEVANT, or AMBIGUOUS.
"""

# ---------------------------------------------------------------------------
# Self-RAG reflection
# ---------------------------------------------------------------------------

SELF_REFLECT_PROMPT = """\
You are a critical evaluator. Assess whether the generated answer is \
well-supported by the provided context.

Context:
{context}

Generated answer:
{answer}

Evaluate on two criteria:
1. **Grounding**: Is every claim in the answer supported by the context? \
   (YES / PARTIALLY / NO)
2. **Completeness**: Does the answer address the question fully? \
   (YES / PARTIALLY / NO)

Respond in this exact format:
GROUNDING: <YES|PARTIALLY|NO>
COMPLETENESS: <YES|PARTIALLY|NO>
CONFIDENCE: <HIGH|MEDIUM|LOW>
EXPLANATION: <one sentence explanation>
"""

# ---------------------------------------------------------------------------
# Query decomposition
# ---------------------------------------------------------------------------

DECOMPOSE_PROMPT = """\
You are a question analyser. Break down the following complex question \
into simpler, self-contained sub-questions that can each be answered \
independently.

Complex question: {query}

Return ONLY the sub-questions, one per line, numbered. \
Do not add any other text. Generate between 2 and 5 sub-questions.
"""

# ---------------------------------------------------------------------------
# HyDE — Hypothetical Document Embeddings
# ---------------------------------------------------------------------------

HYDE_PROMPT = """\
Write a short, factual passage (3-5 sentences) that would perfectly \
answer the following question. Write as if you are quoting from an \
authoritative reference document. Do not preface or qualify — just \
write the passage itself.

Question: {query}
"""

# ---------------------------------------------------------------------------
# Agentic RAG — tool-use planning
# ---------------------------------------------------------------------------

AGENT_PLAN_PROMPT = """\
You are an intelligent research agent. Given the user's question and \
the tools available, decide which tool to use next.

Available tools:
- vector_search: Semantic similarity search over the document collection.
- bm25_search: Keyword-based search over the document collection.
- query_rewrite: Rewrite the query for better retrieval.
- query_decompose: Break a complex query into sub-questions.

Current question: {query}

Information gathered so far:
{context}

Iteration: {iteration}/{max_iterations}

Respond in this exact format:
TOOL: <tool_name>
INPUT: <input for the tool>
REASONING: <one sentence explaining why>

If you have enough information to answer, respond:
TOOL: done
INPUT: none
REASONING: <one sentence explaining why>
"""

# ---------------------------------------------------------------------------
# Query routing / complexity classification
# ---------------------------------------------------------------------------

QUERY_ROUTER_PROMPT = """\
Classify the following query into one of three complexity levels. \
Respond with exactly one word.

- SIMPLE: Straightforward factual question answerable from a single passage.
- MODERATE: Requires synthesising information from a few sources, or \
  needs some reasoning.
- COMPLEX: Multi-part question, requires deep analysis, comparison, or \
  information from many sources.

Examples:
"What is the capital of France?" → SIMPLE
"Compare the economic policies of Japan and Germany in the 1990s" → COMPLEX
"How does photosynthesis work and why is it important?" → MODERATE

Query: {query}

Classification:
"""
