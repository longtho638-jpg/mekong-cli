"""
Mekong CLI - Auto-Discovery Engine

Detects project type and suggests matching recipes automatically.
Inspired by Netdata's service auto-discovery: scans filesystem signals
(package.json, pyproject.toml, Dockerfile, etc.) to route goals.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class ProjectSignal:
    """A file-based signal indicating project type."""

    file_pattern: str
    project_type: str
    confidence: float = 0.8
    description: str = ""


@dataclass
class DiscoveredProject:
    """Result of project auto-discovery."""

    project_type: str
    confidence: float
    signals: List[str] = field(default_factory=list)
    suggested_recipes: List[str] = field(default_factory=list)
    root_dir: str = ""


# Default signal registry (extensible)
DEFAULT_SIGNALS: List[ProjectSignal] = [
    ProjectSignal("pyproject.toml", "python", 0.9, "Python project (Poetry/PEP 621)"),
    ProjectSignal("setup.py", "python", 0.8, "Python project (setuptools)"),
    ProjectSignal("requirements.txt", "python", 0.7, "Python project (pip)"),
    ProjectSignal("package.json", "node", 0.9, "Node.js project"),
    ProjectSignal("tsconfig.json", "typescript", 0.9, "TypeScript project"),
    ProjectSignal("next.config.*", "nextjs", 0.95, "Next.js project"),
    ProjectSignal("vite.config.*", "vite", 0.9, "Vite project"),
    ProjectSignal("Dockerfile", "docker", 0.8, "Containerized project"),
    ProjectSignal("docker-compose.yml", "docker-compose", 0.85, "Multi-container project"),
    ProjectSignal("Cargo.toml", "rust", 0.95, "Rust project"),
    ProjectSignal("go.mod", "go", 0.95, "Go project"),
    ProjectSignal(".claude/CLAUDE.md", "claude-project", 0.7, "Claude Code project"),
    ProjectSignal("wrangler.toml", "cloudflare-worker", 0.9, "Cloudflare Worker"),
    ProjectSignal("vercel.json", "vercel", 0.85, "Vercel deployment"),
    ProjectSignal("supabase/config.toml", "supabase", 0.9, "Supabase project"),
]

# Recipe suggestions per project type
RECIPE_MAP: Dict[str, List[str]] = {
    "python": ["lint-python", "test-pytest", "build-python"],
    "node": ["lint-eslint", "test-jest", "build-npm"],
    "typescript": ["lint-tsc", "test-jest", "build-tsc"],
    "nextjs": ["lint-nextjs", "test-jest", "build-next", "deploy-vercel"],
    "vite": ["lint-eslint", "test-vitest", "build-vite"],
    "docker": ["build-docker", "scan-docker"],
    "rust": ["build-cargo", "test-cargo", "lint-clippy"],
    "go": ["build-go", "test-go", "lint-golangci"],
    "cloudflare-worker": ["deploy-wrangler", "test-miniflare"],
    "vercel": ["deploy-vercel", "preview-vercel"],
    "supabase": ["migrate-supabase", "test-supabase"],
}


class AutoDiscovery:
    """
    Auto-discovers project type by scanning filesystem signals.

    Inspired by Netdata's auto-discovery: probes filesystem for known
    markers and suggests appropriate recipes/agents.
    """

    def __init__(
        self,
        signals: Optional[List[ProjectSignal]] = None,
        recipe_map: Optional[Dict[str, List[str]]] = None,
    ) -> None:
        """Initialize with optional custom signals and recipe mapping."""
        self._signals = signals or DEFAULT_SIGNALS
        self._recipe_map = recipe_map or RECIPE_MAP

    def discover(self, root_dir: Optional[str] = None) -> List[DiscoveredProject]:
        """
        Scan a directory for project type signals.

        Args:
            root_dir: Directory to scan. Defaults to current directory.

        Returns:
            List of discovered projects sorted by confidence (highest first).
        """
        scan_path = Path(root_dir) if root_dir else Path.cwd()
        discoveries: Dict[str, DiscoveredProject] = {}

        for signal in self._signals:
            # Support glob patterns in file_pattern
            if "*" in signal.file_pattern:
                matches = list(scan_path.glob(signal.file_pattern))
            else:
                matches = [scan_path / signal.file_pattern]

            for match in matches:
                if match.exists():
                    ptype = signal.project_type
                    if ptype not in discoveries:
                        discoveries[ptype] = DiscoveredProject(
                            project_type=ptype,
                            confidence=signal.confidence,
                            root_dir=str(scan_path),
                            suggested_recipes=self._recipe_map.get(ptype, []),
                        )
                    disc = discoveries[ptype]
                    disc.signals.append(str(match.name))
                    # Boost confidence with multiple signals (max 0.99)
                    disc.confidence = min(disc.confidence + 0.05, 0.99)

        results = sorted(discoveries.values(), key=lambda d: d.confidence, reverse=True)
        return results

    def suggest_recipe(self, goal: str, root_dir: Optional[str] = None) -> Optional[str]:
        """
        Suggest best recipe for a goal based on project type.

        Args:
            goal: User's goal string.
            root_dir: Directory to scan.

        Returns:
            Recipe name or None if no match.
        """
        projects = self.discover(root_dir)
        if not projects:
            return None

        top = projects[0]
        goal_lower = goal.lower()

        # Match goal keywords to recipe categories
        for recipe in top.suggested_recipes:
            category = recipe.split("-")[0]  # e.g., "lint", "test", "build"
            if category in goal_lower:
                return recipe

        # Default: return first suggested recipe
        return top.suggested_recipes[0] if top.suggested_recipes else None

    def add_signal(self, signal: ProjectSignal) -> None:
        """Add a custom signal to the discovery engine."""
        self._signals.append(signal)

    def add_recipe_mapping(self, project_type: str, recipes: List[str]) -> None:
        """Add recipe suggestions for a project type."""
        existing = self._recipe_map.get(project_type, [])
        self._recipe_map[project_type] = existing + recipes


__all__ = [
    "AutoDiscovery",
    "DiscoveredProject",
    "ProjectSignal",
    "DEFAULT_SIGNALS",
    "RECIPE_MAP",
]
