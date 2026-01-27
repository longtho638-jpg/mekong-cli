import sys
import json
import os

def update_config(agency_name, founder_name, niche):
    config_path = '.agency/config.json'

    if not os.path.exists(config_path):
        print(f"Error: {config_path} not found.")
        sys.exit(1)

    try:
        with open(config_path, 'r') as f:
            data = json.load(f)

        # Update values
        data['agency']['name'] = agency_name
        data['agency']['founder'] = founder_name
        data['agency']['niche'] = niche

        with open(config_path, 'w') as f:
            json.dump(data, f, indent=2)

    except Exception as e:
        print(f"Error updating config: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: configure.py <agency_name> <founder_name> <niche>")
        sys.exit(1)

    update_config(sys.argv[1], sys.argv[2], sys.argv[3])
