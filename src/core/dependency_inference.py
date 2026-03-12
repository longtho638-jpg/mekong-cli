"""Mekong CLI - Dependency Inference.

Auto-detects dependencies between recipe steps via I/O analysis.
Analyzes step descriptions to extract produces/consumes sets, then
matches producers to consumers to infer dependency edges.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .parser import RecipeStep


@dataclass
class StepIO:
    """Tracks what a step produces and consumes."""

    produces: set[str] = field(default_factory=set)
    consumes: set[str] = field(default_factory=set)


class DependencyInference:
    """Infers dependencies between steps via I/O pattern matching.

    Analyzes step descriptions using regex to detect:
    - File I/O (redirects, create/read/write/cat keywords)
    - Package dependencies (pip install / npm install → import)
    - Environment variables (export VAR= → $VAR usage)
    - Git state transitions (git add → git commit)
    """

    def extract_io(self, step: "RecipeStep") -> StepIO:
        """Extract produces/consumes sets from a step's description and title.

        Args:
            step: Recipe step to analyze.

        Returns:
            StepIO with produces and consumes sets populated.

        """
        text = f"{step.title} {step.description}"
        io = StepIO()

        io.produces.update(self._extract_file_produces(text))
        io.consumes.update(self._extract_file_consumes(text))

        pkg_prod, pkg_cons = self._extract_pkg_io(text)
        io.produces.update(pkg_prod)
        io.consumes.update(pkg_cons)

        env_prod, env_cons = self._extract_env_io(text)
        io.produces.update(env_prod)
        io.consumes.update(env_cons)

        git_prod, git_cons = self._extract_git_io(text)
        io.produces.update(git_prod)
        io.consumes.update(git_cons)

        return io

    def infer_dependencies(self, steps: list["RecipeStep"]) -> dict[int, list[int]]:
        """Infer step dependencies by matching producers to consumers.

        Scans all steps for I/O tokens, then for each step that consumes
        a token, finds earlier steps that produce that token and adds
        an inferred dependency edge.

        Args:
            steps: Ordered list of RecipeStep objects.

        Returns:
            Dict mapping step.order → list of step.order dependencies (inferred).

        """
        step_ios: dict[int, StepIO] = {s.order: self.extract_io(s) for s in steps}
        inferred: dict[int, list[int]] = {s.order: [] for s in steps}

        # For each step, check if any earlier step produces what it consumes
        for i, consumer in enumerate(steps):
            consumer_io = step_ios[consumer.order]
            if not consumer_io.consumes:
                continue

            for producer in steps[:i]:  # only look at earlier steps
                producer_io = step_ios[producer.order]
                overlap = consumer_io.consumes & producer_io.produces
                if overlap and producer.order not in inferred[consumer.order]:
                    inferred[consumer.order].append(producer.order)

        return inferred

    def merge_dependencies(
        self,
        steps: list["RecipeStep"],
        inferred: dict[int, list[int]],
    ) -> None:
        """Merge inferred deps into steps in-place. Explicit deps take precedence.

        Union of explicit + inferred, deduped. Existing explicit deps are
        preserved as-is; inferred deps are added if not already present.

        Args:
            steps: List of RecipeStep objects to update.
            inferred: Dict from infer_dependencies (order → [order, ...]).

        """
        for step in steps:
            extra = inferred.get(step.order, [])
            if not extra:
                continue

            existing = set(step.dependencies)
            for dep in extra:
                if dep not in existing:
                    step.dependencies.append(dep)
                    existing.add(dep)

            # Keep params in sync
            if "dependencies" in step.params:
                step.params["dependencies"] = list(step.dependencies)

    # ------------------------------------------------------------------
    # Private extractors
    # ------------------------------------------------------------------

    def _extract_file_produces(self, text: str) -> set[str]:
        """Detect file tokens that this text produces."""
        produced: set[str] = set()

        # Redirect: command > file.ext or >> file.ext
        for m in re.finditer(r">+\s*([\w./\-]+\.\w+)", text):
            produced.add(f"file:{m.group(1)}")

        # create/generate/write/touch/mkdir keywords followed by filename
        for m in re.finditer(
            r"\b(?:create|generate|write|touch|output|save)\s+([\w./\-]+\.\w+)",
            text,
            re.IGNORECASE,
        ):
            produced.add(f"file:{m.group(1)}")

        # cp/mv destination (second arg)
        for m in re.finditer(
            r"\b(?:cp|mv)\s+\S+\s+([\w./\-]+\.\w+)",
            text,
            re.IGNORECASE,
        ):
            produced.add(f"file:{m.group(1)}")

        return produced

    def _extract_file_consumes(self, text: str) -> set[str]:
        """Detect file tokens that this text consumes."""
        consumed: set[str] = set()

        # read/cat/source/load/open followed by filename
        for m in re.finditer(
            r"\b(?:cat|read|source|load|open|import|include|require|process)\s+([\w./\-]+\.\w+)",
            text,
            re.IGNORECASE,
        ):
            consumed.add(f"file:{m.group(1)}")

        # cp/mv source (first arg)
        for m in re.finditer(
            r"\b(?:cp|mv)\s+([\w./\-]+\.\w+)\s+\S+",
            text,
            re.IGNORECASE,
        ):
            consumed.add(f"file:{m.group(1)}")

        return consumed

    def _extract_pkg_io(self, text: str) -> tuple[set[str], set[str]]:
        """Detect package install (produces) and import (consumes)."""
        produced: set[str] = set()
        consumed: set[str] = set()

        # pip install pkg or npm install pkg
        for m in re.finditer(
            r"\b(?:pip|pip3)\s+install\s+([\w\-\[,\]]+)",
            text,
            re.IGNORECASE,
        ):
            # Handle comma-separated or space-separated multi-package installs
            pkgs = re.split(r"[\s,]+", m.group(1))
            for pkg in pkgs:
                pkg = pkg.strip().strip("[]")
                if pkg:
                    produced.add(f"pkg:{pkg.split('[')[0]}")

        for m in re.finditer(
            r"\bnpm\s+install\s+([\w\-@/.]+)",
            text,
            re.IGNORECASE,
        ):
            produced.add(f"pkg:{m.group(1)}")

        # Python import statements
        for m in re.finditer(
            r"\bimport\s+([\w]+)",
            text,
        ):
            consumed.add(f"pkg:{m.group(1)}")

        # from X import ...
        for m in re.finditer(
            r"\bfrom\s+([\w.]+)\s+import",
            text,
        ):
            # Use top-level package name
            consumed.add(f"pkg:{m.group(1).split('.')[0]}")

        return produced, consumed

    def _extract_env_io(self, text: str) -> tuple[set[str], set[str]]:
        """Detect export VAR= (produces) and $VAR / ${VAR} usage (consumes)."""
        produced: set[str] = set()
        consumed: set[str] = set()

        # export VAR=value
        for m in re.finditer(r"\bexport\s+([A-Z_][A-Z0-9_]*)\s*=", text):
            produced.add(f"env:{m.group(1)}")

        # $VAR or ${VAR}
        for m in re.finditer(r"\$\{?([A-Z_][A-Z0-9_]*)\}?", text):
            consumed.add(f"env:{m.group(1)}")

        return produced, consumed

    def _extract_git_io(self, text: str) -> tuple[set[str], set[str]]:
        """Detect git state transitions."""
        produced: set[str] = set()
        consumed: set[str] = set()

        text_lower = text.lower()

        if re.search(r"\bgit\s+add\b", text_lower):
            produced.add("git:staged")

        if re.search(r"\bgit\s+commit\b", text_lower):
            consumed.add("git:staged")
            produced.add("git:commit")

        if re.search(r"\bgit\s+push\b", text_lower):
            consumed.add("git:commit")

        return produced, consumed


__all__ = ["DependencyInference", "StepIO"]
