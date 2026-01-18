#!/usr/bin/env python3
"""
Send Invoice - Quick invoice generation and tracking
Usage: python3 scripts/send_invoice.py <client_name> <amount> <scope>
"""

import subprocess
import sys
from datetime import datetime
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent
INVOICES_DIR = Path(__file__).parent.parent / "invoices"


def run_cmd(cmd: list[str]) -> bool:
    """Run command and return success status."""
    print(f"▶ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode == 0


def main():
    if len(sys.argv) < 4:
        print("Usage: python3 send_invoice.py <client_name> <amount> <scope>")
        print("Example: python3 send_invoice.py 'TechStart' 3000 'Ghost CTO Lite'")
        sys.exit(1)

    client_name = sys.argv[1]
    amount = sys.argv[2]
    scope = sys.argv[3]

    print("\n💰 SEND INVOICE - Emergency Revenue Sprint")
    print("=" * 50)

    # Create invoices directory if not exists
    INVOICES_DIR.mkdir(exist_ok=True)

    # Generate invoice ID
    invoice_id = f"INV-{datetime.now().strftime('%Y-%m')}-{datetime.now().strftime('%d%H%M')}"

    # Step 1: Generate contract/invoice
    print(f"\n📄 Step 1: Generating invoice {invoice_id}...")

    # Create simple invoice markdown
    invoice_content = f"""# INVOICE {invoice_id}

**Date:** {datetime.now().strftime("%Y-%m-%d")}
**Due:** Net 15

---

## Bill To
**{client_name}**

---

## Services

| Description | Amount |
|:---|---:|
| {scope} (Monthly) | ${amount} |
| **Total Due** | **${amount}** |

---

## Payment
PayPal: payment@agencyos.dev

---

*Thank you for your business!*
*🏯 BiNH PHÁP Venture Studio*
"""

    invoice_path = INVOICES_DIR / f"{invoice_id}.md"
    invoice_path.write_text(invoice_content)
    print(f"   ✅ Invoice saved: {invoice_path}")

    # Step 2: Track in system
    print("\n📊 Step 2: Tracking invoice...")
    print(f"   Client: {client_name}")
    print(f"   Amount: ${amount}")
    print(f"   Scope: {scope}")
    print("   Status: PENDING")

    print("\n✅ Invoice ready!")
    print(f"   File: {invoice_path}")
    print("\n📧 Next: Send invoice to client and mark as paid when received:")
    print(f"   python3 scripts/invoice_generator.py status {invoice_id} paid")
    print("\n🏯 Binh Pháp: Tiền về tài khoản!")


if __name__ == "__main__":
    main()
