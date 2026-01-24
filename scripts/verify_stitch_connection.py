import asyncio
import json
import logging
import sys
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stitch_client")

STITCH_URL = "https://stitch.googleapis.com/mcp/v1"
TOKEN = "ya29.a0AUMWg_IHX2-aIriM7njR9jr7W0M0I0AT_eAp-XuDGfr8hqVQbdKS-1hglWo2FB-neQO-Le2AisnA3G_U8ZsFa9nSErbC7Y7ZdIDdfB27qmAPeltUNfXCIBj3_U-0qs7xEUQnFylMtf170xlBrmU3-HusSylc8qGgOJ_n903wQw82bTP8kkd97jKl1y2noiOgz31GQ3I2rwaCgYKAXASARQSFQHGX2Mi_Ifwx6L9hQmpArhhdqU50g0209"
PROJECT_ID = "agencyos-483308"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "X-Goog-User-Project": PROJECT_ID,
    "Content-Type": "application/json",
    "Accept": "text/event-stream"
}

async def verify_stitch():
    print(f"🔌 Connecting to Stitch MCP at {STITCH_URL}...")

    async with aiohttp.ClientSession(headers=headers) as session:
        # Try base URL directly
        target_url = STITCH_URL
        print(f"📡 Trying {target_url}...")

        async with session.get(target_url) as response:
            if response.status != 200:
                print(f"❌ Connection failed: {response.status}")
                try:
                    text = await response.text()
                    print(text)
                except:
                    pass
                return

            print(f"✅ SSE Connected to {target_url}!")

            post_url = None
            current_event = None
            current_data = []

            queue = asyncio.Queue()

            async def reader_task():
                try:
                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        if not line:
                            if current_event and current_data:
                                # Process event
                                full_data = "\n".join(current_data)
                                await queue.put((current_event, full_data))
                                # Reset
                                current_event = None
                                current_data = []
                            continue

                        if line.startswith("event:"):
                            current_event = line[6:].strip()
                        elif line.startswith("data:"):
                            current_data.append(line[5:].strip())
                except Exception as e:
                    print(f"Reader error: {e}")

            reader = asyncio.create_task(reader_task())

            # Main logic loop
            try:
                # Wait for endpoint event
                while True:
                    event_type, event_data = await asyncio.wait_for(queue.get(), timeout=10.0)
                    if event_type == "endpoint":
                        post_endpoint = event_data
                        if post_endpoint.startswith("http"):
                            post_url = post_endpoint
                        elif post_endpoint.startswith("/"):
                            # Handle relative path correctly relative to the base URL
                            # STITCH_URL is https://stitch.googleapis.com/mcp/v1
                            # If endpoint is /mcp/v1/clients/..., we need to be careful

                            # Construct base domain
                            from urllib.parse import urlparse
                            parsed = urlparse(STITCH_URL)
                            base_domain = f"{parsed.scheme}://{parsed.netloc}"
                            post_url = base_domain + post_endpoint
                        else:
                            post_url = STITCH_URL + "/" + post_endpoint
                        print(f"✅ Endpoint: {post_url}")
                        break

                if not post_url:
                    print("❌ No endpoint received")
                    return

                # Now send Initialize
                print("📤 Sending initialize...")
                init_req = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "clientInfo": {"name": "antigravity-verifier", "version": "1.0"}
                    }
                }

                # Send POST
                async with session.post(post_url, json=init_req) as resp:
                    if resp.status >= 400:
                        print(f"❌ Initialize failed: {resp.status}")
                        print(await resp.text())
                        return

                # Wait for response
                while True:
                    event_type, event_data = await asyncio.wait_for(queue.get(), timeout=10.0)
                    if event_type == "message":
                        msg = json.loads(event_data)

                        if msg.get("id") == 1:
                            print("✅ Initialized received!")

                            # Send notifications initialized
                            await session.post(post_url, json={
                                "jsonrpc": "2.0",
                                "method": "notifications/initialized"
                            })

                            # List Tools
                            print("🛠 Listing tools...")
                            await session.post(post_url, json={
                                "jsonrpc": "2.0",
                                "id": 2,
                                "method": "tools/list"
                            })

                        elif msg.get("id") == 2:
                            print("\n🔧 Available Tools:")
                            result = msg.get("result", {})
                            tools = result.get("tools", [])
                            for tool in tools:
                                print(f"   - {tool['name']}: {tool.get('description', 'No desc')[:50]}...")
                            return # Success

            except asyncio.TimeoutError:
                print("❌ Timeout waiting for events")
            finally:
                reader.cancel()

if __name__ == "__main__":
    asyncio.run(verify_stitch())
