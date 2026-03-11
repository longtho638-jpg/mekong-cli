"""
Generate machine-readable JSON contracts from .claude/commands/*.md files.

Reads command frontmatter, maps to layers, and writes per-command JSON contracts.
Also generates skills.registry.json and agents.registry.json.
"""

from __future__ import annotations

import json
import logging
import re
import sys
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).parent.parent
COMMANDS_DIR = REPO_ROOT / ".claude" / "commands"
SKILLS_DIR = REPO_ROOT / ".claude" / "skills"
AGENTS_DIR = REPO_ROOT / ".claude" / "agents"
FACTORY_DIR = REPO_ROOT / "factory"
LAYERS_PATH = FACTORY_DIR / "layers.yaml"
CONTRACTS_DIR = FACTORY_DIR / "contracts"
CMD_CONTRACTS_DIR = CONTRACTS_DIR / "commands"

COMPLEXITY_MAP = {0: "trivial", 1: "simple", 3: "standard", 5: "complex"}
CREDIT_TO_COMPLEXITY = {0: "trivial", 1: "simple", 2: "simple", 3: "standard", 4: "standard", 5: "complex"}
TIMEOUT_MAP = {"trivial": 10_000, "simple": 30_000, "standard": 120_000, "complex": 300_000}


def load_layers() -> dict[str, Any]:
    with LAYERS_PATH.open() as f:
        data = yaml.safe_load(f)
    return data.get("layers", {})


def build_command_layer_map(layers: dict[str, Any]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for layer_name, layer_data in layers.items():
        for cmd in layer_data.get("commands", []):
            mapping[cmd] = layer_name
    return mapping


def parse_frontmatter(path: Path) -> dict[str, Any]:
    content = path.read_text(encoding="utf-8")
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    try:
        return yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        return {}


def collect_command_paths(base: Path) -> list[Path]:
    return sorted(p for p in base.rglob("*.md") if p.stem.upper() != p.stem)


def cmd_id_from_path(path: Path) -> str:
    rel = path.relative_to(COMMANDS_DIR)
    parts = list(rel.parts)
    parts[-1] = parts[-1].removesuffix(".md")
    return "/".join(parts)


def infer_credit_cost(cmd_id: str) -> int:
    ipo_cmds = {"s1", "roadshow", "ipo-day", "public-co", "insider", "succession", "pre-ipo-prep"}
    complex_cmds = {"deploy", "cap-table", "negotiate", "term-sheet", "raas/bootstrap", "secondary"}
    simple_free = {"status", "help", "raas", "raas/status"}
    if cmd_id in simple_free or cmd_id.endswith("/ARCHITECTURE") or cmd_id.endswith("/SOVEREIGNTY") or cmd_id.endswith("/MASTER-MAP"):
        return 0
    stem = cmd_id.split("/")[-1]
    if stem in ipo_cmds or cmd_id in complex_cmds:
        return 5
    if stem in {"billing", "agent", "report", "credits", "plan", "review", "brand", "validate"}:
        return 1
    return 3


def layer_chapter(layers: dict[str, Any], layer_name: str) -> str:
    return layers.get(layer_name, {}).get("chapter", "")


def layer_hub(layers: dict[str, Any], layer_name: str) -> str:
    hubs = layers.get(layer_name, {}).get("hubs", [])
    return hubs[0] if hubs else f"{layer_name}-hub"


def build_contract(cmd_id: str, fm: dict[str, Any], layer: str, layers: dict[str, Any]) -> dict[str, Any]:
    credit_cost = infer_credit_cost(cmd_id)
    complexity = CREDIT_TO_COMPLEXITY.get(credit_cost, "standard")
    name_en = cmd_id.split("/")[-1].replace("-", " ").title()
    desc_raw = fm.get("description", "") or ""
    desc_en = re.sub(r"[^\x00-\x7F]+", "", desc_raw).strip(" —-").strip()
    if not desc_en:
        desc_en = f"Execute {name_en} command"

    return {
        "id": cmd_id,
        "version": "1.0.0",
        "layer": layer,
        "chapter": layer_chapter(layers, layer),
        "display": {
            "name_vi": name_en,
            "name_en": name_en,
            "icon": "",
            "description_vi": desc_raw[:200] if desc_raw else desc_en,
            "description_en": desc_en[:200],
        },
        "execution": {
            "agents": ["planner", "fullstack-developer"],
            "hub": layer_hub(layers, layer),
            "complexity": complexity,
            "timeout_ms": TIMEOUT_MAP[complexity],
            "credit_cost": credit_cost,
            "requires_approval": credit_cost >= 5,
        },
        "input": {
            "type": "object",
            "required": ["goal"],
            "properties": {
                "goal": {"type": "string", "description": "Natural language task description"},
                "project": {"type": "string", "description": "Target project path"},
            },
        },
        "output": {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "files_modified": {"type": "array", "items": {"type": "string"}},
                "credits_used": {"type": "integer"},
            },
        },
        "cascade": {"triggers": []},
        "validation": {
            "output_must_contain": [],
            "min_output_length": 50,
            "max_credit_cost": credit_cost + 2,
        },
    }


