"""
Self-RAG strategy with reflection.

After generating an answer, the LLM evaluates whether the response
is well-grounded in the retrieved context. If not, it re-retrieves
or flags low confidence.
"""

from __future__ import annotations

import re
from typing import Generator, Optional

from src.generation.base import BaseLLM
from src.generation.prompts import RAG_SYSTEM_PROMPT, RAG_USER_PROMPT, SELF_REFLECT_PROMPT
from src.generation.response import ResponseFormatter
from src.models import QueryResult, RetrievalResult
from src.query.contextualizer import QueryContextualizer
from src.retrieval.hybrid_retriever import HybridRetriever
from src.retrieval.reranker import CrossEncoderReranker
from src.strategies.base import BaseRAGStrategy
from src.utils.logger import get_logger

log = get_logger(__name__)


class SelfRAGStrategy(BaseRAGStrategy):
    """
    Self-RAG with self-reflection loop.

    Pipeline:
        1. Decide if retrieval is needed.
        2. Retrieve and re-rank.
        3. Generate an answer.
        4. Reflect: is the answer grounded in context?
        5. If poorly grounded → re-retrieve with broader query.
        6. Return answer with confidence + grounding assessment.

    Args:
        retriever: Hybrid retriever.
        reranker: Optional cross-encoder reranker.
        llm: Language model.
        top_k: Context window size.
        max_retries: Max reflection→re-retrieval cycles.
    """

    def __init__(
        self,
        retriever: HybridRetriever,
        reranker: Optional[CrossEncoderReranker],
        llm: BaseLLM,
        top_k: int = 5,
        max_retries: int = 1,
        contextualizer: Optional[QueryContextualizer] = None,
    ) -> None:
        self.retriever = retriever
        self.reranker = reranker
        self.llm = llm
        self.top_k = top_k
        self.max_retries = max_retries
        self.contextualizer = contextualizer

    def query(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> QueryResult:
        log.info(f"SelfRAG: {question!r}")

        # 1. Check if retrieval is needed
        needs_retrieval = self._needs_retrieval(question)
        if not needs_retrieval:
            log.info("SelfRAG: No retrieval needed — answering directly")
            answer = self.llm.generate(
                f"Answer the following question concisely:\n\n{question}",
                chat_history=chat_history,
            )
            return QueryResult(
                answer=answer,
                sources=[],
                strategy_used="self_rag",
                metadata={"retrieval_used": False, "confidence": "HIGH"},
            )

        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)

        # 2. Retrieve
        results = self.retriever.retrieve(search_query, top_k=self.top_k * 2)
        if self.reranker and results:
            results = self.reranker.rerank(search_query, results, top_k=self.top_k)
        else:
            results = results[: self.top_k]

        # 3. Generate + reflect loop
        answer = ""
        reflection: dict[str, str] = {}
        for attempt in range(1 + self.max_retries):
            context = ResponseFormatter.format_context(results)
            prompt = RAG_USER_PROMPT.format(context=context, query=question)
            answer = self.llm.generate(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history)

            # 4. Reflect
            reflection = self._reflect(context, answer)
            log.info(f"SelfRAG reflection (attempt {attempt + 1}): {reflection}")

            if reflection.get("grounding") == "YES":
                break

            if attempt < self.max_retries:
                log.info("SelfRAG: Poor grounding — broadening retrieval")
                broader_query = f"{question} context background information"
                extra = self.retriever.retrieve(broader_query, top_k=self.top_k)
                # Merge and deduplicate
                seen_ids = {r.chunk.id for r in results}
                for r in extra:
                    if r.chunk.id not in seen_ids:
                        results.append(r)
                        seen_ids.add(r.chunk.id)
                results = results[: self.top_k + 3]  # Allow a few extra

        return QueryResult(
            answer=answer,
            sources=results,
            strategy_used="self_rag",
            metadata={
                "retrieval_used": True,
                "grounding": reflection.get("grounding", "UNKNOWN"),
                "completeness": reflection.get("completeness", "UNKNOWN"),
                "confidence": reflection.get("confidence", "MEDIUM"),
                "explanation": reflection.get("explanation", ""),
            },
        )

    def query_stream(self, question: str, chat_history: Optional[list[dict[str, str]]] = None, **kwargs: object) -> Generator[dict[str, Any], None, None]:
        yield {"type": "trace", "step": "reflection", "message": "Evaluating if retrieval is needed"}
        needs_retrieval = self._needs_retrieval(question)
        if not needs_retrieval:
            yield {"type": "trace", "step": "reflection", "message": "No retrieval needed — answering directly"}
            yield {"type": "sources", "sources": []}
            yield {"type": "trace", "step": "generation", "message": f"Generating answer using {getattr(self.llm, 'model', 'local LLM')}"}
            for t in self.llm.generate_stream(f"Answer the following question concisely:\n\n{question}", chat_history=chat_history):
                yield {"type": "token", "token": t}
            return

        # Determine the search query (contextualize if history present)
        search_query = question
        if chat_history and self.contextualizer:
            search_query = self.contextualizer.contextualize(question, chat_history)
            yield {"type": "trace", "step": "contextualize", "message": f"Contextualized query: '{search_query}'"}

        yield {"type": "trace", "step": "retrieval", "message": "Initiating hybrid search (dense + sparse)"}
        results = self.retriever.retrieve(search_query, top_k=self.top_k * 2)
        yield {"type": "trace", "step": "retrieval", "message": f"Retrieved {len(results)} candidates"}

        if self.reranker and results:
            yield {"type": "trace", "step": "rerank", "message": "Re-ranking candidates with cross-encoder"}
            results = self.reranker.rerank(search_query, results, top_k=self.top_k)
            yield {"type": "trace", "step": "rerank", "message": f"Kept top {len(results)} reranked candidates"}
        else:
            results = results[: self.top_k]

        yield {"type": "trace", "step": "generation", "message": "Generating answer and self-reflecting"}
        
        # Self-reflection loop
        answer = ""
        reflection: dict[str, str] = {}
        for attempt in range(1 + self.max_retries):
            context = ResponseFormatter.format_context(results)
            prompt = RAG_USER_PROMPT.format(context=context, query=question)
            
            if attempt == self.max_retries:
                # Last attempt: stream it!
                yield {"type": "sources", "sources": [
                    {
                        "document_id": r.chunk.document_id,
                        "filename": r.chunk.metadata.get("source", r.source or "unknown"),
                        "chunk_text": r.chunk.content[:500],
                        "relevance_score": round(r.score, 4),
                        "metadata": r.chunk.metadata,
                    } for r in results
                ]}
                yield {"type": "trace", "step": "generation", "message": "Streaming final grounded generation"}
                for token in self.llm.generate_stream(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history):
                    yield {"type": "token", "token": token}
                return
            
            answer = self.llm.generate(prompt, system_prompt=RAG_SYSTEM_PROMPT, chat_history=chat_history)
            reflection = self._reflect(context, answer)
            yield {"type": "trace", "step": "reflection", "message": f"Reflection (attempt {attempt + 1}): grounding={reflection.get('grounding')}, completeness={reflection.get('completeness')}"}
            
            if reflection.get("grounding") == "YES":
                yield {"type": "sources", "sources": [
                    {
                        "document_id": r.chunk.document_id,
                        "filename": r.chunk.metadata.get("source", r.source or "unknown"),
                        "chunk_text": r.chunk.content[:500],
                        "relevance_score": round(r.score, 4),
                        "metadata": r.chunk.metadata,
                    } for r in results
                ]}
                yield {"type": "trace", "step": "generation", "message": "Answer verified! Streaming response"}
                for i in range(0, len(answer), 4):
                    yield {"type": "token", "token": answer[i:i+4]}
                return
            
            yield {"type": "trace", "step": "reflection", "message": "Grounding check failed — broadening context search"}
            broader_query = f"{question} context background information"
            extra = self.retriever.retrieve(broader_query, top_k=self.top_k)
            seen_ids = {r.chunk.id for r in results}
            for r in extra:
                if r.chunk.id not in seen_ids:
                    results.append(r)
                    seen_ids.add(r.chunk.id)
            results = results[: self.top_k + 2]

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    def _needs_retrieval(self, question: str) -> bool:
        """
        Ask the LLM whether retrieval is needed for *question*.

        Returns ``True`` when the question likely needs external context.
        """
        prompt = (
            "Determine if the following question requires searching a knowledge base "
            "to answer accurately, or if it can be answered from general knowledge.\n\n"
            f"Question: {question}\n\n"
            "Respond with exactly one word: YES or NO."
        )
        response = self.llm.generate(prompt).strip().upper()
        return "NO" not in response  # Default to needing retrieval

    def _reflect(self, context: str, answer: str) -> dict[str, str]:
        """
        Use the LLM to evaluate grounding and completeness of *answer*
        against *context*.
        """
        prompt = SELF_REFLECT_PROMPT.format(context=context, answer=answer)
        response = self.llm.generate(prompt)

        # Parse structured output
        result: dict[str, str] = {}
        for line in response.strip().split("\n"):
            line = line.strip()
            for key in ("GROUNDING", "COMPLETENESS", "CONFIDENCE", "EXPLANATION"):
                if line.upper().startswith(key + ":"):
                    value = line.split(":", 1)[1].strip()
                    result[key.lower()] = value
                    break

        return result
