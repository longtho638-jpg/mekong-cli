#!/bin/bash
set -e

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/../.."

echo "📚 Generating API documentation..."

# Ensure the output directory exists
mkdir -p "$PROJECT_ROOT/docs-portal/static"

# Activate virtual environment if it exists (adjust path as needed)
if [ -d "$PROJECT_ROOT/.venv" ]; then
    source "$PROJECT_ROOT/.venv/bin/activate"
elif [ -d "$PROJECT_ROOT/venv" ]; then
    source "$PROJECT_ROOT/venv/bin/activate"
fi

# Set dummy environment variables for schema generation
export SECRET_KEY="dummy-secret-key-for-docs-generation"
export JWT_SECRET_KEY="dummy-jwt-secret-key-for-docs-generation"
export ALGORITHM="HS256"
export ACCESS_TOKEN_EXPIRE_MINUTES=30
export ANTHROPIC_API_KEY="dummy-key"
export OPENAI_API_KEY="dummy-key"
export GEMINI_API_KEY="dummy-key"
export POSTGRES_USER="postgres"
export POSTGRES_PASSWORD="password"
export POSTGRES_DB="agencyos"
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"

# Generate OpenAPI JSON using a python script to import the app and dump the schema
# This avoids needing to run the server and curl it, which can be flaky in CI/CD
cd "$PROJECT_ROOT"
export PYTHONPATH=$PYTHONPATH:.

python3 -c "
import json
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.getcwd())

try:
    from backend.main import app

    # Generate schema
    openapi_schema = app.openapi()

    # Write to file
    with open('docs-portal/static/openapi.json', 'w') as f:
        json.dump(openapi_schema, f, indent=2)

    print('✅ OpenAPI schema written to docs-portal/static/openapi.json')
except Exception as e:
    print(f'❌ Error generating OpenAPI schema: {e}')
    sys.exit(1)
"

echo "✅ API documentation generation complete"
