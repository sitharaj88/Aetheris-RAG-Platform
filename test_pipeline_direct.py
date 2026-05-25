import sys
import time
from pathlib import Path

# Configure stdout for utf-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("Loading RAGPipeline...")
from src.pipeline import RAGPipeline

pipeline = RAGPipeline()

print("Checking documents in ChromaDB...")
stats = pipeline.vector_store.get_collection_stats()
print("Collection Stats:", stats)

print("\nRunning direct pipeline query...")
start = time.perf_counter()
try:
    result = pipeline.query(
        "What is Sitharaj Seenivasan's experience and what technologies does he use?",
        strategy="naive"
    )
    elapsed = time.perf_counter() - start
    print(f"\nQuery completed in {elapsed:.2f} seconds!")
    print("Answer:")
    print(result.answer)
    print("\nSources:")
    for idx, src in enumerate(result.sources):
        print(f"[{idx+1}] {src.chunk.metadata.get('source')} (score: {src.score:.4f})")
except Exception as e:
    import traceback
    print("Query failed:")
    traceback.print_exc()
