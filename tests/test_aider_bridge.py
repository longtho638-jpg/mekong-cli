"""Integration tests for apps/openclaw-worker/lib/aider-bridge.js — tested via subprocess."""

import subprocess
import json
import os

AIDER_BRIDGE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "apps", "openclaw-worker", "lib", "aider-bridge.js")
)


class TestAiderBridgeSyntax:
    def test_js_syntax_valid(self):
        """aider-bridge.js passes Node.js syntax check."""
        result = subprocess.run(
            ["node", "--check", AIDER_BRIDGE_PATH],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Syntax error: {result.stderr}"

    def test_exports_expected_functions(self):
        """Module exports tryAiderFix, isAiderAvailable, extractAffectedFiles."""
        script = f"""
const m = require('{AIDER_BRIDGE_PATH}');
const keys = Object.keys(m);
console.log(JSON.stringify(keys));
"""
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Script error: {result.stderr}"
        exports = json.loads(result.stdout.strip())
        assert "tryAiderFix" in exports
        assert "isAiderAvailable" in exports
        assert "extractAffectedFiles" in exports


class TestExtractAffectedFiles:
    def test_extracts_source_files(self):
        """extractAffectedFiles pulls file paths from error logs."""
        script = f"""
const {{ extractAffectedFiles }} = require('{AIDER_BRIDGE_PATH}');
const files = extractAffectedFiles('Error in src/core/memory.py line 42\\nAlso lib/utils.js:10');
console.log(JSON.stringify(files));
"""
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Script error: {result.stderr}"
        files = json.loads(result.stdout.strip())
        assert isinstance(files, list)
        assert len(files) > 0
        all_files = " ".join(files)
        assert "src/core/memory.py" in all_files or "lib/utils.js" in all_files

    def test_excludes_node_modules(self):
        """extractAffectedFiles skips node_modules paths."""
        script = f"""
const {{ extractAffectedFiles }} = require('{AIDER_BRIDGE_PATH}');
const files = extractAffectedFiles('Error in node_modules/lodash/index.js at line 5');
console.log(JSON.stringify(files));
"""
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Script error: {result.stderr}"
        files = json.loads(result.stdout.strip())
        for f in files:
            assert "node_modules" not in f

    def test_excludes_dot_claude_paths(self):
        """extractAffectedFiles skips .claude internal paths."""
        script = f"""
const {{ extractAffectedFiles }} = require('{AIDER_BRIDGE_PATH}');
const files = extractAffectedFiles('Error in .claude/commands/cook.md and src/core/planner.py');
console.log(JSON.stringify(files));
"""
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Script error: {result.stderr}"
        files = json.loads(result.stdout.strip())
        for f in files:
            assert ".claude" not in f

    def test_limits_to_max_files(self):
        """extractAffectedFiles limits output to MAX_AFFECTED_FILES (5)."""
        many_files = " ".join([f"src/file{i}.js" for i in range(20)])
        script = f"""
const {{ extractAffectedFiles }} = require('{AIDER_BRIDGE_PATH}');
const files = extractAffectedFiles('{many_files}');
console.log(JSON.stringify(files));
"""
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Script error: {result.stderr}"
        files = json.loads(result.stdout.strip())
        assert len(files) <= 5

    def test_returns_empty_for_no_source_files(self):
        """extractAffectedFiles returns empty array when no file paths found."""
        script = f"""
const {{ extractAffectedFiles }} = require('{AIDER_BRIDGE_PATH}');
const files = extractAffectedFiles('generic error message with no file paths here');
console.log(JSON.stringify(files));
"""
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Script error: {result.stderr}"
        files = json.loads(result.stdout.strip())
        assert isinstance(files, list)


class TestIsAiderAvailable:
    def test_returns_boolean(self):
        """isAiderAvailable() returns a boolean."""
        script = f"""
const {{ isAiderAvailable }} = require('{AIDER_BRIDGE_PATH}');
console.log(JSON.stringify(isAiderAvailable()));
"""
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Script error: {result.stderr}"
        val = json.loads(result.stdout.strip())
        assert isinstance(val, bool)

    def test_consistent_result(self):
        """isAiderAvailable() returns same value on repeated calls."""
        script = f"""
const {{ isAiderAvailable }} = require('{AIDER_BRIDGE_PATH}');
const r1 = isAiderAvailable();
const r2 = isAiderAvailable();
console.log(JSON.stringify(r1 === r2));
"""
        result = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=10
        )
        assert result.returncode == 0, f"Script error: {result.stderr}"
        consistent = json.loads(result.stdout.strip())
        assert consistent is True
