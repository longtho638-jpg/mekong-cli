"""Memory-Augmented Decision Making System for Mekong CLI."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any

from packages.memory.memory_facade import get_memory_facade


class DecisionMaker:
    """Makes intelligent decisions based on historical context and precedents
    using the memory system for informed decision-making.
    """

    def __init__(self, user_id: str = "system:decision_maker") -> None:
        """Initialize the decision maker.

        Args:
            user_id: Identifier for the decision maker (format: agent:session)

        """
        self.user_id = user_id
        self.memory = get_memory_facade()
        self.memory.connect()


        # Initialize local storage as backup for YAML fallback
        self.local_storage_path = Path.home() / ".mekong" / "decision_maker"
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        self.local_decisions_file = self.local_storage_path / f"{self.user_id.replace(':', '_').replace('/', '_')}.json"

    def _save_to_local_storage(self, data: dict) -> None:
        """Save data to local file storage as backup."""
        try:
            all_data = []
            if self.local_decisions_file.exists():
                with open(self.local_decisions_file, encoding="utf-8") as f:
                    all_data = json.load(f)

            all_data.append(data)

            # Keep only the most recent 200 decisions to avoid growing too large
            if len(all_data) > 200:
                all_data = all_data[-200:]

            with open(self.local_decisions_file, "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def _load_from_local_storage(self) -> list[dict]:
        """Load data from local file storage."""
        try:
            if self.local_decisions_file.exists():
                with open(self.local_decisions_file, encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return []

    def _generate_decision_hash(self, decision_context: str) -> str:
        """Generate a hash for a decision context to use as a unique identifier.

        Args:
            decision_context: The context of the decision

        Returns:
            SHA256 hash of the decision context

        """
        return hashlib.sha256(decision_context.encode("utf-8")).hexdigest()

    def record_decision(
        self,
        decision_context: str,
        decision: str,
        outcome: str,
        confidence: float = 0.5,
        metadata: dict | None = None,
    ) -> bool:
        """Record a decision and its outcome in the memory system.

        Args:
            decision_context: The context in which the decision was made
            decision: The decision that was made
            outcome: The outcome/result of the decision
            confidence: Initial confidence in the decision (0.0 to 1.0)
            metadata: Additional metadata about the decision

        Returns:
            True if stored in vector backend, False if using YAML fallback

        """
        decision_data = {
            "type": "decision_record",
            "decision_context": decision_context,
            "decision": decision,
            "outcome": outcome,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat(),
            "decision_hash": self._generate_decision_hash(decision_context),
            "session_id": self.user_id,
        }

        if metadata:
            decision_data["metadata"] = metadata

        content = json.dumps(decision_data)

        # Store in memory system
        stored_in_memory = self.memory.add(
            content=content,
            user_id=self.user_id,
            metadata={
                "item_type": "decision_record",
                "decision_hash": decision_data["decision_hash"],
                "timestamp": decision_data["timestamp"],
                "confidence": confidence,
                "outcome": outcome,
            },
        )

        # Always save to local storage as backup
        self._save_to_local_storage(decision_data)

        return stored_in_memory

    def find_similar_decisions(self, context: str, threshold: float = 0.7, limit: int = 5) -> list[dict[str, Any]]:
        """Find past decisions made in similar contexts.

        Args:
            context: The current context to find similar decisions for
            threshold: Minimum similarity threshold (0.0 to 1.0)
            limit: Maximum number of similar decisions to return

        Returns:
            List of similar decision dictionaries

        """
        similar_decisions = []

        # Try to get from memory system first
        search_results = self.memory.search(
            query=context,
            user_id=self.user_id,
            limit=limit * 2,  # Get more results to account for filtering
        )

        context_lower = context.lower()

        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "decision_record":
                        # Calculate similarity based on context overlap
                        decision_context = parsed.get("decision_context", "")
                        similarity = self._calculate_similarity(context_lower, decision_context.lower())

                        if similarity >= threshold:
                            parsed["similarity_score"] = similarity
                            similar_decisions.append(parsed)

                        if len(similar_decisions) >= limit:
                            break
            except json.JSONDecodeError:
                continue

        # If not enough results from memory system, add from local storage
        if len(similar_decisions) < limit:
            local_decisions = self._load_from_local_storage()

            for local_decision in local_decisions:
                if len(similar_decisions) >= limit:
                    break

                if local_decision.get("type") == "decision_record":
                    decision_context = local_decision.get("decision_context", "")
                    similarity = self._calculate_similarity(context_lower, decision_context.lower())

                    if similarity >= threshold:
                        # Check if this decision is already in our results
                        if not any(sd.get("decision_hash") == local_decision.get("decision_hash") for sd in similar_decisions):
                            local_decision["similarity_score"] = similarity
                            similar_decisions.append(local_decision)

        # Sort by similarity score (descending) and confidence (descending)
        similar_decisions.sort(key=lambda x: (x.get("similarity_score", 0), x.get("confidence", 0)), reverse=True)
        return similar_decisions[:limit]

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

    def get_recommendation(self, current_context: str, min_confidence: float = 0.6) -> tuple[str, dict] | None:
        """Get a decision recommendation based on similar past contexts.

        Args:
            current_context: The current context needing a decision
            min_confidence: Minimum confidence for acceptable recommendations

        Returns:
            Tuple of (recommended_decision, decision_data) or None if no suitable recommendation found

        """
        similar_decisions = self.find_similar_decisions(current_context, threshold=0.5, limit=3)

        for decision_data in similar_decisions:
            if decision_data.get("confidence", 0) >= min_confidence and decision_data.get("outcome") != "failure":
                return decision_data["decision"], decision_data

        return None

    def get_decision_rationale(self, decision_hash: str) -> dict[str, Any] | None:
        """Get the rationale and history for a specific decision.

        Args:
            decision_hash: Hash of the decision to look up

        Returns:
            Decision data dictionary or None if not found

        """
        # Search in memory system
        all_decisions = self.memory.get_all(user_id=self.user_id)

        for result in all_decisions:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if (parsed.get("type") == "decision_record" and
                        parsed.get("decision_hash") == decision_hash):
                        return parsed
            except json.JSONDecodeError:
                continue

        # Search in local storage
        local_decisions = self._load_from_local_storage()
        for local_decision in local_decisions:
            if (local_decision.get("type") == "decision_record" and
                local_decision.get("decision_hash") == decision_hash):
                return local_decision

        return None

    def update_decision_outcome(self, decision_hash: str, new_outcome: str, new_confidence: float | None = None) -> None:
        """Update the outcome and confidence of a previously made decision.

        Args:
            decision_hash: Hash of the decision to update
            new_outcome: New outcome of the decision
            new_confidence: New confidence level (if provided)

        """
        # Since we can't directly update stored memories, we'll record a follow-up
        # In a more complete implementation, we would have update/delete capabilities
        local_decisions = self._load_from_local_storage()

        for i, decision in enumerate(local_decisions):
            if decision.get("decision_hash") == decision_hash:
                # Update the decision record
                local_decisions[i]["outcome"] = new_outcome
                if new_confidence is not None:
                    local_decisions[i]["confidence"] = new_confidence

                # Save updated decisions
                with open(self.local_decisions_file, "w", encoding="utf-8") as f:
                    json.dump(local_decisions, f, ensure_ascii=False, indent=2)
                break

    def get_decision_audit_trail(self, limit: int = 10) -> list[dict[str, Any]]:
        """Get a chronological list of decisions for auditing purposes.

        Args:
            limit: Number of recent decisions to return

        Returns:
            List of decision dictionaries ordered chronologically

        """
        # Get from memory system
        all_decisions_memory = self.memory.get_all(user_id=self.user_id)

        # Get from local storage
        all_decisions_local = self._load_from_local_storage()

        # Combine both sources, prioritizing memory system data but supplementing with local
        decisions = []

        # Process memory system results
        for result in all_decisions_memory:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "decision_record":
                        decisions.append(parsed)
            except json.JSONDecodeError:
                continue

        # Add unique entries from local storage
        memory_hashes = {d.get("decision_hash") for d in decisions}
        for local_decision in all_decisions_local:
            if local_decision.get("type") == "decision_record":
                local_hash = local_decision.get("decision_hash")
                if local_hash and local_hash not in memory_hashes:
                    decisions.append(local_decision)
                    memory_hashes.add(local_hash)

        # Sort by timestamp (chronological)
        decisions.sort(key=lambda x: x.get("timestamp", ""))
        return decisions[-limit:]


class MemoryAugmentedDecisionEngine:
    """High-level engine for making memory-augmented decisions."""

    def __init__(self, user_id: str = "system:decision_engine") -> None:
        """Initialize the memory augmented decision engine.

        Args:
            user_id: Identifier for the decision engine

        """
        self.decision_maker = DecisionMaker(user_id)
        self.user_id = user_id

    def make_decision(self, context: str, options: list[str]) -> tuple[str, dict]:
        """Make a decision based on context and available options, using memory of past decisions.

        Args:
            context: The context for the decision
            options: Available options to choose from

        Returns:
            Tuple of (selected_option, decision_metadata)

        """
        # First, try to get a recommendation based on similar past contexts
        recommendation = self.decision_maker.get_recommendation(context)

        if recommendation:
            recommended_decision, decision_data = recommendation
            # Check if the recommended decision is among our options
            for option in options:
                if self._calculate_similarity(recommended_decision.lower(), option.lower()) > 0.7:
                    return option, {
                        "based_on_past": True,
                        "similarity_score": decision_data.get("similarity_score"),
                        "past_outcome": decision_data.get("outcome"),
                    }

        # If no good recommendation, use a simple heuristic (select the first option as default)
        # In a more sophisticated system, we would implement more complex decision logic
        selected_option = options[0] if options else "no-option-available"

        # Record this decision for future reference
        self.decision_maker.record_decision(
            decision_context=context,
            decision=selected_option,
            outcome="pending",  # Outcome unknown at decision time
            confidence=0.5,
        )

        return selected_option, {
            "based_on_past": False,
            "reason": "No similar past decisions found",
        }

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts based on common words."""
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

    def record_decision_outcome(self, context: str, decision: str, outcome: str, confidence: float = 0.5) -> None:
        """Record the actual outcome of a decision.

        Args:
            context: The context of the decision
            decision: The decision that was made
            outcome: The actual outcome
            confidence: Confidence in the outcome assessment

        """
        # Find the closest matching decision to update
        # For now, we'll record a follow-up record
        decision_hash = hashlib.sha256(context.encode("utf-8")).hexdigest()
        self.decision_maker.update_decision_outcome(decision_hash, outcome, confidence)

        # Also record this as a new decision outcome for future reference
        self.decision_maker.record_decision(
            decision_context=context,
            decision=decision,
            outcome=outcome,
            confidence=confidence,
            metadata={"follow_up": True},
        )


# Convenience function for initialization
def create_decision_maker(user_id: str = "system:default_decision_maker") -> MemoryAugmentedDecisionEngine:
    """Create a memory-augmented decision maker instance.

    Args:
        user_id: User identifier for the decision maker

    Returns:
        MemoryAugmentedDecisionEngine instance

    """
    return MemoryAugmentedDecisionEngine(user_id)
