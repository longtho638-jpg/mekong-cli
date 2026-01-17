#!/usr/bin/env python3
"""
🔔 Gumroad Webhook Handler
==========================
Receives sale notifications from Gumroad.
Auto-updates revenue tracker.

Setup:
1. Go to Gumroad Settings > Advanced > Webhooks
2. Add webhook URL: https://your-domain.com/api/webhook/gumroad
3. Or run locally: python3 scripts/gumroad_webhook.py

Usage (local test):
    python3 scripts/gumroad_webhook.py --test
"""

import json
import subprocess
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


class GumroadWebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle Gumroad webhook POST."""
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8")

        try:
            data = json.loads(body)
            self.handle_sale(data)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        except Exception as e:
            print(f"❌ Error: {e}")
            self.send_response(500)
            self.end_headers()

    def handle_sale(self, data):
        """Process sale data."""
        product = data.get("product_name", "Unknown")
        price = float(data.get("price", 0)) / 100
        email = data.get("email", "N/A")

        print("\n🎉 NEW SALE!")
        print(f"   Product: {product}")
        print(f"   Price: ${price:.2f}")
        print(f"   Email: {email}")
        print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        # Auto-update revenue tracker
        subprocess.run(
            [
                "python3",
                "scripts/revenue_tracker.py",
                "add",
                str(price),
                "gumroad",
                f"{product}",
            ]
        )

        # Log to file
        log_file = Path(".mekong/sales.log")
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, "a") as f:
            f.write(f"{datetime.now().isoformat()}|{product}|{price}|{email}\n")


def simulate_sale():
    """Simulate a sale for testing."""
    print("\n🧪 Simulating Gumroad sale...")

    mock_data = {
        "product_name": "FastAPI Starter Template",
        "price": 3700,  # cents
        "email": "test@example.com",
        "sale_id": "test_123",
    }

    handler = GumroadWebhookHandler
    handler.handle_sale(None, mock_data)


def main():
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        simulate_sale()
        return

    port = 8888
    server = HTTPServer(("localhost", port), GumroadWebhookHandler)
    print(f"🔔 Gumroad Webhook Server running on http://localhost:{port}")
    print("   Add this URL to Gumroad Settings > Advanced > Webhooks")
    print("   Press Ctrl+C to stop\n")
    server.serve_forever()


if __name__ == "__main__":
    main()
