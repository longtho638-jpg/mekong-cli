import unittest
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.content_writer import ContentWriter

class TestContentWriter(unittest.TestCase):
    def setUp(self):
        self.agent = ContentWriter()

    def test_initialization(self):
        self.assertEqual(self.agent.name, "ContentWriter")

    def test_planning(self):
        tasks = self.agent.plan("AI Marketing")
        self.assertEqual(len(tasks), 4)
        ids = [t.id for t in tasks]
        self.assertIn("keyword_research", ids)
        self.assertIn("seo_optimize", ids)

    def test_execution_flow(self):
        results = self.agent.run("Growth Hacking")

        self.assertEqual(len(results), 4)
        self.assertTrue(all(r.success for r in results))

        # Check SEO output
        seo_res = results[3]
        self.assertEqual(seo_res.task_id, "seo_optimize")
        self.assertGreater(seo_res.output["score"], 90)

if __name__ == "__main__":
    unittest.main()
