import unittest
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.lead_hunter import LeadHunter

class TestLeadHunter(unittest.TestCase):
    def setUp(self):
        self.agent = LeadHunter()

    def test_initialization(self):
        self.assertEqual(self.agent.name, "LeadHunter")
        self.assertEqual(len(self.agent.tasks), 0)

    def test_planning(self):
        tasks = self.agent.plan("example.com")
        self.assertEqual(len(tasks), 3)
        self.assertEqual(tasks[0].id, "search_company")
        self.assertEqual(tasks[1].id, "identify_ceo")
        self.assertEqual(tasks[2].id, "find_email")

    def test_execution_flow(self):
        results = self.agent.run("test-startup.com")

        # Check all tasks executed
        self.assertEqual(len(results), 3)

        # Check final email result
        email_result = results[2]
        self.assertTrue(email_result.success)
        self.assertIn("ceo@test-startup.com", email_result.output["email"])

if __name__ == "__main__":
    unittest.main()
