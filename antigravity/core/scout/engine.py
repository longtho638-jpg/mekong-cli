"""
Scout Engine - Codebase Intelligence and Search
================================================
Unified search engine for files, content, and code definitions.
Uses ripgrep for performance when available.
"""

import logging
import os
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """A single search result."""

    path: str
    line_number: Optional[int] = None
    content: Optional[str] = None
    match_type: str = "file"  # file, content, definition
    context: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ScoutReport:
    """Scout operation report."""

    query: str
    results: List[SearchResult]
    total_found: int
    search_type: str
    duration_ms: float = 0.0


class ScoutEngine:
    """
    🔍 Scout Engine - Codebase Intelligence

    Provides fast, accurate file and content search across the codebase.
    """

    def __init__(self, root_path: Optional[str] = None):
        self.root_path = Path(root_path or os.getcwd())
        self.has_ripgrep = self._check_ripgrep()
        self._ignore_patterns = [
            "node_modules",
            ".git",
            "__pycache__",
            ".next",
            "dist",
            "build",
            ".cache",
            "*.pyc",
            "*.log",
        ]

    def _check_ripgrep(self) -> bool:
        """Check if ripgrep (rg) is available."""
        try:
            subprocess.run(["rg", "--version"], capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def search_files(self, pattern: str, limit: int = 50) -> ScoutReport:
        """
        Search for files matching a glob pattern.

        Args:
            pattern: Glob pattern or filename to search for
            limit: Maximum number of results

        Returns:
            ScoutReport with matching files
        """
        import time

        start = time.time()
        results = []

        try:
            if self.has_ripgrep:
                # Use ripgrep for file search (faster)
                cmd = ["rg", "--files", "-g", f"*{pattern}*", str(self.root_path)]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                for line in proc.stdout.strip().split("\n")[:limit]:
                    if line:
                        results.append(SearchResult(path=line, match_type="file"))
            else:
                # Fallback to glob
                for path in self.root_path.rglob(f"*{pattern}*"):
                    if len(results) >= limit:
                        break
                    if not any(p in str(path) for p in self._ignore_patterns):
                        results.append(SearchResult(path=str(path), match_type="file"))
        except Exception as e:
            logger.error(f"File search error: {e}")

        duration = (time.time() - start) * 1000
        return ScoutReport(
            query=pattern,
            results=results,
            total_found=len(results),
            search_type="file",
            duration_ms=duration,
        )

    def search_content(self, query: str, file_pattern: str = "*", limit: int = 50) -> ScoutReport:
        """
        Search for content within files.

        Args:
            query: Text or regex to search for
            file_pattern: Glob pattern to filter files
            limit: Maximum number of results

        Returns:
            ScoutReport with matching lines
        """
        import time

        start = time.time()
        results = []

        try:
            if self.has_ripgrep:
                cmd = ["rg", "-n", "--max-count", str(limit), query, str(self.root_path)]
                if file_pattern != "*":
                    cmd.extend(["-g", file_pattern])

                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                for line in proc.stdout.strip().split("\n")[:limit]:
                    if ":" in line:
                        parts = line.split(":", 2)
                        if len(parts) >= 3:
                            results.append(
                                SearchResult(
                                    path=parts[0],
                                    line_number=int(parts[1]) if parts[1].isdigit() else None,
                                    content=parts[2].strip(),
                                    match_type="content",
                                )
                            )
            else:
                # Fallback to grep
                cmd = ["grep", "-rn", query, str(self.root_path)]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                for line in proc.stdout.strip().split("\n")[:limit]:
                    if ":" in line:
                        parts = line.split(":", 2)
                        if len(parts) >= 3:
                            results.append(
                                SearchResult(
                                    path=parts[0],
                                    line_number=int(parts[1]) if parts[1].isdigit() else None,
                                    content=parts[2].strip(),
                                    match_type="content",
                                )
                            )
        except Exception as e:
            logger.error(f"Content search error: {e}")

        duration = (time.time() - start) * 1000
        return ScoutReport(
            query=query,
            results=results,
            total_found=len(results),
            search_type="content",
            duration_ms=duration,
        )

    def find_definitions(self, symbol: str, language: str = "python") -> ScoutReport:
        """
        Find function, class, or variable definitions.

        Args:
            symbol: Name of the symbol to find
            language: Programming language (python, javascript, typescript)

        Returns:
            ScoutReport with definition locations
        """
        import time

        start = time.time()
        results = []

        # Language-specific patterns
        patterns = {
            "python": [
                rf"^\s*def\s+{symbol}\s*\(",
                rf"^\s*class\s+{symbol}\s*[:\(]",
                rf"^\s*{symbol}\s*=",
            ],
            "javascript": [
                rf"function\s+{symbol}\s*\(",
                rf"const\s+{symbol}\s*=",
                rf"let\s+{symbol}\s*=",
                rf"class\s+{symbol}\s*{{{{",
            ],
            "typescript": [
                rf"function\s+{symbol}\s*[<\(]",
                rf"const\s+{symbol}\s*[:=]",
                rf"class\s+{symbol}\s*[<{{]",
                rf"interface\s+{symbol}\s*[<{{]",
                rf"type\s+{symbol}\s*=",
            ],
        }

        lang_patterns = patterns.get(language, patterns["python"])
        file_ext = {"python": "*.py", "javascript": "*.js", "typescript": "*.ts"}.get(language, "*")

        for pattern in lang_patterns:
            report = self.search_content(pattern, file_ext, limit=20)
            for result in report.results:
                result.match_type = "definition"
                result.context["language"] = language
                result.context["pattern"] = pattern
                results.append(result)

        # Deduplicate
        seen = set()
        unique_results = []
        for r in results:
            key = (r.path, r.line_number)
            if key not in seen:
                seen.add(key)
                unique_results.append(r)

        duration = (time.time() - start) * 1000
        return ScoutReport(
            query=symbol,
            results=unique_results,
            total_found=len(unique_results),
            search_type="definition",
            duration_ms=duration,
        )

    def scout(self, query: str, search_type: str = "auto") -> ScoutReport:
        """
        Unified scout interface.

        Args:
            query: Search query
            search_type: auto, file, content, or definition

        Returns:
            ScoutReport with results
        """
        if search_type == "file":
            return self.search_files(query)
        elif search_type == "content":
            return self.search_content(query)
        elif search_type == "definition":
            return self.find_definitions(query)
        else:
            # Auto-detect: if query looks like a filename, search files
            if "." in query or "/" in query:
                return self.search_files(query)
            else:
                return self.search_content(query)


# Default instance
scout_engine = ScoutEngine()
