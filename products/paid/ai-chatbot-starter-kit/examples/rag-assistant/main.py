import requests
import json
import time

API_URL = "http://localhost:8000/api/v1"

def run_rag_demo():
    # 1. Upload a Document
    print("--- 1. Uploading Document ---")
    doc_text = """
    Antigravity is a concept often found in science fiction, referring to the creation of a place or object that is free from the force of gravity.
    In the real world, the Antigravity AI Starter Kit helps developers build chatbots quickly.
    It costs $77 and includes RAG pipelines, streaming, and multi-LLM support.
    """

    upload_payload = {
        "content": doc_text,
        "metadata": {"source": "manual_entry", "author": "admin"}
    }

    try:
        upload_resp = requests.post(f"{API_URL}/documents/upload/text", json=upload_payload)
        upload_resp.raise_for_status()
        print("Upload Success:", upload_resp.json())
    except Exception as e:
        print(f"Upload Failed: {e}")
        return

    time.sleep(1) # Wait for indexing (usually instant but good for demo flow)

    # 2. Ask a Question using RAG
    print("\n--- 2. Asking Question about the Document ---")
    question = "How much does the Antigravity Starter Kit cost?"
    print(f"User: {question}")
    print("AI: ", end="", flush=True)

    chat_payload = {
        "messages": [{"role": "user", "content": question}],
        "stream": True
        # Backend automatically injects context if relevant
    }

    try:
        response = requests.post(
            f"{API_URL}/chat/stream",
            json=chat_payload,
            stream=True
        )

        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data: "):
                    token = decoded_line[6:]
                    if token == "[DONE]":
                        break
                    print(token, end="", flush=True)
        print("\n")

    except Exception as e:
        print(f"Chat Error: {e}")

if __name__ == "__main__":
    run_rag_demo()
