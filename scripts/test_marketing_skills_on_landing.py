import asyncio
import json
from antigravity.mcp_servers.marketing_server.handlers import MarketingHandler

async def test_skills():
    handler = MarketingHandler()

    print("\n--- 1. Testing SEO Audit (Simulated) ---")
    # In a real scenario, this would fetch the live URL
    seo_result = await handler.audit_seo("https://mekongmarketing.com")
    print(json.dumps(seo_result, indent=2))

    print("\n--- 2. Testing CRO Analysis ---")
    cro_result = await handler.analyze_cro("https://mekongmarketing.com", "landing")
    print(json.dumps(cro_result, indent=2))

    print("\n--- 3. Testing Copywriting Generation ---")
    copy_context = {
        "product_name": "Mekong Marketing Hub",
        "audience": "Agency Owners in Vietnam",
        "tone": "Bold and Professional"
    }
    copy_result = await handler.generate_copy("landing", copy_context)
    print(json.dumps(copy_result, indent=2))

    print("\n--- 4. Testing Pricing Strategy ---")
    pricing_result = await handler.pricing_strategy("Agency Franchise", "Vietnamese SMBs")
    print(json.dumps(pricing_result, indent=2))

if __name__ == "__main__":
    asyncio.run(test_skills())
