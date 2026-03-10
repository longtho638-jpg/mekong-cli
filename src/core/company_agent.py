"""Company Agent Management — /company agent backend.

Subcommands: list, status, ask, train, handoff, pause, resume.
Manages the 8 solo agentic company agents.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

AGENT_ROLES = ("cto", "cmo", "coo", "cfo", "cs", "sales", "editor", "data")

ROLE_DEFAULTS = {
    "cto": {"model": "claude-opus-4-6"},
    "cmo": {"model": "gemini-2.0-flash"},
    "coo": {"model": "ollama:llama3.2:3b"},
    "cfo": {"model": "ollama:qwen2.5:7b"},
    "cs": {"model": "claude-haiku-4-5"},
    "sales": {"model": "claude-haiku-4-5"},
    "editor": {"model": "gemini-2.0-flash"},
    "data": {"model": "ollama:qwen2.5:7b"},
}


def list_agents(base_dir: str | Path = ".") -> list[dict]:
    """List all 8 agents with status and metadata."""
    base = Path(base_dir)
    agents_dir = base / ".mekong" / "agents"
    memory = _load_memory(base)

    result = []
    for role in AGENT_ROLES:
        agent_file = agents_dir / f"{role}.md"
        exists = agent_file.exists()
        paused = False
        if exists:
            content = agent_file.read_text(encoding="utf-8")
            paused = content.startswith("STATUS: PAUSED")

        task_count = sum(1 for e in memory if e.get("agent") == role)
        last_active = _last_active(memory, role)
        model = ROLE_DEFAULTS.get(role, {}).get("model", "unknown")

        result.append({
            "role": role,
            "status": "paused" if paused else ("active" if exists else "unconfigured"),
            "model": model,
            "tasks": task_count,
            "last_active": last_active,
            "prompt_exists": exists,
        })

    return result


def get_agent_status(role: str, base_dir: str | Path = ".") -> dict:
    """Get detailed status for a single agent."""
    if role not in AGENT_ROLES:
        raise ValueError(f"Unknown role: {role}. Valid: {list(AGENT_ROLES)}")

    base = Path(base_dir)
    agent_file = base / ".mekong" / "agents" / f"{role}.md"
    memory = _load_memory(base)

    prompt_preview = ""
    paused = False
    if agent_file.exists():
        content = agent_file.read_text(encoding="utf-8")
        paused = content.startswith("STATUS: PAUSED")
        lines = content.strip().split("\n")
        prompt_preview = "\n".join(lines[:3])

    agent_tasks = [e for e in memory if e.get("agent") == role]
    recent = agent_tasks[-5:] if agent_tasks else []
    success_count = sum(1 for t in agent_tasks if t.get("status") == "success")
    total = len(agent_tasks)
    success_rate = round(success_count / total * 100, 1) if total else 0.0
    total_mcu = sum(t.get("mcu", 0) for t in agent_tasks)
    avg_mcu = round(total_mcu / total, 1) if total else 0.0

    return {
        "role": role,
        "status": "paused" if paused else "active",
        "model": ROLE_DEFAULTS.get(role, {}).get("model", "unknown"),
        "prompt_preview": prompt_preview,
        "recent_tasks": recent,
        "stats": {
            "total_tasks": total,
            "success_rate": success_rate,
            "avg_mcu": avg_mcu,
            "total_mcu": total_mcu,
        },
    }


def train_agent(role: str, knowledge: str, base_dir: str | Path = ".") -> dict:
    """Append knowledge block to agent prompt file."""
    if role not in AGENT_ROLES:
        raise ValueError(f"Unknown role: {role}")

    base = Path(base_dir)
    agent_file = base / ".mekong" / "agents" / f"{role}.md"
    if not agent_file.exists():
        raise FileNotFoundError(f"Agent file not found: {agent_file}")

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    block = f"\n\n---\n## Additional Knowledge (added {now})\n{knowledge}\n---\n"
    with open(agent_file, "a", encoding="utf-8") as f:
        f.write(block)

    lines = knowledge.strip().split("\n")
    return {"role": role, "lines_added": len(lines), "date": now}


def handoff(
    from_role: str, to_role: str, context: str, base_dir: str | Path = "."
) -> dict:
    """Record agent-to-agent handoff in memory."""
    for role in (from_role, to_role):
        if role not in AGENT_ROLES:
            raise ValueError(f"Unknown role: {role}")

    base = Path(base_dir)
    memory = _load_memory(base)

    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "type": "handoff",
        "from": from_role,
        "to": to_role,
        "context": context,
        "timestamp": now,
    }
    memory.append(entry)
    _save_memory(base, memory)

    return entry


def pause_agent(role: str, base_dir: str | Path = ".") -> dict:
    """Pause an agent by prepending STATUS: PAUSED."""
    if role not in AGENT_ROLES:
        raise ValueError(f"Unknown role: {role}")

    base = Path(base_dir)
    agent_file = base / ".mekong" / "agents" / f"{role}.md"
    if not agent_file.exists():
        raise FileNotFoundError(f"Agent file not found: {agent_file}")

    content = agent_file.read_text(encoding="utf-8")
    if content.startswith("STATUS: PAUSED"):
        return {"role": role, "action": "already_paused"}

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    new_content = f"STATUS: PAUSED — {now}\n\n{content}"
    agent_file.write_text(new_content, encoding="utf-8")

    return {"role": role, "action": "paused", "date": now}


def resume_agent(role: str, base_dir: str | Path = ".") -> dict:
    """Resume a paused agent by removing STATUS: PAUSED line."""
    if role not in AGENT_ROLES:
        raise ValueError(f"Unknown role: {role}")

    base = Path(base_dir)
    agent_file = base / ".mekong" / "agents" / f"{role}.md"
    if not agent_file.exists():
        raise FileNotFoundError(f"Agent file not found: {agent_file}")

    content = agent_file.read_text(encoding="utf-8")
    if not content.startswith("STATUS: PAUSED"):
        return {"role": role, "action": "already_active"}

    # Remove first line (STATUS: PAUSED) and blank line after
    lines = content.split("\n")
    # Skip "STATUS: PAUSED..." line and any blank lines after
    idx = 1
    while idx < len(lines) and lines[idx].strip() == "":
        idx += 1
    new_content = "\n".join(lines[idx:])
    agent_file.write_text(new_content, encoding="utf-8")

    return {"role": role, "action": "resumed"}


def _load_memory(base: Path) -> list[dict]:
    """Load memory.json entries."""
    memory_file = base / ".mekong" / "memory.json"
    if not memory_file.exists():
        return []
    try:
        data = json.loads(memory_file.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _save_memory(base: Path, memory: list[dict]) -> None:
    """Save memory entries to memory.json."""
    memory_file = base / ".mekong" / "memory.json"
    memory_file.parent.mkdir(parents=True, exist_ok=True)
    memory_file.write_text(
        json.dumps(memory, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def _last_active(memory: list[dict], role: str) -> str:
    """Get last active timestamp for an agent."""
    agent_entries = [e for e in memory if e.get("agent") == role]
    if not agent_entries:
        return "never"
    last = agent_entries[-1]
    return last.get("timestamp", last.get("date", "unknown"))
