import unittest
from unittest import mock
from antigravity.core.jules_runner import run_jules_task, run_weekly_tasks, JULES_TASKS

class TestJulesIntegration(unittest.TestCase):

    def test_run_jules_task_dry_run(self):
        """Test that running a task in dry_run mode returns True."""
        result = run_jules_task("tests", dry_run=True)
        self.assertTrue(result)

    def test_run_jules_task_unknown(self):
        """Test that running an unknown task returns False."""
        result = run_jules_task("unknown_task")
        self.assertFalse(result)

    @mock.patch("antigravity.core.jules_runner.subprocess.run")
    def test_run_jules_task_success(self, mock_subprocess):
        """Test that running a task calls the correct command."""
        # Setup mock to return success
        mock_result = mock.Mock()
        mock_result.returncode = 0
        mock_subprocess.return_value = mock_result

        # Run the task
        result = run_jules_task("cleanup", dry_run=False)

        # Assertions
        self.assertTrue(result)

        expected_prompt = JULES_TASKS["cleanup"]["prompt"]
        expected_cmd = f'gemini -p "/jules {expected_prompt}"'

        mock_subprocess.assert_called_with(
            expected_cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=120
        )

    @mock.patch("antigravity.core.jules_runner.run_jules_task")
    @mock.patch("antigravity.core.jules_runner.datetime")
    def test_run_weekly_tasks_monday(self, mock_datetime, mock_run_jules_task):
        """Test that Monday schedules the 'tests' task."""
        # Setup mock datetime
        # We need to mock datetime.now() -> object with strftime
        mock_now = mock.Mock()
        mock_now.strftime.return_value = "Monday"
        mock_datetime.now.return_value = mock_now

        # Run weekly tasks
        run_weekly_tasks(dry_run=True)

        # Verify correct task was triggered
        mock_run_jules_task.assert_called_with("tests", True)

if __name__ == "__main__":
    unittest.main()
