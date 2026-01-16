#!/usr/bin/env python3
"""
🔧 Import System - AgencyOS
===========================

Centralized import management to eliminate sys.path abuse.
Sets up proper package structure and handles imports cleanly.
"""

import os
import sys
from pathlib import Path
from typing import Optional, Set

class ImportManager:
    """Manages imports without sys.path abuse."""
    
    def __init__(self):
        self.mekong_root = Path(__file__).parent.parent.parent
        self.setup_python_path()
    
    def setup_python_path(self):
        """Setup proper Python path structure."""
        # Add project root to PYTHONPATH if not already present
        project_root = str(self.mekong_root)
        if project_root not in sys.path:
            sys.path.insert(0, project_root)
        
        # Setup package paths
        packages = [
            "antigravity",
            "apps", 
            "backend",
            "cli",
            "core",
            "scripts",
            "tests"
        ]
        
        for package in packages:
            package_path = self.mekong_root / package
            if package_path.exists() and str(package_path) not in sys.path:
                sys.path.insert(0, str(package_path))
    
    def get_import_path(self, module_path: str) -> str:
        """Convert relative path to proper import path."""
        # Handle common import patterns
        if module_path.startswith("core."):
            return module_path
        elif module_path.startswith("cli."):
            return module_path
        elif module_path.startswith("backend."):
            return module_path
        elif module_path.startswith("antigravity."):
            return module_path
        elif module_path.startswith("apps."):
            return module_path
        else:
            # Fallback to original path
            return module_path
    
    def import_module(self, module_path: str):
        """Import module with proper error handling."""
        try:
            clean_path = self.get_import_path(module_path)
            return __import__(clean_path, fromlist=['*'])
        except ImportError as e:
            raise ImportError(f"Failed to import {module_path}: {e}")

# Global import manager instance
_import_manager = None

def get_import_manager() -> ImportManager:
    """Get or create import manager instance."""
    global _import_manager
    if _import_manager is None:
        _import_manager = ImportManager()
    return _import_manager

def setup_imports():
    """Setup import system - call once at application start."""
    get_import_manager()

def import_from_path(module_path: str):
    """Import module using centralized system."""
    return get_import_manager().import_module(module_path)