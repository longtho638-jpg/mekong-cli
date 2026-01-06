---
description: How to add new features to an AgencyOS project
---

# Add New Feature

## Overview
Add new features to your AgencyOS project using the feature generator.

## Step 1: Plan the Feature
```bash
# Create feature spec
echo "Feature: User Profiles
- Profile CRUD operations
- Avatar upload
- Settings page
" > features/user-profiles.md
```

## Step 2: Generate Feature Code
```bash
python main.py generate-feature user-profiles
```

This generates:
- Routes (`src/routes/profile.routes.ts`)
- Controllers (`src/controllers/profile.controller.ts`)
- Services (`src/services/profile.service.ts`)
- Tests (`tests/profile.test.ts`)

## Step 3: Run Database Migration
```bash
# Prisma
npx prisma migrate dev --name add-user-profiles

# SQLAlchemy
alembic revision --autogenerate -m "add user profiles"
alembic upgrade head
```

## Step 4: Test the Feature
// turbo
```bash
npm test -- --grep "profile"
# or
python -m pytest tests/test_profile.py -v
```

## Step 5: Update Documentation
```bash
python main.py docs:update
```

## Step 6: Commit
```bash
git add -A
git commit -m "feat: add user profiles feature"
git push
```

## 🏯 Binh Pháp Alignment
"形勢" (Terrain) - Build incrementally, test continuously.
