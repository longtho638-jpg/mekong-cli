"""
Entity Extraction Rules
=======================

Helper functions for AST-based entity extraction.
"""

import ast
import hashlib
from typing import Optional


def make_entity_id(file_path: str, name: str, entity_type: str) -> str:
    """Create unique entity ID using hash."""
    key = f"{file_path}:{name}:{entity_type}"
    return hashlib.md5(key.encode()).hexdigest()[:12]


def get_node_name(node: ast.AST) -> str:
    """Get name from AST node."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        return f"{get_node_name(node.value)}.{node.attr}"
    elif isinstance(node, ast.Call):
        return get_node_name(node.func)
    return str(node)


def get_function_signature(node: ast.FunctionDef) -> str:
    """Get function signature as string."""
    args = [arg.arg for arg in node.args.args]
    return f"({', '.join(args)})"


def find_parent_class(tree: ast.AST, target: ast.AST) -> Optional[ast.ClassDef]:
    """Find parent class of a node."""
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            for child in ast.walk(node):
                if child is target:
                    return node
    return None
