"""Mekong CLI v3.1 - Plugin Validator.

Security and integrity validation for plugins before activation.
Scans for dangerous patterns, missing interfaces, and uninstalled deps.
"""

from __future__ import annotations

import ast
import re
from dataclasses import dataclass, field
from importlib import util as importlib_util
from pathlib import Path

logger = __import__("logging").getLogger(__name__)

# Dangerous imports that could compromise security
DANGEROUS_IMPORTS = {
    "subprocess",
    "os.system",
    "eval",
    "exec",
    "compile",
    "__import__",
    "pickle",
    "marshal",
}

# Patterns indicating secrets or credentials
SECRET_PATTERNS = [
    r"(?i)(api[_-]?key|secret|password|token|credential)\s*=\s*['\"][^'\"]+['\"]",
    r"(?i)(AWS|GCP|AZURE|STRIPE|POLAR)_.*_KEY\s*=",
    r"sk-[a-zA-Z0-9]{32,}",  # API key pattern
]


@dataclass
class PluginValidationResult:
    """Result of plugin validation."""

    is_valid: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    info: list[str] = field(default_factory=list)

    def add_error(self, msg: str) -> None:
        self.is_valid = False
        self.errors.append(msg)

    def add_warning(self, msg: str) -> None:
        self.warnings.append(msg)

    def add_info(self, msg: str) -> None:
        self.info.append(msg)


class PluginValidator:
    """Validates plugin integrity, security, and interface compliance.

    Usage:
        validator = PluginValidator()
        result = validator.validate_all(plugin_path)
        if not result.is_valid:
            print(f"Plugin invalid: {result.errors}")
    """

    def __init__(self) -> None:
        self._dangerous_imports = DANGEROUS_IMPORTS
        self._secret_patterns = [re.compile(p) for p in SECRET_PATTERNS]

    def validate_all(self, plugin_path: Path | str) -> PluginValidationResult:
        """Run all validation checks on a plugin."""
        path = Path(plugin_path)
        if not path.exists():
            result = PluginValidationResult()
            result.add_error(f"Plugin file not found: {path}")
            return result

        result = PluginValidationResult()
        result.add_info(f"Validating plugin: {path.name}")

        # Syntax check
        syntax_result = self.validate_syntax(path)
        if not syntax_result.is_valid:
            result.errors.extend(syntax_result.errors)
            result.is_valid = False

        # Security scan
        security_result = self.validate_security(path)
        result.warnings.extend(security_result.warnings)
        result.errors.extend(security_result.errors)
        if not security_result.is_valid:
            result.is_valid = False

        # Interface check
        interface_result = self.validate_interface(path)
        result.warnings.extend(interface_result.warnings)
        if not interface_result.is_valid:
            result.errors.extend(interface_result.errors)
            result.is_valid = False

        return result

    def validate_syntax(self, plugin_path: Path) -> PluginValidationResult:
        """Validate Python syntax without executing the file.

        Returns:
            PluginValidationResult with syntax errors if any
        """
        result = PluginValidationResult()
        try:
            source = plugin_path.read_text(encoding="utf-8")
            ast.parse(source)
            result.add_info("Syntax check passed")
        except SyntaxError as e:
            result.add_error(f"Syntax error at line {e.lineno}: {e.msg}")
        except Exception as e:
            result.add_error(f"Failed to read plugin: {e}")
        return result

    def validate_security(self, plugin_path: Path) -> PluginValidationResult:
        """Scan for dangerous imports and hardcoded secrets.

        Returns:
            PluginValidationResult with security warnings/errors
        """
        result = PluginValidationResult()
        try:
            source = plugin_path.read_text(encoding="utf-8")
        except Exception as e:
            result.add_error(f"Cannot read file: {e}")
            return result

        # Check for dangerous imports
        dangerous_found = self._scan_dangerous_imports(source)
        if dangerous_found:
            result.add_error(
                f"Dangerous imports detected: {', '.join(dangerous_found)}. "
                "Plugins must not use subprocess, eval, exec, or os.system."
            )

        # Check for hardcoded secrets
        secrets_found = self._scan_secrets(source)
        if secrets_found:
            result.add_warning(
                f"Potential hardcoded secrets detected: {', '.join(secrets_found)}. "
                "Use environment variables instead."
            )

        if not dangerous_found and not secrets_found:
            result.add_info("Security scan passed")

        return result

    def _scan_dangerous_imports(self, source: str) -> list[str]:
        """Scan source for dangerous imports using AST."""
        dangerous_found = []
        try:
            tree = ast.parse(source)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name in self._dangerous_imports:
                            dangerous_found.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module and node.module in self._dangerous_imports:
                        dangerous_found.append(node.module)
                    for alias in node.names:
                        full = f"{node.module}.{alias.name}" if node.module else alias.name
                        if full in self._dangerous_imports:
                            dangerous_found.append(full)
        except SyntaxError:
            pass  # Syntax errors caught in validate_syntax
        return dangerous_found

    def _scan_secrets(self, source: str) -> list[str]:
        """Scan source for hardcoded secrets using regex patterns."""
        secrets_found = []
        for pattern in self._secret_patterns:
            matches = pattern.findall(source)
            secrets_found.extend(matches[:3])  # Limit to first 3 matches
        return list(set(secrets_found))

    def validate_interface(self, plugin_path: Path) -> PluginValidationResult:
        """Validate plugin has required interface (register function).

        Returns:
            PluginValidationResult indicating if interface is valid
        """
        result = PluginValidationResult()
        try:
            spec = importlib_util.spec_from_file_location(plugin_path.stem, plugin_path)
            if spec is None or spec.loader is None:
                result.add_error("Cannot create module spec")
                return result

            mod = importlib_util.module_from_spec(spec)
            spec.loader.exec_module(mod)

            if not hasattr(mod, "register"):
                result.add_error(
                    "Missing required 'register()' function. "
                    "Plugins must define register(registry) -> None."
                )
            else:
                register_fn = getattr(mod, "register")
                if not callable(register_fn):
                    result.add_error("'register' must be a callable function")

            if result.is_valid:
                result.add_info("Interface validation passed: register() found")

        except Exception as e:
            result.add_error(f"Interface validation failed: {type(e).__name__}: {e}")

        return result

    def validate_dependencies(
        self, dependencies: list[str]
    ) -> PluginValidationResult:
        """Check if all plugin dependencies are installed.

        Args:
            dependencies: List of package names (e.g., ['requests', 'pydantic>=2.0'])

        Returns:
            PluginValidationResult with missing dependencies
        """
        result = PluginValidationResult()
        if not dependencies:
            result.add_info("No dependencies to validate")
            return result

        missing = []
        for dep in dependencies:
            pkg_name = re.split(r"[>=<!~]", dep)[0].strip()
            try:
                importlib_util.find_spec(pkg_name)
            except (ImportError, ModuleNotFoundError):
                missing.append(dep)

        if missing:
            result.add_error(f"Missing dependencies: {', '.join(missing)}")
        else:
            result.add_info("All dependencies installed")

        return result


def validate_plugin(plugin_path: Path | str) -> tuple[bool, str]:
    """Convenience function for quick plugin validation.

    Args:
        plugin_path: Path to plugin .py file

    Returns:
        (is_valid, message) tuple
    """
    validator = PluginValidator()
    result = validator.validate_all(plugin_path)

    if result.is_valid:
        msg = f"Plugin valid: {result.info}"
    else:
        msg = f"Plugin invalid: {result.errors} | Warnings: {result.warnings}"

    return result.is_valid, msg


__all__ = ["PluginValidator", "PluginValidationResult", "validate_plugin"]
