#!/bin/bash
# Validate translation files for missing keys

echo "Validating translations..."

# Ideally we would use a linter tool. For now, we'll check if files exist and are valid JSON.

LANGS=("en-US" "vi-VN" "ar-SA" "he-IL" "zh-CN" "ja-JP" "es-ES" "fr-FR" "de-DE")
NAMESPACES=("common" "auth" "dashboard" "errors" "validation")

EXIT_CODE=0

for lang in "${LANGS[@]}"; do
    for ns in "${NAMESPACES[@]}"; do
        file="apps/web/public/locales/$lang/$ns.json"
        if [ ! -f "$file" ]; then
            echo "WARNING: Missing translation file: $file"
            # Optional: Create empty file if missing to prevent 404s
            # echo "{}" > "$file"
        else
            # Check valid JSON
            if ! jq empty "$file" > /dev/null 2>&1; then
                echo "ERROR: Invalid JSON in $file"
                EXIT_CODE=1
            fi
        fi
    done
done

if [ $EXIT_CODE -eq 0 ]; then
    echo "Validation passed."
else
    echo "Validation failed."
fi

exit $EXIT_CODE
