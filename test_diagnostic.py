"""Quick diagnostic test for the RAG pipeline."""
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from pathlib import Path
from src.ingestion.loader import DocumentLoader
from src.ingestion.chunker import get_chunker
from src.ingestion.preprocessor import TextPreprocessor

# 1. Test PDF loading
loader = DocumentLoader()
pdf_path = list(Path("data/raw").glob("*.pdf"))[0]
print(f"=== Loading PDF: {pdf_path.name} ===")
docs = loader.load_file(pdf_path)
print(f"Documents loaded: {len(docs)}")

for d in docs[:3]:
    page = d.metadata.get("page_num", "?")
    print(f"  Page {page}: {len(d.content)} chars")
    print(f"  Preview: {d.content[:150]}...")

# 2. Test chunking
print(f"\n=== Chunking ===")
chunker = get_chunker("recursive", chunk_size=512, chunk_overlap=50)
all_chunks = []
for d in docs:
    chunks = chunker.chunk(d)
    all_chunks.extend(chunks)
print(f"Total chunks: {len(all_chunks)}")

if all_chunks:
    print(f"First chunk ({len(all_chunks[0].content)} chars):")
    print(f"  {all_chunks[0].content[:200]}...")

# 3. Test embedding
print(f"\n=== Embedding ===")
from src.embedding.sentence_transformer import SentenceTransformerEmbedder
embedder = SentenceTransformerEmbedder()
if all_chunks:
    emb = embedder.embed(all_chunks[0].content)
    print(f"Embedding dim: {len(emb)}")
    print(f"First 5 values: {emb[:5]}")

# 4. Test vector store
print(f"\n=== Vector Store ===")
from src.vectorstore.chroma_store import ChromaVectorStore
store = ChromaVectorStore()
stats = store.get_collection_stats()
print(f"Current chunks in store: {stats}")

print("\n=== ALL TESTS PASSED ===")
