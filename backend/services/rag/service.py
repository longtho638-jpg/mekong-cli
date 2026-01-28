from typing import List, Dict, Any, Optional
from backend.services.rag.embeddings import GeminiEmbeddings, OpenAIEmbeddings, EmbeddingsProvider
from backend.services.rag.vector_store import VectorStore, InMemoryVectorStore
from backend.services.llm.service import LLMService
from backend.services.llm.prompts import PromptTemplates
from backend.api.config.settings import settings

class RAGService:
    """
    Retrieval-Augmented Generation Service.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RAGService, cls).__new__(cls)
            cls._instance._init_components()
        return cls._instance

    def _init_components(self):
        # Initialize Embeddings
        if settings.default_llm_provider == "openai":
            self.embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key or "")
        else:
            self.embeddings = GeminiEmbeddings(api_key=settings.google_api_key or "")

        # Initialize Vector Store (Using In-Memory for now, can swap with Meilisearch/Chroma/Pinecone)
        self.vector_store = InMemoryVectorStore()

        # Initialize LLM
        self.llm_service = LLMService()

    async def ingest_documents(self, documents: List[str], metadatas: Optional[List[Dict[str, Any]]] = None) -> None:
        """
        Ingest documents into the vector store.
        """
        if not documents:
            return

        if metadatas is None:
            metadatas = [{} for _ in documents]

        # Generate embeddings
        embeddings = await self.embeddings.embed_documents(documents)

        # Store
        await self.vector_store.add_documents(documents, metadatas, embeddings)

    async def query(self, question: str, max_results: int = 3) -> str:
        """
        Answer a question using RAG.
        """
        # 1. Embed query
        query_embedding = await self.embeddings.embed_query(question)

        # 2. Retrieve relevant docs
        results = await self.vector_store.search(query_embedding, limit=max_results)

        # 3. Construct context
        context_parts = [r["content"] for r in results]
        context = "\n\n".join(context_parts)

        # 4. Generate answer
        prompt = PromptTemplates.RAG_QA.value.format(context=context, question=question)

        answer = await self.llm_service.generate_text(
            prompt=prompt,
            temperature=0.3 # Low temperature for factual QA
        )

        return answer
