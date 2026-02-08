import sys
import os

# Ensure src is in path
sys.path.append(os.path.join(os.getcwd(), "src"))

from core.llm_client import LLMClient


def test_vertex_client():
    print("--- Testing LLMClient with Vertex/Gemini ---")

    # Initialize client (should pick up key from env or hardcoded fallback)
    # Since I hardcoded it in autonomous.py but not llm_client.py default,
    # I should pass it here to verify the class capability.
    # Actually, llm_client.py reads GEMINI_API_KEY from env.
    # I'll pass the key explicitly to be sure.

    key = "AIzaSyBeFTNIvKtav1DoZKFACQVyrgNusRODfcg"
    client = LLMClient(gemini_key=key)

    if client.mode != "vertex":
        print(f"FAILED: Mode is {client.mode}, expected 'vertex'")
        sys.exit(1)

    print(f"Client mode: {client.mode}")
    print(f"Model: {client.model}")

    print("Sending request...")
    try:
        response = client.chat(
            [
                {
                    "role": "user",
                    "content": "Reply with 'VERTEX_INTEGRATION_SUCCESS' if you read this.",
                }
            ]
        )
        print(f"Response: {response.content}")
        print(f"Usage: {response.usage}")

        if "VERTEX_INTEGRATION_SUCCESS" in response.content:
            print("✅ VERIFIED: Vertex Integration Works!")
        else:
            print("⚠️ WARNING: Unexpected response content.")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    test_vertex_client()
