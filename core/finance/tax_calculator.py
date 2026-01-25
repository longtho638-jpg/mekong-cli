#!/usr/bin/env python3
"""
Vietnam Tax Strategy (2026)
============================
Implements the threshold-based simplified tax calculation for agencies.

Business Rules:
- Below 500M VND per quarter: 0.5% simplified tax
- Above 500M VND per quarter: 20% (10% standard + 10% VAT)
"""


def calculate_vn_tax(amount_vnd: float, quarter_total: float) -> dict:
    """
    Calculate Vietnam tax based on quarterly threshold.

    Args:
        amount_vnd: Amount in VND for this transaction
        quarter_total: Total revenue in VND for the quarter so far

    Returns:
        dict with 'rate' and 'method' keys

    Example:
        >>> calculate_vn_tax(100_000_000, 200_000_000)
        {'rate': 0.005, 'method': 'simplified'}

        >>> calculate_vn_tax(300_000_000, 400_000_000)
        {'rate': 0.20, 'method': 'standard + VAT'}
    """
    THRESHOLD = 500_000_000  # VND per quarter

    if quarter_total + amount_vnd <= THRESHOLD:
        return {
            "rate": 0.005,  # 0.5%
            "method": "simplified"
        }
    else:
        return {
            "rate": 0.20,  # 20% (10% + 10%)
            "method": "standard + VAT"
        }


if __name__ == "__main__":
    # Test cases
    print("Vietnam Tax Calculator - 2026 Strategy")
    print("=" * 50)

    # Test 1: Below threshold
    result1 = calculate_vn_tax(100_000_000, 200_000_000)
    print("\nTest 1: 100M VND (quarter total: 300M)")
    print(f"  Rate: {result1['rate']*100}% ({result1['method']})")

    # Test 2: Above threshold
    result2 = calculate_vn_tax(300_000_000, 400_000_000)
    print("\nTest 2: 300M VND (quarter total: 700M)")
    print(f"  Rate: {result2['rate']*100}% ({result2['method']})")

    print("\n" + "=" * 50)
