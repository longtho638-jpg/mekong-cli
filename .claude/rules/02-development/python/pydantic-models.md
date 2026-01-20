# Pydantic Model Standards

Guidelines for using Pydantic models for data validation.

## Rules
- Use `BaseModel` for all data schemas.
- Leverage `Field` for adding metadata, descriptions, and validations (e.g., `gt`, `le`).
- Use `ConfigDict` (or `class Config` in older versions) to control model behavior (e.g., `extra='forbid'`).
- Define `RootModel` when the root type is not a dictionary.
- Use `model_validator` and `field_validator` for complex custom validations.
- Ensure all fields have clear types and, where appropriate, default values.
