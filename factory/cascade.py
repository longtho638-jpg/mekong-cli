"""
Vibe Coding Factory — Cascade Engine.

Detects layer transition signals in command output and suggests
downstream commands. Also builds session lineage trees.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import yaml

logger = logging.getLogger(__name__)

_FACTORY_DIR = Path(__file__).parent


@dataclass
class CascadeSuggestion:
    """A suggested downstream command based on detected trigger keywords."""

    command: str
    reason: str
    target_layer: str
    context: str
    confidence: float = 1.0


@dataclass
class SessionLineage:
    """Tracks the chain of commands executed in a session."""

    session_id: str
    steps: list[dict] = field(default_factory=list)


def _load_yaml(path: Path) -> dict:
    """Load a YAML file and return parsed content."""
    try:
        with path.open("r", encoding="utf-8") as fh:
            return yaml.safe_load(fh) or {}
    except FileNotFoundError:
        logger.error("YAML file not found: %s", path)
        return {}
    except yaml.YAMLError as exc:
        logger.error("YAML parse error in %s: %s", path, exc)
        return {}


class CascadeEngine:
    """
    Detects cascade opportunities between factory layers.

    Scans command output for trigger keywords and returns suggestions
    for commands in the next layer down the pyramid.
    """

    def __init__(self, layers_config: dict | None = None) -> None:
        if layers_config is not None:
            layers_data = layers_config
        else:
            layers_data = _load_yaml(_FACTORY_DIR / "layers.yaml")
        triggers_data = _load_yaml(_FACTORY_DIR / "cascade_triggers.yaml")

        self._layers: dict = layers_data.get("layers", {})
        self._triggers: dict = triggers_data.get("triggers", {})
        self._lineage: dict[str, SessionLineage] = {}

    def detect_cascades(
        self,
        current_layer: str,
        command_output: str,
    ) -> list[CascadeSuggestion]:
        """
        Scan command_output for trigger keywords and return cascade suggestions.

        Args:
            current_layer: Name of the layer that produced the output.
            command_output: Raw text output from the executed command.

        Returns:
            List of CascadeSuggestion objects ordered by relevance.
        """
        if current_layer not in self._layers:
            logger.warning("Unknown layer: %s", current_layer)
            return []

        layer_cfg = self._layers[current_layer]
        cascades_to: list[str] = layer_cfg.get("cascades_to", [])
        if not cascades_to:
            return []

        suggestions: list[CascadeSuggestion] = []
        output_lower = command_output.lower()

        for target_layer in cascades_to:
            trigger_key = f"{current_layer}_to_{target_layer}"
            trigger_cfg = self._triggers.get(trigger_key, {})
            keywords: list[str] = trigger_cfg.get("keywords", [])

            matched = [kw for kw in keywords if kw.lower() in output_lower]
            if not matched:
                continue

            # Prefer suggest_commands from trigger config, fallback to layer commands
            suggest_cmds: list[str] = trigger_cfg.get("suggest_commands", [])
            if not suggest_cmds:
                suggest_cmds = self._layers.get(target_layer, {}).get(
                    "commands", []
                )[:3]
            if not suggest_cmds:
                continue

            for cmd in suggest_cmds:
                suggestions.append(
                    CascadeSuggestion(
                        command=cmd,
                        reason=f"Detected keywords: {', '.join(matched[:3])}",
                        target_layer=target_layer,
                        context=trigger_cfg.get("description", ""),
                        confidence=len(matched) / max(len(keywords), 1),
                    )
                )

        suggestions.sort(key=lambda s: s.confidence, reverse=True)
        logger.debug(
            "Layer %s → %d cascade suggestions", current_layer, len(suggestions)
        )
        return suggestions

    def build_lineage(self, session_id: str) -> dict:
        """
        Return the full lineage tree for a session.

        Args:
            session_id: Unique identifier for the session.

        Returns:
            Dict with session_id and ordered list of steps.
        """
        session = self._lineage.get(session_id)
        if session is None:
            logger.debug("No lineage found for session: %s", session_id)
            return {"session_id": session_id, "steps": []}
        return {
            "session_id": session.session_id,
            "steps": session.steps,
        }

    def record_step(
        self,
        session_id: str,
        layer: str,
        command: str,
        triggered_by: Optional[str] = None,
    ) -> None:
        """
        Append a command execution step to the session lineage.

        Args:
            session_id: Session identifier.
            layer: Factory layer name.
            command: Command that was executed.
            triggered_by: Parent command that cascaded to this one, if any.
        """
        if session_id not in self._lineage:
            self._lineage[session_id] = SessionLineage(session_id=session_id)

        self._lineage[session_id].steps.append(
            {
                "layer": layer,
                "command": command,
                "triggered_by": triggered_by,
            }
        )
