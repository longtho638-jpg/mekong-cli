"""Tests for SECRET_KEY validation in auth utils."""
import os
import unittest
from unittest.mock import patch


class TestSecretKeyValidation(unittest.TestCase):
    """Test SECRET_KEY environment variable validation."""

    def test_secret_key_required(self):
        """Test that SECRET_KEY env var is required."""
        # Remove SECRET_KEY from environment
        with patch.dict(os.environ, {}, clear=True):
            # Importing the module should raise RuntimeError
            with self.assertRaises(RuntimeError) as context:
                # Force reimport to trigger validation
                import importlib
                import backend.api.auth.utils as auth_utils
                importlib.reload(auth_utils)

            self.assertIn("SECRET_KEY", str(context.exception))
            self.assertIn("environment variable", str(context.exception))

    def test_secret_key_loaded_correctly(self):
        """Test that SECRET_KEY is loaded from environment."""
        test_key = "test-secret-key-for-testing-only"

        with patch.dict(os.environ, {"SECRET_KEY": test_key}):
            # Reimport to pick up new env var
            import importlib
            import backend.api.auth.utils as auth_utils
            importlib.reload(auth_utils)

            self.assertEqual(auth_utils.SECRET_KEY, test_key)

    def test_no_hardcoded_fallback(self):
        """Test that there's no hardcoded SECRET_KEY fallback."""
        # Read the source file
        import backend.api.auth.utils
        source_file = backend.api.auth.utils.__file__

        with open(source_file, 'r') as f:
            content = f.read()

        # Ensure no hardcoded default value
        self.assertNotIn('"your-secret-key', content.lower())
        self.assertNotIn("'your-secret-key", content.lower())
        self.assertNotIn('SECRET_KEY = "', content)
        self.assertNotIn("SECRET_KEY = '", content)


class TestAuthUtilsTypeSafety(unittest.TestCase):
    """Test type annotations in auth utils."""

    @patch.dict(os.environ, {"SECRET_KEY": "test-key-123"})
    def test_function_signatures(self):
        """Test that functions have proper type annotations."""
        import importlib
        import backend.api.auth.utils as auth_utils
        importlib.reload(auth_utils)

        # Check function signatures
        import inspect

        # verify_password should have str, str -> bool
        sig = inspect.signature(auth_utils.verify_password)
        self.assertEqual(len(sig.parameters), 2)
        self.assertEqual(sig.return_annotation, bool)

        # get_password_hash should have str -> str
        sig = inspect.signature(auth_utils.get_password_hash)
        self.assertEqual(len(sig.parameters), 1)
        self.assertEqual(sig.return_annotation, str)

        # create_access_token should return str
        sig = inspect.signature(auth_utils.create_access_token)
        self.assertEqual(sig.return_annotation, str)


if __name__ == "__main__":
    unittest.main()
