"""Integration tests for modularized orchestrator components."""

from unittest.mock import Mock, patch

from src.core.orchestrator import (
    StepExecutor,
    RollbackHandler,
    ReportFormatter,
    RecipeOrchestrator,
    StepResult,
    OrchestrationStatus,
    OrchestrationResult,
)
from src.core.parser import RecipeStep
from src.core.verifier import VerificationReport


class TestStepExecutor:
    """Tests for StepExecutor class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.mock_executor = Mock()
        self.mock_verifier = Mock()
        self.mock_llm_client = Mock()
        self.mock_history = Mock()
        self.mock_telemetry = Mock()

        self.step_executor = StepExecutor(
            executor=self.mock_executor,
            verifier=self.mock_verifier,
            llm_client=self.mock_llm_client,
            history=self.mock_history,
            telemetry=self.mock_telemetry,
        )

    def test_execute_and_verify_success(self):
        """Test successful step execution and verification."""
        # Arrange
        step = RecipeStep(
            order=1,
            title="Test Step",
            description="echo hello",
            agent="shell",
            params={"verification": {}},
        )
        mock_result = Mock(exit_code=0, stdout="hello", stderr="")
        self.mock_executor.execute_step.return_value = mock_result
        self.mock_verifier.verify.return_value = VerificationReport(
            passed=True, warnings=[], errors=[]
        )

        # Act
        result = self.step_executor.execute_and_verify(step, "workflow-123", 1)

        # Assert
        assert isinstance(result, StepResult)
        assert result.step == step
        assert result.verification.passed is True
        assert result.self_healed is False
        self.mock_executor.execute_step.assert_called_once()
        self.mock_verifier.verify.assert_called_once()

    def test_execute_and_verify_with_self_healing(self):
        """Test self-healing on failed shell command."""
        # Arrange
        step = RecipeStep(
            order=1,
            title="Test Step",
            description="invalid-command",
            agent="shell",
            params={"type": "shell"},
        )
        failed_result = Mock(exit_code=1, stdout="", stderr="command not found")
        success_result = Mock(exit_code=0, stdout="fixed", stderr="")

        # First call fails, second call (healed) succeeds
        self.mock_executor.execute_step.side_effect = [failed_result, success_result]
        self.mock_llm_client.generate.return_value = "fixed-command"
        self.mock_verifier.verify.return_value = VerificationReport(
            passed=True, warnings=[], errors=[]
        )

        # Act
        result = self.step_executor.execute_and_verify(step, "workflow-123", 1)

        # Assert
        assert result.self_healed is True
        assert self.mock_executor.execute_step.call_count == 2
        self.mock_llm_client.generate.assert_called_once()

    def test_execute_and_verify_no_self_healing_without_llm(self):
        """Test no self-healing when LLM client not available."""
        # Arrange
        step = RecipeStep(
            order=1,
            title="Test Step",
            description="invalid-command",
            agent="shell",
            params={"type": "shell"},
        )
        mock_result = Mock(exit_code=1, stdout="", stderr="command not found")
        self.mock_executor.execute_step.return_value = mock_result
        # Remove llm_client
        self.step_executor.llm_client = None
        self.mock_verifier.verify.return_value = VerificationReport(
            passed=False, warnings=[], errors=["Exit code: 1"]
        )

        # Act
        result = self.step_executor.execute_and_verify(step)

        # Assert
        assert result.self_healed is False
        # Should only call execute_step once (no retry)
        assert self.mock_executor.execute_step.call_count == 1

    def test_execute_and_verify_with_telemetry(self):
        """Test telemetry recording."""
        # Arrange
        step = RecipeStep(
            order=1,
            title="Test Step",
            description="echo test",
            agent="shell",
            params={},
        )
        mock_result = Mock(exit_code=0, stdout="test", stderr="")
        self.mock_executor.execute_step.return_value = mock_result
        self.mock_verifier.verify.return_value = VerificationReport(
            passed=True, warnings=[], errors=[]
        )

        # Act
        self.step_executor.execute_and_verify(step, "workflow-123", 1)

        # Assert
        self.mock_telemetry.record_step.assert_called_once()


class TestRollbackHandler:
    """Tests for RollbackHandler class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.rollback_handler = RollbackHandler(enable_rollback=True)

    def test_rollback_disabled(self):
        """Test rollback when disabled."""
        handler = RollbackHandler(enable_rollback=False)
        mock_result = Mock()
        mock_result.errors = []
        mock_step = Mock()
        handler.rollback(mock_result, mock_step)
        assert mock_result.errors == []

    def test_rollback_single_step(self):
        """Test rollback of single step."""
        # Arrange
        mock_result = Mock()
        mock_result.step_results = [
            Mock(
                verification=Mock(passed=True),
                step=Mock(
                    order=1,
                    params={"rollback": "echo rollback"}
                )
            )
        ]
        mock_failed_step = Mock(order=2)

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = Mock(returncode=0, stderr="")

            # Act
            self.rollback_handler.rollback(mock_result, mock_failed_step)

            # Assert
            mock_run.assert_called_once()
            assert mock_result.status == OrchestrationStatus.ROLLED_BACK

    def test_rollback_with_timeout(self):
        """Test rollback with timeout error."""
        # Arrange
        mock_result = Mock()
        mock_result.step_results = [
            Mock(
                verification=Mock(passed=True),
                step=Mock(
                    order=1,
                    params={"rollback": "sleep 100"}
                )
            )
        ]
        mock_result.errors = []
        mock_failed_step = Mock(order=2)

        import subprocess
        with patch("subprocess.run") as mock_run:
            mock_run.side_effect = subprocess.TimeoutExpired(cmd="sleep 100", timeout=30)

            # Act
            self.rollback_handler.rollback(mock_result, mock_failed_step)

            # Assert
            assert len(mock_result.errors) > 0
            assert "timed out" in mock_result.errors[0]

    def test_rollback_step_without_command(self):
        """Test rollback when step has no rollback command."""
        # Arrange
        mock_result = Mock()
        mock_result.step_results = [
            Mock(
                verification=Mock(passed=True),
                step=Mock(
                    order=1,
                    params={}  # No rollback command
                )
            )
        ]
        mock_failed_step = Mock(order=2)

        with patch("subprocess.run") as mock_run:
            # Act
            self.rollback_handler.rollback(mock_result, mock_failed_step)

            # Assert
            mock_run.assert_not_called()
            assert mock_result.status == OrchestrationStatus.ROLLED_BACK


