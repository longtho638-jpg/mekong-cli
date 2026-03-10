"""Tests for RecipeExecutor - run recipes step-by-step."""

import subprocess
from unittest.mock import Mock, patch

import pytest

from src.core.executor import RecipeExecutor
from src.core.parser import Recipe, RecipeStep
from src.core.verifier import ExecutionResult


class TestRecipeExecutorInit:
    """Test RecipeExecutor initialization."""

    def test_init_with_recipe(self):
        """RecipeExecutor initializes with a Recipe object."""
        recipe = Recipe(name="test-recipe", description="Test description")
        executor = RecipeExecutor(recipe)
        assert executor.recipe == recipe
        assert executor.console is not None

    def test_init_with_multiple_steps(self):
        """RecipeExecutor handles recipe with multiple steps."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="cmd1"),
            RecipeStep(order=2, title="Step 2", description="cmd2"),
        ]
        recipe = Recipe(name="multi-step", description="Multi-step recipe", steps=steps)
        executor = RecipeExecutor(recipe)
        assert len(executor.recipe.steps) == 2


class TestExecuteStepModeDetection:
    """Test execute_step() mode detection."""

    def test_detect_shell_mode_default(self):
        """Shell mode is default when no type specified."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="echo hello")
        executor = RecipeExecutor(recipe)
        with patch.object(executor, "_execute_shell_step") as mock_shell:
            mock_shell.return_value = ExecutionResult(exit_code=0)
            executor.execute_step(step)
            mock_shell.assert_called_once_with(step)

    def test_detect_llm_mode(self):
        """LLM mode when type='llm'."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="Generate", params={"type": "llm"})
        executor = RecipeExecutor(recipe)
        with patch.object(executor, "_execute_llm_step") as mock_llm:
            mock_llm.return_value = ExecutionResult(exit_code=0)
            executor.execute_step(step)
            mock_llm.assert_called_once_with(step)

    def test_detect_api_mode(self):
        """API mode when type='api'."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="API", params={"type": "api"})
        executor = RecipeExecutor(recipe)
        with patch.object(executor, "_execute_api_step") as mock_api:
            mock_api.return_value = ExecutionResult(exit_code=0)
            executor.execute_step(step)
            mock_api.assert_called_once_with(step)


class TestExecuteShellStep:
    """Test _execute_shell_step() - shell command execution."""

    def test_execute_command_success(self):
        """Successful command execution returns exit_code=0."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="echo hello")
        executor = RecipeExecutor(recipe)
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = subprocess.CompletedProcess(
                args=["echo", "hello"], returncode=0, stdout="hello\n", stderr="",
            )
            result = executor._execute_shell_step(step)
            assert result.exit_code == 0
            assert "hello" in result.stdout
            assert result.metadata["mode"] == "shell"

    def test_execute_command_failure(self):
        """Failed command returns non-zero exit_code."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="exit 1")
        executor = RecipeExecutor(recipe)
        with patch("subprocess.run") as mock_run:
            exc = subprocess.CalledProcessError(1, "exit 1")
            exc.stdout = "output"
            exc.stderr = "error"
            mock_run.side_effect = exc
            result = executor._execute_shell_step(step)
            assert result.exit_code == 1
            assert result.error is not None

    def test_empty_command_skipped(self):
        """Empty command returns skipped result."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="   ")
        executor = RecipeExecutor(recipe)
        result = executor._execute_shell_step(step)
        assert result.exit_code == 0
        assert "[SKIPPED] Empty command" in result.stdout

    def test_retry_on_failure(self):
        """Command retries on failure up to retry limit."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="cmd", params={"retry": 2, "retry_delay": 0})
        executor = RecipeExecutor(recipe)
        call_count = 0
        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                exc = subprocess.CalledProcessError(1, "cmd")
                exc.stdout = ""
                exc.stderr = ""
                raise exc
            return subprocess.CompletedProcess(args=["cmd"], returncode=0, stdout="ok", stderr="")
        with patch("subprocess.run", side_effect=side_effect):
            result = executor._execute_shell_step(step)
        assert result.exit_code == 0
        assert call_count == 3


