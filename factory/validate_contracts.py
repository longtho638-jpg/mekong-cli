"""
Validate all JSON contract files in factory/contracts/ against their schemas.

Checks cross-references: layer names match layers.yaml, agent IDs match registry.
Exit 0 if all pass, exit 1 if any fail.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger(__name__)

FACTORY_DIR = Path(__file__).parent
REPO_ROOT = FACTORY_DIR.parent
CONTRACTS_DIR = FACTORY_DIR / "contracts"
LAYERS_PATH = FACTORY_DIR / "layers.yaml"

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_layers() -> set[str]:
    with LAYERS_PATH.open() as f:
        data = yaml.safe_load(f)
    return set(data.get("layers", {}).keys())


def validate_against_schema(data: dict[str, Any], schema: dict[str, Any], label: str) -> list[str]:
    if not HAS_JSONSCHEMA:
        return []
    errors: list[str] = []
    validator = jsonschema.Draft7Validator(schema)
    for err in validator.iter_errors(data):
        errors.append(f"{label}: {err.message} at {list(err.path)}")
    return errors


def check_command_contract(path: Path, schema: dict[str, Any], valid_layers: set[str]) -> list[str]:
    errors: list[str] = []
    try:
        data = load_json(path)
    except json.JSONDecodeError as e:
        return [f"{path.name}: invalid JSON — {e}"]

    errors.extend(validate_against_schema(data, schema, path.name))

    layer = data.get("layer")
    if layer and layer not in valid_layers:
        errors.append(f"{path.name}: unknown layer '{layer}' (valid: {sorted(valid_layers)})")

    credit_cost = data.get("execution", {}).get("credit_cost")
    if credit_cost is not None and credit_cost < 0:
        errors.append(f"{path.name}: credit_cost must be >= 0, got {credit_cost}")

    return errors


def check_registry(path: Path, file_key: str) -> list[str]:
    errors: list[str] = []
    try:
        data = load_json(path)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        return [f"{path.name}: {e}"]

    entries = data.get(file_key, [])
    for entry in entries:
        entry_path = entry.get("path", "")
        # Skip external/symlinked skills (ClaudeKit managed, not in repo)
        if entry_path.startswith(".claude/skills/") or entry_path.startswith("mekong/skills/"):
            continue
        ref_path = REPO_ROOT / entry_path
        if not ref_path.exists():
            errors.append(f"{path.name}: referenced file not found: {entry_path}")
    return errors


def check_approval_rules(path: Path, valid_layers: set[str]) -> list[str]:
    errors: list[str] = []
    try:
        data = load_json(path)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        return [f"{path.name}: {e}"]

    for rule in data.get("rules", []):
        for layer_key in ("from_layer", "to_layer"):
            layer = rule.get(layer_key)
            if layer and layer not in valid_layers:
                errors.append(f"approval_rules: unknown {layer_key} '{layer}'")
    return errors


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    cmd_schema_path = CONTRACTS_DIR / "commands.schema.json"
    if not cmd_schema_path.exists():
        logger.error("commands.schema.json not found at %s", cmd_schema_path)
        return 1

    cmd_schema = load_json(cmd_schema_path)
    valid_layers = load_layers()

    all_errors: list[str] = []
    checked = 0

    cmd_contracts_dir = CONTRACTS_DIR / "commands"
    if cmd_contracts_dir.exists():
        for contract_path in sorted(cmd_contracts_dir.glob("*.json")):
            errs = check_command_contract(contract_path, cmd_schema, valid_layers)
            all_errors.extend(errs)
            checked += 1
            if errs:
                for e in errs:
                    logger.warning("FAIL  %s", e)
            else:
                logger.debug("PASS  %s", contract_path.name)

    skills_path = CONTRACTS_DIR / "skills.registry.json"
    if skills_path.exists():
        errs = check_registry(skills_path, "skills")
        all_errors.extend(errs)
        checked += 1

    agents_path = CONTRACTS_DIR / "agents.registry.json"
    if agents_path.exists():
        errs = check_registry(agents_path, "agents")
        all_errors.extend(errs)
        checked += 1

    approval_path = CONTRACTS_DIR / "approval_rules.json"
    if approval_path.exists():
        errs = check_approval_rules(approval_path, valid_layers)
        all_errors.extend(errs)
        checked += 1

    print(f"\nValidated {checked} files — {len(all_errors)} errors")
    if all_errors:
        for err in all_errors:
            print(f"  ERROR: {err}")
        return 1

    print("All contracts valid.")
    if not HAS_JSONSCHEMA:
        print("Note: install jsonschema for full schema validation (pip install jsonschema)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
