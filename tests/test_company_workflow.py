"""Tests for company_workflow.py — /company workflow backend."""

import json
import tempfile
from pathlib import Path

import pytest

from src.core.company_workflow import (
    WORKFLOW_BUILDERS,
    WorkflowDef,
    WorkflowResult,
    WorkflowStep,
    add_custom_workflow,
    build_workflow,
    execute_workflow,
    list_workflows,
    log_workflow_run,
)


class TestBuildWorkflow:
    def test_build_onboard(self):
        wf = build_workflow("onboard", tenant_id="t1", email="a@b.com", tier="starter")
        assert wf.name == "onboard"
        assert len(wf.steps) == 3
        assert wf.agents == ["coo", "cs", "cmo"]
        assert "t1" in wf.steps[0].goal

    def test_build_upsell(self):
        wf = build_workflow("upsell", tenant_id="t1", balance=20)
        assert wf.name == "upsell"
        assert len(wf.steps) == 3
        assert "20" in wf.steps[1].goal

    def test_build_bug_pipeline(self):
        wf = build_workflow("bug-pipeline", ticket="JWT expires too fast")
        assert wf.name == "bug-pipeline"
        assert len(wf.steps) == 3
        assert wf.steps[1].agent_role == "cto"
        assert wf.steps[1].mcu_cost == 5

    def test_build_bug_pipeline_with_tenant(self):
        wf = build_workflow("bug-pipeline", ticket="crash", tenant_id="acme")
        assert "acme" in wf.steps[0].goal

    def test_build_weekly_brief(self):
        wf = build_workflow("weekly-brief")
        assert wf.name == "weekly-brief"
        assert len(wf.steps) == 3
        assert wf.steps[0].agent_role == "data"

    def test_build_deploy_staging(self):
        wf = build_workflow("deploy", env="staging")
        assert "staging" in wf.steps[0].goal
        assert len(wf.steps) == 3

    def test_build_deploy_with_service(self):
        wf = build_workflow("deploy", env="production", service="api")
        assert "api" in wf.steps[0].goal

    def test_unknown_workflow_raises(self):
        with pytest.raises(ValueError, match="Unknown workflow"):
            build_workflow("nonexistent")


class TestExecuteWorkflow:
    def test_execute_default_executor(self):
        wf = build_workflow("weekly-brief")
        result = execute_workflow(wf)
        assert result.status == "completed"
        assert result.total_mcu == 3
        assert len(result.steps) == 3

    def test_execute_custom_executor(self):
        wf = build_workflow("weekly-brief")

        def custom_exec(step: WorkflowStep) -> str:
            return f"Done by {step.agent_role}"

        result = execute_workflow(wf, step_executor=custom_exec)
        assert result.status == "completed"
        assert result.outputs["data"] == "Done by data"

    def test_execute_step_failure(self):
        wf = build_workflow("weekly-brief")

        call_count = 0

        def failing_exec(step: WorkflowStep) -> str:
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise RuntimeError("LLM timeout")
            return "ok"

        result = execute_workflow(wf, step_executor=failing_exec)
        assert result.status == "failed"
        assert "cfo" in result.error
        assert len(result.steps) == 2  # stopped at failure

    def test_execute_onboard_mcu(self):
        wf = build_workflow("onboard", tenant_id="t1", email="x@y.com", tier="growth")
        result = execute_workflow(wf)
        assert result.total_mcu == 3
        assert "500" in wf.steps[0].goal

    def test_execute_deploy_mcu(self):
        wf = build_workflow("deploy", env="production")
        result = execute_workflow(wf)
        assert result.total_mcu == 5  # 3 + 1 + 1

    def test_result_outputs_dict(self):
        wf = build_workflow("upsell", tenant_id="t1", balance=10)
        result = execute_workflow(wf)
        assert "data" in result.outputs
        assert "sales" in result.outputs
        assert "cmo" in result.outputs


class TestListWorkflows:
    def test_list_builtins(self):
        wfs = list_workflows()
        names = [w["name"] for w in wfs]
        assert "onboard" in names
        assert "deploy" in names
        assert len(names) >= 5

    def test_list_with_custom(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            wf_dir = Path(tmpdir) / ".mekong" / "workflows"
            wf_dir.mkdir(parents=True)
            (wf_dir / "my-flow.md").write_text("# Custom")
            wfs = list_workflows(base_dir=tmpdir)
            names = [w["name"] for w in wfs]
            assert "my-flow" in names

    def test_list_types(self):
        wfs = list_workflows()
        for wf in wfs:
            assert wf["type"] == "built-in"


class TestLogWorkflowRun:
    def test_log_creates_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            result = WorkflowResult(name="test", status="completed", total_mcu=5)
            log_path = log_workflow_run(result, base_dir=tmpdir)
            assert Path(log_path).exists()

    def test_log_appends(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            r1 = WorkflowResult(name="a", status="completed", total_mcu=3)
            r2 = WorkflowResult(name="b", status="failed", total_mcu=1, error="boom")
            log_workflow_run(r1, base_dir=tmpdir)
            log_workflow_run(r2, base_dir=tmpdir)
            log_file = Path(tmpdir) / ".mekong" / "activity.log"
            lines = log_file.read_text().strip().split("\n")
            assert len(lines) == 2
            assert json.loads(lines[0])["workflow"] == "a"
            assert json.loads(lines[1])["status"] == "failed"


class TestAddCustomWorkflow:
    def test_add_saves_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            content = "---\nname: my-wf\ntrigger: manual\n---\nSTEP 1 [cto]: do stuff"
            path = add_custom_workflow("my-wf", content, base_dir=tmpdir)
            assert Path(path).exists()
            assert Path(path).read_text() == content

    def test_add_creates_dir(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            add_custom_workflow("test", "content", base_dir=tmpdir)
            assert (Path(tmpdir) / ".mekong" / "workflows").is_dir()


class TestWorkflowBuilders:
    def test_all_builders_registered(self):
        assert set(WORKFLOW_BUILDERS.keys()) == {
            "onboard", "upsell", "bug-pipeline", "weekly-brief", "deploy"
        }

    def test_onboard_tiers(self):
        for tier, expected_mcu in [("starter", 100), ("growth", 500), ("premium", 2000)]:
            wf = build_workflow("onboard", tenant_id="t1", email="a@b.com", tier=tier)
            assert str(expected_mcu) in wf.steps[0].goal

    def test_all_steps_have_agent_role(self):
        wf = build_workflow("weekly-brief")
        for step in wf.steps:
            assert step.agent_role in (
                "cto", "cmo", "coo", "cfo", "cs", "sales", "editor", "data"
            )
