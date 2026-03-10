"""Tests for src/core/founder_grow.py."""

import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from src.core.founder_grow import (
    Prospect,
    build_content_calendar,
    build_growth_dashboard,
    build_keyword_map,
    build_partner_pipeline,
    build_prospect_list,
    generate_content_pillars,
    generate_email_sequence,
    generate_engagement_plan,
    generate_seo_brief,
    generate_technical_seo_checklist,
    map_communities,
    save_channel_data,
    save_dashboard,
)


class TestColdOutreach(unittest.TestCase):
    def test_prospect_list(self):
        prospects = build_prospect_list("billing issues", "CTO", 10)
        self.assertEqual(len(prospects), 10)
        high_pri = [p for p in prospects if p.priority == 1]
        self.assertGreater(len(high_pri), 0)

    def test_prospect_list_cap(self):
        prospects = build_prospect_list("x", "y", 100)
        self.assertEqual(len(prospects), 50)

    def test_email_sequence(self):
        p = Prospect("Alice", "CTO", "Acme", "a@b.com", "linkedin")
        seq = generate_email_sequence(p, "slow deployments", "$10K saved")
        self.assertIn("Alice", seq.day1_body)
        self.assertIn("Acme", seq.day1_body)
        self.assertIn("slow deployments", seq.day8_breakup)


class TestContentMarketing(unittest.TestCase):
    def test_calendar(self):
        cal = build_content_calendar(["DevOps", "Security", "Cost"], 1)
        self.assertEqual(cal.week_number, 1)
        self.assertIn("DevOps", cal.monday_blog)
        self.assertEqual(len(cal.wednesday_threads), 3)

    def test_calendar_wraps(self):
        cal = build_content_calendar(["A"], 5)
        self.assertIn("A", cal.monday_blog)

    def test_empty_pillars_raises(self):
        with self.assertRaises(ValueError):
            build_content_calendar([], 1)

    def test_content_pillars(self):
        pillars = generate_content_pillars("saas", ["auth", "billing", "scaling"])
        self.assertEqual(len(pillars), 3)
        self.assertIn("stage", pillars[0])


class TestSEO(unittest.TestCase):
    def test_keyword_map(self):
        keywords = build_keyword_map(["deploy faster", "ci cd", "devops"])
        self.assertEqual(len(keywords), 3)
        self.assertIn(keywords[0].priority, ("HIGH", "MEDIUM", "SKIP"))

    def test_seo_brief(self):
        keywords = build_keyword_map(["cloud costs"])
        brief = generate_seo_brief(keywords[0])
        self.assertIn("cloud costs", brief["title_h1"])
        self.assertGreater(len(brief["outline"]), 3)

    def test_tech_checklist(self):
        checks = generate_technical_seo_checklist()
        self.assertGreater(len(checks), 5)
        high = [c for c in checks if c["priority"] == "high"]
        self.assertGreater(len(high), 0)


class TestCommunity(unittest.TestCase):
    def test_map(self):
        communities = map_communities("saas", 5)
        self.assertEqual(len(communities), 5)

    def test_engagement_plan(self):
        plan = generate_engagement_plan()
        self.assertIn("week_1_2", plan)
        self.assertIn("rule", plan)


class TestPartnership(unittest.TestCase):
    def test_pipeline(self):
        leads = build_partner_pipeline("saas", 4)
        self.assertEqual(len(leads), 4)
        types = {lead.type for lead in leads}
        self.assertGreater(len(types), 1)


class TestDashboard(unittest.TestCase):
    def test_basic(self):
        with TemporaryDirectory() as tmpdir:
            dash = build_growth_dashboard(tmpdir, 1000.0, 49.0)
            self.assertEqual(dash.current_mrr, 1000.0)
            self.assertGreater(dash.gap_mrr, 0)
            self.assertGreater(dash.leads_needed, 0)

    def test_zero_deal_size(self):
        with TemporaryDirectory() as tmpdir:
            dash = build_growth_dashboard(tmpdir, 0, 0)
            self.assertEqual(dash.leads_needed, 0)


class TestSaveFiles(unittest.TestCase):
    def test_save_channel_data(self):
        with TemporaryDirectory() as tmpdir:
            path = save_channel_data(tmpdir, "cold", {"prospects": 10})
            self.assertTrue(Path(path).exists())
            data = json.loads(Path(path).read_text())
            self.assertEqual(data["prospects"], 10)

    def test_save_dashboard(self):
        with TemporaryDirectory() as tmpdir:
            dash = build_growth_dashboard(tmpdir, 500)
            path = save_dashboard(tmpdir, dash)
            self.assertTrue(Path(path).exists())


if __name__ == "__main__":
    unittest.main()
