"""Tests for src/cli/studio_commands.py — Typer CLI commands for VC Studio."""

from typer.testing import CliRunner
from src.cli.studio_commands import (
    app,
    portfolio_app,
    dealflow_app,
    expert_app,
    venture_app,
    match_app,
    register_studio_commands,
)
import typer

runner = CliRunner()


class TestStudioCommands:
    def test_studio_init(self):
        result = runner.invoke(app, ["init", "test-studio"])
        assert result.exit_code == 0
        assert "test-studio" in result.output

    def test_studio_init_with_thesis(self):
        result = runner.invoke(app, ["init", "my-studio", "--thesis", "ai"])
        assert result.exit_code == 0
        assert "my-studio" in result.output

    def test_studio_status(self):
        result = runner.invoke(app, ["status"])
        assert result.exit_code == 0
        assert "Studio Status" in result.output

    def test_studio_report(self):
        result = runner.invoke(app, ["report"])
        assert result.exit_code == 0
        assert "Studio Report" in result.output

    def test_studio_report_with_options(self):
        result = runner.invoke(app, ["report", "--period", "monthly", "--output", "json"])
        assert result.exit_code == 0
        assert "monthly" in result.output


class TestPortfolioCommands:
    def test_portfolio_create(self):
        result = runner.invoke(portfolio_app, [
            "create", "test-co", "--sector", "ai", "--stage", "mvp",
        ])
        assert result.exit_code == 0
        assert "test-co" in result.output

    def test_portfolio_create_with_equity(self):
        result = runner.invoke(portfolio_app, [
            "create", "co2", "--sector", "fintech", "--equity", "25.0",
        ])
        assert result.exit_code == 0
        assert "25.0" in result.output

    def test_portfolio_list(self):
        result = runner.invoke(portfolio_app, ["list"])
        assert result.exit_code == 0

    def test_portfolio_list_with_sort(self):
        result = runner.invoke(portfolio_app, ["list", "--sort", "mrr"])
        assert result.exit_code == 0

    def test_portfolio_status(self):
        result = runner.invoke(portfolio_app, ["status", "test-co"])
        assert result.exit_code == 0
        assert "test-co" in result.output

    def test_portfolio_update(self):
        result = runner.invoke(portfolio_app, [
            "update", "test-co", "--mrr", "5000",
        ])
        assert result.exit_code == 0
        assert "test-co" in result.output

    def test_portfolio_health(self):
        result = runner.invoke(portfolio_app, ["health", "test-co"])
        assert result.exit_code == 0
        assert "Health" in result.output

    def test_portfolio_health_all(self):
        result = runner.invoke(portfolio_app, ["health"])
        assert result.exit_code == 0
        assert "all" in result.output


class TestDealflowCommands:
    def test_dealflow_add(self):
        result = runner.invoke(dealflow_app, [
            "add", "NewDeal",
            "--sector", "ai",
            "--source", "referral",
            "--one-liner", "AI platform",
        ])
        assert result.exit_code == 0
        assert "NewDeal" in result.output

    def test_dealflow_list(self):
        result = runner.invoke(dealflow_app, ["list"])
        assert result.exit_code == 0

    def test_dealflow_screen(self):
        result = runner.invoke(dealflow_app, ["screen", "deal-123"])
        assert result.exit_code == 0
        assert "deal-123" in result.output

    def test_dealflow_diligence(self):
        result = runner.invoke(dealflow_app, [
            "diligence", "deal-123", "--depth", "deep",
        ])
        assert result.exit_code == 0
        assert "deep" in result.output

    def test_dealflow_advance(self):
        result = runner.invoke(dealflow_app, ["advance", "deal-123"])
        assert result.exit_code == 0
        assert "deal-123" in result.output

    def test_dealflow_pass(self):
        result = runner.invoke(dealflow_app, [
            "pass", "deal-456", "--reason", "Outside thesis",
        ])
        assert result.exit_code == 0
        assert "deal-456" in result.output


class TestExpertCommands:
    def test_expert_add(self):
        result = runner.invoke(expert_app, [
            "add", "John Doe",
            "--email", "john@example.com",
            "--specialties", "backend,devops",
        ])
        assert result.exit_code == 0
        assert "John Doe" in result.output

    def test_expert_match(self):
        result = runner.invoke(expert_app, [
            "match", "test-co", "--need", "Backend architecture",
        ])
        assert result.exit_code == 0
        assert "test-co" in result.output

    def test_expert_dispatch(self):
        result = runner.invoke(expert_app, [
            "dispatch", "exp-123",
            "--company", "test-co",
            "--scope", "Architecture review",
            "--type", "advisory",
        ])
        assert result.exit_code == 0
        assert "exp-123" in result.output

    def test_expert_pool(self):
        result = runner.invoke(expert_app, ["pool"])
        assert result.exit_code == 0
        assert "Expert Pool" in result.output


class TestVentureCommands:
    def test_venture_thesis(self):
        result = runner.invoke(venture_app, ["thesis"])
        assert result.exit_code == 0
        assert "Thesis" in result.output

    def test_venture_thesis_update(self):
        result = runner.invoke(venture_app, ["thesis", "update"])
        assert result.exit_code == 0

    def test_venture_terrain(self):
        result = runner.invoke(venture_app, ["terrain", "ai-agents"])
        assert result.exit_code == 0
        assert "ai-agents" in result.output

    def test_venture_momentum(self):
        result = runner.invoke(venture_app, ["momentum"])
        assert result.exit_code == 0

    def test_venture_five_factors(self):
        result = runner.invoke(venture_app, ["five-factors", "deal-123"])
        assert result.exit_code == 0
        assert "deal-123" in result.output

    def test_venture_void_substance(self):
        result = runner.invoke(venture_app, ["void-substance", "fintech"])
        assert result.exit_code == 0
        assert "fintech" in result.output


class TestMatchCommands:
    def test_match_founder_idea(self):
        result = runner.invoke(match_app, ["founder-idea"])
        assert result.exit_code == 0
        assert "Founder-Idea" in result.output

    def test_match_vc_startup(self):
        result = runner.invoke(match_app, ["vc-startup", "test-co"])
        assert result.exit_code == 0
        assert "test-co" in result.output

    def test_match_expert_need(self):
        result = runner.invoke(match_app, [
            "expert-need", "test-co", "--need", "DevOps setup",
        ])
        assert result.exit_code == 0
        assert "test-co" in result.output


class TestRegisterStudioCommands:
    def test_register_adds_all_typers(self):
        main_app = typer.Typer()
        register_studio_commands(main_app)
        # Verify all 6 sub-groups registered
        group_names = [g.name for g in main_app.registered_groups]
        assert "studio" in group_names
        assert "portfolio" in group_names
        assert "dealflow" in group_names
        assert "expert" in group_names
        assert "venture" in group_names
        assert "match" in group_names
