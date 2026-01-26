import requests
import json
import uuid

API_URL = "http://localhost:8000/api/v1"

def chat_loop():
    conversation_id = str(uuid.uuid4())
    print(f"--- Starting New Conversation (ID: {conversation_id}) ---")
    print("Type 'quit' to exit.\n")

    while True:
        user_input = input("You: ")
        if user_input.lower() in ['quit', 'exit']:
            break

        print("Bot: ", end="", flush=True)

        payload = {
            "messages": [{"role": "user", "content": user_input}],
            "conversation_id": conversation_id,
            "stream": True
        }

        try:
            response = requests.post(
                f"{API_URL}/chat/stream",
                json=payload,
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
            print(f"[Error: {e}]\n")

if __name__ == "__main__":
    chat_loop()
