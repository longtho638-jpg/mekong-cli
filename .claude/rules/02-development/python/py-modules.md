# Python Module and Package Standards

Guidelines for organizing Python code.

## Rules
- Use `__init__.py` to define package interfaces and exports.
- Follow a logical directory structure (e.g., `core/`, `utils/`, `api/`).
- Use absolute imports instead of relative imports.
- Keep `__init__.py` files thin; avoid putting heavy logic in them.
- Use `if __name__ == "__main__":` for scripts that can be executed.
- Explicitly list public APIs using the `__all__` variable in modules.
