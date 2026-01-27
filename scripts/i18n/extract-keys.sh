#!/bin/bash
# Extract translation keys from code

if ! command -v npx &> /dev/null; then
    echo "npx not found. Please install nodejs/npm."
    exit 1
fi

echo "Extracting translation keys..."
npx i18next-scanner --config i18next-scanner.config.js

echo "Translation keys extracted to apps/web/public/locales/"
