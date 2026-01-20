# Python Naming Conventions

Standards for naming Python entities in the Antigravity ecosystem.

## Rules
- Use `PascalCase` for classes.
- Use `snake_case` for variables, functions, methods, and modules.
- Use `SCREAMING_SNAKE_CASE` for constants.
- Internal members should be prefixed with a single underscore (e.g., `_internal_method`).
- Private members (to avoid name clashes) should be prefixed with double underscores (e.g., `__private_variable`).
- File names should be `snake_case` and descriptive (e.g., `revenue_engine.py`).
- Avoid single-letter variable names except in short loops or mathematical expressions.
