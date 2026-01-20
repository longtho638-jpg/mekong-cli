# Report: core/security/env_manager.py Splitting Strategy

**Context**: `core/security/env_manager.py` (584 LOC) violates the < 200 LOC rule. It centralizes environment variable definitions, validation, and generation.

## Current Structure
- `EnvironmentType` (Enum)
- `VariableType` (Enum)
- `EnvironmentVariable` (Dataclass)
- `SecureEnvironmentManager` (Class)
  - `_load_variable_definitions()`: Huge method registering dozens of variables.
  - `register()`: Utility to add variables.
  - `validate_all()` / `_validate_variable()`: Validation logic.
  - `_convert_type()`: Type conversion logic.
  - `_generate_secret()`: Secret generation logic.
  - `is_secure()`: Security check logic.
  - `export_env_file()`: File I/O logic.

## Proposed Split

### 1. `core/security/env/constants.py`
- Move `EnvironmentType`, `VariableType`, and common constants here.

### 2. `core/security/env/models.py`
- Move `EnvironmentVariable` dataclass here.

### 3. `core/security/env/definitions.py`
- Extract all variable registrations into a registry or a specific provider.
- This will remove ~300 lines from the main manager.

### 4. `core/security/env/converter.py`
- Move `_convert_type` logic here as a standalone utility or class.

### 5. `core/security/env/generator.py`
- Move `_generate_secret` logic here.

### 6. `core/security/env_manager.py` (The Coordinator)
- Keep `SecureEnvironmentManager` but make it a coordinator that uses the above modules.
- Refactor `_load_variable_definitions` to import from `definitions.py`.

## Benefits
- **Readability**: Each file will be well under 100-150 LOC.
- **Maintainability**: Adding a new variable only requires editing `definitions.py`.
- **Testability**: Converters and generators can be tested in isolation.

## Circular Dependency Check
- Ensure `env_manager` doesn't import from modules that import `env_manager`.
- The `env/` sub-package should be a leaf in the dependency graph.
