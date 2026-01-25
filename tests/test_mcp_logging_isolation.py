"""Tests for MCP server logging isolation."""
import io
import logging
import sys
import unittest
from unittest.mock import patch


class TestMCPLoggingIsolation(unittest.TestCase):
    """Test that MCP servers log to stderr, not stdout."""

    def test_all_servers_log_to_stderr(self):
        """Verify all 14 MCP servers configure logging to stderr."""
        import os
        import re

        mcp_servers_dir = "antigravity/mcp_servers"
        server_files = []

        # Find all server.py files
        for root, dirs, files in os.walk(mcp_servers_dir):
            if "server.py" in files:
                server_files.append(os.path.join(root, "server.py"))

        self.assertEqual(len(server_files), 14, "Should have 14 MCP servers")

        # Check each server
        for server_file in server_files:
            with self.subTest(server=server_file):
                with open(server_file, 'r') as f:
                    content = f.read()

                # Verify logging.basicConfig is present
                self.assertIn("logging.basicConfig", content,
                             f"{server_file} missing logging.basicConfig")

                # Verify stream=sys.stderr is set
                self.assertIn("stream=sys.stderr", content,
                             f"{server_file} not logging to stderr")

                # Ensure no print() statements (corrupts JSON-RPC)
                # Allow print in __main__ blocks and comments
                lines = content.split('\n')
                for i, line in enumerate(lines, 1):
                    if 'print(' in line:
                        # Allow in __main__ block
                        if 'if __name__' not in content[max(0, content.index(line) - 200):content.index(line)]:
                            # Allow in comments
                            if not line.strip().startswith('#'):
                                self.fail(f"{server_file}:{i} contains print() - use logger instead")

    def test_logging_stderr_isolation(self):
        """Test that logging to stderr doesn't affect stdout."""
        # Capture stdout and stderr separately
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()

        with patch('sys.stdout', stdout_capture), patch('sys.stderr', stderr_capture):
            # Configure logging to stderr like MCP servers
            test_logger = logging.getLogger('test_mcp')
            test_handler = logging.StreamHandler(sys.stderr)
            test_logger.addHandler(test_handler)
            test_logger.setLevel(logging.INFO)

            # Log a message
            test_logger.info("Test log message")

            # Clean up
            test_logger.removeHandler(test_handler)

        # Verify stdout is empty (JSON-RPC safe)
        self.assertEqual(stdout_capture.getvalue(), "",
                        "Logging should not write to stdout")

        # Verify stderr has the log
        stderr_content = stderr_capture.getvalue()
        self.assertIn("Test log message", stderr_content,
                     "Log message should appear in stderr")


if __name__ == "__main__":
    unittest.main()
