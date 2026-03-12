"""Tests for OutputComparator module.

Tests cover:
1. ComparisonMode enum values
2. EXACT mode: match and mismatch
3. CONTAINS mode: found and not found
4. REGEX mode: valid pattern match, no match, invalid regex
5. JSON_SUBSET mode: full match, missing key, value mismatch, invalid JSON, non-dict expected
6. LINE_BY_LINE mode: identical, diff present
"""

from __future__ import annotations

import json
import unittest

from src.core.output_comparator import (
    ComparisonMode,
    OutputComparator,
)


class TestComparisonModeEnum(unittest.TestCase):
    def test_values(self):
        self.assertEqual(ComparisonMode.EXACT.value, "exact")
        self.assertEqual(ComparisonMode.CONTAINS.value, "contains")
        self.assertEqual(ComparisonMode.REGEX.value, "regex")
        self.assertEqual(ComparisonMode.JSON_SUBSET.value, "json_subset")
        self.assertEqual(ComparisonMode.LINE_BY_LINE.value, "line_by_line")


class TestExactMode(unittest.TestCase):
    def setUp(self):
        self.cmp = OutputComparator()

    def test_exact_match(self):
        r = self.cmp.compare("hello world", "hello world", ComparisonMode.EXACT)
        self.assertTrue(r.matched)
        self.assertEqual(r.mode, ComparisonMode.EXACT)

    def test_exact_mismatch(self):
        r = self.cmp.compare("hello", "goodbye", ComparisonMode.EXACT)
        self.assertFalse(r.matched)
        self.assertIn("Expected", r.diff_details)

    def test_exact_strips_whitespace(self):
        r = self.cmp.compare("  hello  ", "hello", ComparisonMode.EXACT)
        self.assertTrue(r.matched)

    def test_exact_case_sensitive(self):
        r = self.cmp.compare("Hello", "hello", ComparisonMode.EXACT)
        self.assertFalse(r.matched)


class TestContainsMode(unittest.TestCase):
    def setUp(self):
        self.cmp = OutputComparator()

    def test_contains_found(self):
        r = self.cmp.compare("the quick brown fox", "brown", ComparisonMode.CONTAINS)
        self.assertTrue(r.matched)

    def test_contains_not_found(self):
        r = self.cmp.compare("the quick brown fox", "cat", ComparisonMode.CONTAINS)
        self.assertFalse(r.matched)
        self.assertIn("not found", r.diff_details)

    def test_contains_default_mode(self):
        r = self.cmp.compare("hello world", "world")
        self.assertTrue(r.matched)
        self.assertEqual(r.mode, ComparisonMode.CONTAINS)


class TestRegexMode(unittest.TestCase):
    def setUp(self):
        self.cmp = OutputComparator()

    def test_regex_match(self):
        r = self.cmp.compare("error code: 404", r"\d{3}", ComparisonMode.REGEX)
        self.assertTrue(r.matched)

    def test_regex_no_match(self):
        r = self.cmp.compare("all good", r"\d+", ComparisonMode.REGEX)
        self.assertFalse(r.matched)
        self.assertIn("did not match", r.diff_details)

    def test_regex_invalid_pattern(self):
        r = self.cmp.compare("output", r"[invalid", ComparisonMode.REGEX)
        self.assertFalse(r.matched)
        self.assertIn("Invalid regex", r.diff_details)

    def test_regex_multiline(self):
        r = self.cmp.compare("line1\nSUCCESS\nline3", r"^SUCCESS$", ComparisonMode.REGEX)
        self.assertTrue(r.matched)

    def test_regex_case_insensitive(self):
        r = self.cmp.compare("Error occurred", r"error", ComparisonMode.REGEX)
        self.assertTrue(r.matched)


class TestJsonSubsetMode(unittest.TestCase):
    def setUp(self):
        self.cmp = OutputComparator()

    def test_full_subset_match(self):
        actual = json.dumps({"name": "alice", "age": 30, "role": "admin"})
        r = self.cmp.compare(actual, {"name": "alice", "age": 30}, ComparisonMode.JSON_SUBSET)
        self.assertTrue(r.matched)

    def test_exact_json_match(self):
        data = {"key": "value"}
        r = self.cmp.compare(json.dumps(data), data, ComparisonMode.JSON_SUBSET)
        self.assertTrue(r.matched)

    def test_missing_key(self):
        actual = json.dumps({"name": "alice"})
        r = self.cmp.compare(actual, {"name": "alice", "age": 30}, ComparisonMode.JSON_SUBSET)
        self.assertFalse(r.matched)
        self.assertIn("age", r.diff_details)

    def test_value_mismatch(self):
        actual = json.dumps({"name": "alice", "age": 25})
        r = self.cmp.compare(actual, {"name": "alice", "age": 30}, ComparisonMode.JSON_SUBSET)
        self.assertFalse(r.matched)
        self.assertIn("age", r.diff_details)

    def test_invalid_actual_json(self):
        r = self.cmp.compare("not json", {"key": "val"}, ComparisonMode.JSON_SUBSET)
        self.assertFalse(r.matched)
        self.assertIn("not valid JSON", r.diff_details)

    def test_non_dict_expected(self):
        actual = json.dumps({"key": "val"})
        r = self.cmp.compare(actual, "not a dict", ComparisonMode.JSON_SUBSET)
        self.assertFalse(r.matched)
        self.assertIn("dict", r.diff_details)

    def test_nested_subset_match(self):
        actual = json.dumps({"user": {"name": "bob", "active": True}})
        r = self.cmp.compare(actual, {"user": {"name": "bob"}}, ComparisonMode.JSON_SUBSET)
        self.assertTrue(r.matched)

    def test_nested_subset_mismatch(self):
        actual = json.dumps({"user": {"name": "bob", "active": False}})
        r = self.cmp.compare(actual, {"user": {"active": True}}, ComparisonMode.JSON_SUBSET)
        self.assertFalse(r.matched)


class TestLineByLineMode(unittest.TestCase):
    def setUp(self):
        self.cmp = OutputComparator()

    def test_identical_lines(self):
        text = "line1\nline2\nline3"
        r = self.cmp.compare(text, text, ComparisonMode.LINE_BY_LINE)
        self.assertTrue(r.matched)
        self.assertEqual(r.diff_details, "")

    def test_different_lines(self):
        r = self.cmp.compare("line1\nline2", "line1\nline3", ComparisonMode.LINE_BY_LINE)
        self.assertFalse(r.matched)
        self.assertIn("line2", r.diff_details)

    def test_extra_line_in_actual(self):
        r = self.cmp.compare("a\nb\nc", "a\nb", ComparisonMode.LINE_BY_LINE)
        self.assertFalse(r.matched)
        self.assertIn("+c", r.diff_details)


if __name__ == "__main__":
    unittest.main()
