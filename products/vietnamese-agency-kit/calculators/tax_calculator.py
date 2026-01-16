#!/usr/bin/env python3
"""
🧮 Vietnam Tax Calculator
=========================
Calculate PIT (Personal Income Tax) and CIT (Corporate Income Tax) for Vietnam.

Usage:
    python3 tax_calculator.py --income 500000000 --type PIT
    python3 tax_calculator.py --revenue 2000000000 --type CIT
"""

import argparse
from typing import Tuple


def calculate_pit(annual_income: int) -> Tuple[int, float]:
    """
    Calculate Personal Income Tax (PIT) for Vietnam.

    Progressive tax brackets:
    - 0 - 60M: 0%
    - 60M - 120M: 5%
    - 120M - 216M: 10%
    - 216M - 384M: 15%
    - 384M - 624M: 20%
    - 624M - 960M: 25%
    - > 960M: 35%
    """
    brackets = [
        (60_000_000, 0.0),
        (120_000_000, 0.05),
        (216_000_000, 0.10),
        (384_000_000, 0.15),
        (624_000_000, 0.20),
        (960_000_000, 0.25),
        (float("inf"), 0.35),
    ]

    tax = 0
    prev_limit = 0

    for limit, rate in brackets:
        if annual_income <= prev_limit:
            break
        taxable = min(annual_income, limit) - prev_limit
        tax += taxable * rate
        prev_limit = limit

    effective_rate = (tax / annual_income * 100) if annual_income > 0 else 0
    return int(tax), effective_rate


def calculate_cit(revenue: int, expenses: int = 0) -> Tuple[int, float]:
    """
    Calculate Corporate Income Tax (CIT) for Vietnam.

    Standard rate: 20%
    Tech startup incentive: 10% (first 2 years)
    """
    profit = revenue - expenses
    if profit <= 0:
        return 0, 0.0

    # Standard 20% rate
    tax = int(profit * 0.20)
    return tax, 20.0


def format_vnd(amount: int) -> str:
    """Format amount in VND with thousand separators."""
    return f"{amount:,} VND".replace(",", ".")


def main():
    parser = argparse.ArgumentParser(description="Vietnam Tax Calculator")
    parser.add_argument("--income", type=int, help="Annual income (VND) for PIT")
    parser.add_argument("--revenue", type=int, help="Annual revenue (VND) for CIT")
    parser.add_argument(
        "--expenses", type=int, default=0, help="Business expenses (VND)"
    )
    parser.add_argument(
        "--type", choices=["PIT", "CIT"], required=True, help="Tax type"
    )

    args = parser.parse_args()

    print("\n🧮 VIETNAM TAX CALCULATOR")
    print("=" * 40)

    if args.type == "PIT":
        if not args.income:
            print("❌ Error: --income required for PIT calculation")
            return

        tax, rate = calculate_pit(args.income)
        print(f"📊 Income: {format_vnd(args.income)}")
        print(f"💰 PIT Tax: {format_vnd(tax)}")
        print(f"📈 Effective Rate: {rate:.2f}%")

    elif args.type == "CIT":
        if not args.revenue:
            print("❌ Error: --revenue required for CIT calculation")
            return

        tax, rate = calculate_cit(args.revenue, args.expenses)
        profit = args.revenue - args.expenses
        print(f"📊 Revenue: {format_vnd(args.revenue)}")
        print(f"📉 Expenses: {format_vnd(args.expenses)}")
        print(f"💵 Profit: {format_vnd(profit)}")
        print(f"💰 CIT Tax: {format_vnd(tax)}")
        print(f"📈 Rate: {rate:.1f}%")

    print("=" * 40)
    print("🏯 Powered by Vietnamese Agency Kit\n")


if __name__ == "__main__":
    main()
