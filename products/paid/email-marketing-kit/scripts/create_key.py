import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.apikey import ApiKey

async def create_api_key(name: str):
    async with AsyncSessionLocal() as db:
        raw_key = ApiKey.generate_key()
        key_hash = ApiKey.hash_key(raw_key)

        api_key = ApiKey(name=name, key_hash=key_hash)
        db.add(api_key)
        await db.commit()

        print(f"API Key Created: {name}")
        print(f"Key: {raw_key}")
        print("Keep this key safe! It won't be shown again.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/create_key.py <name>")
        sys.exit(1)
    asyncio.run(create_api_key(sys.argv[1]))
