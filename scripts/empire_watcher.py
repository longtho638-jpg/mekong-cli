#!/usr/bin/env python3
"""
🔔 EMPIRE WATCHER - Real-time Business Monitoring
=================================================
Watches for changes and sends macOS notifications.
Run in background to get alerts when:
- New sale arrives
- Lead stage changes
- Campaign post is due

Usage:
    python3 scripts/empire_watcher.py start    # Start watching
    python3 scripts/empire_watcher.py check    # One-time check
    python3 scripts/empire_watcher.py test     # Test notification
"""

import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# Config
CONFIG_DIR = Path.home() / ".mekong"
SALES_LOG = CONFIG_DIR / "sales.log"
LEADS_FILE = CONFIG_DIR / "leads.json"
QUEUE_FILE = CONFIG_DIR / "social_queue.json"
FOLLOWUPS_FILE = CONFIG_DIR / "followups.json"
STATE_FILE = CONFIG_DIR / "watcher_state.json"

# Colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"


def notify(title, message, sound="Glass"):
    """Send macOS notification."""
    script = f'''
    display notification "{message}" with title "{title}" sound name "{sound}"
    '''
    subprocess.run(["osascript", "-e", script], capture_output=True)
    print(f"  🔔 {title}: {message}")


def load_json(path):
    if path.exists():
        try:
            with open(path) as f:
                return json.load(f)
        except:
            return []
    return []


def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"last_sales_count": 0, "last_leads_hash": "", "last_check": None}


def count_sales():
    """Count lines in sales.log"""
    if SALES_LOG.exists():
        with open(SALES_LOG) as f:
            return len([l for l in f.readlines() if l.strip()])
    return 0


def get_leads_hash():
    """Create a simple hash of leads state."""
    leads = load_json(LEADS_FILE)
    return str(len(leads)) + "_" + "_".join([l.get("stage", "") for l in leads])


def check_sales():
    """Check for new sales."""
    state = load_state()
    current_count = count_sales()
    last_count = state.get("last_sales_count", 0)

    if current_count > last_count:
        new_sales = current_count - last_count
        # Get last sale details
        if SALES_LOG.exists():
            with open(SALES_LOG) as f:
                lines = f.readlines()
                if lines:
                    last_line = lines[-1].strip()
                    parts = last_line.split("|")
                    if len(parts) >= 3:
                        product = parts[1]
                        price = parts[2]
                        notify("💰 NEW SALE!", f"{product} - ${price}", "Ping")
                        return True

    state["last_sales_count"] = current_count
    save_state(state)
    return False


def check_leads():
    """Check for lead stage changes."""
    state = load_state()
    current_hash = get_leads_hash()
    last_hash = state.get("last_leads_hash", "")

    if current_hash != last_hash and last_hash != "":
        leads = load_json(LEADS_FILE)
        # Find meeting or closed leads
        hot_leads = [l for l in leads if l.get("stage") in ["meeting", "closed"]]
        if hot_leads:
            lead = hot_leads[-1]
            notify("🔥 HOT LEAD!", f"{lead['name']} → {lead['stage'].upper()}", "Hero")

    state["last_leads_hash"] = current_hash
    save_state(state)


def check_followups():
    """Check for follow-ups due today."""
    today = datetime.now().strftime("%Y-%m-%d")
    followups = load_json(FOLLOWUPS_FILE)

    due_today = [
        f
        for f in followups
        if f.get("due_date") == today and f.get("status") == "pending"
    ]

    if due_today:
        notify(
            "📬 FOLLOW-UP DUE", f"{len(due_today)} follow-up(s) to send today!", "Basso"
        )


def check_queue():
    """Check for content due today."""
    today = datetime.now().strftime("%Y-%m-%d")
    queue = load_json(QUEUE_FILE)

    due_today = [
        q for q in queue if q.get("date") == today and q.get("status") == "queued"
    ]

    if due_today:
        notify("📣 POST DUE", f"{len(due_today)} post(s) scheduled for today!", "Pop")


def cmd_check():
    """One-time check of all systems."""
    print(f"\n{BOLD}🔔 EMPIRE WATCHER - Status Check{RESET}")
    print("=" * 50)
    print(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    print(f"\n{CYAN}Checking for updates...{RESET}")

    check_sales()
    check_leads()
    check_followups()
    check_queue()

    state = load_state()
    state["last_check"] = datetime.now().isoformat()
    save_state(state)

    print(f"\n{GREEN}✅ Check complete.{RESET}")


def cmd_start():
    """Start watching (runs continuously)."""
    print(f"\n{BOLD}🔔 EMPIRE WATCHER - Monitoring Mode{RESET}")
    print("=" * 50)
    print("  Watching for: Sales, Lead changes, Follow-ups, Posts")
    print("  Press Ctrl+C to stop")
    print()

    try:
        while True:
            check_sales()
            check_leads()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        print(f"\n{YELLOW}⏹️  Stopped watching.{RESET}")


def cmd_test():
    """Send a test notification."""
    print(f"\n{CYAN}Sending test notification...{RESET}")
    notify("🧪 TEST", "Empire Watcher is working!", "Glass")
    print(f"{GREEN}✅ If you saw a notification, it's working!{RESET}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1].lower()

    if cmd == "start":
        cmd_start()
    elif cmd == "check":
        cmd_check()
    elif cmd == "test":
        cmd_test()
    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
