#!/usr/bin/env python3
"""
💵 INVOICE GENERATOR - One-Click Professional Invoices
=======================================================
Generate PDF invoices with PayPal payment links.

Usage:
    python3 scripts/invoice_generator.py create <client> <amount> <description>
    python3 scripts/invoice_generator.py list
    python3 scripts/invoice_generator.py status <invoice_id>
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
INVOICES_FILE = CONFIG_DIR / "invoices.json"
INVOICES_DIR = CONFIG_DIR / "invoices"

# PayPal me link (customize this)
PAYPAL_ME = os.getenv("PAYPAL_ME_LINK", "https://paypal.me/yourname")

# Service catalog for quick invoicing
SERVICES = {
    "ghost_cto_lite": {"name": "Ghost CTO Lite (1 month)", "price": 2000},
    "ghost_cto_full": {"name": "Ghost CTO Full (1 month)", "price": 5000},
    "strategy_session": {"name": "Strategy Session", "price": 997},
    "venture_architecture": {"name": "Venture Architecture", "price": 10000},
    "moat_audit": {"name": "Moat Audit Sprint", "price": 3000},
    "rapid_mvp": {"name": "Rapid MVP (14 days)", "price": 15000},
}


def load_invoices():
    if INVOICES_FILE.exists():
        with open(INVOICES_FILE) as f:
            return json.load(f)
    return []


def save_invoices(invoices):
    CONFIG_DIR.mkdir(exist_ok=True)
    with open(INVOICES_FILE, "w") as f:
        json.dump(invoices, f, indent=2)


def generate_invoice_id():
    """Generate invoice ID like INV-2026-0001."""
    invoices = load_invoices()
    year = datetime.now().year
    count = sum(1 for i in invoices if str(year) in i.get("id", "")) + 1
    return f"INV-{year}-{count:04d}"


def cmd_create(args):
    """Create a new invoice."""
    if len(args) < 3:
        print("Usage: invoice_generator.py create <client> <amount> <description>")
        print("\nQuick services:")
        for key, svc in SERVICES.items():
            print(f"  {key}: {svc['name']} (${svc['price']})")
        return

    client = args[0]

    # Check if using service shorthand
    if args[1] in SERVICES:
        svc = SERVICES[args[1]]
        amount = svc["price"]
        description = svc["name"]
    else:
        amount = float(args[1])
        description = " ".join(args[2:])

    invoice_id = generate_invoice_id()
    due_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")

    invoice = {
        "id": invoice_id,
        "client": client,
        "amount": amount,
        "description": description,
        "status": "pending",  # pending → paid → cancelled
        "created": datetime.now().isoformat(),
        "due_date": due_date,
        "paid_date": None,
        "payment_link": f"{PAYPAL_ME}/{amount}",
    }

    invoices = load_invoices()
    invoices.append(invoice)
    save_invoices(invoices)

    # Generate markdown invoice
    INVOICES_DIR.mkdir(exist_ok=True)
    invoice_path = INVOICES_DIR / f"{invoice_id}.md"

    invoice_md = f"""# 🏯 INVOICE {invoice_id}

**From**: AgencyOS  
**To**: {client}  
**Date**: {datetime.now().strftime("%Y-%m-%d")}  
**Due**: {due_date}

---

## Services

| Description | Amount |
|:---|---:|
| {description} | **${amount:,.2f}** |

---

## Total: **${amount:,.2f} USD**

---

## Payment

**PayPal**: [{PAYPAL_ME}/{amount}]({PAYPAL_ME}/{amount})

Or scan QR code in your PayPal app.

---

Thank you for your business!

🏯 AgencyOS | "Win Without Fighting"
"""

    with open(invoice_path, "w") as f:
        f.write(invoice_md)

    print("\n✅ INVOICE CREATED")
    print("=" * 50)
    print(f"   ID: {invoice_id}")
    print(f"   Client: {client}")
    print(f"   Amount: ${amount:,.2f}")
    print(f"   Due: {due_date}")
    print(f"   File: {invoice_path}")
    print(f"\n💰 Payment Link: {PAYPAL_ME}/{amount}")


def cmd_list():
    """List all invoices."""
    invoices = load_invoices()

    if not invoices:
        print("📋 No invoices yet.")
        return

    print(f"\n📋 INVOICES ({len(invoices)} total)")
    print("=" * 70)

    total_pending = 0
    total_paid = 0

    for inv in invoices:
        status_icons = {"pending": "⏳", "paid": "✅", "cancelled": "❌"}
        icon = status_icons.get(inv["status"], "❓")

        print(
            f"  {icon} {inv['id']} | {inv['client']:<20} | ${inv['amount']:>8,.2f} | {inv['status']}"
        )

        if inv["status"] == "pending":
            total_pending += inv["amount"]
        elif inv["status"] == "paid":
            total_paid += inv["amount"]

    print("-" * 70)
    print(f"  💵 Paid: ${total_paid:,.2f} | ⏳ Pending: ${total_pending:,.2f}")
    print()


def cmd_status(args):
    """Update invoice status."""
    if len(args) < 1:
        print("Usage: invoice_generator.py status <invoice_id> [paid|cancelled]")
        return

    invoice_id = args[0].upper()
    new_status = args[1].lower() if len(args) > 1 else None

    invoices = load_invoices()
    invoice = next((i for i in invoices if i["id"] == invoice_id), None)

    if not invoice:
        print(f"❌ Invoice {invoice_id} not found")
        return

    if new_status:
        if new_status in ["paid", "cancelled"]:
            invoice["status"] = new_status
            if new_status == "paid":
                invoice["paid_date"] = datetime.now().isoformat()
            save_invoices(invoices)
            print(f"✅ Invoice {invoice_id} marked as {new_status}")
        else:
            print("❌ Invalid status. Use: paid, cancelled")
    else:
        # Show invoice details
        print(f"\n📄 INVOICE {invoice['id']}")
        print("=" * 40)
        print(f"   Client: {invoice['client']}")
        print(f"   Amount: ${invoice['amount']:,.2f}")
        print(f"   Status: {invoice['status']}")
        print(f"   Created: {invoice['created'][:10]}")
        print(f"   Due: {invoice['due_date']}")
        if invoice["paid_date"]:
            print(f"   Paid: {invoice['paid_date'][:10]}")
        print(f"\n   💰 Payment Link: {invoice['payment_link']}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nQuick Services:")
        for key, svc in SERVICES.items():
            print(f"  • {key}: {svc['name']} (${svc['price']})")
        return

    cmd = sys.argv[1].lower()
    args = sys.argv[2:]

    if cmd == "create":
        cmd_create(args)
    elif cmd == "list":
        cmd_list()
    elif cmd == "status":
        cmd_status(args)
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
