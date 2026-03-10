"""Context Manager for Mekong CLI - Handles conversation context using the memory system."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from packages.memory.memory_facade import get_memory_facade

logger = logging.getLogger(__name__)


class ContextManager:
    """Manages conversation context using the memory system.
    Stores, retrieves, and summarizes conversation history for context-aware interactions.
    """

    def __init__(self, user_id: str) -> None:
        """Initialize context manager for a specific user/session.

        Args:
            user_id: Identifier for the user/conversation (format: agent:session)

        """
        self.user_id = user_id
        self.memory = get_memory_facade()
        self.memory.connect()

        # Ensure consistent format for user ID
        if ":" not in user_id:
            self.user_id = f"default:{user_id}"

        logger.debug("ContextManager initialized for %s, using %s storage",
                     self.user_id, self.memory.get_provider_status()["active_provider"])

        # Initialize local storage as backup for YAML fallback
        self.local_storage_path = Path.home() / ".mekong" / "contexts"
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        self.local_context_file = self.local_storage_path / f"{self.user_id.replace(':', '_').replace('/', '_')}.json"

    def _save_to_local_storage(self, data: dict) -> None:
        """Save data to local file storage as backup."""
        try:
            all_data = []
            if self.local_context_file.exists():
                with open(self.local_context_file, encoding="utf-8") as f:
                    all_data = json.load(f)

            all_data.append(data)

            # Keep only the most recent 100 interactions to avoid growing too large
            if len(all_data) > 100:
                all_data = all_data[-100:]

            with open(self.local_context_file, "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning("Could not save to local storage: %s", e)

    def _load_from_local_storage(self) -> list[dict]:
        """Load data from local file storage."""
        try:
            if self.local_context_file.exists():
                with open(self.local_context_file, encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning("Could not load from local storage: %s", e)
        return []

    def store_interaction(self, user_message: str, agent_response: str, metadata: dict | None = None) -> bool:
        """Store a conversation interaction in memory.

        Args:
            user_message: The message from the user
            agent_response: The response from the agent
            metadata: Additional metadata to store with the interaction

        Returns:
            True if stored in vector backend, False if using YAML fallback

        """
        interaction_data = {
            "type": "conversation_interaction",
            "user_message": user_message,
            "agent_response": agent_response,
            "timestamp": datetime.now().isoformat(),
            "session_id": self.user_id,
        }

        if metadata:
            interaction_data["metadata"] = metadata

        content = json.dumps(interaction_data)

        # Store in memory system
        stored_in_memory = self.memory.add(
            content=content,
            user_id=self.user_id,
            metadata={
                "interaction_type": "conversation",
                "timestamp": interaction_data["timestamp"],
                "user_id": self.user_id,
            },
        )

        # Always save to local storage as backup
        self._save_to_local_storage(interaction_data)

        return stored_in_memory

    def retrieve_context(self, query: str | None = None, limit: int = 5) -> list[dict[str, Any]]:
        """Retrieve relevant context from memory (memory system + local backup).

        Args:
            query: Optional query to search for specific context
            limit: Maximum number of context items to retrieve

        Returns:
            List of context items (dictionaries)

        """
        context_items = []

        # Try to get from memory system first
        if query:
            # Search for specific context related to the query
            search_results = self.memory.search(
                query=query,
                user_id=self.user_id,
                limit=limit,
            )
        else:
            # Get recent interactions
            search_results = self.memory.get_all(user_id=self.user_id)[-limit:]

        # Parse results from memory system
        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    context_items.append(parsed)
                else:
                    # Raw string content
                    context_items.append({
                        "type": "raw_memory",
                        "content": memory_content,
                        "timestamp": datetime.now().isoformat(),
                    })
            except json.JSONDecodeError:
                # If it's not JSON, store as raw content
                context_items.append({
                    "type": "raw_content",
                    "content": memory_content,
                    "timestamp": datetime.now().isoformat(),
                })

        # Add results from local storage to supplement if needed
        if len(context_items) < limit:
            local_items = self._load_from_local_storage()
            # Add local items that aren't already in context_items
            for local_item in reversed(local_items):  # Most recent first
                if len(context_items) >= limit:
                    break
                # Check if this item is already in our context_items
                if not any(item.get("timestamp") == local_item.get("timestamp") for item in context_items):
                    context_items.insert(0, local_item)

        # Return up to the limit
        return context_items[:limit]

    def summarize_context(self, context_items: list[dict]) -> dict[str, Any]:
        """Create a summary of the conversation context.

        Args:
            context_items: List of context items from retrieve_context

        Returns:
            Summary dictionary with key information

        """
        if not context_items:
            return {
                "total_interactions": 0,
                "topics_discussed": [],
                "last_interaction": None,
                "summary": "No conversation history available",
            }

        # Extract key information
        topics = set()
        interactions_count = len(context_items)

        for item in context_items:
            if item.get("type") == "conversation_interaction":
                user_msg = item.get("user_message", "").lower()
                agent_resp = item.get("agent_response", "").lower()

                # Extract potential topics from messages
                for word in user_msg.split() + agent_resp.split():
                    if len(word) > 4 and word.isalpha():  # Likely a topic word
                        topics.add(word)

        last_item = context_items[-1] if context_items else None

        return {
            "total_interactions": interactions_count,
            "topics_discussed": list(topics)[:10],  # Limit to 10 topics
            "last_interaction": last_item,
            "summary": f"Conversation includes {interactions_count} interactions about: {', '.join(list(topics)[:5])}",
        }

    def get_recent_interactions(self, count: int = 3) -> list[dict[str, Any]]:
        """Get the most recent interactions from memory.

        Args:
            count: Number of recent interactions to retrieve

        Returns:
            List of recent interaction dictionaries

        """
        all_interactions = self.retrieve_context(limit=count)
        return all_interactions[-count:]

    def has_context_about(self, topic: str) -> bool:
        """Check if there's existing context about a particular topic.

        Args:
            topic: Topic to check for

        Returns:
            True if context about the topic exists, False otherwise

        """
        context = self.retrieve_context(query=topic, limit=1)
        return len(context) > 0


# Context-aware conversation agent
class ContextAwareAgent:
    """An agent that uses context to provide more personalized and coherent responses."""

    def __init__(self, user_id: str) -> None:
        """Initialize the context-aware agent.

        Args:
            user_id: Identifier for the user/conversation

        """
        self.context_manager = ContextManager(user_id)
        self.user_id = user_id

    def respond(self, user_input: str) -> str:
        """Generate a response based on user input and conversation context.

        Args:
            user_input: Input from the user

        Returns:
            Response string

        """
        # Retrieve relevant context
        context_items = self.context_manager.retrieve_context(limit=5)
        context_summary = self.context_manager.summarize_context(context_items)

        # Store the interaction in memory
        self.context_manager.store_interaction(
            user_message=user_input,
            agent_response="",  # Will fill this after generating response
            metadata={"stage": "input_received"},
        )

        # Generate response based on context
        response = self._generate_contextual_response(user_input, context_summary)

        # Update the stored interaction with the actual response
        # Note: In a more advanced implementation, we might want to update the last interaction
        # For now, we'll store a new interaction with the full response
        self.context_manager.store_interaction(
            user_message=user_input,
            agent_response=response,
            metadata={"stage": "response_generated"},
        )

        return response

    def _generate_contextual_response(self, user_input: str, context_summary: dict) -> str:
        """Generate a response considering the conversation context.

        Args:
            user_input: Input from the user
            context_summary: Summary of conversation context

        Returns:
            Generated response string

        """
        # Check if this topic was discussed before
        user_input_lower = user_input.lower()
        previously_discussed = any(topic.lower() in user_input_lower
                                  for topic in context_summary.get("topics_discussed", []))

        if context_summary["total_interactions"] == 0:
            # First interaction
            return f"Hello! I'm your context-aware assistant. I see this is our first interaction. You said: '{user_input}'. How can I help you with {self._extract_topic(user_input)}?"
        if previously_discussed:
            # Topic was mentioned before
            return f"I remember we talked about {self._extract_topic(user_input)} earlier. You said '{user_input}'. Would you like to continue our discussion on this topic?"
        if context_summary["total_interactions"] > 0:
            # Returning user with context
            recent_topics = ", ".join(context_summary.get("topics_discussed", [])[-2:])
            if recent_topics:
                return f"Welcome back! We were discussing {recent_topics}. Now you're asking about '{user_input}'. How does this relate to our previous conversation?"
            return f"I see you're asking about '{user_input}'. We've had {context_summary['total_interactions']} previous interactions. How can I help you further?"
        # Default response
        return f"You said: '{user_input}'. Based on our conversation history, {context_summary['summary']}. How can I assist you?"

    def _extract_topic(self, text: str) -> str:
        """Extract a potential topic from the text."""
        words = text.split()
        # Return the longest word or the first noun-like word
        if words:
            # Simple heuristic: return first word with length > 4
            for word in words:
                clean_word = "".join(c for c in word if c.isalnum())
                if len(clean_word) > 4:
                    return clean_word
        return "this topic"


# Utility function for easy initialization
def create_context_aware_conversation(user_id: str) -> ContextAwareAgent:
    """Create a context-aware conversation agent for a user.

    Args:
        user_id: User identifier for the conversation

    Returns:
        ContextAwareAgent instance

    """
    return ContextAwareAgent(user_id)
