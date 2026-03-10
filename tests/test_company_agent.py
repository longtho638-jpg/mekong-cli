"""Tests for company_agent.py — /company agent backend."""

import json
import tempfile
from pathlib import Path

import pytest

from src.core.company_agent import (
    AGENT_ROLES,
    get_agent_status,
    handoff,
    list_agents,
    pause_agent,
    resume_agent,
    train_agent,
)


def _setup_agents_dir(tmpdir: str, roles=None) -> Path:
    """Create .mekong/agents/ with prompt files for given roles."""
    base = Path(tmpdir)
    agents_dir = base / ".mekong" / "agents"
    agents_dir.mkdir(parents=True)
    for role in (roles or AGENT_ROLES):
        (agents_dir / f"{role}.md").write_text(
            f"You are the {role} of TestCorp.\nLanguage: vi\nFocus: testing."
        )
    return base


def _setup_memory(base: Path, entries: list[dict]) -> None:
    memory_file = base / ".mekong" / "memory.json"
    memory_file.write_text(json.dumps(entries), encoding="utf-8")


class TestListAgents:
    def test_list_all_8(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _setup_agents_dir(tmpdir)
            agents = list_agents(base_dir=tmpdir)
            assert len(agents) == 8
            roles = [a["role"] for a in agents]
            assert "cto" in roles
            assert "data" in roles

    def test_all_active_by_default(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _setup_agents_dir(tmpdir)
            agents = list_agents(base_dir=tmpdir)
            assert all(a["status"] == "active" for a in agents)

    def test_unconfigured_if_no_files(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            agents = list_agents(base_dir=tmpdir)
            assert all(a["status"] == "unconfigured" for a in agents)

    def test_task_count_from_memory(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = _setup_agents_dir(tmpdir)
            _setup_memory(base, [
                {"agent": "cto", "status": "success", "mcu": 3},
                {"agent": "cto", "status": "success", "mcu": 5},
                {"agent": "cmo", "status": "success", "mcu": 1},
            ])
            agents = list_agents(base_dir=tmpdir)
            cto = next(a for a in agents if a["role"] == "cto")
            assert cto["tasks"] == 2


class TestGetAgentStatus:
    def test_valid_role(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _setup_agents_dir(tmpdir)
            status = get_agent_status("cto", base_dir=tmpdir)
            assert status["role"] == "cto"
            assert status["status"] == "active"
            assert "TestCorp" in status["prompt_preview"]

    def test_invalid_role_raises(self):
        with pytest.raises(ValueError, match="Unknown role"):
            get_agent_status("invalid_role")

    def test_stats_calculation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = _setup_agents_dir(tmpdir)
            _setup_memory(base, [
                {"agent": "cto", "status": "success", "mcu": 3},
                {"agent": "cto", "status": "success", "mcu": 5},
                {"agent": "cto", "status": "failed", "mcu": 1},
            ])
            status = get_agent_status("cto", base_dir=tmpdir)
            assert status["stats"]["total_tasks"] == 3
            assert status["stats"]["success_rate"] == pytest.approx(66.7, abs=0.1)
            assert status["stats"]["total_mcu"] == 9

    def test_empty_memory(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _setup_agents_dir(tmpdir)
            status = get_agent_status("cmo", base_dir=tmpdir)
            assert status["stats"]["total_tasks"] == 0
            assert status["stats"]["success_rate"] == 0.0


class TestTrainAgent:
    def test_train_appends_knowledge(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = _setup_agents_dir(tmpdir)
            result = train_agent("cto", "New coding standard: use Ruff.", base_dir=tmpdir)
            assert result["role"] == "cto"
            assert result["lines_added"] == 1
            content = (base / ".mekong" / "agents" / "cto.md").read_text()
            assert "New coding standard" in content
            assert "Additional Knowledge" in content

    def test_train_invalid_role(self):
        with pytest.raises(ValueError):
            train_agent("bogus", "stuff")

    def test_train_missing_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with pytest.raises(FileNotFoundError):
                train_agent("cto", "stuff", base_dir=tmpdir)


class TestHandoff:
    def test_handoff_creates_entry(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _setup_agents_dir(tmpdir)
            entry = handoff("cs", "cto", "Bug: JWT expires", base_dir=tmpdir)
            assert entry["from"] == "cs"
            assert entry["to"] == "cto"
            assert entry["type"] == "handoff"

    def test_handoff_persists_to_memory(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = _setup_agents_dir(tmpdir)
            handoff("cs", "cto", "context1", base_dir=tmpdir)
            handoff("cto", "cmo", "context2", base_dir=tmpdir)
            memory = json.loads((base / ".mekong" / "memory.json").read_text())
            assert len(memory) == 2

    def test_handoff_invalid_role(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with pytest.raises(ValueError):
                handoff("invalid", "cto", "ctx", base_dir=tmpdir)


class TestPauseResume:
    def test_pause(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = _setup_agents_dir(tmpdir)
            result = pause_agent("editor", base_dir=tmpdir)
            assert result["action"] == "paused"
            content = (base / ".mekong" / "agents" / "editor.md").read_text()
            assert content.startswith("STATUS: PAUSED")

    def test_pause_already_paused(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _setup_agents_dir(tmpdir)
            pause_agent("editor", base_dir=tmpdir)
            result = pause_agent("editor", base_dir=tmpdir)
            assert result["action"] == "already_paused"

    def test_resume(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            base = _setup_agents_dir(tmpdir)
            pause_agent("editor", base_dir=tmpdir)
            result = resume_agent("editor", base_dir=tmpdir)
            assert result["action"] == "resumed"
            content = (base / ".mekong" / "agents" / "editor.md").read_text()
            assert not content.startswith("STATUS: PAUSED")
            assert "TestCorp" in content

    def test_resume_already_active(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _setup_agents_dir(tmpdir)
            result = resume_agent("cto", base_dir=tmpdir)
            assert result["action"] == "already_active"

    def test_pause_shows_in_list(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _setup_agents_dir(tmpdir)
            pause_agent("editor", base_dir=tmpdir)
            agents = list_agents(base_dir=tmpdir)
            editor = next(a for a in agents if a["role"] == "editor")
            assert editor["status"] == "paused"

    def test_pause_invalid_role(self):
        with pytest.raises(ValueError):
            pause_agent("bogus")

    def test_resume_missing_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with pytest.raises(FileNotFoundError):
                resume_agent("cto", base_dir=tmpdir)