def generate_skills_registry() -> list[dict[str, Any]]:
    skills = []
    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            continue
        fm = parse_frontmatter(skill_md)
        skills.append({
            "id": skill_dir.name,
            "name": fm.get("name", skill_dir.name),
            "description": (fm.get("description", "") or "")[:200],
            "path": str(skill_md.relative_to(REPO_ROOT)),
        })
    return skills


def generate_agents_registry() -> list[dict[str, Any]]:
    agents = []
    for agent_md in sorted(AGENTS_DIR.glob("*.md")):
        fm = parse_frontmatter(agent_md)
        if not fm:
            continue
        agents.append({
            "id": agent_md.stem,
            "name": fm.get("name", agent_md.stem),
            "description": (fm.get("description", "") or "")[:200],
            "model": fm.get("model", "sonnet"),
            "path": str(agent_md.relative_to(REPO_ROOT)),
        })
    return agents


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    CMD_CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)

    layers = load_layers()
    cmd_layer_map = build_command_layer_map(layers)
    cmd_paths = collect_command_paths(COMMANDS_DIR)

    generated_ids: set[str] = set()
    for path in cmd_paths:
        cmd_id = cmd_id_from_path(path)
        stem = cmd_id.split("/")[-1]
        # Try full hyphenated path first (e.g., "founder-brand"), then stem only
        flat_id = cmd_id.replace("/", "-")
        layer = cmd_layer_map.get(flat_id) or cmd_layer_map.get(stem, "ops")
        fm = parse_frontmatter(path)
        contract = build_contract(cmd_id, fm, layer, layers)
        out_path = CMD_CONTRACTS_DIR / f"{cmd_id.replace('/', '__')}.json"
        out_path.write_text(json.dumps(contract, ensure_ascii=False, indent=2))
        logger.info("Generated %s → %s", cmd_id, out_path.name)
        generated_ids.add(stem)

    # Generate stub contracts for layer commands without .md files
    stubs = 0
    for layer_name, layer_data in layers.items():
        for cmd in layer_data.get("commands", []):
            if cmd in generated_ids:
                continue
            contract = build_contract(cmd, {}, layer_name, layers)
            out_path = CMD_CONTRACTS_DIR / f"{cmd}.json"
            out_path.write_text(json.dumps(contract, ensure_ascii=False, indent=2))
            logger.info("Stub %s → %s", cmd, out_path.name)
            generated_ids.add(cmd)
            stubs += 1

    skills = generate_skills_registry()
    skills_path = CONTRACTS_DIR / "skills.registry.json"
    skills_path.write_text(json.dumps({"version": "1.0.0", "skills": skills}, ensure_ascii=False, indent=2))
    logger.info("Skills registry: %d skills → %s", len(skills), skills_path.name)

    agents = generate_agents_registry()
    agents_path = CONTRACTS_DIR / "agents.registry.json"
    agents_path.write_text(json.dumps({"version": "1.0.0", "agents": agents}, ensure_ascii=False, indent=2))
    logger.info("Agents registry: %d agents → %s", len(agents), agents_path.name)

    from_md = len(generated_ids) - stubs
    print(f"\nSummary: {from_md} from .md + {stubs} stubs = {len(generated_ids)} total contracts")
    print(f"Skills: {len(skills)} | Agents: {len(agents)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