class TestReportFormatter:
    """Tests for ReportFormatter class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.formatter = ReportFormatter()

    def test_format_status_success(self):
        """Test status formatting for success."""
        # Act
        result = self.formatter._format_status(OrchestrationStatus.SUCCESS)

        # Assert
        assert "green" in result
        assert "SUCCESS" in result

    def test_format_status_failed(self):
        """Test status formatting for failure."""
        # Act
        result = self.formatter._format_status(OrchestrationStatus.FAILED)

        # Assert
        assert "red" in result
        assert "FAILED" in result

    def test_format_status_partial(self):
        """Test status formatting for partial."""
        # Act
        result = self.formatter._format_status(OrchestrationStatus.PARTIAL)

        # Assert
        assert "yellow" in result
        assert "PARTIAL" in result

    def test_format_status_rolled_back(self):
        """Test status formatting for rolled back."""
        # Act
        result = self.formatter._format_status(OrchestrationStatus.ROLLED_BACK)

        # Assert
        assert "magenta" in result
        assert "ROLLED_BACK" in result

    def test_display_report(self):
        """Test display of orchestration report."""
        # Arrange
        mock_result = Mock()
        mock_result.status = OrchestrationStatus.SUCCESS
        mock_result.total_steps = 5
        mock_result.completed_steps = 5
        mock_result.failed_steps = 0
        mock_result.success_rate = 100.0
        mock_result.errors = []
        mock_result.warnings = []

        # Act & Assert - should not raise
        with patch.object(self.formatter.console, 'print') as mock_print:
            self.formatter.display(mock_result)
            assert mock_print.call_count > 0


class TestRecipeOrchestratorIntegration:
    """Integration tests for RecipeOrchestrator with modular components."""

    def setup_method(self):
        """Set up test fixtures."""
        self.orchestrator = RecipeOrchestrator(
            strict_verification=True,
            enable_rollback=True,
        )

    def test_step_executor_initialized(self):
        """Test step executor is properly initialized."""
        # Arrange
        mock_executor = Mock()

        # Act
        step_executor = self.orchestrator._init_step_executor(mock_executor)

        # Assert
        assert isinstance(step_executor, StepExecutor)
        assert step_executor.executor == mock_executor
        assert step_executor.verifier == self.orchestrator.verifier

    def test_rollback_handler_enabled(self):
        """Test rollback handler is enabled."""
        # Assert
        assert self.orchestrator.rollback_handler.enable_rollback is True

    def test_report_formatter_available(self):
        """Test report formatter is available."""
        # Assert
        assert isinstance(self.orchestrator.report_formatter, ReportFormatter)


class TestOrchestrationResult:
    """Tests for OrchestrationResult dataclass."""

    def test_success_rate_calculation(self):
        """Test success rate calculation."""
        # Arrange
        from src.core.orchestrator import OrchestrationResult

        result = OrchestrationResult(
            status=OrchestrationStatus.SUCCESS,
            recipe=Mock(),
            total_steps=10,
            completed_steps=8,
            failed_steps=2,
        )

        # Act
        rate = result.success_rate

        # Assert
        assert rate == 80.0

    def test_success_rate_zero_steps(self):
        """Test success rate with zero steps."""
        # Arrange
        result = OrchestrationResult(
            status=OrchestrationStatus.SUCCESS,
            recipe=Mock(),
            total_steps=0,
            completed_steps=0,
            failed_steps=0,
        )

        # Act
        rate = result.success_rate

        # Assert
        assert rate == 0.0
