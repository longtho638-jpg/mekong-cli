import sys
import os

# Add root to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import from facade...")
    from antigravity.core.algorithm_enhanced import (
        enhanced_algorithm,
        calculate_optimized_price,
        PricingStrategy
    )
    print("✅ Import successful!")

    print("Testing calculate_optimized_price...")
    result = calculate_optimized_price(
        base_price=100.0,
        strategy=PricingStrategy.VIRAL_COEFFICIENT
    )
    print(f"✅ Result: {result}")

    if result['final_price'] == 100.0:
         print("✅ Price calculation looks sane (default)")
    else:
         print(f"✅ Price calculation modified: {result['final_price']}")

except ImportError as e:
    print(f"❌ ImportError: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Exception: {e}")
    sys.exit(1)
