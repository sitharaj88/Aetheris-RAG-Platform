"""
Main RAG pipeline orchestrator.

Wires together all components (embedder, vector store, retrievers,
reranker, LLM, strategies) from configuration and provides a single
entry-point for ingestion and querying.
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Callable, Generator, Optional


from src.cache.semantic_cache import SemanticCache
from src.config.settings import Settings, get_settings
from src.embedding.base import BaseEmbedder
from src.observability.tracing import Tracer, get_tracer
from src.security.guard import SecurityGuard
from src.embedding.sentence_transformer import SentenceTransformerEmbedder
from src.generation.base import BaseLLM
from src.generation.ollama_llm import OllamaLLM
from src.generation.response import ResponseFormatter
from src.ingestion.chunker import get_chunker
from src.ingestion.loader import DocumentLoader
from src.ingestion.pipeline import IngestionPipeline
from src.ingestion.preprocessor import TextPreprocessor
from src.models import (
    Chunk,
    IngestionStats,
    QueryResult,
    RAGRequest,
    RAGResponse,
    RAGStrategyType,
    RetrievalResult,
)
from src.query.contextualizer import QueryContextualizer
from src.query.decomposer import QueryDecomposer
from src.query.hyde import HyDEGenerator
from src.query.rewriter import QueryRewriter
from src.query.router import QueryRouter
from src.retrieval.dense_retriever import DenseRetriever
from src.retrieval.hybrid_retriever import HybridRetriever
from src.retrieval.reranker import CrossEncoderReranker, get_reranker
from src.retrieval.sparse_retriever import SparseRetriever
from src.strategies.adaptive_rag import AdaptiveRAGStrategy
from src.strategies.agentic_rag import AgenticRAGStrategy
from src.strategies.base import BaseRAGStrategy
from src.strategies.corrective_rag import CorrectiveRAGStrategy
from src.strategies.hyde_rag import HyDERAGStrategy
from src.strategies.naive_rag import NaiveRAGStrategy
from src.strategies.self_rag import SelfRAGStrategy
from src.utils.logger import get_logger, setup_logging
from src.vectorstore.base import BaseVectorStore
from src.vectorstore.chroma_store import ChromaVectorStore

log = get_logger(__name__)


def _chunk_answer(answer: str, size: int = 24) -> Generator[str, None, None]:
    """Yield a cached answer in small chunks so the UI still 'streams' it."""
    for i in range(0, len(answer), size):
        yield answer[i : i + size]


class RAGPipeline:
    """
    Top-level orchestrator that lazily initialises every component from
    :class:`Settings` and exposes ``ingest`` / ``query`` / ``query_stream``
    entry-points.

    Usage::

        pipeline = RAGPipeline()
        pipeline.ingest(Path("./docs"))
        result = pipeline.query("What is X?")
    """

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()

        # Configure logging
        setup_logging(
            level=self.settings.logging.level,
            log_file=self.settings.logging.file,
            rotation=self.settings.logging.rotation,
            retention=self.settings.logging.retention,
        )

        # Lazy-init slots
        self._embedder: Optional[BaseEmbedder] = None
        self._vector_store: Optional[BaseVectorStore] = None
        self._llm: Optional[BaseLLM] = None
        self._dense_retriever: Optional[DenseRetriever] = None
        self._sparse_retriever: Optional[SparseRetriever] = None
        self._hybrid_retriever: Optional[HybridRetriever] = None
        self._reranker: Optional[CrossEncoderReranker] = None
        self._ingestion_pipeline: Optional[IngestionPipeline] = None
        self._strategies: dict[str, BaseRAGStrategy] = {}
        self._contextualizer: Optional[QueryContextualizer] = None
        self._tracer: Optional[Tracer] = None
        self._semantic_cache: Optional[SemanticCache] = None
        self._security_guard: Optional[SecurityGuard] = None

        # Track the active knowledge collection (for cache scoping).
        self._active_collection: str = self.settings.vectorstore.collection_name

        log.info("RAGPipeline initialised (components will be loaded lazily)")

    # ================================================================== #
    # Component accessors (lazy init)
    # ================================================================== #

    @property
    def embedder(self) -> BaseEmbedder:
        if self._embedder is None:
            cfg = self.settings.embedding
            provider = getattr(cfg, "provider", "sentence_transformers")
            if provider == "qwen3":
                from src.embedding.qwen3_embedder import Qwen3Embedder

                self._embedder = Qwen3Embedder(
                    model_name=cfg.model_name,
                    backend=cfg.backend,
                    batch_size=cfg.batch_size,
                    normalize=cfg.normalize,
                    truncate_dim=cfg.truncate_dim,
                    max_seq_length=cfg.max_seq_length,
                    host=cfg.host,
                )
            else:
                self._embedder = SentenceTransformerEmbedder(
                    model_name=cfg.model_name,
                    batch_size=cfg.batch_size,
                    normalize=cfg.normalize,
                )
        return self._embedder

    @property
    def vector_store(self) -> BaseVectorStore:
        if self._vector_store is None:
            cfg = self.settings.vectorstore
            self._vector_store = ChromaVectorStore(
                persist_dir=cfg.persist_dir,
                collection_name=cfg.collection_name,
            )
        return self._vector_store

    @property
    def llm(self) -> BaseLLM:
        if self._llm is None:
            cfg = self.settings.generation
            provider = getattr(cfg, "provider", "ollama")
            if provider == "litellm":
                from src.generation.litellm_llm import LiteLLMProvider

                self._llm = LiteLLMProvider(
                    model=cfg.litellm_model,
                    temperature=cfg.temperature,
                    max_tokens=cfg.max_tokens,
                    api_key=cfg.api_key,
                    api_base=cfg.api_base,
                )
            else:
                self._llm = OllamaLLM(
                    host=cfg.ollama_host,
                    model=cfg.model,
                    temperature=cfg.temperature,
                    max_tokens=cfg.max_tokens,
                )
        return self._llm

    @property
    def dense_retriever(self) -> DenseRetriever:
        if self._dense_retriever is None:
            cfg = self.settings.retrieval
            self._dense_retriever = DenseRetriever(
                embedder=self.embedder,
                vector_store=self.vector_store,
                top_k=cfg.top_k,
                similarity_threshold=cfg.similarity_threshold,
            )
        return self._dense_retriever

    @property
    def sparse_retriever(self) -> SparseRetriever:
        if self._sparse_retriever is None:
            self._sparse_retriever = SparseRetriever(
                vector_store=self.vector_store,
                index_path=str(
                    Path(self.settings.vectorstore.persist_dir) / "bm25_index.pkl"
                ),
            )
        return self._sparse_retriever

    @property
    def hybrid_retriever(self) -> HybridRetriever:
        if self._hybrid_retriever is None:
            cfg = self.settings.retrieval
            self._hybrid_retriever = HybridRetriever(
                dense_retriever=self.dense_retriever,
                sparse_retriever=self.sparse_retriever,
                dense_weight=cfg.dense_weight,
                sparse_weight=cfg.sparse_weight,
                rrf_k=cfg.rrf_k,
            )
        return self._hybrid_retriever

    @property
    def reranker(self) -> Optional[CrossEncoderReranker]:
        if self._reranker is None and self.settings.reranking.enabled:
            cfg = self.settings.reranking
            self._reranker = get_reranker(
                provider=getattr(cfg, "provider", "cross_encoder"),
                model_name=cfg.model_name,
                top_k=cfg.top_k,
            )
        return self._reranker

    @property
    def ingestion_pipeline(self) -> IngestionPipeline:
        if self._ingestion_pipeline is None:
            cfg = self.settings.chunking
            chunker = get_chunker(
                strategy=cfg.strategy,
                chunk_size=cfg.chunk_size,
                chunk_overlap=cfg.chunk_overlap,
                embedder=self.embedder,
                semantic_threshold=cfg.semantic_threshold,
                llm=self.llm,
            )
            self._ingestion_pipeline = IngestionPipeline(
                loader=DocumentLoader(),
                preprocessor=TextPreprocessor(),
                chunker=chunker,
                embedder=self.embedder,
                vector_store=self.vector_store,
            )
        return self._ingestion_pipeline

    # ================================================================== #
    # Strategy factory
    # ================================================================== #

    @property
    def contextualizer(self) -> QueryContextualizer:
        """Lazy-init the query contextualizer."""
        if self._contextualizer is None:
            self._contextualizer = QueryContextualizer(self.llm)
        return self._contextualizer

    @property
    def tracer(self) -> Tracer:
        """Lazy-init the tracer (no-op unless observability is enabled)."""
        if self._tracer is None:
            self._tracer = get_tracer(self.settings.observability)
        return self._tracer

    @property
    def semantic_cache(self) -> Optional[SemanticCache]:
        """Lazy-init the semantic cache (``None`` unless caching is enabled)."""
        if self._semantic_cache is None and self.settings.cache.enabled:
            cfg = self.settings.cache
            self._semantic_cache = SemanticCache(
                embedder=self.embedder,
                persist_dir=self.settings.vectorstore.persist_dir,
                collection_name=cfg.collection_name,
                similarity_threshold=cfg.similarity_threshold,
                max_entries=cfg.max_entries,
            )
        return self._semantic_cache

    @property
    def security_guard(self) -> Optional[SecurityGuard]:
        """Lazy-init the security guard (``None`` unless security is enabled)."""
        if self._security_guard is None and self.settings.security.enabled:
            cfg = self.settings.security
            self._security_guard = SecurityGuard(
                scan_input=cfg.scan_input,
                scan_output=cfg.scan_output,
            )
        return self._security_guard

    # ------------------------------------------------------------------ #
    # Source (de)serialisation for the semantic cache
    # ------------------------------------------------------------------ #

    @staticmethod
    def _sources_to_cache(sources: list[RetrievalResult]) -> list[dict[str, object]]:
        """Serialise retrieval results to the streaming-sources dict schema."""
        return [
            {
                "document_id": r.chunk.document_id,
                "filename": r.chunk.metadata.get("source", r.source or "unknown"),
                "chunk_text": r.chunk.content[:500],
                "relevance_score": round(r.score, 4),
                "metadata": r.chunk.metadata,
            }
            for r in sources
        ]

    @staticmethod
    def _sources_from_cache(sources: list[dict[str, object]]) -> list[RetrievalResult]:
        """Rebuild retrieval results from cached source dicts."""
        rebuilt: list[RetrievalResult] = []
        for s in sources:
            meta = s.get("metadata") or {}
            rebuilt.append(
                RetrievalResult(
                    chunk=Chunk(
                        content=str(s.get("chunk_text", "")),
                        metadata=meta if isinstance(meta, dict) else {},
                        document_id=str(s.get("document_id", "")),
                    ),
                    score=float(s.get("relevance_score", 0.0) or 0.0),
                    source=str(s.get("filename", "")),
                )
            )
        return rebuilt

    def _get_strategy(self, name: str) -> BaseRAGStrategy:
        """Lazily build and cache strategy instances."""
        if name in self._strategies:
            return self._strategies[name]

        reranker = self.reranker
        retriever = self.hybrid_retriever
        llm = self.llm
        ctx = self.contextualizer

        if name == "naive":
            strategy: BaseRAGStrategy = NaiveRAGStrategy(
                retriever=retriever,
                reranker=reranker,
                llm=llm,
                top_k=self.settings.reranking.top_k,
                contextualizer=ctx,
            )

        elif name == "hyde":
            strategy = HyDERAGStrategy(
                retriever=retriever,
                reranker=reranker,
                llm=llm,
                hyde_generator=HyDEGenerator(llm, self.embedder),
                top_k=self.settings.reranking.top_k,
                contextualizer=ctx,
            )

        elif name == "corrective":
            strategy = CorrectiveRAGStrategy(
                retriever=retriever,
                reranker=reranker,
                llm=llm,
                query_rewriter=QueryRewriter(llm),
                top_k=self.settings.reranking.top_k,
                contextualizer=ctx,
            )

        elif name == "self_rag":
            strategy = SelfRAGStrategy(
                retriever=retriever,
                reranker=reranker,
                llm=llm,
                top_k=self.settings.reranking.top_k,
                contextualizer=ctx,
            )

        elif name == "agentic":
            strategy = AgenticRAGStrategy(
                retriever=retriever,
                dense_retriever=self.dense_retriever,
                sparse_retriever=self.sparse_retriever,
                reranker=reranker,
                llm=llm,
                query_rewriter=QueryRewriter(llm),
                query_decomposer=QueryDecomposer(llm),
                top_k=self.settings.reranking.top_k,
                contextualizer=ctx,
            )

        elif name == "adaptive":
            strategy = AdaptiveRAGStrategy(
                router=QueryRouter(llm),
                naive=self._get_strategy("naive"),  # type: ignore[arg-type]
                corrective=self._get_strategy("corrective"),  # type: ignore[arg-type]
                agentic=self._get_strategy("agentic"),  # type: ignore[arg-type]
            )

        else:
            log.warning(f"Unknown strategy '{name}'; falling back to naive")
            return self._get_strategy("naive")

        self._strategies[name] = strategy
        return strategy

    # ================================================================== #
    # Public API
    # ================================================================== #

    def ingest(
        self,
        path: Path | str,
        extensions: Optional[list[str]] = None,
        progress_callback: Optional[Callable[[str, float, dict], None]] = None,
    ) -> IngestionStats:
        """
        Ingest documents from a file or directory.

        After ingestion the BM25 sparse index is rebuilt and saved.
        """
        path = Path(path)
        if path.is_dir():
            # For directories we could also add callbacks if supported,
            # but currently we support it on single files
            stats = self.ingestion_pipeline.ingest_directory(
                path, extensions=extensions
            )
        else:
            stats = self.ingestion_pipeline.ingest_file(
                path, progress_callback=progress_callback
            )

        # Rebuild BM25 index
        if progress_callback:
            progress_callback("indexing", 0.9, {"message": "Rebuilding sparse keyword index..."})
        self.sparse_retriever.build_index()
        self.sparse_retriever.save_index()

        # Invalidate any cached answers for the active collection — they may now
        # be stale given the new documents.
        if self.semantic_cache:
            self.semantic_cache.invalidate(self._active_collection)

        if progress_callback:
            progress_callback("completed", 1.0, {"message": "Ingestion completed successfully", "chunks_created": stats.total_chunks})

        return stats


    def query(
        self,
        question: str,
        strategy: str | RAGStrategyType = RAGStrategyType.ADAPTIVE,
        top_k: Optional[int] = None,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> QueryResult:
        """Run a query through the selected strategy."""
        strategy_name = strategy.value if isinstance(strategy, RAGStrategyType) else strategy

        # 1. Input guard
        guard = self.security_guard
        if guard:
            gin = guard.scan_input(question)
            if gin.flagged and self.settings.security.block_on_detection:
                log.warning(f"Query blocked by security policy: {gin.reasons}")
                return QueryResult(
                    answer="Your request was blocked by the security policy.",
                    sources=[],
                    strategy_used="blocked",
                    metadata={"blocked": True, "security_flags": gin.reasons},
                )

        # 2. Semantic cache lookup (skip for contextual follow-ups)
        cache = self.semantic_cache
        if cache and not chat_history:
            hit = cache.get(question, self._active_collection)
            if hit:
                return QueryResult(
                    answer=hit["answer"],
                    sources=self._sources_from_cache(hit.get("sources", [])),
                    strategy_used="cache",
                    metadata={**hit.get("metadata", {}), "cache_hit": True,
                              "cache_similarity": hit.get("similarity")},
                )

        strat = self._get_strategy(strategy_name)
        log.info(f"Query (strategy={strategy_name}): {question!r}")
        start = time.perf_counter()
        with self.tracer.trace(
            "rag_query", input=question, metadata={"strategy": strategy_name}
        ) as span:
            result = strat.query(question, chat_history=chat_history)
            span.update(output=result.answer,
                        metadata={"strategy_used": result.strategy_used})
        elapsed = time.perf_counter() - start

        result.metadata["elapsed_seconds"] = round(elapsed, 3)
        log.info(f"Query completed in {elapsed:.2f}s")

        # 3. Output guard
        if guard:
            gout = guard.scan_output(result.answer)
            if gout.flagged:
                result.metadata["security_flags"] = gout.reasons

        # 4. Cache store
        if cache and not chat_history and result.answer:
            cache.put(
                question,
                self._active_collection,
                result.answer,
                self._sources_to_cache(result.sources),
                {"strategy_used": result.strategy_used},
            )
        return result

    def query_stream(
        self,
        question: str,
        strategy: str | RAGStrategyType = RAGStrategyType.ADAPTIVE,
        chat_history: Optional[list[dict[str, str]]] = None,
    ) -> Generator[str, None, None]:
        """Stream a query response."""
        strategy_name = strategy.value if isinstance(strategy, RAGStrategyType) else strategy

        # 1. Input guard
        guard = self.security_guard
        if guard:
            gin = guard.scan_input(question)
            if gin.flagged and self.settings.security.block_on_detection:
                log.warning(f"Stream query blocked by security policy: {gin.reasons}")
                yield {"type": "trace", "step": "security",
                       "message": "Query blocked by security policy"}
                yield {"type": "token",
                       "token": "Your request was blocked by the security policy."}
                return

        # 2. Semantic cache lookup (skip for contextual follow-ups)
        cache = self.semantic_cache
        if cache and not chat_history:
            hit = cache.get(question, self._active_collection)
            if hit:
                yield {"type": "trace", "step": "cache",
                       "message": f"Semantic cache hit (sim={hit.get('similarity', 0):.3f})"}
                if hit.get("sources"):
                    yield {"type": "sources", "sources": hit["sources"]}
                for piece in _chunk_answer(hit["answer"]):
                    yield {"type": "token", "token": piece}
                return

        strat = self._get_strategy(strategy_name)
        captured_sources: list[dict] = []
        answer_parts: list[str] = []
        with self.tracer.trace(
            "rag_query_stream", input=question, metadata={"strategy": strategy_name}
        ) as span:
            for event in strat.query_stream(question, chat_history=chat_history):
                etype = event.get("type")
                if etype == "sources":
                    captured_sources = event.get("sources", [])
                elif etype == "token":
                    answer_parts.append(event.get("token", ""))
                yield event
            answer = "".join(answer_parts)
            span.update(output=answer, metadata={"strategy": strategy_name})

        # 3. Output guard
        if guard:
            gout = guard.scan_output(answer)
            if gout.flagged:
                yield {"type": "trace", "step": "security",
                       "message": f"Output flagged: {', '.join(gout.reasons)}"}

        # 4. Cache store
        if cache and not chat_history and answer:
            cache.put(question, self._active_collection, answer, captured_sources,
                      {"strategy_used": strategy_name})

    def query_api(self, request: RAGRequest) -> RAGResponse:
        """
        Handle an API-level :class:`RAGRequest` and return a
        :class:`RAGResponse`.
        """
        start = time.perf_counter()
        result = self.query(
            question=request.query,
            strategy=request.strategy,
            top_k=request.top_k,
        )
        elapsed = time.perf_counter() - start

        return ResponseFormatter.build_response(
            answer=result.answer,
            results=result.sources,
            strategy_used=result.strategy_used,
            timing={"total_seconds": round(elapsed, 3)},
            metadata=result.metadata,
        )

    def switch_collection(self, collection_name: str) -> None:
        """Switch to a different collection and update the sparse retriever."""
        if not collection_name:
            collection_name = "default"

        log.info(f"Switching RAGPipeline to collection: {collection_name}")
        self.vector_store.switch_collection(collection_name)
        self._active_collection = collection_name

        # Update the sparse retriever's index path and invalidate its loaded index
        sr = self.sparse_retriever

        # Build path based on collection name
        filename = f"bm25_index_{collection_name}.pkl" if collection_name != "default" else "bm25_index.pkl"
        sr.index_path = Path(self.settings.vectorstore.persist_dir) / filename

        # Reset the cached index and corpus to force a reload / rebuild on next query
        sr._bm25 = None
        sr._chunks = []
        sr._corpus_tokens = []

    def health_check(self) -> dict[str, object]:
        """Return component health status."""
        ollama_ok = False
        check = getattr(self.llm, "is_available", None)
        if callable(check):
            ollama_ok = bool(check())

        store_stats = self.vector_store.get_collection_stats()

        return {
            "status": "healthy" if ollama_ok else "degraded",
            "ollama_available": ollama_ok,
            "vector_store": store_stats,
            "embedding_model": self.settings.embedding.model_name,
            "llm_model": self.settings.generation.model,
        }
