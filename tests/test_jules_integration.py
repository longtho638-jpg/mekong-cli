import unittest
from unittest import mock
from antigravity.core.jules_runner import trigger_jules_mission, run_scheduled_maintenance, JULES_MISSIONS

class TestJulesIntegration(unittest.TestCase):

    def test_run_jules_task_dry_run(self):
        """Test that running a task in dry_run mode returns True."""
        result = trigger_jules_mission("tests", dry_run=True)
        self.assertTrue(result)

    def test_run_jules_task_unknown(self):
        """Test that running an unknown task returns False."""
        result = trigger_jules_mission("unknown_task")
        self.assertFalse(result)

    @mock.patch("antigravity.core.jules_runner.subprocess.run")
    def test_run_jules_task_success(self, mock_subprocess):
        """Test that running a task calls the correct command."""
        # Setup mock to return success
        mock_result = mock.Mock()
        mock_result.returncode = 0
        mock_subprocess.return_value = mock_result

        # Run the task
        result = trigger_jules_mission("cleanup", dry_run=False)

        # Assertions
        self.assertTrue(result)

        expected_prompt = JULES_MISSIONS["cleanup"]["prompt"]
        expected_cmd = f'gemini -p "/jules {expected_prompt}"'

        mock_subprocess.assert_called_with(
            expected_cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=180 # New timeout is 180
        )

    @mock.patch("antigravity.core.jules_runner.trigger_jules_mission")
    @mock.patch("antigravity.core.jules_runner.datetime")
    def test_run_weekly_tasks_monday(self, mock_datetime, mock_run_jules_task):
        """Test that Monday schedules the 'tests' task."""
        # Setup mock datetime
        mock_now = mock.Mock()
        mock_now.strftime.return_value = "Monday"
        mock_datetime.now.return_value = mock_now

        # Run weekly tasks
        run_scheduled_maintenance(dry_run=True)

        # Verify correct task was triggered
        mock_run_jules_task.assert_called_with("tests", True)

if __name__ == "__main__":
    unittest.main()