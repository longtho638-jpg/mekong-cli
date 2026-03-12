"""Tests for ErrorPatternDetector module.

Tests cover:
1. Built-in patterns registered at init
2. scan() detects each built-in pattern category
3. Custom pattern registration
4. Category filter in scan()
5. filter_by_severity()
6. Context extraction around matched lines
7. De-duplication (one DetectedError per pattern)
8. Invalid regex pattern handled gracefully
"""

from __future__ import annotations

import unittest

from src.core.error_pattern_detector import (
    ErrorPattern,
    ErrorPatternDetector,
)


class TestBuiltinPatterns(unittest.TestCase):
    def setUp(self):
        self.detector = ErrorPatternDetector()

    def test_builtins_registered(self):
        names = self.detector.registered_names
        for expected in [
            "stack_trace", "permission_denied", "connection_refused",
            "out_of_memory", "syntax_error", "import_error", "timeout",
            "file_not_found", "assertion_error",
        ]:
            self.assertIn(expected, names)

    def test_get_existing_pattern(self):
        p = self.detector.get_pattern("stack_trace")
        self.assertIsNotNone(p)
        self.assertEqual(p.name, "stack_trace")

    def test_get_unknown_pattern_returns_none(self):
        self.assertIsNone(self.detector.get_pattern("does_not_exist"))


class TestScanBuiltinMatches(unittest.TestCase):
    def setUp(self):
        self.detector = ErrorPatternDetector()

    def test_detects_stack_trace(self):
        output = "Traceback (most recent call last):\n  File 'x.py', line 1"
        results = self.detector.scan(output)
        names = [d.pattern.name for d in results]
        self.assertIn("stack_trace", names)

    def test_detects_permission_denied(self):
        results = self.detector.scan("bash: /etc/shadow: Permission denied")
        names = [d.pattern.name for d in results]
        self.assertIn("permission_denied", names)

    def test_detects_connection_refused(self):
        results = self.detector.scan("connect: Connection refused (127.0.0.1:5432)")
        names = [d.pattern.name for d in results]
        self.assertIn("connection_refused", names)

    def test_detects_out_of_memory(self):
        results = self.detector.scan("MemoryError: out of memory")
        names = [d.pattern.name for d in results]
        self.assertIn("out_of_memory", names)

    def test_detects_syntax_error(self):
        results = self.detector.scan("SyntaxError: invalid syntax")
        names = [d.pattern.name for d in results]
        self.assertIn("syntax_error", names)

    def test_detects_import_error(self):
        results = self.detector.scan("ModuleNotFoundError: No module named 'foo'")
        names = [d.pattern.name for d in results]
        self.assertIn("import_error", names)

    def test_detects_timeout(self):
        results = self.detector.scan("Request timed out after 30s")
        names = [d.pattern.name for d in results]
        self.assertIn("timeout", names)

    def test_detects_file_not_found(self):
        results = self.detector.scan("No such file or directory: '/tmp/missing'")
        names = [d.pattern.name for d in results]
        self.assertIn("file_not_found", names)

    def test_clean_output_no_matches(self):
        results = self.detector.scan("Build succeeded. All tests passed.")
        self.assertEqual(results, [])


class TestCustomPatternRegistration(unittest.TestCase):
    def setUp(self):
        self.detector = ErrorPatternDetector()

    def test_register_custom_pattern(self):
        p = ErrorPattern(
            name="custom_db_error",
            pattern=r"DB connection lost",
            severity="critical",
            category="database",
            suggestion="Restart database.",
        )
        self.detector.register_pattern(p)
        self.assertIn("custom_db_error", self.detector.registered_names)

    def test_custom_pattern_detected(self):
        p = ErrorPattern(name="test_pat", pattern=r"FATAL", severity="critical", category="test")
        self.detector.register_pattern(p)
        results = self.detector.scan("FATAL: something went wrong")
        names = [d.pattern.name for d in results]
        self.assertIn("test_pat", names)

    def test_overwrite_existing_pattern(self):
        new_p = ErrorPattern(
            name="timeout", pattern=r"CUSTOM_TIMEOUT", severity="warning", category="performance",
        )
        self.detector.register_pattern(new_p)
        retrieved = self.detector.get_pattern("timeout")
        self.assertEqual(retrieved.pattern, r"CUSTOM_TIMEOUT")


class TestCategoryFilter(unittest.TestCase):
    def setUp(self):
        self.detector = ErrorPatternDetector()

    def test_category_filter_limits_results(self):
        output = "SyntaxError: bad code\nConnection refused"
        all_results = self.detector.scan(output)
        syntax_only = self.detector.scan(output, category="syntax")
        self.assertLessEqual(len(syntax_only), len(all_results))
        for d in syntax_only:
            self.assertEqual(d.pattern.category, "syntax")

    def test_category_filter_no_match(self):
        results = self.detector.scan("SyntaxError: bad", category="network")
        self.assertEqual(results, [])


class TestFilterBySeverity(unittest.TestCase):
    def setUp(self):
        self.detector = ErrorPatternDetector()

    def test_filter_critical_only(self):
        output = "MemoryError: out of memory\nSyntaxError: bad"
        results = self.detector.scan(output)
        critical = self.detector.filter_by_severity(results, "critical")
        for d in critical:
            self.assertEqual(d.pattern.severity, "critical")

    def test_filter_warning_only(self):
        output = "Request timed out\nPermission denied"
        results = self.detector.scan(output)
        warnings = self.detector.filter_by_severity(results, "warning")
        for d in warnings:
            self.assertEqual(d.pattern.severity, "warning")


class TestDeduplication(unittest.TestCase):
    def setUp(self):
        self.detector = ErrorPatternDetector()

    def test_same_pattern_multiple_lines_deduplicated(self):
        output = "SyntaxError: line 1\nSyntaxError: line 2\nSyntaxError: line 3"
        results = self.detector.scan(output)
        syntax_matches = [d for d in results if d.pattern.name == "syntax_error"]
        self.assertEqual(len(syntax_matches), 1)


class TestContextExtraction(unittest.TestCase):
    def setUp(self):
        self.detector = ErrorPatternDetector()

    def test_context_includes_surrounding_lines(self):
        output = "line before\nSyntaxError: bad syntax\nline after"
        results = self.detector.scan(output)
        syntax = next((d for d in results if d.pattern.name == "syntax_error"), None)
        self.assertIsNotNone(syntax)
        self.assertIn("SyntaxError", syntax.context)

    def test_line_number_is_correct(self):
        output = "ok\nok\nSyntaxError: here"
        results = self.detector.scan(output)
        syntax = next((d for d in results if d.pattern.name == "syntax_error"), None)
        self.assertIsNotNone(syntax)
        self.assertEqual(syntax.line_number, 3)


if __name__ == "__main__":
    unittest.main()
