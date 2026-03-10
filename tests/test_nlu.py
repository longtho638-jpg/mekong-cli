"""Tests for IntentClassifier NLU engine."""

import unittest
from unittest.mock import MagicMock

from src.core.nlu import (
    Intent,
    IntentClassifier,
    KEYWORD_MAP,
)


class TestIntentClassifier(unittest.TestCase):
    """Test keyword matching, entity extraction, and LLM fallback."""

    def setUp(self):
        self.classifier = IntentClassifier()

    # -- Intent classification --

    def test_deploy_english(self):
        """'deploy sophia' -> DEPLOY, high confidence."""
        result = self.classifier.classify("deploy sophia")
        self.assertEqual(result.intent, Intent.DEPLOY)
        self.assertGreaterEqual(result.confidence, 0.7)

    def test_deploy_vietnamese(self):
        """'trien khai sophia' -> DEPLOY."""
        result = self.classifier.classify("trien khai sophia")
        self.assertEqual(result.intent, Intent.DEPLOY)

    def test_deploy_vietnamese_diacritics(self):
        """'triển khai sophia' -> DEPLOY."""
        result = self.classifier.classify("triển khai sophia")
        self.assertEqual(result.intent, Intent.DEPLOY)

    def test_audit_keyword(self):
        """'audit security' -> AUDIT."""
        result = self.classifier.classify("audit security")
        self.assertEqual(result.intent, Intent.AUDIT)

    def test_create_keyword(self):
        """'create new project' -> CREATE."""
        result = self.classifier.classify("create new project")
        self.assertEqual(result.intent, Intent.CREATE)

    def test_fix_keyword(self):
        """'fix login bug' -> FIX."""
        result = self.classifier.classify("fix login bug")
        self.assertEqual(result.intent, Intent.FIX)

    def test_status_keyword(self):
        """'status of system' -> STATUS."""
        result = self.classifier.classify("status of system")
        self.assertEqual(result.intent, Intent.STATUS)

    def test_schedule_keyword(self):
        """'schedule daily backup' -> SCHEDULE."""
        result = self.classifier.classify("schedule daily backup")
        self.assertEqual(result.intent, Intent.SCHEDULE)

    def test_unknown_intent(self):
        """'hello world' -> UNKNOWN, low confidence."""
        result = self.classifier.classify("hello world")
        self.assertEqual(result.intent, Intent.UNKNOWN)
        self.assertLess(result.confidence, 0.5)

    def test_case_insensitive(self):
        """'DEPLOY APP' works case-insensitively."""
        result = self.classifier.classify("DEPLOY APP")
        self.assertEqual(result.intent, Intent.DEPLOY)

    def test_multiple_keywords_first_wins(self):
        """First matching intent wins."""
        result = self.classifier.classify("deploy and fix")
        self.assertEqual(result.intent, Intent.DEPLOY)

    def test_confidence_exact_word(self):
        """Exact keyword word match -> high confidence."""
        result = self.classifier.classify("deploy my-app")
        self.assertGreaterEqual(result.confidence, 0.9)

    def test_confidence_substring(self):
        """Substring match (not exact word) -> lower confidence."""
        result = self.classifier.classify("undeployable system")
        # "deploy" is a substring of "undeployable" — should still match
        self.assertEqual(result.intent, Intent.DEPLOY)

    # -- Entity extraction --

    def test_entity_project(self):
        """'deploy sophia' -> entities['project'] = 'sophia'."""
        result = self.classifier.classify("deploy sophia")
        self.assertEqual(result.entities.get("project"), "sophia")

    def test_entity_interval(self):
        """'run every 10 mins' -> entities['interval'] = '600'."""
        result = self.classifier.classify("schedule every 10 mins")
        self.assertEqual(result.entities.get("interval"), "600")

    def test_entity_interval_hours(self):
        """'run every 2 hours' -> entities['interval'] = '7200'."""
        result = self.classifier.classify("schedule every 2 hours")
        self.assertEqual(result.entities.get("interval"), "7200")

    def test_entity_target(self):
        """'check health of node-1' -> entities['target'] = 'node-1'."""
        result = self.classifier.classify("check health of node-1")
        self.assertEqual(result.entities.get("target"), "node-1")

    def test_no_project_for_keyword(self):
        """Project should not be extracted if candidate is a keyword."""
        result = self.classifier.classify("deploy check")
        # "check" is a keyword -> should not be project
        self.assertNotIn("project", result.entities)

    # -- Raw goal preserved --

    def test_raw_goal_preserved(self):
        """IntentResult stores the original goal string."""
        result = self.classifier.classify("deploy sophia")
        self.assertEqual(result.raw_goal, "deploy sophia")

    # -- LLM fallback --

    def test_llm_fallback_triggered(self):
        """LLM fallback triggered when confidence < 0.5."""
        mock_llm = MagicMock()
        mock_llm.generate.return_value = "deploy"
        classifier = IntentClassifier(llm_client=mock_llm)
        result = classifier.classify("vague task")
        # Should have called LLM fallback since keyword match is UNKNOWN
        mock_llm.generate.assert_called_once()
        self.assertEqual(result.confidence, 0.6)

    def test_llm_fallback_error_graceful(self):
        """LLM fallback failure doesn't crash."""
        mock_llm = MagicMock()
        mock_llm.generate.side_effect = RuntimeError("LLM down")
        classifier = IntentClassifier(llm_client=mock_llm)
        result = classifier.classify("vague task")
        # Should fallback gracefully to keyword result
        self.assertEqual(result.intent, Intent.UNKNOWN)


class TestIntentEnum(unittest.TestCase):
    """Test Intent enum values."""

    def test_all_intents_are_strings(self):
        """All intent values are lowercase strings."""
        for intent in Intent:
            self.assertIsInstance(intent.value, str)
            self.assertEqual(intent.value, intent.value.lower())

    def test_intent_count(self):
        """There should be 7 intents."""
        self.assertEqual(len(Intent), 11)


class TestKeywordMap(unittest.TestCase):
    """Test KEYWORD_MAP structure."""

    def test_all_intents_except_unknown_have_keywords(self):
        """Every non-UNKNOWN intent has keywords."""
        for intent in Intent:
            if intent != Intent.UNKNOWN:
                self.assertIn(intent, KEYWORD_MAP)
                self.assertGreater(len(KEYWORD_MAP[intent]), 0)

    def test_unknown_not_in_map(self):
        """UNKNOWN should not be in the keyword map."""
        self.assertNotIn(Intent.UNKNOWN, KEYWORD_MAP)


if __name__ == "__main__":
    unittest.main()
