#!/bin/bash
COMMAND=$(cat | jq -r '.tool_input.command')
BLOCKED="node_modules|__pycache__|\.git/|dist/|build/"

# Block .env files but allow .env.example, .env.test, .env.local, etc.
if echo "$COMMAND" | grep -qE "$BLOCKED"; then
 echo "ERROR: Blocked directory pattern" >&2
 exit 2
fi

# Check for .env but exclude .env.* patterns (like .env.example, .env.test)
if echo "$COMMAND" | grep -E '\.env([^.]|$)' | grep -qvE '\.env\.(example|test|local|development|production|staging)'; then
 echo "ERROR: Blocked .env file (use .env.example instead)" >&2
 exit 2
fi