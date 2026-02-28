import unittest
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.git_agent import GitAgent


class TestGitAgent(unittest.TestCase):
    def setUp(self):
        self.agent = GitAgent(cwd=".")

    def test_initialization(self):
        self.assertEqual(self.agent.name, "GitAgent")
        self.assertEqual(len(self.agent.tasks), 0)

    def test_plan_status(self):
        tasks = self.agent.plan("status")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_status")

    def test_plan_diff(self):
        tasks = self.agent.plan("diff")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_diff")

    def test_plan_log(self):
        tasks = self.agent.plan("log 5")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_log")
        self.assertEqual(tasks[0].input["count"], 5)

    def test_plan_log_default(self):
        tasks = self.agent.plan("log")
        self.assertEqual(tasks[0].input["count"], 10)

    def test_plan_commit(self):
        tasks = self.agent.plan("commit fix: test message")
        self.assertEqual(len(tasks), 2)
        self.assertEqual(tasks[0].id, "git_add")
        self.assertEqual(tasks[1].id, "git_commit")
        self.assertEqual(tasks[1].input["message"], "fix: test message")

    def test_plan_push(self):
        tasks = self.agent.plan("push origin main")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_push")
        self.assertEqual(tasks[0].input["remote"], "origin")
        self.assertEqual(tasks[0].input["branch"], "main")

    def test_plan_push_default(self):
        tasks = self.agent.plan("push")
        self.assertEqual(tasks[0].input["remote"], "origin")
        self.assertEqual(tasks[0].input["branch"], "")

    def test_plan_pull(self):
        tasks = self.agent.plan("pull upstream")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_pull")
        self.assertEqual(tasks[0].input["remote"], "upstream")

    def test_plan_checkout(self):
        tasks = self.agent.plan("checkout feat/new")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_checkout")
        self.assertEqual(tasks[0].input["target"], "feat/new")

    def test_plan_branch_list(self):
        tasks = self.agent.plan("branch")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_branch_list")

    def test_plan_branch_create(self):
        tasks = self.agent.plan("branch feat/new-feature")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_branch_create")
        self.assertEqual(tasks[0].input["name"], "feat/new-feature")

    def test_plan_custom_command(self):
        tasks = self.agent.plan("stash list")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "git_custom")

    def test_execute_status(self):
        """Execute git status in actual repo."""
        results = self.agent.run("status")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)

    def test_execute_log(self):
        """Execute git log in actual repo."""
        results = self.agent.run("log 3")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)
        self.assertIsNotNone(results[0].output)

    def test_execute_diff(self):
        """Execute git diff in actual repo."""
        results = self.agent.run("diff")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)

    def test_execute_branch_list(self):
        """Execute git branch -a in actual repo."""
        results = self.agent.run("branch")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)


if __name__ == "__main__":
    unittest.main()
