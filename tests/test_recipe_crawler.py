import unittest
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.recipe_crawler import RecipeCrawler

class TestRecipeCrawler(unittest.TestCase):
    def setUp(self):
        self.agent = RecipeCrawler()

    def test_initialization(self):
        self.assertEqual(self.agent.name, "RecipeCrawler")
        self.assertIn("github.com", self.agent.community_repo)

    def test_planning(self):
        tasks = self.agent.plan("marketing")
        self.assertEqual(len(tasks), 3)
        self.assertEqual(tasks[0].id, "search_repo")

    def test_execution_flow(self):
        results = self.agent.run("all")

        self.assertEqual(len(results), 3)
        self.assertTrue(all(r.success for r in results))

        # Check download output
        download_res = results[2]
        self.assertEqual(download_res.task_id, "download_recipes")
        self.assertTrue(len(download_res.output["downloaded"]) > 0)

if __name__ == "__main__":
    unittest.main()
