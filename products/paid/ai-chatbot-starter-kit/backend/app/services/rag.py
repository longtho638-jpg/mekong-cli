from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import get_settings
import os

settings = get_settings()

class RAGService:
    def __init__(self):
        # We use OpenAI Embeddings by default for high quality
        if not settings.OPENAI_API_KEY:
             raise ValueError("OPENAI_API_KEY is required for RAG Service")

        self.embeddings = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)

        # Ensure persistence directory exists
        os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)

        self.vectorstore = Chroma(
            persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
            embedding_function=self.embeddings
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )

    async def ingest_text(self, text: str, metadata: dict = None) -> list[str]:
        """Ingest raw text into vector store"""
        if metadata is None:
            metadata = {}

        docs = self.text_splitter.create_documents([text], metadatas=[metadata])
        # Returns list of IDs
        return await self.vectorstore.aadd_documents(docs)

    async def retrieve(self, query: str, k: int = 3) -> list[str]:
        """Retrieve relevant document chunks"""
        docs = await self.vectorstore.asimilarity_search(query, k=k)
        return [doc.page_content for doc in docs]

    async def retrieve_with_metadata(self, query: str, k: int = 3) -> list[dict]:
        """Retrieve relevant documents with metadata"""
        docs = await self.vectorstore.asimilarity_search(query, k=k)
        return [{"content": doc.page_content, "metadata": doc.metadata} for doc in docs]
