#!/bin/bash
# GUMROAD QUICK UPLOAD SCRIPT
# Run this to open Gumroad with each product ready for upload

echo "🏯 BINH PHÁP LAUNCH SEQUENCE - Starting..."
echo ""

# Product list with prices
declare -a products=(
  "User Preferences Kit|47|antigravity-user-preferences-kit-v1.0.0.zip"
  "Webhook Manager Kit|57|webhook-manager-kit-v1.0.0.zip"
  "Database Migration Kit|47|database-migration-kit-v1.0.0.zip"
  "API Rate Limiter Kit|37|api-rate-limiter-kit-v1.0.0.zip"
  "File Upload Kit|47|file-upload-kit-v1.0.0.zip"
  "Full-Text Search Kit|77|full-text-search-kit-v1.0.0.zip"
)

# Open Gumroad dashboard
echo "📂 Opening Gumroad Dashboard..."
open "https://gumroad.com/dashboard"
sleep 2

echo ""
echo "=== PRODUCTS TO UPLOAD ==="
echo ""

for product in "${products[@]}"; do
  IFS='|' read -r name price file <<< "$product"
  
  filepath="/Users/macbookprom1/mekong-cli/products/paid/${file}"
  copypath="/Users/macbookprom1/mekong-cli/products/paid/gumroad-copy/"
  
  if [ -f "$filepath" ]; then
    size=$(ls -lh "$filepath" | awk '{print $5}')
    echo "✅ $name (\$$price) - $size"
    echo "   📄 ZIP: $file"
    echo "   📝 Copy: gumroad-copy/$(echo "$name" | tr ' ' '-' | tr '[:upper:]' '[:lower:]').md"
    echo ""
  else
    echo "⚠️ $name - FILE NOT FOUND: $file"
    echo ""
  fi
done

echo "=== LAUNCH CHECKLIST ==="
echo "1. [ ] Open Gumroad → New Product"
echo "2. [ ] Set name and price"
echo "3. [ ] Upload ZIP file"
echo "4. [ ] Copy description from gumroad-copy/*.md"
echo "5. [ ] Enable affiliate program (20%)"
echo "6. [ ] Publish!"
echo ""
echo "🐦 Social posts ready: gumroad-copy/SOCIAL_LAUNCH_POSTS.md"
echo ""
echo "🏯 Let's ship! 🚀"
