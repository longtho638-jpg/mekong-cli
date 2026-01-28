
import os
import sys

from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.main import app

client = TestClient(app)

def test_binh_phap_status():
    print("Testing /api/v1/binh-phap/status...")
    response = client.get("/api/v1/binh-phap/status")

    if response.status_code == 200:
        data = response.json()
        print("✅ Status Code: 200 OK")
        print(f"✅ Total Progress: {data['total_progress']}%")
        print(f"✅ Chapters returned: {len(data['chapters'])}")

        # Check specific chapter
        chapter_1 = next((c for c in data['chapters'] if c['key'] == 'ke-hoach'), None)
        if chapter_1:
            print(f"✅ Chapter 1 found: {chapter_1['name_vi']} - {chapter_1['status']}")
        else:
            print("❌ Chapter 1 not found")

    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_binh_phap_status()
