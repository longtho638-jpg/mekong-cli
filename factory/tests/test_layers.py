"""
Tests for factory/layers.yaml integrity.

Verifies:
- All 5 layers are present
- Each layer has required fields
- Each layer has at least one command
- No command appears in more than one layer (no duplicates)
"""

from __future__ import annotations

import logging
from pathlib import Path

import pytest
import yaml

logger = logging.getLogger(__name__)

_FACTORY_DIR = Path(__file__).parent.parent
_LAYERS_PATH = _FACTORY_DIR / "layers.yaml"

REQUIRED_LAYERS = {"founder", "business", "product", "engineering", "ops"}
REQUIRED_FIELDS = {"chapter", "role", "description", "cascades_to", "entry_prompt", "commands"}


@pytest.fixture(scope="module")
def layers_data() -> dict:
    """Load and return layers.yaml content."""
    with _LAYERS_PATH.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    return data.get("layers", {})


def test_all_required_layers_present(layers_data: dict) -> None:
    """All 5 pyramid layers must exist in layers.yaml."""
    assert REQUIRED_LAYERS == set(layers_data.keys()), (
        f"Missing layers: {REQUIRED_LAYERS - set(layers_data.keys())}"
    )


def test_each_layer_has_required_fields(layers_data: dict) -> None:
    """Every layer must have all required configuration fields."""
    for layer_name, cfg in layers_data.items():
        missing = REQUIRED_FIELDS - set(cfg.keys())
        assert not missing, f"Layer '{layer_name}' missing fields: {missing}"


def test_each_layer_has_commands(layers_data: dict) -> None:
    """Every layer must define at least one command."""
    for layer_name, cfg in layers_data.items():
        commands = cfg.get("commands", [])
        assert commands, f"Layer '{layer_name}' has no commands"
        assert len(commands) >= 1


def test_no_duplicate_commands_across_layers(layers_data: dict) -> None:
    """No command should appear in more than one layer."""
    seen: dict[str, str] = {}
    duplicates: list[str] = []

    for layer_name, cfg in layers_data.items():
        for cmd in cfg.get("commands", []):
            cmd_lower = cmd.lower()
            if cmd_lower in seen:
                duplicates.append(
                    f"'{cmd_lower}' in both '{seen[cmd_lower]}' and '{layer_name}'"
                )
            else:
                seen[cmd_lower] = layer_name

    assert not duplicates, "Duplicate commands found:\n" + "\n".join(duplicates)


def test_cascades_to_references_valid_layers(layers_data: dict) -> None:
    """cascades_to must only reference layers that exist."""
    valid_layers = set(layers_data.keys())
    for layer_name, cfg in layers_data.items():
        for target in cfg.get("cascades_to", []):
            assert target in valid_layers, (
                f"Layer '{layer_name}' cascades_to unknown layer '{target}'"
            )


def test_ops_layer_has_no_cascades(layers_data: dict) -> None:
    """The ops layer is the base — it must not cascade to anything."""
    ops_cfg = layers_data.get("ops", {})
    assert ops_cfg.get("cascades_to") == [], (
        "ops layer should have empty cascades_to (it is the base layer)"
    )


def test_entry_prompt_is_non_empty_string(layers_data: dict) -> None:
    """Every layer entry_prompt must be a non-empty string."""
    for layer_name, cfg in layers_data.items():
        prompt = cfg.get("entry_prompt", "")
        assert isinstance(prompt, str) and prompt.strip(), (
            f"Layer '{layer_name}' has blank entry_prompt"
        )
