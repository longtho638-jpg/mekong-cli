import os
import sys
from importlib import import_module

import pytest

# Add current directory to path
sys.path.insert(0, os.getcwd())

SERVERS = [
    "agency_server",
    "coding_server",
    "commander_server",
    "marketing_server",
    "network_server",
    "orchestrator_server",
    "quota_server",
    "recovery_server",
    "revenue_server",
    "security_server",
    "solo_revenue_server",
    "sync_server",
    "ui_server",
    "workflow_server",
]

def test_server_import_and_instantiation():
    """
    Verifies that each server module can be imported and the server class instantiated.
    This checks for:
    1. Syntax errors
    2. Import errors (missing dependencies)
    3. Inheritance issues (BaseMCPServer)
    """
    results = {}

    for server_name in SERVERS:
        module_path = f"antigravity.mcp_servers.{server_name}.server"
        try:
            # Try importing the module
            module = import_module(module_path)

            # Try finding the server class (assuming standard naming convention or single class)
            # Usually named {Name}Server or just Server
            server_class = None
            for attr_name in dir(module):
                if attr_name.endswith("Server") and attr_name != "BaseMCPServer":
                    server_class = getattr(module, attr_name)
                    break

            if not server_class:
                results[server_name] = "FAIL: No Server class found"
                continue

            # Try instantiating
            # Most servers initialize with name and optional tools
            try:
                server_instance = server_class()
                results[server_name] = "PASS"
            except Exception as e:
                # Some might require args, try with simple name if that fails
                try:
                    server_instance = server_class(name=server_name)
                    results[server_name] = "PASS"
                except Exception:
                    results[server_name] = f"FAIL: Instantiation error: {str(e)}"

        except ImportError as e:
            results[server_name] = f"FAIL: Import error: {str(e)}"
        except Exception as e:
            results[server_name] = f"FAIL: General error: {str(e)}"

    return results

if __name__ == "__main__":
    print("Running Server Integration Verification...")
    results = test_server_import_and_instantiation()

    failed = False
    for server, result in results.items():
        print(f"{server}: {result}")
        if "FAIL" in result:
            failed = True

    if failed:
        sys.exit(1)
    else:
        print("\nAll servers verified successfully.")
        sys.exit(0)
