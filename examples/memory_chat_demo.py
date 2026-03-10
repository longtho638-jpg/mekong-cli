#!/usr/bin/env python3
"""
Simple chat feature using the memory system
"""

from packages.memory.memory_facade import get_memory_facade
from datetime import datetime
import json

class MemoryChat:
    """
    A simple chat interface that uses the memory system to remember conversation context
    """

    def __init__(self, user_id="default:user"):
        self.user_id = user_id
        self.memory_facade = get_memory_facade()
        self.session_start = datetime.now()

        # Connect to memory system
        self.memory_facade.connect()
        print(f"Chat started for user: {user_id}")
        print(f"Memory provider: {self.memory_facade.get_provider_status()['active_provider']}")
        print("-" * 50)

    def remember_interaction(self, user_input, bot_response):
        """Remember the interaction in memory"""
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "user_input": user_input,
            "bot_response": bot_response,
            "type": "chat_interaction"
        }

        memory_entry = json.dumps(interaction)
        success = self.memory_facade.add(
            content=memory_entry,
            user_id=self.user_id,
            metadata={
                "interaction_type": "chat",
                "timestamp": interaction["timestamp"]
            }
        )

        if success:
            print("[Memory] Interaction saved to vector store")
        else:
            print("[Memory] Interaction saved to YAML fallback")

    def recall_context(self, query=None):
        """Recall relevant context from memory"""
        if query is None:
            # Get all memories for this user
            memories = self.memory_facade.get_all(user_id=self.user_id)
        else:
            # Search for specific memories
            memories = self.memory_facade.search(query, user_id=self.user_id, limit=5)

        return memories

    def chat(self, user_input):
        """Process a chat message and return a response"""
        print(f"You: {user_input}")

        # Recall relevant context
        relevant_memories = self.recall_context(user_input)

        # Simple response logic (could be enhanced with LLM later)
        if relevant_memories:
            print(f"[Memory] Found {len(relevant_memories)} relevant memories")

            # Extract and summarize past interactions
            past_topics = []
            for memory in relevant_memories[:3]:  # Limit to recent memories
                try:
                    content = memory.get('memory', str(memory))
                    parsed = json.loads(content) if content.startswith('{') else {}
                    if parsed.get('type') == 'chat_interaction':
                        past_topics.append(parsed.get('user_input', ''))
                except Exception:
                    continue

            if past_topics:
                print(f"[Context] Previous topics: {', '.join(past_topics[-2:])}")

        # Generate response (simple for now)
        response = self.generate_response(user_input, relevant_memories)

        # Remember this interaction
        self.remember_interaction(user_input, response)

        print(f"Bot: {response}")
        print()
        return response

    def generate_response(self, user_input, relevant_memories):
        """Generate a response based on input and context"""
        user_input_lower = user_input.lower()

        # Simple rule-based responses
        if any(word in user_input_lower for word in ["hello", "hi", "hey"]):
            return "Hello! I'm your memory-enabled chat assistant. How can I help you today?"
        elif any(word in user_input_lower for word in ["memory", "remember", "recall"]):
            count = len(relevant_memories) if relevant_memories else 0
            return f"I can remember our conversations using the memory system. Currently, I have {count} relevant memories."
        elif any(word in user_input_lower for word in ["name", "who are you"]):
            return "I'm a chatbot with memory capabilities powered by the Mekong CLI memory system."
        elif any(word in user_input_lower for word in ["bye", "goodbye", "exit"]):
            return "Goodbye! Thanks for chatting. Your conversation is remembered for context."
        else:
            return f"I received: '{user_input}'. I'm using the memory system to remember our conversation context."

    def show_memory_status(self):
        """Show current memory status"""
        status = self.memory_facade.get_provider_status()
        print(f"Memory Status: {status}")

        # Show all memories for this user
        all_memories = self.memory_facade.get_all(user_id=self.user_id)
        print(f"Total memories stored: {len(all_memories)}")


def main():
    print("Mekong CLI Memory Chat Demo")
    print("=" * 50)

    # Create a chat instance
    chat = MemoryChat(user_id="demo:chat_session")

    print("\nCommands: Type 'quit' to exit, 'status' to see memory info, 'history' to see all memories")
    print("Try mentioning topics like 'memory', 'hello', 'name' to see contextual responses\n")

    while True:
        try:
            user_input = input("Your message: ").strip()

            if user_input.lower() in ['quit', 'exit', 'bye']:
                print("Bot: Goodbye! Thanks for chatting.")
                break
            elif user_input.lower() == 'status':
                chat.show_memory_status()
                continue
            elif user_input.lower() == 'history':
                memories = chat.recall_context()
                print(f"Found {len(memories)} memories:")
                for i, memory in enumerate(memories):
                    print(f"  {i+1}. {memory}")
                continue

            if user_input:
                chat.chat(user_input)
            else:
                print("Please enter a message.")

        except KeyboardInterrupt:
            print("\nBot: Goodbye! Thanks for chatting.")
            break
        except Exception as e:
            print(f"An error occurred: {e}")
            break


if __name__ == "__main__":
    main()