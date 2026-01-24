import os
import sys

# Add project root to path
sys.path.insert(0, os.getcwd())

print(f"sys.path: {sys.path}")

try:
    import core
    print(f"core: {core}")
    print(f"core file: {core.__file__}")
except ImportError as e:
    print(f"ImportError core: {e}")

try:
    import core.modules
    print(f"core.modules: {core.modules}")
except ImportError as e:
    print(f"ImportError core.modules: {e}")

try:
    from core.modules.crm import CRM
    print(f"CRM: {CRM}")
except ImportError as e:
    print(f"ImportError CRM: {e}")
