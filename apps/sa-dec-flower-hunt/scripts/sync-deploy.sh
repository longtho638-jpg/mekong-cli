#!/bin/bash

echo "🚀 STAYING ALIVE: Deployment Sync Initiate..."
echo "==============================================="

# 1. Add Critical Assets (Images, 3D Models)
echo "📦 Staging Assets..."
git add public/assets
git add public/avatars
git add public/social-content

# 2. Add New UI Components
echo "🎨 Staging WOW UI & Core Components..."
git add components/layout
git add components/landing
git add components/wow
git add components/admin
git add components/ui       # Critical: GlassPanel, NeonButton
git add components/brand    # Critical: AgriosLogo
git add components/market   # Critical: ProductCard
git add components/auth
git add components/game
git add components/visualizations
git add components/terminal
git add components/marketing
git add components/video
# Catch-all for any other new components
git add components

# 3. Add Core Logic & Pages
echo "🧠 Staging Logic & Pages..."
git add app
git add lib
git add hooks               # Critical: Custom hooks
git add utils 2>/dev/null

# 4. Add Config & Package
echo "⚙️ Staging Config..."
git add next.config.ts next.config.mjs 2>/dev/null
git add package.json package-lock.json
git add tailwind.config.ts tailwind.config.js 2>/dev/null
git add components.json

# 5. Commit
echo "💾 Committing..."
git commit -m "feat(deploy): Sync Vercel with Unified Navigation & Digital Twins [10x Upgrade]"

echo "==============================================="
echo "✅ READY TO PUSH. Run: git push origin main"
