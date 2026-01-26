# RAG (Retrieval-Augmented Generation) Setup

This starter kit comes with a built-in RAG pipeline powered by **ChromaDB** and **LangChain**.

## How It Works

1.  **Ingestion**: You upload text or files. The system splits them into chunks and creates vector embeddings.
2.  **Storage**: Embeddings are stored in ChromaDB (locally persisted in `backend/chroma_db`).
3.  **Retrieval**: When a user asks a question, the system searches for relevant chunks.
4.  **Generation**: The relevant chunks are injected into the System Prompt for the LLM.

## Setup Steps

### 1. Configure Embeddings
By default, the system uses `OpenAIEmbeddings`. Ensure your `OPENAI_API_KEY` is set.

If you want to use local embeddings (free) like HuggingFace:
1.  Open `backend/app/services/rag.py`.
2.  Change `OpenAIEmbeddings()` to `HuggingFaceEmbeddings()`.
3.  Install `sentence-transformers`: `pip install sentence-transformers`.

### 2. Ingesting Documents

You can ingest documents via the API.

**Upload Raw Text:**
```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload/text" \
     -H "Content-Type: application/json" \
     -d '{
           "content": "Your long text content here...",
           "metadata": {"source": "manual", "topic": "intro"}
         }'
```

**Upload File (TXT/MD):**
```bash
curl -X POST "http://localhost:8000/api/v1/documents/upload/file" \
     -F "file=@/path/to/your/document.txt"
```

### 3. Testing Retrieval

You can verify what the AI "knows" by searching the vector DB directly:

```bash
curl -X POST "http://localhost:8000/api/v1/documents/search" \
     -H "Content-Type: application/json" \
     -d '{"query": "search term", "k": 3}'
```

## Best Practices

- **Chunk Size**: Adjusted in `backend/app/services/rag.py` (`chunk_size=1000`). Smaller chunks are better for precise fact retrieval; larger chunks preserve context.
- **Metadata**: Always add metadata (source, author, date) to help with filtering later (not implemented in v1 but ready for v2).
