import unittest
import sys
import os
import tempfile
import shutil

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.file_agent import FileAgent


class TestFileAgent(unittest.TestCase):
    def setUp(self):
        self.agent = FileAgent(cwd=".")

    def test_initialization(self):
        self.assertEqual(self.agent.name, "FileAgent")
        self.assertEqual(len(self.agent.tasks), 0)

    def test_plan_find(self):
        tasks = self.agent.plan("find *.py")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "file_find")
        self.assertEqual(tasks[0].input["pattern"], "*.py")

    def test_plan_read(self):
        tasks = self.agent.plan("read README.md")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "file_read")
        self.assertEqual(tasks[0].input["path"], "README.md")

    def test_plan_write(self):
        tasks = self.agent.plan("write test.txt hello world")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "file_write")
        self.assertEqual(tasks[0].input["path"], "test.txt")
        self.assertEqual(tasks[0].input["content"], "hello world")

    def test_plan_tree(self):
        tasks = self.agent.plan("tree 2")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "file_tree")
        self.assertEqual(tasks[0].input["depth"], 2)

    def test_plan_tree_default(self):
        tasks = self.agent.plan("tree")
        self.assertEqual(tasks[0].input["depth"], 3)

    def test_plan_stats(self):
        tasks = self.agent.plan("stats")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "file_stats")

    def test_plan_grep(self):
        tasks = self.agent.plan("grep AgentBase")
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].id, "file_grep")
        self.assertEqual(tasks[0].input["pattern"], "AgentBase")

    def test_plan_unknown(self):
        tasks = self.agent.plan("unknown_cmd arg")
        self.assertEqual(tasks[0].id, "file_custom")

    def test_execute_read_existing_file(self):
        """Read a file that exists in the repo."""
        results = self.agent.run("read README.md")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)
        self.assertIn("content", results[0].output)
        self.assertGreater(results[0].output["lines"], 0)

    def test_execute_read_nonexistent(self):
        """Read a file that doesn't exist."""
        results = self.agent.run("read nonexistent_file_xyz.txt")
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0].success)

    def test_execute_stats(self):
        """Run file stats on current project."""
        results = self.agent.run("stats")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)
        self.assertIn(".py", results[0].output)

    def test_execute_tree(self):
        """Run tree on current project."""
        results = self.agent.run("tree 1")
        self.assertEqual(len(results), 1)
        self.assertTrue(results[0].success)
        self.assertGreater(results[0].output["count"], 0)

    def test_execute_write_and_read(self):
        """Write a temp file and read it back."""
        tmpdir = tempfile.mkdtemp()
        try:
            agent = FileAgent(cwd=tmpdir)
            # Write
            from src.core.agent_base import Task
            write_task = Task(
                id="file_write",
                description="Write test",
                input={"path": "test_output.txt", "content": "hello mekong"},
            )
            result = agent.execute(write_task)
            self.assertTrue(result.success)
            self.assertEqual(result.output["size"], 12)

            # Read back
            read_task = Task(
                id="file_read",
                description="Read test",
                input={"path": "test_output.txt"},
            )
            result = agent.execute(read_task)
            self.assertTrue(result.success)
            self.assertIn("hello mekong", result.output["content"])
        finally:
            shutil.rmtree(tmpdir)


if __name__ == "__main__":
    unittest.main()
