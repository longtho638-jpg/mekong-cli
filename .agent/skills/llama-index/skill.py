import os
import sys
from typing import List, Optional
from llama_index.core import VectorStoreIndex, Document, Settings
from llama_index.llms.gemini import Gemini
from llama_index.embeddings.gemini import GeminiEmbedding

def setup_llama_index():
    """
    Configures LlamaIndex with Gemini models.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not found. Please set it.")
        return False

    # Configure Gemini LLM
    # Using gemini-1.5-flash for speed/cost effectiveness as per Antigravity rules
    Settings.llm = Gemini(model_name="models/gemini-1.5-flash", api_key=api_key)

    # Configure Gemini Embeddings
    Settings.embed_model = GeminiEmbedding(model_name="models/text-embedding-004", api_key=api_key)

    return True

def run_rag_task(query: str, texts: Optional[List[str]] = None) -> str:
    """
    Runs a simple RAG task using LlamaIndex.
    If no texts are provided, it uses a default set of documents about Antigravity.
    """
    if not setup_llama_index():
        return "Error: specific provider configuration failed (missing API keys)."

    if not texts:
        # Default knowledge base for testing
        texts = [
            "Antigravity is an advanced Agency Operating System designed for high-efficiency AI coding.",
            "The system uses a WIN-WIN-WIN philosophy: Owner wins, Agency wins, Client wins.",
            "Antigravity integrates multiple AI models including Claude, Gemini, and OpenAI.",
            "The core architecture is based on the Binh Phap 13 Chapters strategy."
        ]

    try:
        documents = [Document(text=t) for t in texts]
        index = VectorStoreIndex.from_documents(documents)
        query_engine = index.as_query_engine()
        response = query_engine.query(query)
        return str(response)

    except Exception as e:
        return f"Error running LlamaIndex task: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query_input = sys.argv[1]
    else:
        query_input = "What is the philosophy of Antigravity?"

    print(f"Running LlamaIndex RAG task: {query_input}")
    result = run_rag_task(query_input)
    print(f"Answer: {result}")
