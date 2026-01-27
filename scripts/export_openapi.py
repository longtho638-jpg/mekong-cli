import json
import os
import sys

# Add parent directory to path to import backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app


def export_openapi():
    openapi_data = app.openapi()

    # Save to file
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "openapi.json")
    with open(output_path, "w") as f:
        json.dump(openapi_data, f, indent=2)

    print(f"OpenAPI spec exported to {output_path}")

if __name__ == "__main__":
    export_openapi()
