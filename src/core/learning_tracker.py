"""Learning History Tracker for Mekong CLI
Tracks and analyzes AI agent learning patterns and knowledge evolution over time.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from packages.memory.memory_facade import get_memory_facade


class LearningHistoryTracker:
    """Tracks and analyzes AI agent learning patterns and knowledge evolution over time.
    Includes knowledge gap identification, learning progression tracking,
    improvement pattern recognition, and performance trend analysis.
    """

    def __init__(self, agent_id: str = "system:learning_tracker") -> None:
        """Initialize the learning history tracker.

        Args:
            agent_id: Identifier for the agent being tracked

        """
        self.agent_id = agent_id
        self.memory = get_memory_facade()
        self.memory.connect()


        # Initialize local storage as backup for YAML fallback
        self.local_storage_path = Path.home() / ".mekong" / "learning_history"
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
        self.local_history_file = self.local_storage_path / f"{self.agent_id.replace(':', '_').replace('/', '_')}.json"

    def _save_to_local_storage(self, data: dict) -> None:
        """Save data to local file storage as backup."""
        try:
            all_data = []
            if self.local_history_file.exists():
                with open(self.local_history_file, encoding="utf-8") as f:
                    all_data = json.load(f)

            all_data.append(data)

            # Keep only the most recent 500 learning records to avoid growing too large
            if len(all_data) > 500:
                all_data = all_data[-500:]

            with open(self.local_history_file, "w", encoding="utf-8") as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def _load_from_local_storage(self) -> list[dict]:
        """Load data from local file storage."""
        try:
            if self.local_history_file.exists():
                with open(self.local_history_file, encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return []

    def log_learning_event(
        self,
        topic: str,
        content: str,
        outcome: str,
        performance_score: float,
        metadata: dict | None = None,
    ) -> str:
        """Log a learning event.

        Args:
            topic: The topic that was learned
            content: The content of the learning
            outcome: The outcome/result of the learning
            performance_score: A score (0.0-1.0) indicating how well the learning performed
            metadata: Additional metadata about the learning event

        Returns:
            ID of the logged event

        """
        event_id = str(uuid.uuid4())

        learning_data = {
            "type": "learning_event",
            "event_id": event_id,
            "topic": topic,
            "content": content,
            "outcome": outcome,
            "performance_score": performance_score,
            "timestamp": datetime.now().isoformat(),
            "agent_id": self.agent_id,
        }

        if metadata:
            learning_data["metadata"] = metadata

        content_str = json.dumps(learning_data)

        # Store in memory system
        self.memory.add(
            content=content_str,
            user_id=f"learning:{self.agent_id}",
            metadata={
                "item_type": "learning_event",
                "topic": topic,
                "performance_score": performance_score,
                "timestamp": learning_data["timestamp"],
            },
        )

        # Always save to local storage as backup
        self._save_to_local_storage(learning_data)

        return event_id

    def get_learning_events_by_topic(self, topic: str, limit: int = 10) -> list[dict[str, Any]]:
        """Get learning events for a specific topic.

        Args:
            topic: The topic to filter by
            limit: Maximum number of events to return

        Returns:
            List of learning events

        """
        # First try to get from memory system
        search_results = self.memory.search(
            query=topic,
            user_id=f"learning:{self.agent_id}",
            limit=limit,
        )

        events = []
        for result in search_results:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "learning_event" and topic.lower() in parsed.get("topic", "").lower():
                        events.append(parsed)
            except json.JSONDecodeError:
                continue

        # Supplement with local storage if needed
        if len(events) < limit:
            local_events = self._load_from_local_storage()
            for local_event in local_events:
                if len(events) >= limit:
                    break
                if (local_event.get("type") == "learning_event" and
                    topic.lower() in local_event.get("topic", "").lower()):
                    # Avoid duplicates
                    if not any(event["event_id"] == local_event["event_id"] for event in events):
                        events.append(local_event)

        # Sort by timestamp (newest first)
        events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return events[:limit]

    def identify_knowledge_gaps(self, min_performance_threshold: float = 0.6) -> list[dict[str, Any]]:
        """Identify knowledge gaps based on poor performance.

        Args:
            min_performance_threshold: Minimum performance score to consider as 'good'

        Returns:
            List of topics that represent knowledge gaps

        """
        # Get all learning events from memory system
        all_events_memory = self.memory.get_all(user_id=f"learning:{self.agent_id}")

        # Get all events from local storage
        all_events_local = self._load_from_local_storage()

        # Combine both sources
        all_events = []

        # Process memory system results
        for result in all_events_memory:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "learning_event":
                        all_events.append(parsed)
            except json.JSONDecodeError:
                continue

        # Add unique entries from local storage
        memory_ids = {event.get("event_id") for event in all_events}
        for local_event in all_events_local:
            if local_event.get("type") == "learning_event":
                local_id = local_event.get("event_id")
                if local_id and local_id not in memory_ids:
                    all_events.append(local_event)
                    memory_ids.add(local_id)

        # Identify knowledge gaps (events with poor performance)
        gaps = []
        topic_performance = {}

        for event in all_events:
            topic = event.get("topic", "")
            performance = event.get("performance_score", 0.0)

            if topic not in topic_performance:
                topic_performance[topic] = {"total": 0, "count": 0, "recent": []}

            tp = topic_performance[topic]
            tp["total"] += performance
            tp["count"] += 1
            tp["recent"].append(performance)

            # Keep only the 5 most recent performances
            if len(tp["recent"]) > 5:
                tp["recent"] = tp["recent"][-5:]

        for topic, data in topic_performance.items():
            avg_performance = data["total"] / data["count"] if data["count"] > 0 else 0
            recent_avg = sum(data["recent"]) / len(data["recent"]) if data["recent"] else 0

            # Identify as gap if both overall and recent performance are below threshold
            if avg_performance < min_performance_threshold and recent_avg < min_performance_threshold:
                gaps.append({
                    "topic": topic,
                    "average_performance": avg_performance,
                    "recent_average": recent_avg,
                    "attempts": data["count"],
                    "gap_severity": "HIGH" if recent_avg < 0.3 else "MEDIUM" if recent_avg < 0.6 else "LOW",
                })

        # Sort by average performance (worst performers first)
        gaps.sort(key=lambda x: x["average_performance"])
        return gaps

    def get_learning_progression(self, topic: str) -> list[dict[str, Any]]:
        """Get the learning progression for a specific topic.

        Args:
            topic: The topic to get progression for

        Returns:
            List of learning events for the topic ordered by time

        """
        events = self.get_learning_events_by_topic(topic, limit=100)
        # Sort by timestamp (oldest first to show progression)
        events.sort(key=lambda x: x.get("timestamp", ""))
        return events

    def get_improvement_patterns(self) -> list[dict[str, Any]]:
        """Get improvement patterns across all topics.

        Returns:
            List of improvement patterns

        """
        # Get all learning events
        all_events = self.memory.get_all(user_id=f"learning:{self.agent_id}")
        local_events = self._load_from_local_storage()

        # Combine both sources
        combined_events = []

        # Process memory system results
        for result in all_events:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "learning_event":
                        combined_events.append(parsed)
            except json.JSONDecodeError:
                continue

        # Add unique entries from local storage
        memory_ids = {event.get("event_id") for event in combined_events}
        for local_event in local_events:
            if local_event.get("type") == "learning_event":
                local_id = local_event.get("event_id")
                if local_id and local_id not in memory_ids:
                    combined_events.append(local_event)
                    memory_ids.add(local_id)

        # Group events by topic
        topic_groups = {}
        for event in combined_events:
            topic = event.get("topic", "unknown")
            if topic not in topic_groups:
                topic_groups[topic] = []
            topic_groups[topic].append(event)

        # Analyze improvement patterns
        patterns = []
        for topic, events in topic_groups.items():
            if len(events) < 2:
                continue  # Need at least 2 events to identify a pattern

            # Sort by timestamp
            events.sort(key=lambda x: x.get("timestamp", ""))

            # Get first and last performance
            first_performance = events[0].get("performance_score", 0.0)
            last_performance = events[-1].get("performance_score", 0.0)
            improvement = last_performance - first_performance

            # Calculate trend (if we have more than 2 events)
            if len(events) > 2:
                middle_idx = len(events) // 2
                middle_performance = events[middle_idx].get("performance_score", 0.0)

                # Determine trend: consistent improvement, plateau, regression, etc.
                if improvement > 0.2 and (last_performance > middle_performance > first_performance):
                    trend = "CONSISTENT_IMPROVEMENT"
                elif abs(improvement) < 0.1:
                    trend = "STABLE_PERFORMANCE"
                elif improvement < -0.2:
                    trend = "REGRESSION"
                else:
                    trend = "FLUCTUATING"
            else:
                trend = "MINIMAL_DATA"

            patterns.append({
                "topic": topic,
                "first_performance": first_performance,
                "last_performance": last_performance,
                "improvement": improvement,
                "total_events": len(events),
                "trend": trend,
                "significant_improvement": improvement > 0.3,
            })

        # Sort by improvement (most improved first)
        patterns.sort(key=lambda x: x["improvement"], reverse=True)
        return patterns

    def get_performance_trends(self) -> dict[str, Any]:
        """Get overall performance trends.

        Returns:
            Dictionary containing performance trend analysis

        """
        all_events = self.memory.get_all(user_id=f"learning:{self.agent_id}")
        local_events = self._load_from_local_storage()

        # Combine both sources
        combined_events = []

        # Process memory system results
        for result in all_events:
            try:
                memory_content = result.get("memory", str(result))
                if memory_content.startswith("{"):  # JSON string
                    parsed = json.loads(memory_content)
                    if parsed.get("type") == "learning_event":
                        combined_events.append(parsed)
            except json.JSONDecodeError:
                continue

        # Add unique entries from local storage
        memory_ids = {event.get("event_id") for event in combined_events}
        for local_event in local_events:
            if local_event.get("type") == "learning_event":
                local_id = local_event.get("event_id")
                if local_id and local_id not in memory_ids:
                    combined_events.append(local_event)
                    memory_ids.add(local_id)

        # Sort by timestamp
        combined_events.sort(key=lambda x: x.get("timestamp", ""))

        if not combined_events:
            return {
                "total_learning_events": 0,
                "average_performance": 0.0,
                "trend_direction": "INSUFFICIENT_DATA",
                "performance_chart": [],
            }

        # Calculate overall metrics
        total_events = len(combined_events)
        total_performance = sum(event.get("performance_score", 0.0) for event in combined_events)
        average_performance = total_performance / total_events if total_events > 0 else 0.0

        # Calculate trend (compare first 25% with last 25%)
        quarter_size = max(1, total_events // 4)
        first_quarter = combined_events[:quarter_size]
        last_quarter = combined_events[-quarter_size:] if quarter_size < total_events else combined_events

        if first_quarter and last_quarter:
            first_avg = sum(e.get("performance_score", 0.0) for e in first_quarter) / len(first_quarter)
            last_avg = sum(e.get("performance_score", 0.0) for e in last_quarter) / len(last_quarter)
            trend_change = last_avg - first_avg

            if trend_change > 0.1:
                trend_direction = "IMPROVING"
            elif trend_change < -0.1:
                trend_direction = "DECLINING"
            else:
                trend_direction = "STABLE"
        else:
            trend_direction = "INSUFFICIENT_DATA"

        # Prepare performance chart data (last 20 events)
        recent_events = combined_events[-20:]
        performance_chart = [
            {
                "timestamp": event.get("timestamp", ""),
                "performance_score": event.get("performance_score", 0.0),
                "topic": event.get("topic", ""),
            }
            for event in recent_events
        ]

        return {
            "total_learning_events": total_events,
            "average_performance": average_performance,
            "trend_direction": trend_direction,
            "performance_chart": performance_chart,
            "most_common_topics": self._get_most_common_topics(combined_events),
        }

    def _get_most_common_topics(self, events: list[dict]) -> list[dict[str, Any]]:
        """Helper method to get most common topics."""
        topic_counts = {}
        for event in events:
            topic = event.get("topic", "unknown")
            topic_counts[topic] = topic_counts.get(topic, 0) + 1

        # Convert to list and sort by count
        topic_list = [{"topic": topic, "count": count} for topic, count in topic_counts.items()]
        topic_list.sort(key=lambda x: x["count"], reverse=True)
        return topic_list[:5]  # Return top 5


class LearningAnalyticsDashboard:
    """Provides a dashboard interface for learning analytics."""

    def __init__(self, agent_id: str = "system:analytics_dashboard") -> None:
        """Initialize the learning analytics dashboard.

        Args:
            agent_id: Identifier for the agent being tracked

        """
        self.tracker = LearningHistoryTracker(agent_id)
        self.agent_id = agent_id

    def generate_learning_report(self) -> dict[str, Any]:
        """Generate a comprehensive learning report.

        Returns:
            Dictionary containing the learning report

        """
        return {
            "agent_id": self.agent_id,
            "report_timestamp": datetime.now().isoformat(),
            "performance_trends": self.tracker.get_performance_trends(),
            "knowledge_gaps": self.tracker.identify_knowledge_gaps(),
            "improvement_patterns": self.tracker.get_improvement_patterns(),
            "summary": self._generate_summary(),
        }

    def _generate_summary(self) -> dict[str, Any]:
        """Generate a summary of learning progress."""
        trends = self.tracker.get_performance_trends()
        gaps = self.tracker.identify_knowledge_gaps()
        patterns = self.tracker.get_improvement_patterns()

        return {
            "total_events": trends["total_learning_events"],
            "overall_performance": trends["average_performance"],
            "trend_direction": trends["trend_direction"],
            "critical_gaps_count": len([g for g in gaps if g["gap_severity"] == "HIGH"]),
            "improved_topics_count": len([p for p in patterns if p["significant_improvement"]]),
            "most_studied_topics": trends["most_common_topics"][:3],
        }


# Convenience function for initialization
def create_learning_tracker(agent_id: str = "system:default_learning_tracker") -> LearningHistoryTracker:
    """Create a learning history tracker instance.

    Args:
        agent_id: Agent identifier for the tracker

    Returns:
        LearningHistoryTracker instance

    """
    return LearningHistoryTracker(agent_id)
