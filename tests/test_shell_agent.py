import unittest
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.shell_agent import ShellAgent


class TestShellAgent(unittest.TestCase):
    def setUp(self):
        self.agent = ShellAgent(cwd=".")

    def test_initialization(self):
        self.assertEqual(self.agent.name, "ShellAgent")
        self.assertEqual(len(self.agent.tasks), 0)

    def test_plan_run(self):
        tasks = self.agent.plan("run echo hello")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "shell_run")
        self.assertEqual(tasks[0].input["command"], "echo hello")

    def test_plan_env(self):
        tasks = self.agent.plan("env")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "shell_env")

    def test_plan_raw_command(self):
        """Without 'run' prefix, treat entire input as command."""
        tasks = self.agent.plan("ls -la")
        self.assertEqual(tasks[0].id, "shell_run")
        self.assertEqual(tasks[0].input["command"], "ls -la")

    def test_execute_echo(self):
        """Execute simple echo command."""
        results = self.agent.run("run echo hello_mekong")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)
        self.assertIn("hello_mekong", results[0].output["stdout"])

    def test_execute_env(self):
        """Execute env info."""
        results = self.agent.run("env")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)
        self.assertIn("os", results[0].output)
        self.assertIn("python", results[0].output)

    def test_execute_pipe(self):
        """Execute piped command."""
        results = self.agent.run("run echo hello | tr a-z A-Z")
        self.assertTrue(results[0].success)
        self.assertIn("HELLO", results[0].output["stdout"])

    def test_blocked_dangerous_command(self):
        """Dangerous commands must be blocked."""
        results = self.agent.run("run rm -rf /")
        self.assertFalse(results[0].success)
        self.assertIn("Blocked", results[0].error)

    def test_blocked_mkfs(self):
        """mkfs must be blocked."""
        results = self.agent.run("run mkfs.ext4 /dev/sda1")
        self.assertFalse(results[0].success)
        self.assertIn("Blocked", results[0].error)

    def test_exit_code_nonzero(self):
        """Non-zero exit code should report failure."""
        results = self.agent.run("run false")
        self.assertFalse(results[0].success)
        self.assertEqual(results[0].output["exit_code"], 1)

    def test_timeout_capped(self):
        """Timeout cannot exceed MAX_TIMEOUT."""
        agent = ShellAgent(cwd=".", timeout=999)
        self.assertEqual(agent.timeout, ShellAgent.MAX_TIMEOUT)

    def test_empty_command(self):
        """Empty command should fail gracefully."""
        from src.core.agent_base import Task
        task = Task(id="shell_run", description="Empty", input={"command": ""})
        result = self.agent.execute(task)
        self.assertFalse(result.success)
        self.assertIn("Empty", result.error)


if __name__ == "__main__":
    unittest.main()
