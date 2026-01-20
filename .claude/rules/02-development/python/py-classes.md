# Python Class Standards

Guidelines for defining and using classes in Python.

## Rules
- Follow PEP 8 guidelines for class structure.
- Always include a docstring for the class and its public methods.
- Use `@classmethod` and `@staticmethod` decorators appropriately.
- Prefer composition over inheritance unless there is a clear "is-a" relationship.
- Use `@property` for getter and setter patterns instead of explicit `get_x` and `set_x` methods.
- Initialize all attributes in the `__init__` method.
- Keep classes focused on a single responsibility.
