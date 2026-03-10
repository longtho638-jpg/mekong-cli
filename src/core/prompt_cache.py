"""Intelligent Prompt Caching System for Mekong CLI."""

from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from packages.memory.memory_facade import get_memory_facade

logger = logging.getLogger(__name__)


class PromptCache:
    """Caches and retrieves effective prompts based on similarity matching,
    improving efficiency and consistency of AI interactions.
    """

    def __init__(self, user_id: str = "system:prompt_cache") -> None:
        """Initialize the prompt cache.

        Args:
            user_id: Identifier for the prompt cache (format: agent:session)

        """
        self.user_id = user_id
        self.memory = get_memory_facade()
        self.memory.connect()

        logger.debug("PromptCache initialized for %s, using %s storage",
                     self.user_id, self.memory.get_provider_status()["active_provider"])

        # Initialize local storage as backup for YAML fallback
        self.local_storage_path = Path.home() / ".mekong" / "prompt_cache"
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        self.local_cache_file = self.local_storage_path / f"{self.user_id.replace(':', '_').replace('/', '_')}.json"

    def _save_to_local_storage(self, data: dict) -> None:
        """Save data to local file storage as backup."""
        try:
            all_data = []
            if self.local_cache_file.exists():
                with open(self.local_cache_file, encoding="utf-8") as f:
                    all_data = json.load(f)

            all_data.append(data)

            # Keep only the most recent 200 cached prompts to avoid growing too large
            if len(all_data) > 200:
                all_data = all_data[-200:]

            with open(self.local_cache_file, "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning("Could not save to local storage: %s", e)

    def _load_from_local_storage(self) -> list[dict]:
        """Load data from local file storage."""
        try:
            if self.local_cache_file.exists():
                with open(self.local_cache_file, encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning("Could not load from local storage: %s", e)
        return []

    def _generate_prompt_hash(self, prompt: str) -> str:
        """Generate a hash for a prompt to use as a unique identifier.

        Args:
            prompt: The prompt text

        Returns:
            SHA256 hash of the prompt

        """
        return hashlib.sha256(prompt.encode("utf-8")).hexdigest()

    def store_prompt(
        self,
        prompt: str,
        response: str,
        outcome_score: float = 1.0,
        metadata: dict | None = None,
    ) -> bool:
        """Store a prompt and its outcome in the cache.

        Args:
            prompt: The prompt text
            response: The response generated
            outcome_score: Effectiveness score (0.0 to 1.0)
            metadata: Additional metadata about the prompt

        Returns:
            True if stored in vector backend, False if using YAML fallback

        """
        prompt_data = {
            "type": "cached_prompt",
            "prompt_text": prompt,
            "response_text": response,
            "outcome_score": outcome_score,
            "timestamp": datetime.now().isoformat(),
            "prompt_hash": self._generate_prompt_hash(prompt),
            "session_id": self.user_id,
        }

        if metadata:
            prompt_data["metadata"] = metadata

        content = json.dumps(prompt_data)

        # Store in memory system
        stored_in_memory = self.memory.add(
            content=content,
            user_id=self.user_id,
            metadata={
                "item_type": "cached_prompt",
                "prompt_hash": prompt_data["prompt_hash"],
                "timestamp": prompt_data["timestamp"],
                "outcome_score": outcome_score,
            },
        )

        # Always save to local storage as backup
        self._save_to_local_storage(prompt_data)

        return stored_in_memory

    def find_similar_prompts(self, query_prompt: str, threshold: float = 0.7, limit: int = 5) -> list[dict[str, Any]]:
        """Find prompts similar to the query prompt.

        Args:
            query_prompt: The prompt to find similarities for
            threshold: Minimum similarity threshold (0.0 to 1.0)
            limit: Maximum number of similar prompts to return

        Returns:
            List of similar prompt dictionaries

        """
        similar_prompts = []

        # Try to get from memory system first
        search_results = self.memory.search(
            query=query_prompt,
            user_id=self.user_id,
            limit=limit * 2,  # Get more results to account for filtering
        )

        query_lower = query_prompt.lower()

        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "cached_prompt":
                        # Calculate similarity based on content overlap
                        prompt_text = parsed.get("prompt_text", "")
                        similarity = self._calculate_similarity(query_lower, prompt_text.lower())

                        if similarity >= threshold:
                            parsed["similarity_score"] = similarity
                            similar_prompts.append(parsed)

                        if len(similar_prompts) >= limit:
                            break
            except json.JSONDecodeError:
                continue

        # If not enough results from memory system, add from local storage
        if len(similar_prompts) < limit:
            local_prompts = self._load_from_local_storage()

            for local_prompt in local_prompts:
                if len(similar_prompts) >= limit:
                    break

                if local_prompt.get("type") == "cached_prompt":
                    prompt_text = local_prompt.get("prompt_text", "")
                    similarity = self._calculate_similarity(query_lower, prompt_text.lower())

                    if similarity >= threshold:
                        # Check if this prompt is already in our results
                        if not any(sp.get("prompt_hash") == local_prompt.get("prompt_hash") for sp in similar_prompts):
                            local_prompt["similarity_score"] = similarity
                            similar_prompts.append(local_prompt)

        # Sort by similarity score (descending) and outcome score (descending)
        similar_prompts.sort(key=lambda x: (x.get("similarity_score", 0), x.get("outcome_score", 0)), reverse=True)
        return similar_prompts[:limit]

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts based on common words.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score between 0.0 and 1.0

        """
        # Simple word overlap similarity
        words1 = set(text1.split())
        words2 = set(text2.split())

        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        # Jaccard similarity
        return len(intersection) / len(union)

    def get_cached_response(self, query_prompt: str, min_outcome_score: float = 0.5) -> tuple[str, dict] | None:
        """Get a cached response for a similar prompt.

        Args:
            query_prompt: The prompt to find a cached response for
            min_outcome_score: Minimum outcome score for acceptable cached responses

        Returns:
            Tuple of (cached_response, prompt_metadata) or None if no suitable match found

        """
        similar_prompts = self.find_similar_prompts(query_prompt, threshold=0.5, limit=3)

        for prompt_data in similar_prompts:
            if prompt_data.get("outcome_score", 0) >= min_outcome_score:
                return prompt_data["response_text"], prompt_data

        return None

    def get_top_prompts(self, limit: int = 10) -> list[dict[str, Any]]:
        """Get the top performing prompts based on outcome score.

        Args:
            limit: Number of top prompts to return

        Returns:
            List of top performing prompt dictionaries

        """
        # Get from memory system
        all_prompts_memory = self.memory.get_all(user_id=self.user_id)

        # Get from local storage
        all_prompts_local = self._load_from_local_storage()

        # Combine both sources, prioritizing memory system data but supplementing with local
        cached_prompts = []

        # Process memory system results
        for result in all_prompts_memory:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "cached_prompt":
                        cached_prompts.append(parsed)
            except json.JSONDecodeError:
                continue

        # Add unique entries from local storage
        memory_hashes = {p.get("prompt_hash") for p in cached_prompts}
        for local_prompt in all_prompts_local:
            if local_prompt.get("type") == "cached_prompt":
                local_hash = local_prompt.get("prompt_hash")
                if local_hash and local_hash not in memory_hashes:
                    cached_prompts.append(local_prompt)
                    memory_hashes.add(local_hash)

        # Sort by outcome score (descending)
        cached_prompts.sort(key=lambda x: x.get("outcome_score", 0), reverse=True)
        return cached_prompts[:limit]

    def update_prompt_outcome(self, prompt: str, new_outcome_score: float, additional_metadata: dict | None = None) -> None:
        """Update the outcome score of a previously stored prompt.

        Args:
            prompt: The original prompt text
            new_outcome_score: The new outcome score
            additional_metadata: Additional metadata to update

        """
        # In this implementation, we'll add a new record with the updated score
        # In a more complete implementation, we would update the existing record
        existing = self.find_similar_prompts(prompt, threshold=0.9, limit=1)

        if existing:
            original = existing[0]
            # Update the outcome score and add new metadata
            updated_metadata = original.get("metadata", {}).copy()
            if additional_metadata:
                updated_metadata.update(additional_metadata)

            # Store the updated version (in a complete implementation, we'd update the existing one)
            self.store_prompt(
                prompt=original["prompt_text"],
                response=original["response_text"],
                outcome_score=new_outcome_score,
                metadata=updated_metadata,
            )


class IntelligentPromptManager:
    """High-level manager for intelligent prompt caching and retrieval."""

    def __init__(self, user_id: str = "system:intelligent_prompt_manager") -> None:
        """Initialize the intelligent prompt manager.

        Args:
            user_id: Identifier for the prompt manager

        """
        self.cache = PromptCache(user_id)
        self.user_id = user_id

    def get_response_or_generate(self, prompt: str, generator_func, *args, **kwargs) -> str:
        """Get a cached response if available, otherwise generate a new one and cache it.

        Args:
            prompt: The prompt to get or generate a response for
            generator_func: Function to generate response if not cached
            *args, **kwargs: Arguments for the generator function

        Returns:
            The response string (either from cache or newly generated)

        """
        # Try to get cached response first
        cached_result = self.cache.get_cached_response(prompt)

        if cached_result:
            response, metadata = cached_result
            logger.info("Retrieved cached response with %.2f similarity", metadata.get("similarity_score", 0))
            return response

        # Generate new response
        logger.debug("No suitable cached response found, generating new response")
        response = generator_func(prompt, *args, **kwargs)

        # Store the new prompt-response pair with default good score
        self.cache.store_prompt(prompt, response, outcome_score=0.8)

        return response

    def evaluate_and_update_cache(self, prompt: str, response: str, outcome_evaluation: float) -> None:
        """Evaluate the outcome of a prompt-response pair and update the cache.

        Args:
            prompt: The original prompt
            response: The response generated
            outcome_evaluation: Evaluation score (0.0 to 1.0) of how well the response worked

        """
        # Update the cached outcome score for this prompt
        self.cache.update_prompt_outcome(prompt, outcome_evaluation)

    def get_suggestions_for_topic(self, topic: str) -> list[dict[str, Any]]:
        """Get prompt suggestions for a specific topic based on past successful prompts.

        Args:
            topic: The topic to get prompt suggestions for

        Returns:
            List of prompt suggestion dictionaries

        """
        # Search for prompts related to the topic
        search_results = self.cache.find_similar_prompts(topic, threshold=0.3, limit=5)

        # Filter for only those with high outcome scores
        return [
            prompt_data for prompt_data in search_results
            if prompt_data.get("outcome_score", 0) >= 0.7
        ]



# Convenience function for initialization
def create_intelligent_prompt_manager(user_id: str = "system:default_prompt_manager") -> IntelligentPromptManager:
    """Create an intelligent prompt manager instance.

    Args:
        user_id: User identifier for the prompt manager

    Returns:
        IntelligentPromptManager instance

    """
    return IntelligentPromptManager(user_id)
