# 🔧 Supabase Setup Guide - AgencyOS Dashboards

**Purpose**: Quick setup guide for connecting AgencyOS dashboards to Supabase backend

---

## 📋 Prerequisites

- [ ] Supabase account (free tier works)
- [ ] AgencyOS project running (`npm run dev`)
- [ ] Migration file ready: `supabase/migrations/20251228_dashboards_schema.sql`

---

## 🚀 Step 1: Create Supabase Project (5 min)

### 1.1 Sign Up / Login
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended)

### 1.2 Create New Project
1. Click "New Project"
2. **Organization**: Select or create one
3. **Name**: `agencyos-dashboards`
4. **Database Password**: Generate strong password (SAVE IT!)
5. **Region**: Choose closest to you
6. Click "Create new project"
7. **Wait 2-3 minutes** for provisioning

---

## 🗄️ Step 2: Run Database Migration (3 min)

### 2.1 Open SQL Editor
1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**

### 2.2 Copy Migration SQL
1. **Open migration file**: [20251228_dashboards_schema.sql](file:///Users/macbookprom1/Documents/mekong-hq/mekong-cli/mekong-docs/supabase/migrations/20251228_dashboards_schema.sql) ← Click to open
2. **Select All** (Cmd+A / Ctrl+A)
3. **Copy** (Cmd+C / Ctrl+C)
4. Paste into Supabase SQL Editor

### 2.3 Execute Migration
1. Click **"Run"** button (or Cmd/Ctrl + Enter)
2. Wait for success message
3. Verify: You should see **"Success. No rows returned"**

### 2.4 Verify Tables Created
1. Click **"Table Editor"** (left sidebar)
2. You should see 7 tables:
   - `clients`
   - `projects`
   - `tasks`
   - `invoices`
   - `messages`
   - `agency_stats`
   - `affiliate_stats`

**✅ If you see all 7 tables, migration successful!**

---

## 🔑 Step 3: Get API Credentials (2 min)

### 3.1 Find Project Settings
1. Click **"Settings"** icon (⚙️) in left sidebar
2. Click **"API"**

### 3.2 Copy Credentials
You need 2 values:

**Project URL**:
```
https://[your-project-id].supabase.co
```
Copy this value ↑

**Service Role Key** (anon key is NOT enough):
```
eyJhbGc... (long string starting with eyJ)
```
**⚠️ IMPORTANT**: Use "service_role" key, NOT "anon" key!

---

## 📝 Step 4: Configure Environment (1 min)

### 4.1 Create .env File
In your project root (`mekong-docs/`), create `.env`:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Node Environment
NODE_ENV=development
```

### 4.2 Replace Values
- Replace `YOUR_PROJECT_ID` with your actual project ID
- Replace the service key with your full key

### 4.3 Verify .env in .gitignore
Check `.gitignore` includes:
```
.env
.env.*
```

**⚠️ NEVER commit .env to git!**

---

## 🔄 Step 5: Restart Dev Server (1 min)

### 5.1 Stop Current Server
- Press `Ctrl + C` in terminal running `npm run dev`

### 5.2 Restart
```bash
npm run dev
```

### 5.3 Verify
- Server should restart without errors
- Check terminal for no Supabase-related errors

---

## ✅ Step 6: Test API Connection (2 min)

### 6.1 Test Client Dashboard API
Open in browser:
```
http://localhost:4321/api/client/dashboard?code=TEST12345678
```

**Expected Response**:
```json
{
  "client": {
    "id": "...",
    "name": "John Smith",
    "company": "Acme Corp"
  },
  "stats": {
    "active_projects": 1,
    ...
  }
}
```

### 6.2 Test Agency Stats API
Open in browser:
```
http://localhost:4321/api/agency/stats
```

**Expected Response**:
```json
{
  "metrics": {
    "revenue_mtd": 45200,
    "active_clients": 15,
    ...
  }
}
```

**✅ If you see JSON data, APIs are working!**

---

## 🎯 Next Steps

After Supabase is configured:
1. ✅ Frontend dashboards will connect to real data
2. ✅ Real-time updates will work
3. ✅ Test with live backend

**Ready? Let me know and I'll connect the dashboards!** 🚀

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"
- ✅ Check `.env` file exists
- ✅ Verify credentials are correct
- ✅ Restart dev server

### Error: "relation does not exist"
- ✅ Re-run migration SQL
- ✅ Check Table Editor shows 7 tables

### Error: "Invalid API key"
- ✅ Use `service_role` key, not `anon`
- ✅ Copy full key (starts with `eyJ`)

---

**Total Time**: ~15 minutes  
**Difficulty**: Easy  
**Result**: Dashboards connected to live database ✨
