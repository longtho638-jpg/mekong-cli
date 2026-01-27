import importlib
from typing import Any

def load_symbol(symbol_path: str) -> Any:
    """
    Load a symbol from a string path like 'module.submodule:Attribute'.
    """
    try:
        module_path, attribute_name = symbol_path.split(":")
    except ValueError:
        raise ValueError(f"Invalid symbol path '{symbol_path}'. Expected format 'module:attribute'")

    try:
        module = importlib.import_module(module_path)
    except ImportError as e:
        raise ImportError(f"Could not import module '{module_path}': {e}")

    try:
        return getattr(module, attribute_name)
    except AttributeError:
        raise AttributeError(f"Module '{module_path}' has no attribute '{attribute_name}'")
