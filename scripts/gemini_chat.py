import sys
import os

# Ensure src is in path
sys.path.append(os.path.join(os.getcwd(), "src"))

from core.llm_client import LLMClient


def main():
    print("🦞 TÔM HÙM AGI - Gemini 2.5 Pro Chat Demo")
    print("-----------------------------------------")
    print("Loading Brain... (Connecting to Google Vertex AI)")

    # Use the key injected in autonomous.py
    key = "AIzaSyBeFTNIvKtav1DoZKFACQVyrgNusRODfcg"
    client = LLMClient(gemini_key=key)

    if client.mode != "vertex":
        print("❌ FAILED: Not in Vertex mode.")
        return

    print(f"✅ CONNECTED: Model [{client.model}] ready via Vertex AI.")
    print("Type 'exit' or 'quit' to stop.\n")

    history = []

    while True:
        try:
            user_input = input("YOU > ")
            if user_input.lower() in ["exit", "quit"]:
                break

            history.append({"role": "user", "content": user_input})

            print("GEMINI > ", end="", flush=True)

            # Simple chat loop
            response = client.chat(history)
            print(response.content)
            print()

            # Append AI response for context (basic history)
            history.append({"role": "assistant", "content": response.content})

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
