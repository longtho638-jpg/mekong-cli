"""
🧠 Agent Memory - Learning from Past Executions

Agents learn patterns, remember outcomes, and improve over time.

Usage:
    from antigravity.core.agent_memory import AgentMemory
    memory = AgentMemory()
    memory.remember("debugger", {"bug": "auth"}, "fixed")
    memories = memory.recall("debugger", "auth")
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import json


@dataclass
class Memory:
    """Single memory entry."""
    agent: str
    context: Dict[str, Any]
    outcome: str
    success: bool
    timestamp: datetime = field(default_factory=datetime.now)
    patterns: List[str] = field(default_factory=list)


@dataclass
class Pattern:
    """Learned pattern."""
    agent: str
    pattern: str
    success_rate: float
    occurrences: int
    last_seen: datetime


class AgentMemory:
    """
    🧠 Agent Memory System
    
    Remembers past executions and learns patterns for improvement.
    """
    
    def __init__(self, storage_path: str = ".antigravity/memory"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.memories: List[Memory] = []
        self.patterns: Dict[str, List[Pattern]] = {}
        self._load_memories()
    
    def remember(
        self, 
        agent: str, 
        context: Dict[str, Any], 
        outcome: str,
        success: bool = True,
        patterns: List[str] = None
    ) -> Memory:
        """
        Store a memory from an agent execution.
        """
        memory = Memory(
            agent=agent,
            context=context,
            outcome=outcome,
            success=success,
            patterns=patterns or [],
        )
        self.memories.append(memory)
        
        # Update patterns
        for pattern in memory.patterns:
            self._update_pattern(agent, pattern, success)
        
        self._save_memories()
        return memory
    
    def recall(self, agent: str, query: str = None, limit: int = 10) -> List[Memory]:
        """
        Recall memories for an agent.
        Optionally filter by query in context.
        """
        agent_memories = [m for m in self.memories if m.agent == agent]
        
        if query:
            agent_memories = [
                m for m in agent_memories
                if query.lower() in str(m.context).lower()
            ]
        
        # Sort by timestamp, newest first
        agent_memories.sort(key=lambda m: m.timestamp, reverse=True)
        return agent_memories[:limit]
    
    def get_success_rate(self, agent: str) -> float:
        """Get success rate for an agent."""
        agent_memories = [m for m in self.memories if m.agent == agent]
        if not agent_memories:
            return 0.0
        successful = sum(1 for m in agent_memories if m.success)
        return successful / len(agent_memories)
    
    def learn_pattern(self, agent: str, pattern: str, success: bool = True):
        """Learn a new pattern."""
        self._update_pattern(agent, pattern, success)
    
    def get_patterns(self, agent: str) -> List[Pattern]:
        """Get learned patterns for an agent."""
        return self.patterns.get(agent, [])
    
    def get_best_patterns(self, agent: str, limit: int = 5) -> List[Pattern]:
        """Get highest success rate patterns."""
        patterns = self.get_patterns(agent)
        sorted_patterns = sorted(patterns, key=lambda p: p.success_rate, reverse=True)
        return sorted_patterns[:limit]
    
    def _update_pattern(self, agent: str, pattern: str, success: bool):
        """Update or create a pattern."""
        if agent not in self.patterns:
            self.patterns[agent] = []
        
        # Find existing pattern
        for p in self.patterns[agent]:
            if p.pattern == pattern:
                # Update
                total = p.occurrences
                new_rate = (p.success_rate * total + (1 if success else 0)) / (total + 1)
                p.success_rate = new_rate
                p.occurrences += 1
                p.last_seen = datetime.now()
                return
        
        # Create new
        self.patterns[agent].append(Pattern(
            agent=agent,
            pattern=pattern,
            success_rate=1.0 if success else 0.0,
            occurrences=1,
            last_seen=datetime.now(),
        ))
    
    def _save_memories(self):
        """Save memories to disk."""
        try:
            data = {
                "memories": [
                    {
                        "agent": m.agent,
                        "context": m.context,
                        "outcome": m.outcome,
                        "success": m.success,
                        "timestamp": m.timestamp.isoformat(),
                        "patterns": m.patterns,
                    }
                    for m in self.memories[-1000:]  # Keep last 1000
                ]
            }
            path = self.storage_path / "memories.json"
            path.write_text(json.dumps(data, indent=2))
        except Exception:
            pass  # Silent fail for memory storage
    
    def _load_memories(self):
        """Load memories from disk."""
        try:
            path = self.storage_path / "memories.json"
            if path.exists():
                data = json.loads(path.read_text())
                for m in data.get("memories", []):
                    self.memories.append(Memory(
                        agent=m["agent"],
                        context=m["context"],
                        outcome=m["outcome"],
                        success=m["success"],
                        timestamp=datetime.fromisoformat(m["timestamp"]),
                        patterns=m.get("patterns", []),
                    ))
        except Exception:
            pass  # Silent fail for memory loading
    
    def get_stats(self) -> Dict[str, Any]:
        """Get memory statistics."""
        agents = set(m.agent for m in self.memories)
        return {
            "total_memories": len(self.memories),
            "agents_with_memory": len(agents),
            "total_patterns": sum(len(p) for p in self.patterns.values()),
            "overall_success_rate": sum(1 for m in self.memories if m.success) / len(self.memories) if self.memories else 0,
        }
    
    def print_dashboard(self):
        """Print memory dashboard."""
        stats = self.get_stats()
        
        print("\n🧠 AGENT MEMORY DASHBOARD")
        print("═" * 60)
        print(f"   Total Memories: {stats['total_memories']}")
        print(f"   Agents with Memory: {stats['agents_with_memory']}")
        print(f"   Learned Patterns: {stats['total_patterns']}")
        print(f"   Overall Success: {stats['overall_success_rate']:.1%}")
        
        # Top agents by memory
        if self.memories:
            print("\n📊 AGENTS BY MEMORY:")
            agent_counts = {}
            for m in self.memories:
                agent_counts[m.agent] = agent_counts.get(m.agent, 0) + 1
            top = sorted(agent_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            for agent, count in top:
                rate = self.get_success_rate(agent)
                print(f"   {agent}: {count} memories ({rate:.0%} success)")
        
        print("═" * 60)


# Global memory instance
_memory_instance: Optional[AgentMemory] = None

def get_memory() -> AgentMemory:
    """Get global memory instance."""
    global _memory_instance
    if _memory_instance is None:
        _memory_instance = AgentMemory()
    return _memory_instance
