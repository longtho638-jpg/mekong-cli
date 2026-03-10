"""Cross-Session Intelligence for Mekong CLI."""

import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from packages.memory.memory_facade import get_memory_facade

logger = logging.getLogger(__name__)


class UserProfile:
    """Represents a persistent user profile that maintains information across sessions."""

    def __init__(self, user_id: str) -> None:
        self.user_id = user_id
        self.created_at = datetime.now()
        self.preferences: dict[str, Any] = {}
        self.interaction_history: list[dict[str, Any]] = []
        self.knowledge_base: dict[str, Any] = {}
        self.session_history: list[dict[str, Any]] = []


class CrossSessionStateManager:
    """Manages state and knowledge that persists across multiple sessions for a user."""

    def __init__(self, user_id: str) -> None:
        """Initialize the cross-session state manager.

        Args:
            user_id: Identifier for the user

        """
        self.user_id = user_id
        self.memory = get_memory_facade()
        self.memory.connect()

        logger.debug("CrossSessionStateManager initialized for %s, using %s storage",
                     user_id, self.memory.get_provider_status()["active_provider"])

        # Initialize local storage as backup for YAML fallback
        self.local_storage_path = Path.home() / ".mekong" / "cross_session_profiles"
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        self.local_profile_file = self.local_storage_path / f"{self.user_id.replace(':', '_').replace('/', '_')}.json"

        # Load or create user profile
        self.profile = self._load_or_create_profile()

    def _load_or_create_profile(self) -> UserProfile:
        """Load an existing user profile or create a new one."""
        # Try to load from memory system first
        search_results = self.memory.search(
            query=f"profile for {self.user_id}",
            user_id=f"profiles:{self.user_id}",
            limit=1,
        )

        profile_data = None
        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "user_profile":
                        profile_data = parsed
                        break
            except json.JSONDecodeError:
                continue

        # If not found in memory system, try local storage
        if not profile_data:
            local_profiles = self._load_from_local_storage()
            for local_profile in local_profiles:
                if local_profile.get("type") == "user_profile" and local_profile.get("user_id") == self.user_id:
                    profile_data = local_profile
                    break

        if profile_data:
            # Restore existing profile
            profile = UserProfile(profile_data["user_id"])
            profile.created_at = datetime.fromisoformat(profile_data["created_at"])
            profile.preferences = profile_data.get("preferences", {})
            profile.interaction_history = profile_data.get("interaction_history", [])
            profile.knowledge_base = profile_data.get("knowledge_base", {})
            profile.session_history = profile_data.get("session_history", [])
            return profile
        # Create new profile
        return UserProfile(self.user_id)

    def _save_to_local_storage(self, data: dict) -> None:
        """Save data to local file storage as backup."""
        try:
            all_data = []
            if self.local_profile_file.exists():
                with open(self.local_profile_file, encoding="utf-8") as f:
                    all_data = json.load(f)

            # Check if this is an update to existing profile data
            updated_existing = False
            for i, item in enumerate(all_data):
                if item.get("type") == "user_profile" and item.get("user_id") == data.get("user_id"):
                    all_data[i] = data
                    updated_existing = True
                    break

            if not updated_existing:
                all_data.append(data)

            # Keep only the most recent profile data to avoid growing too large
            if len(all_data) > 10:  # Keep only recent items
                all_data = [item for item in all_data if item.get("type") != "user_profile"] + \
                          [item for item in all_data if item.get("type") == "user_profile"][-1:]  # Last profile

            with open(self.local_profile_file, "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning("Could not save to local storage: %s", e)

    def _load_from_local_storage(self) -> list[dict]:
        """Load data from local file storage."""
        try:
            if self.local_profile_file.exists():
                with open(self.local_profile_file, encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning("Could not load from local storage: %s", e)
        return []

    def update_preferences(self, preferences: dict[str, any]) -> None:
        """Update user preferences that persist across sessions.

        Args:
            preferences: Dictionary of user preferences to update

        """
        self.profile.preferences.update(preferences)

        # Store the updated preferences in memory system
        pref_data = {
            "type": "user_preference",
            "user_id": self.user_id,
            "preferences": preferences,
            "timestamp": datetime.now().isoformat(),
        }

        self.memory.add(
            content=json.dumps(pref_data),
            user_id=f"profiles:{self.user_id}",
            metadata={
                "item_type": "user_preference",
                "user_id": self.user_id,
                "timestamp": pref_data["timestamp"],
            },
        )

        # Also save to local storage as backup
        self._save_to_local_storage(pref_data)

    def add_interaction(
        self,
        interaction_type: str,
        content: str,
        metadata: Optional[dict] = None,
    ) -> str:
        """Add an interaction to the user's history.

        Args:
            interaction_type: Type of interaction (e.g., 'query', 'feedback', 'command')
            content: Content of the interaction
            metadata: Additional metadata about the interaction

        Returns:
            ID of the recorded interaction

        """
        interaction_id = str(uuid.uuid4())

        interaction = {
            "id": interaction_id,
            "type": interaction_type,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {},
        }

        self.profile.interaction_history.append(interaction)

        # Store in memory system
        interaction_data = {
            "type": "user_interaction",
            "user_id": self.user_id,
            "interaction": interaction,
            "timestamp": datetime.now().isoformat(),
        }

        self.memory.add(
            content=json.dumps(interaction_data),
            user_id=f"interactions:{self.user_id}",
            metadata={
                "item_type": "user_interaction",
                "user_id": self.user_id,
                "interaction_type": interaction_type,
                "timestamp": interaction_data["timestamp"],
            },
        )

        # Also save to local storage as backup
        self._save_to_local_storage(interaction_data)

        return interaction_id

    def add_to_knowledge_base(self, category: str, key: str, value: Any) -> None:
        """Add information to the user's persistent knowledge base.

        Args:
            category: Category of the knowledge (e.g., 'facts', 'preferences', 'history')
            key: Key for the knowledge item
            value: Value of the knowledge item

        """
        if category not in self.profile.knowledge_base:
            self.profile.knowledge_base[category] = {}

        self.profile.knowledge_base[category][key] = value

        # Store in memory system
        knowledge_data = {
            "type": "user_knowledge",
            "user_id": self.user_id,
            "category": category,
            "key": key,
            "value": value,
            "timestamp": datetime.now().isoformat(),
        }

        self.memory.add(
            content=json.dumps(knowledge_data),
            user_id=f"knowledge:{self.user_id}",
            metadata={
                "item_type": "user_knowledge",
                "user_id": self.user_id,
                "category": category,
                "key": key,
                "timestamp": knowledge_data["timestamp"],
            },
        )

        # Also save to local storage as backup
        self._save_to_local_storage(knowledge_data)

    def record_session(self, session_data: dict[str, any]) -> str:
        """Record a session for this user.

        Args:
            session_data: Data about the session

        Returns:
            ID of the recorded session

        """
        session_id = str(uuid.uuid4())

        session_record = {
            "id": session_id,
            "start_time": datetime.now().isoformat(),
            "session_data": session_data,
            "user_id": self.user_id,
        }

        self.profile.session_history.append(session_record)

        # Store in memory system
        session_data_record = {
            "type": "session_record",
            "user_id": self.user_id,
            "session": session_record,
            "timestamp": datetime.now().isoformat(),
        }

        self.memory.add(
            content=json.dumps(session_data_record),
            user_id=f"sessions:{self.user_id}",
            metadata={
                "item_type": "session_record",
                "user_id": self.user_id,
                "timestamp": session_data_record["timestamp"],
            },
        )

        # Also save to local storage as backup
        self._save_to_local_storage(session_data_record)

        return session_id

    def get_user_preferences(self) -> Dict[str, Any]:
        """Get user preferences.

        Returns:
            Dictionary of user preferences

        """
        # Try to refresh from memory system
        search_results = self.memory.search(
            query="user preferences",
            user_id=f"profiles:{self.user_id}",
            limit=5,  # Get recent preference updates
        )

        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "user_preference":
                        # Update our local copy with newer preferences
                        self.profile.preferences.update(parsed.get("preferences", {}))
            except json.JSONDecodeError:
                continue

        return self.profile.preferences.copy()

    def get_interaction_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's interaction history.

        Args:
            limit: Maximum number of interactions to return

        Returns:
            List of interaction dictionaries

        """
        # Try to refresh from memory system
        search_results = self.memory.search(
            query="user interactions",
            user_id=f"interactions:{self.user_id}",
            limit=limit,
        )

        interactions = []
        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "user_interaction":
                        interactions.append(parsed.get("interaction"))
            except json.JSONDecodeError:
                continue

        # Supplement with local storage if needed
        if len(interactions) < limit:
            local_data = self._load_from_local_storage()
            for local_item in local_data:
                if len(interactions) >= limit:
                    break
                if (local_item.get("type") == "user_interaction" and
                    local_item.get("user_id") == self.user_id):
                    local_interaction = local_item.get("interaction")
                    if local_interaction and local_interaction not in interactions:
                        interactions.append(local_interaction)

        # Sort by timestamp (most recent first)
        interactions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return interactions[:limit]

    def get_knowledge_base(self, category: Optional[str] = None) -> Dict[str, Any]:
        """Get user's knowledge base.

        Args:
            category: Optional category to filter by

        Returns:
            Dictionary of knowledge base items

        """
        # Try to refresh from memory system
        query = "user knowledge"
        if category:
            query = f"user knowledge in {category}"

        search_results = self.memory.search(
            query=query,
            user_id=f"knowledge:{self.user_id}",
            limit=100,  # Get all knowledge items
        )

        knowledge = {}
        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "user_knowledge":
                        cat = parsed.get("category")
                        key = parsed.get("key")
                        value = parsed.get("value")

                        if cat and key and value is not None:
                            if cat not in knowledge:
                                knowledge[cat] = {}
                            knowledge[cat][key] = value
            except json.JSONDecodeError:
                continue

        # Merge with our local knowledge
        for cat, items in self.profile.knowledge_base.items():
            if cat not in knowledge:
                knowledge[cat] = {}
            knowledge[cat].update(items)

        if category:
            return knowledge.get(category, {})
        return knowledge

    def get_session_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's session history.

        Args:
            limit: Maximum number of sessions to return

        Returns:
            List of session dictionaries

        """
        # Try to refresh from memory system
        search_results = self.memory.search(
            query="session history",
            user_id=f"sessions:{self.user_id}",
            limit=limit,
        )

        sessions = []
        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "session_record":
                        sessions.append(parsed.get("session"))
            except json.JSONDecodeError:
                continue

        # Supplement with local storage if needed
        if len(sessions) < limit:
            local_data = self._load_from_local_storage()
            for local_item in local_data:
                if len(sessions) >= limit:
                    break
                if (local_item.get("type") == "session_record" and
                    local_item.get("user_id") == self.user_id):
                    local_session = local_item.get("session")
                    if local_session and local_session not in sessions:
                        sessions.append(local_session)

        # Sort by timestamp (most recent first)
        sessions.sort(key=lambda x: x.get("start_time", ""), reverse=True)
        return sessions[:limit]

    def recall_information(self, query: str) -> List[Dict[str, Any]]:
        """Recall relevant information from across sessions based on a query.

        Args:
            query: Query to search for relevant information

        Returns:
            List of relevant information items

        """
        results = []

        # Search preferences
        prefs = self.get_user_preferences()
        if query.lower() in str(prefs).lower():
            results.append({
                "type": "preferences",
                "data": prefs,
                "relevance": "high",
            })

        # Search interaction history
        interactions = self.get_interaction_history(limit=10)
        for interaction in interactions:
            if query.lower() in interaction.get("content", "").lower():
                results.append({
                    "type": "interaction",
                    "data": interaction,
                    "relevance": "medium",
                })

        # Search knowledge base
        knowledge = self.get_knowledge_base()
        for category, items in knowledge.items():
            for key, value in items.items():
                if query.lower() in f"{key} {value}".lower():
                    results.append({
                        "type": "knowledge",
                        "category": category,
                        "key": key,
                        "data": value,
                        "relevance": "high",
                    })

        return results

    def save_profile(self) -> None:
        """Save the current user profile to persistent storage."""
        profile_data = {
            "type": "user_profile",
            "user_id": self.profile.user_id,
            "created_at": self.profile.created_at.isoformat(),
            "preferences": self.profile.preferences,
            "interaction_history": self.profile.interaction_history[-50:],  # Keep last 50 interactions
            "knowledge_base": self.profile.knowledge_base,
            "session_history": self.profile.session_history[-20:],  # Keep last 20 sessions
        }

        # Store in memory system
        self.memory.add(
            content=json.dumps(profile_data),
            user_id=f"profiles:{self.user_id}",
            metadata={
                "item_type": "user_profile",
                "user_id": self.profile.user_id,
            },
        )

        # Also save to local storage as backup
        self._save_to_local_storage(profile_data)


class CrossSessionIntelligenceEngine:
    """High-level engine for cross-session intelligence capabilities."""

    def __init__(self) -> None:
        self.state_managers: Dict[str, CrossSessionStateManager] = {}

    def get_state_manager(self, user_id: str) -> CrossSessionStateManager:
        """Get or create a state manager for a user.

        Args:
            user_id: Identifier for the user

        Returns:
            CrossSessionStateManager for the user

        """
        if user_id not in self.state_managers:
            self.state_managers[user_id] = CrossSessionStateManager(user_id)
        return self.state_managers[user_id]

    def personalize_response(self, user_id: str, response: str) -> str:
        """Personalize a response based on the user's cross-session data.

        Args:
            user_id: Identifier for the user
            response: Original response to personalize

        Returns:
            Personalized response

        """
        manager = self.get_state_manager(user_id)

        # Get user preferences
        preferences = manager.get_user_preferences()

        # Get user's knowledge base
        # knowledge = manager.get_knowledge_base()  # Removed unused

        # Add personalization based on preferences
        if preferences:
            pref_details = []
            for key, value in preferences.items():
                if isinstance(value, (str, int, float, bool)):
                    pref_details.append(f"{key}: {value}")

            if pref_details:
                response += f" (Based on your preferences: {', '.join(pref_details)})"

        return response

    def build_context_from_history(self, user_id: str, topic: str) -> str:
        """Build contextual information from the user's history for a specific topic.

        Args:
            user_id: Identifier for the user
            topic: Topic to build context for

        Returns:
            Contextual information string

        """
        manager = self.get_state_manager(user_id)

        # Get relevant information from history
        relevant_info = manager.recall_information(topic)

        if not relevant_info:
            return ""

        context_parts = [f"Context for '{topic}':"]
        for item in relevant_info:
            if item["type"] == "knowledge":
                context_parts.append(f"- {item['category']}.{item['key']}: {item['data']}")
            elif item["type"] == "interaction":
                content = item["data"].get("content", "")[:100]  # Limit length
                context_parts.append(f"- Previous interaction: {content}...")
            elif item["type"] == "preferences":
                # Don't add all preferences to context, just mention they exist
                context_parts.append("- User preferences considered")

        return " ".join(context_parts)


# Convenience function for initialization
def create_cross_session_engine() -> CrossSessionIntelligenceEngine:
    """Create a cross-session intelligence engine instance.

    Returns:
        CrossSessionIntelligenceEngine instance

    """
    return CrossSessionIntelligenceEngine()
