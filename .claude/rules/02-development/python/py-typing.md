# Python Typing Standards

Guidelines for using type hints in Python.

## Rules
- Use `typing` module (or built-in types in 3.9+) for all type annotations.
- Annotate function signatures: `def func(a: int, b: str) -> bool:`.
- Use `Optional[Type]` for variables that can be `None`.
- Use `Union[Type1, Type2]` for variables that can be multiple types.
- Use `Any` sparingly; prefer more specific types or `TypeVar` for generics.
- Leverage `Protocol` from `typing` for structural subtyping (interfaces).
- Run `mypy` or a similar type checker to verify annotations.
