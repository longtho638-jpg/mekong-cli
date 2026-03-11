"""
Self-validation script for factory/contracts/.

Validates all JSON contracts against schemas, checks referenced files exist,
verifies layers.yaml consistency. Outputs health score 0-100 and writes
factory/self-test-report.json.
"""

from __future__ import annotations

import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger(__name__)

FACTORY_DIR = Path(__file__).parent
REPO_ROOT = FACTORY_DIR.parent
CONTRACTS_DIR = FACTORY_DIR / "contracts"
LAYERS_PATH = FACTORY_DIR / "layers.yaml"
REPORT_PATH = FACTORY_DIR / "self-test-report.json"

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False


@dataclass
class CheckResult:
    name: str
    passed: bool
    details: str
    errors: list[str] = field(default_factory=list)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_layers() -> dict[str, Any]:
    with LAYERS_PATH.open() as f:
        return yaml.safe_load(f).get("layers", {})


def check_schemas_exist() -> CheckResult:
    required = ["commands.schema.json", "missions.schema.json"]
    missing = [f for f in required if not (CONTRACTS_DIR / f).exists()]
    if missing:
        return CheckResult("schemas_exist", False, f"Missing schemas: {missing}", missing)
    return CheckResult("schemas_exist", True, "Both schemas present")


def check_command_contracts(layers: dict[str, Any]) -> CheckResult:
    cmd_dir = CONTRACTS_DIR / "commands"
    if not cmd_dir.exists():
        return CheckResult("command_contracts", False, "commands/ directory not found", ["commands/ missing"])

    schema_path = CONTRACTS_DIR / "commands.schema.json"
    schema = load_json(schema_path) if schema_path.exists() else {}
    valid_layers = set(layers.keys())
    errors: list[str] = []
    count = 0

    for path in sorted(cmd_dir.glob("*.json")):
        try:
            data = load_json(path)
        except json.JSONDecodeError as e:
            errors.append(f"{path.name}: invalid JSON — {e}")
            continue

        count += 1
        layer = data.get("layer")
        if layer not in valid_layers:
            errors.append(f"{path.name}: unknown layer '{layer}'")

        if HAS_JSONSCHEMA and schema:
            v = jsonschema.Draft7Validator(schema)
            for err in v.iter_errors(data):
                errors.append(f"{path.name}: {err.message}")

    detail = f"{count} contracts checked, {len(errors)} errors"
    return CheckResult("command_contracts", len(errors) == 0, detail, errors)


def check_skills_registry() -> CheckResult:
    path = CONTRACTS_DIR / "skills.registry.json"
    if not path.exists():
        return CheckResult("skills_registry", False, "skills.registry.json not found", ["file missing"])

    data = load_json(path)
    errors: list[str] = []
    skills = data.get("skills", [])
    for skill in skills:
        ref = REPO_ROOT / skill.get("path", "")
        if not ref.exists():
            errors.append(f"skill '{skill.get('id')}': file not found at {skill.get('path')}")

    return CheckResult("skills_registry", len(errors) == 0, f"{len(skills)} skills, {len(errors)} missing files", errors)


def check_agents_registry() -> CheckResult:
    path = CONTRACTS_DIR / "agents.registry.json"
    if not path.exists():
        return CheckResult("agents_registry", False, "agents.registry.json not found", ["file missing"])

    data = load_json(path)
    errors: list[str] = []
    agents = data.get("agents", [])
    for agent in agents:
        agent_path = agent.get("path", "")
        ref = REPO_ROOT / agent_path
        # Skip paths under .claude/ — gitignored, only present locally
        if agent_path.startswith(".claude/"):
            continue
        if not ref.exists():
            errors.append(f"agent '{agent.get('id')}': file not found at {agent_path}")

    return CheckResult("agents_registry", len(errors) == 0, f"{len(agents)} agents, {len(errors)} missing files", errors)


