"""Tests for Water Protocol — agent identity, hub loading, context flow, multi-agent routing."""

import pytest
from pathlib import Path


class TestAgentDefinitions:
    """Verify all agent .md files have required sections."""

    REQUIRED_SECTIONS = ["Identity", "Workflow", "Output Format", "Tools", "Escalation Protocol", "Anti-patterns"]

    @pytest.mark.parametrize("agent", ["cto", "cfo", "cmo", "coo", "cs", "sales", "editor", "data"])
    def test_agent_has_required_sections(self, agent: str) -> None:
        path = Path(f"agents/{agent}.md")
        assert path.exists(), f"Agent file missing: {path}"
        content = path.read_text()
        for section in self.REQUIRED_SECTIONS:
            assert section.lower() in content.lower(), f"{agent}.md missing section: {section}"

    @pytest.mark.parametrize("agent", ["cto", "cfo", "cmo", "coo", "cs", "sales", "editor", "data"])
    def test_agent_has_status_protocol(self, agent: str) -> None:
        content = Path(f"agents/{agent}.md").read_text()
        assert "status" in content.lower(), f"{agent}.md missing status protocol"


class TestHubLoading:
    """Verify hubs are loaded into agent dispatcher."""

    def test_load_agent_with_hub(self) -> None:
        from src.core.agent_dispatcher import load_agent_prompt
        prompt = load_agent_prompt("cto", include_hub=True)
        # Should contain both agent identity AND hub expertise
        assert "CTO" in prompt or "cto" in prompt.lower()
        assert len(prompt) > 200  # Must be substantial, not 27-line fluff

    def test_load_agent_without_hub(self) -> None:
        from src.core.agent_dispatcher import load_agent_prompt
        prompt = load_agent_prompt("cto", include_hub=False)
        assert "CTO" in prompt or "cto" in prompt.lower()

    def test_hub_mapping_exists(self) -> None:
        from src.core.agent_dispatcher import ROLE_HUB_MAP
        assert "cto" in ROLE_HUB_MAP
        assert "cfo" in ROLE_HUB_MAP
        assert "cmo" in ROLE_HUB_MAP


class TestContextFlow:
    """Verify context flows between agents."""

    def test_empty_flow(self, tmp_path: Path) -> None:
        from src.core.context_flow import ContextFlow
        flow = ContextFlow(task_id="test1", mekong_dir=str(tmp_path))
        assert flow.get_context_for("cto") == ""

    def test_single_contribution(self, tmp_path: Path) -> None:
        from src.core.context_flow import ContextFlow
        flow = ContextFlow(task_id="test2", mekong_dir=str(tmp_path))
        flow.add("cfo", "Revenue: $42K MRR", status="DONE")
        context = flow.get_context_for("cmo")
        assert "CFO" in context
        assert "$42K" in context
        assert "CMO" in context

    def test_multi_contribution(self, tmp_path: Path) -> None:
        from src.core.context_flow import ContextFlow
        flow = ContextFlow(task_id="test3", mekong_dir=str(tmp_path))
        flow.add("cfo", "Revenue: $42K", status="DONE")
        flow.add("cmo", "Blog draft ready", status="DONE")
        context = flow.get_context_for("editor")
        assert "CFO" in context
        assert "CMO" in context
        assert "EDITOR" in context

    def test_blocker_detection(self, tmp_path: Path) -> None:
        from src.core.context_flow import ContextFlow
        flow = ContextFlow(task_id="test4", mekong_dir=str(tmp_path))
        flow.add("cfo", "", status="BLOCKED", concerns="Missing Q1 data")
        assert flow.has_blocker()

    def test_persistence(self, tmp_path: Path) -> None:
        from src.core.context_flow import ContextFlow
        flow = ContextFlow(task_id="test5", mekong_dir=str(tmp_path))
        flow.add("cto", "Architecture designed", status="DONE")
        # Load from disk
        loaded = ContextFlow.load("test5", mekong_dir=str(tmp_path))
        assert len(loaded.contributions) == 1
        assert loaded.contributions[0].agent_role == "cto"

    def test_summary(self, tmp_path: Path) -> None:
        from src.core.context_flow import ContextFlow
        flow = ContextFlow(task_id="test6", mekong_dir=str(tmp_path))
        flow.add("cfo", "Done", status="DONE")
        flow.add("cmo", "Done", status="DONE")
        summary = flow.get_summary()
        assert "cfo" in summary or "CMO" in summary


class TestMultiAgentRouting:
    """Verify multi-agent detection."""

    def test_single_agent_default(self) -> None:
        from src.core.task_classifier import classify_multi_agent
        agents = classify_multi_agent("fix the login bug")
        assert len(agents) == 1
        assert agents[0] == "cto"

    def test_multi_agent_revenue_report(self) -> None:
        from src.core.task_classifier import classify_multi_agent
        agents = classify_multi_agent("create a revenue report for Q1")
        assert "cfo" in agents
        assert "data" in agents

    def test_multi_agent_product_launch(self) -> None:
        from src.core.task_classifier import classify_multi_agent
        agents = classify_multi_agent("prepare product launch campaign")
        assert "cmo" in agents

    def test_multi_agent_incident(self) -> None:
        from src.core.task_classifier import classify_multi_agent
        agents = classify_multi_agent("handle incident response for API downtime")
        assert "coo" in agents
        assert "cto" in agents
