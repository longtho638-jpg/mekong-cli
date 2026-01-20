"""
Rule Registry - Scalable rule management and semantic retrieval.
"""
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

RULES_DIR = Path(".claude/rules")

class RuleRegistry:
    """
    Manages indexing and retrieval of rules for agents.
    Supports scaling to 500+ atomic rules.
    """
    def __init__(self, rules_dir: Path = RULES_DIR):
        self.rules_dir = rules_dir
        self.rules: Dict[str, Dict[str, Any]] = {}
        self.tag_index: Dict[str, Set[str]] = {}
        self.agent_index: Dict[str, Set[str]] = {}
        self.refresh()

    def refresh(self):
        """Rebuilds the rule index by parsing files."""
        self.rules = {}
        self.tag_index = {}
        self.agent_index = {}

        if not self.rules_dir.exists():
            return

        for rule_file in self.rules_dir.glob("*.md"):
            metadata = self._parse_rule(rule_file)
            name = rule_file.name
            self.rules[name] = metadata

            # Index by tags
            for tag in metadata.get("tags", []):
                if tag not in self.tag_index:
                    self.tag_index[tag] = set()
                self.tag_index[tag].add(name)

            # Index by agents
            for agent in metadata.get("agents", []):
                if agent not in self.agent_index:
                    self.agent_index[agent] = set()
                self.agent_index[agent].add(name)

    def _parse_rule(self, rule_file: Path) -> Dict[str, Any]:
        """Parses metadata from rule file content (Frontmatter or Headers)."""
        content = rule_file.read_text(encoding="utf-8")
        metadata = {
            "title": rule_file.stem,
            "priority": "P2",
            "tags": [],
            "agents": ["*"],
            "path": str(rule_file.absolute())
        }

        # Try to find Frontmatter
        fm_match = re.search(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
        if fm_match:
            fm_content = fm_match.group(1)
            for line in fm_content.split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.strip().lower()
                    val = val.strip()
                    if key == "tags" or key == "agents":
                        # Handle [tag1, tag2] or simple csv
                        val = val.strip("[]")
                        metadata[key] = [v.strip() for v in val.split(",")]
                    else:
                        metadata[key] = val
        else:
            # Fallback to searching for specific markers in text
            tags_match = re.search(r"tags:\s*\[(.*?)\]", content, re.I)
            if tags_match:
                metadata["tags"] = [t.strip() for t in tags_match.group(1).split(",")]

            agents_match = re.search(r"agents:\s*\[(.*?)\]", content, re.I)
            if agents_match:
                metadata["agents"] = [a.strip() for a in agents_match.group(1).split(",")]

        return metadata

    def get_rules_for_agent(self, agent_name: str) -> List[str]:
        """Retrieves all rules applicable to a specific agent."""
        rules = self.agent_index.get(agent_name, set()).copy()
        rules.update(self.agent_index.get("*", set()))
        return sorted(list(rules))

    def search_rules(self, query: str) -> List[str]:
        """Simple keyword search across titles and tags."""
        query = query.lower()
        results = set()
        for name, meta in self.rules.items():
            if query in name.lower() or query in meta.get("title", "").lower():
                results.add(name)
            for tag in meta.get("tags", []):
                if query in tag.lower():
                    results.add(name)
        return sorted(list(results))

# Global instance
rule_registry = RuleRegistry()
