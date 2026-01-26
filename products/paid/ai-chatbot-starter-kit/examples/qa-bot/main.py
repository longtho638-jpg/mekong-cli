import requests
import json
import sys

API_URL = "http://localhost:8000/api/v1"

def ask_question(question: str):
    print(f"User: {question}")
    print("AI: ", end="", flush=True)

    payload = {
        "messages": [{"role": "user", "content": question}],
        "stream": True,
        "model": "gpt-3.5-turbo" # Or claude-3-opus, etc.
    }

    try:
        response = requests.post(
            f"{API_URL}/chat/stream",
            json=payload,
            stream=True
        )
        response.raise_for_status()

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
        print(f"\nError: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])
    else:
        question = "What is the capital of France?"

    ask_question(question)
