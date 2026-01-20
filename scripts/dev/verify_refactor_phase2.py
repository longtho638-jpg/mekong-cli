import importlib
import os
import sys

# Add root to path explicitly
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
sys.path.insert(0, root_dir)

print(f"Root dir: {root_dir}")
print(f"Sys path: {sys.path[:2]}")

try:
    import antigravity
    print(f"Antigravity package: {antigravity.__file__}")

    import antigravity.core
    print(f"Antigravity core: {antigravity.core.__file__}")

    print("Attempting to import algorithm_enhanced...")
    import antigravity.core.algorithm_enhanced as ae
    print(f"Module imported: {ae}")

    print("Classes in module:")
    for name in dir(ae):
        if not name.startswith("_"):
            print(f" - {name}")

    # Test functionality
    res = ae.calculate_optimized_price(100.0)
    print(f"Calculation result: {res}")

except ImportError as e:
    print(f"❌ ImportError: {e}")
    # checking what antigravity resolves to if it failed
    if 'antigravity' in sys.modules:
        print(f"antigravity module: {sys.modules['antigravity']}")

except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()