def check_layers_consistency(layers: dict[str, Any]) -> CheckResult:
    errors: list[str] = []
    required_fields = {"chapter", "role", "description", "cascades_to", "commands"}
    all_commands: list[str] = []

    for layer_name, layer_data in layers.items():
        missing = required_fields - set(layer_data.keys())
        if missing:
            errors.append(f"layer '{layer_name}': missing fields {missing}")

        cascades_to = layer_data.get("cascades_to", [])
        for target in cascades_to:
            if target not in layers:
                errors.append(f"layer '{layer_name}': cascades_to unknown layer '{target}'")

        cmds = layer_data.get("commands", [])
        all_commands.extend(cmds)

    dupes = {c for c in all_commands if all_commands.count(c) > 1}
    if dupes:
        errors.append(f"Duplicate commands across layers: {sorted(dupes)}")

    detail = f"{len(layers)} layers, {len(all_commands)} commands, {len(errors)} errors"
    return CheckResult("layers_consistency", len(errors) == 0, detail, errors)


def check_contract_coverage(layers: dict[str, Any]) -> CheckResult:
    """Check that every command in layers.yaml has a matching contract."""
    cmd_dir = CONTRACTS_DIR / "commands"
    if not cmd_dir.exists():
        return CheckResult("contract_coverage", False, "commands/ dir missing", ["missing"])

    contract_stems = {p.stem.split("__")[-1] for p in cmd_dir.glob("*.json")}
    missing: list[str] = []
    total = 0
    for layer_name, layer_data in layers.items():
        for cmd in layer_data.get("commands", []):
            total += 1
            if cmd not in contract_stems:
                missing.append(f"{layer_name}/{cmd}")

    if missing:
        detail = f"{total - len(missing)}/{total} covered, {len(missing)} missing"
        return CheckResult("contract_coverage", False, detail, missing[:10])
    return CheckResult("contract_coverage", True, f"{total}/{total} commands covered")


def check_pricing_and_approval() -> CheckResult:
    errors: list[str] = []
    for fname in ["pricing.json", "approval_rules.json"]:
        p = CONTRACTS_DIR / fname
        if not p.exists():
            errors.append(f"{fname} missing")
            continue
        try:
            load_json(p)
        except json.JSONDecodeError as e:
            errors.append(f"{fname}: invalid JSON — {e}")
    return CheckResult("pricing_and_approval", len(errors) == 0, "pricing + approval_rules checked", errors)


def compute_score(results: list[CheckResult]) -> int:
    if not results:
        return 0
    passed = sum(1 for r in results if r.passed)
    return round((passed / len(results)) * 100)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    layers = load_layers()
    results = [
        check_schemas_exist(),
        check_command_contracts(layers),
        check_contract_coverage(layers),
        check_skills_registry(),
        check_agents_registry(),
        check_layers_consistency(layers),
        check_pricing_and_approval(),
    ]

    score = compute_score(results)
    print("\nOpenClaw Factory Self-Test")
    print("=" * 40)
    for r in results:
        status = "PASS" if r.passed else "FAIL"
        print(f"  [{status}] {r.name}: {r.details}")
        for err in r.errors[:3]:
            print(f"         {err}")
        if len(r.errors) > 3:
            print(f"         ... and {len(r.errors) - 3} more")

    verdict = "HEALTHY" if score >= 80 else ("WARNING" if score >= 60 else "CRITICAL")
    print(f"\nHealth Score: {score}/100 — {verdict}")
    if not HAS_JSONSCHEMA:
        print("Note: install jsonschema for schema validation (pip install jsonschema)")

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "score": score,
        "verdict": verdict,
        "checks": [
            {"name": r.name, "passed": r.passed, "details": r.details, "errors": r.errors}
            for r in results
        ],
    }
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    logger.info("Report written to %s", REPORT_PATH)

    return 0 if score >= 80 else 1


if __name__ == "__main__":
    sys.exit(main())
