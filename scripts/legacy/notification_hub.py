#!/usr/bin/env python3
"""
🔔 NOTIFICATION HUB - Push Alerts for Business Events
======================================================
Get notified instantly when important things happen.

Usage:
    python3 scripts/notification_hub.py test      # Test notification
    python3 scripts/notification_hub.py sale      # Simulate sale alert
    python3 scripts/notification_hub.py check     # Check for new events
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# Paths
CONFIG_DIR = Path.home() / ".mekong"
EVENTS_FILE = CONFIG_DIR / "events.json"


# Notification methods
def notify_macos(title, message, sound="default"):
    """Send macOS notification via osascript."""
    script = f'''
    display notification "{message}" with title "{title}" sound name "{sound}"
    '''
    try:
        subprocess.run(["osascript", "-e", script], capture_output=True)
        return True
    except Exception:
        return False


def notify_terminal(title, message, icon="🔔"):
    """Print colored notification to terminal."""
    GREEN = "\033[92m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

    print(f"\n{BOLD}{GREEN}{'═' * 50}{RESET}")
    print(f"{icon} {BOLD}{title}{RESET}")
    print(f"{'─' * 50}")
    print(f"   {message}")
    print(f"{GREEN}{'═' * 50}{RESET}\n")


def notify_log(event_type, data):
    """Log event to file for history."""
    CONFIG_DIR.mkdir(exist_ok=True)

    events = []
    if EVENTS_FILE.exists():
        with open(EVENTS_FILE) as f:
            events = json.load(f)

    event = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.now().isoformat(),
        "seen": False,
    }

    events.append(event)

    # Keep last 100 events
    events = events[-100:]

    with open(EVENTS_FILE, "w") as f:
        json.dump(events, f, indent=2)


def send_notification(event_type, title, message, data=None):
    """Send notification through all channels."""
    # Terminal
    icons = {
        "sale": "💰",
        "lead": "📧",
        "invoice": "📄",
        "payment": "✅",
        "alert": "⚠️",
        "info": "ℹ️",
    }
    icon = icons.get(event_type, "🔔")
    notify_terminal(title, message, icon)

    # macOS
    notify_macos(title, message)

    # Log
    notify_log(event_type, {"title": title, "message": message, **(data or {})})

    return True


# Event generators
def event_sale(product_name="Product", amount=0, customer="Customer"):
    """Generate sale notification."""
    return send_notification(
        "sale",
        f"💰 NEW SALE: ${amount / 100:.2f}",
        f"{customer} purchased {product_name}",
        {"product": product_name, "amount": amount, "customer": customer},
    )


def event_lead(name, email, company=""):
    """Generate new lead notification."""
    return send_notification(
        "lead",
        "📧 NEW LEAD",
        f"{name} ({email}) from {company or 'Unknown'}",
        {"name": name, "email": email, "company": company},
    )


def event_payment(invoice_id, amount, client):
    """Generate payment received notification."""
    return send_notification(
        "payment",
        f"✅ PAYMENT RECEIVED: ${amount:.2f}",
        f"Invoice {invoice_id} paid by {client}",
        {"invoice_id": invoice_id, "amount": amount, "client": client},
    )


def event_alert(title, message):
    """Generate alert notification."""
    return send_notification("alert", f"⚠️ {title}", message)


# Commands
def cmd_test():
    """Test notification system."""
    print("🔔 Testing notification system...")
    send_notification(
        "info", "Test Notification", "If you see this, notifications work!"
    )
    print("✅ Check your notification center")


def cmd_sale():
    """Simulate a sale notification."""
    event_sale("AgencyOS Pro", 19700, "demo@example.com")


def cmd_check():
    """Check for new/unseen events."""
    if not EVENTS_FILE.exists():
        print("📋 No events yet")
        return

    with open(EVENTS_FILE) as f:
        events = json.load(f)

    unseen = [e for e in events if not e.get("seen")]

    if not unseen:
        print("✅ No new events")
        return

    print(f"\n🔔 {len(unseen)} NEW EVENTS")
    print("=" * 50)

    for event in unseen[-5:]:  # Show last 5
        icons = {"sale": "💰", "lead": "📧", "payment": "✅", "alert": "⚠️"}
        icon = icons.get(event["type"], "🔔")
        time = event["timestamp"][11:16]  # HH:MM
        print(f"  {icon} [{time}] {event['data'].get('title', event['type'])}")

    # Mark as seen
    for event in events:
        event["seen"] = True
    with open(EVENTS_FILE, "w") as f:
        json.dump(events, f, indent=2)


def cmd_history():
    """Show event history."""
    if not EVENTS_FILE.exists():
        print("📋 No events yet")
        return

    with open(EVENTS_FILE) as f:
        events = json.load(f)

    print(f"\n📋 EVENT HISTORY ({len(events)} total)")
    print("=" * 60)

    for event in events[-10:]:  # Last 10
        icons = {"sale": "💰", "lead": "📧", "payment": "✅", "alert": "⚠️", "info": "ℹ️"}
        icon = icons.get(event["type"], "🔔")
        time = event["timestamp"][:16].replace("T", " ")
        title = event["data"].get("title", event["type"])
        print(f"  {icon} [{time}] {title}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("Commands: test, sale, check, history")
        return

    cmd = sys.argv[1].lower()

    if cmd == "test":
        cmd_test()
    elif cmd == "sale":
        cmd_sale()
    elif cmd == "check":
        cmd_check()
    elif cmd == "history":
        cmd_history()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
