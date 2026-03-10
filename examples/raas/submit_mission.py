#!/usr/bin/env python3
"""
Example: Submit a mission to AgencyOS RaaS platform

This example shows how to submit a mission request to the
AgencyOS platform using the Python SDK.
"""

from mekong.raas import MissionClient
import asyncio


async def main():
    # Initialize RaaS client
    client = MissionClient(
        api_key="your_api_key_here",  # Get from agencyos.network/dashboard
        tenant_id="your_tenant_id",
    )

    # Submit a mission
    print("=== Submitting Mission ===")
    mission = {
        "goal": "Create a FastAPI service with JWT authentication",
        "complexity": "standard",
        "priority": "normal",
        "callback_url": "https://your-webhook.com/mission-complete",
    }

    response = await client.submit_mission(mission)
    print(f"Mission ID: {response['mission_id']}")
    print(f"Status: {response['status']}")
    print(f"Estimated credits: {response['estimated_credits']}")

    # Poll for completion
    print("\n=== Polling Status ===")
    while True:
        status = await client.get_status(response["mission_id"])
        print(f"Status: {status['state']} - {status.get('progress', '0%')}")

        if status["state"] in ["completed", "failed"]:
            break

        await asyncio.sleep(5)

    # Get results
    if status["state"] == "completed":
        result = await client.get_result(response["mission_id"])
        print("\n=== Mission Results ===")
        print(f"Files created: {len(result.get('files', []))}")
        print(f"Output: {result.get('output', '')[:500]}")
    else:
        print(f"\n❌ Mission failed: {status.get('error', 'Unknown error')}")


if __name__ == "__main__":
    asyncio.run(main())
