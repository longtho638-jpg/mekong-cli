#!/usr/bin/env python3
"""Upload FastAPI Starter to Gumroad."""

import os
from pathlib import Path

import requests

TOKEN = os.getenv("GUMROAD_TOKEN")
if not TOKEN:
    print("❌ Error: GUMROAD_TOKEN environment variable not set.")
    exit(1)
API = "https://api.gumroad.com/v2"

# Create product
print("📦 Creating product...")
resp = requests.post(
    f"{API}/products",
    data={
        "access_token": TOKEN,
        "name": "FastAPI Starter - Production-Ready Python API",
        "description": "<p>🚀 Build APIs faster with this production-ready FastAPI boilerplate.</p><p>✅ Modular router structure<br>✅ Pydantic v2 validation<br>✅ CORS pre-configured<br>✅ Health checks for Kubernetes<br>✅ Pagination built-in<br>✅ Test suite included</p><p>💰 Save 10+ hours of setup time!</p>",
        "price": 3700,
        "currency": "usd",
    },
    timeout=60,
)

if resp.status_code != 200:
    print(f"❌ Failed: {resp.text}")
    exit(1)

data = resp.json()
product = data.get("product", {})
product_id = product.get("id")
short_url = product.get("short_url")
print(f"✅ Product created: {short_url}")

# Upload file
zip_path = Path.home() / "Desktop" / "fastapi-starter-template-v1.0.0.zip"
if zip_path.exists():
    print(f"📤 Uploading: {zip_path}")
    with open(zip_path, "rb") as f:
        resp = requests.post(
            f"{API}/products/{product_id}/files",
            data={"access_token": TOKEN},
            files={"file": f},
            timeout=120,
        )
    if resp.status_code == 200:
        print("✅ File uploaded!")
    else:
        print(f"⚠️ Upload failed: {resp.text}")

print(f"\n🎉 Done! Product: {short_url}")
print(f"   ID: {product_id}")
