#!/usr/bin/env python3
"""
🔍 PayPal API Deprecation Checker
==================================
Scans codebase to ensure no deprecated PayPal APIs are used.

Based on: https://developer.paypal.com/api/rest/deprecated-resources/

DEPRECATED → CURRENT:
- Billing Agreements → Subscriptions (/v1/billing/subscriptions)
- Billing Plans (old) → Subscriptions (/v1/billing/plans)
- Invoicing v1 → Invoicing v2 (/v2/invoicing)
- Orders v1 → Orders v2 (/v2/checkout/orders)
- Payments v1 → Payments v2 (/v2/payments)
- Partner Referrals v1 → Partner Referrals v2

Usage:
    python3 scripts/paypal_deprecation_check.py
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Deprecated API patterns and their replacements
DEPRECATED_PATTERNS = {
    # Billing Agreements (deprecated) - should use Subscriptions
    r"/v1/payments/billing-agreements": {
        "name": "Billing Agreements v1",
        "replacement": "Subscriptions API (/v1/billing/subscriptions)",
        "severity": "high",
    },
    r"/v1/payments/billing-plans": {
        "name": "Billing Plans v1 (old)",
        "replacement": "Subscriptions API (/v1/billing/plans)",
        "severity": "high",
    },
    # Invoicing v1 (deprecated)
    r"/v1/invoicing": {
        "name": "Invoicing v1",
        "replacement": "Invoicing v2 (/v2/invoicing)",
        "severity": "high",
    },
    # Orders v1 (deprecated)
    r"/v1/checkout/orders": {
        "name": "Orders v1",
        "replacement": "Orders v2 (/v2/checkout/orders)",
        "severity": "high",
    },
    # Payments v1 (some endpoints deprecated)
    r"/v1/payments/payment[^s]": {
        "name": "Payments v1 (legacy)",
        "replacement": "Orders v2 + Payments v2",
        "severity": "medium",
    },
    # Partner Referrals v1
    r"/v1/customer/partner-referrals": {
        "name": "Partner Referrals v1",
        "replacement": "Partner Referrals v2 (/v2/customer/partner-referrals)",
        "severity": "medium",
    },
}

# Modern API patterns (for verification)
MODERN_PATTERNS = {
    r"/v2/checkout/orders": "Orders v2 ✅",
    r"/v2/invoicing": "Invoicing v2 ✅",
    r"/v1/billing/subscriptions": "Subscriptions ✅",
    r"/v1/billing/plans": "Billing Plans ✅",
    r"/v2/payments": "Payments v2 ✅",
    r"/v1/notifications/webhooks": "Webhooks ✅",
    r"/v1/catalogs/products": "Catalog Products ✅",
    r"/v1/shipping/trackers": "Shipment Tracking ✅",
    r"/v1/customer/disputes": "Disputes ✅",
    r"/v1/reporting/transactions": "Reporting ✅",
}

# File extensions to scan
SCAN_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx"}

# Directories to skip
SKIP_DIRS = {"node_modules", ".git", "__pycache__", "dist", "build", ".next", "venv"}

# Files to skip (including self)
SKIP_FILES = {"paypal_deprecation_check.py"}


def scan_file(filepath: Path) -> List[Tuple[int, str, Dict]]:
    """Scan a single file for deprecated API usage."""
    issues = []

    try:
        content = filepath.read_text(encoding="utf-8")
        lines = content.splitlines()

        for line_num, line in enumerate(lines, 1):
            for pattern, info in DEPRECATED_PATTERNS.items():
                if re.search(pattern, line):
                    issues.append((line_num, line.strip(), info))
    except Exception as e:
        print(f"  ⚠️ Error reading {filepath}: {e}")

    return issues


def scan_directory(directory: Path) -> Dict[str, List]:
    """Scan directory recursively."""
    results = {
        "deprecated": [],
        "modern": [],
        "files_scanned": 0,
    }

    for root, dirs, files in os.walk(directory):
        # Skip unwanted directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in files:
            # Skip self and other excluded files
            if filename in SKIP_FILES:
                continue

            filepath = Path(root) / filename

            if filepath.suffix not in SCAN_EXTENSIONS:
                continue

            results["files_scanned"] += 1

            # Check for deprecated APIs
            issues = scan_file(filepath)
            if issues:
                results["deprecated"].append(
                    {
                        "file": str(filepath.relative_to(directory)),
                        "issues": issues,
                    }
                )

            # Check for modern APIs
            try:
                content = filepath.read_text(encoding="utf-8")
                for pattern, api_name in MODERN_PATTERNS.items():
                    if re.search(pattern, content):
                        results["modern"].append(
                            {
                                "file": str(filepath.relative_to(directory)),
                                "api": api_name,
                            }
                        )
            except Exception:
                pass

    return results


def print_report(results: Dict):
    """Print the deprecation report."""
    print("\n" + "=" * 70)
    print("🔍 PAYPAL API DEPRECATION CHECK")
    print("=" * 70)

    print(f"\n📊 Files scanned: {results['files_scanned']}")

    # Modern APIs found
    print("\n✅ MODERN APIs FOUND:")
    print("-" * 70)

    modern_apis = {}
    for item in results["modern"]:
        api = item["api"]
        if api not in modern_apis:
            modern_apis[api] = []
        modern_apis[api].append(item["file"])

    if modern_apis:
        for api, files in sorted(modern_apis.items()):
            print(f"  {api}")
            for f in files[:3]:  # Show first 3 files
                print(f"    └─ {f}")
            if len(files) > 3:
                print(f"    └─ ... and {len(files) - 3} more files")
    else:
        print("  (No PayPal APIs found)")

    # Deprecated APIs found
    print("\n❌ DEPRECATED APIs FOUND:")
    print("-" * 70)

    if results["deprecated"]:
        for item in results["deprecated"]:
            print(f"\n  📁 {item['file']}")
            for line_num, line, info in item["issues"]:
                severity_icon = "🔴" if info["severity"] == "high" else "🟡"
                print(f"    {severity_icon} Line {line_num}: {info['name']}")
                print(f"       → Replace with: {info['replacement']}")
                print(f"       Code: {line[:60]}...")
    else:
        print("  ✅ No deprecated APIs found!")

    print("\n" + "=" * 70)

    # Summary
    if results["deprecated"]:
        total_issues = sum(len(item["issues"]) for item in results["deprecated"])
        print(f"\n⚠️ SUMMARY: {total_issues} deprecated API usage(s) found!")
        print("   Please migrate to the recommended alternatives.")
    else:
        print("\n✅ SUMMARY: All clear! No deprecated PayPal APIs in use.")

    print("\n📚 Reference: https://developer.paypal.com/api/rest/deprecated-resources/")
    print()


def main():
    # Default to current directory
    directory = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")

    if not directory.exists():
        print(f"❌ Directory not found: {directory}")
        sys.exit(1)

    print(f"\n🔍 Scanning {directory.absolute()}...")

    results = scan_directory(directory)
    print_report(results)

    # Exit with error code if deprecated APIs found
    if results["deprecated"]:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
