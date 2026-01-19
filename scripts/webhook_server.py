#!/usr/bin/env python3
"""
☢️ Gumroad Webhook Server with Tunnel
======================================

Run locally and expose via tunnel for Gumroad webhook testing.

Options:
1. pyngrok (auto-tunnel)
2. Manual ngrok (if installed)
3. Cloudflare Tunnel

Usage: python3 scripts/webhook_server.py
"""

import logging
import sys
from datetime import datetime
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent))

import uvicorn
from fastapi import BackgroundTasks, FastAPI, Request

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="☢️ Gumroad Webhook Server")


# ═══════════════════════════════════════════════════════════════════════
# 🔗 WEBHOOK HANDLERS
# ═══════════════════════════════════════════════════════════════════════


@app.get("/")
async def root():
    """Health check."""
    return {
        "status": "running",
        "service": "Gumroad Webhook Server",
        "endpoint": "/webhook/gumroad",
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/webhook/gumroad")
async def gumroad_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle Gumroad purchase webhook.
    Triggers workflow_engine closed-loop automation.
    """
    try:
        # Gumroad sends form data
        form_data = await request.form()
        data = dict(form_data)

        logger.info(f"🔔 Gumroad webhook received: {data.get('email', 'unknown')}")
        logger.info(f"   Product: {data.get('product_name', 'unknown')}")
        logger.info(f"   Price: ${data.get('price', 0)}")

        # Trigger workflow engine
        background_tasks.add_task(execute_workflow, data)

        return {"status": "success", "message": "Purchase received, workflow triggered"}

    except Exception as e:
        logger.error(f"❌ Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/webhook/test")
async def test_webhook():
    """Test endpoint."""
    return {"status": "ready", "endpoint": "/webhook/gumroad"}


@app.post("/webhook/test-trigger")
async def test_trigger():
    """Simulate a Gumroad purchase for testing."""
    test_data = {
        "email": "test@example.com",
        "product_id": "agencyos-pro",
        "product_name": "AgencyOS Pro Suite",
        "price": 197,
        "sale_id": f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}",
    }

    await execute_workflow(test_data)
    return {"status": "triggered", "data": test_data}


async def execute_workflow(data: dict):
    """Execute workflow engine with purchase data."""
    try:
        from scripts.vibeos.workflow_engine import WorkflowEngine

        engine = WorkflowEngine()

        # Ensure templates installed
        if "gumroad_closed_loop" not in engine.workflows:
            engine.install_templates()

        # Execute closed-loop workflow
        context = {
            "email": data.get("email", ""),
            "product_id": data.get("product_id", ""),
            "product_name": data.get("product_name", ""),
            "price": float(data.get("price", 0)),
            "sale_id": data.get("sale_id", ""),
        }

        engine.execute("gumroad_closed_loop", context)
        logger.info(f"☢️ Workflow complete for {data.get('email')}")

    except Exception as e:
        logger.error(f"⚠️ Workflow error: {e}")


# ═══════════════════════════════════════════════════════════════════════
# 🚀 SERVER STARTUP WITH TUNNEL
# ═══════════════════════════════════════════════════════════════════════


def start_with_pyngrok(port: int = 8888):
    """Start server with pyngrok tunnel."""
    try:
        from pyngrok import ngrok

        # Start tunnel
        public_url = ngrok.connect(port)
        logger.info(f"\n🌐 PUBLIC URL: {public_url}")
        logger.info(f"📋 Gumroad Webhook URL: {public_url}/webhook/gumroad")
        logger.info("\n👉 Copy this URL to Gumroad Settings → Advanced → Ping\n")

        return public_url
    except ImportError:
        logger.warning("⚠️ pyngrok not installed. Run: pip install pyngrok")
        return None


def main():
    port = 8888

    print("\n☢️ GUMROAD WEBHOOK SERVER")
    print("=" * 50)
    print(f"Local: http://localhost:{port}")
    print(f"Webhook: http://localhost:{port}/webhook/gumroad")
    print()

    # Try to start tunnel
    public_url = start_with_pyngrok(port)

    if not public_url:
        print("\n💡 To expose publicly, choose one:")
        print("   1. pip install pyngrok && python3 scripts/webhook_server.py")
        print("   2. brew install ngrok && ngrok http 8888")
        print("   3. brew install cloudflared && cloudflared tunnel --url http://localhost:8888")
        print()

    # Start server
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