class TestExecuteLlmStep:
    """Test _execute_llm_step() - LLM generation."""

    def test_llm_success(self):
        """Successful LLM call returns response."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="Generate", params={"type": "llm"})
        executor = RecipeExecutor(recipe)
        mock_response = Mock()
        mock_response.content = "Code haiku"
        mock_response.model = "gemini-2.5-pro"
        mock_client = Mock()
        mock_client.is_available = True
        mock_client.chat.return_value = mock_response
        with patch("src.core.llm_client.get_client", return_value=mock_client):
            result = executor._execute_llm_step(step)
            assert result.exit_code == 0
            assert result.metadata["mode"] == "llm"
            mock_client.chat.assert_called_once()

    def test_llm_client_unavailable_skipped(self):
        """Offline LLM client skips step gracefully."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="Generate", params={"type": "llm"})
        executor = RecipeExecutor(recipe)
        mock_client = Mock()
        mock_client.is_available = False
        with patch("src.core.llm_client.get_client", return_value=mock_client):
            result = executor._execute_llm_step(step)
            assert result.exit_code == 0
            assert "[SKIPPED] LLM offline" in result.stdout
            assert result.metadata["skipped"] is True


class TestExecuteApiStep:
    """Test _execute_api_step() - HTTP API calls."""

    def test_api_get_success(self):
        """Successful GET request returns response."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="Fetch", params={"type": "api", "url": "https://api.example.com/1"})
        executor = RecipeExecutor(recipe)
        mock_response = Mock()
        mock_response.ok = True
        mock_response.status_code = 200
        mock_response.text = '{"id": 1}'
        with patch("requests.request") as mock_request:
            mock_request.return_value = mock_response
            result = executor._execute_api_step(step)
            assert result.exit_code == 0
            assert result.metadata["mode"] == "api"
            assert result.metadata["status_code"] == 200

    def test_api_no_url_skipped(self):
        """API step without URL is skipped."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="API", params={"type": "api"})
        executor = RecipeExecutor(recipe)
        result = executor._execute_api_step(step)
        assert result.exit_code == 0
        assert "[SKIPPED] No URL" in result.stdout

    def test_api_http_error(self):
        """HTTP error response returns error exit_code."""
        recipe = Recipe(name="test", description="Test")
        step = RecipeStep(order=1, title="Test", description="Fetch", params={"type": "api", "url": "https://api.example.com/1"})
        executor = RecipeExecutor(recipe)
        mock_response = Mock()
        mock_response.ok = False
        mock_response.status_code = 404
        mock_response.text = '{"error": "Not found"}'
        with patch("requests.request") as mock_request:
            mock_request.return_value = mock_response
            result = executor._execute_api_step(step)
            assert result.exit_code == 1
            assert result.metadata["status_code"] == 404


class TestRunFullRecipe:
    """Test run() - full recipe execution."""

    def test_run_success(self):
        """Recipe with successful steps returns True."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="echo hello"),
            RecipeStep(order=2, title="Step 2", description="echo world"),
        ]
        recipe = Recipe(name="success-recipe", description="Success test", steps=steps)
        executor = RecipeExecutor(recipe)
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = subprocess.CompletedProcess(args=["echo"], returncode=0, stdout="out", stderr="")
            result = executor.run()
            assert result is True
            assert mock_run.call_count >= 2  # May retry

    def test_run_failure_stops_execution(self):
        """Recipe fails and stops on first error."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="echo hello"),
            RecipeStep(order=2, title="Step 2", description="fail"),
            RecipeStep(order=3, title="Step 3", description="skip"),
        ]
        recipe = Recipe(name="fail-recipe", description="Fail test", steps=steps)
        executor = RecipeExecutor(recipe)
        with patch("subprocess.run") as mock_run:
            exc = subprocess.CalledProcessError(1, "fail")
            exc.stdout = ""
            exc.stderr = ""
            mock_run.side_effect = [
                subprocess.CompletedProcess(args=["echo"], returncode=0, stdout="ok", stderr=""),
                exc,
            ]
            result = executor.run()
            assert result is False
            assert mock_run.call_count >= 2  # May retry


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
