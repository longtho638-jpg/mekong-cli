# API Design Document - AgencyOS Dashboards

**Version**: 1.0  
**Date**: December 28, 2025  
**Author**: Planner Agent  
**Status**: Design Complete

---

## Overview

This document defines the API architecture for AgencyOS dashboard backend integration. Four REST endpoints will power the Client Portal, Agency Command Center, and Affiliate Dashboard with real-time data from Supabase.

---

## API Endpoints

### 1. GET `/api/client/dashboard`

**Purpose**: Retrieve client dashboard data by portal code

**Authentication**: Portal code validation

**Request**:
```http
GET /api/client/dashboard?code=ABC123XYZ789
```

**Response** (200 OK):
```json
{
  "client": {
    "id": "client_001",
    "name": "John Smith",
    "company": "Acme Corp",
    "status": "active",
    "member_since": "2025-12-01"
  },
  "stats": {
    "active_projects": 2,
    "completed_tasks": 15,
    "total_paid": 7500,
    "unread_messages": 3
  },
  "projects": [
    {
      "id": "proj_001",
      "name": "Website Redesign",
      "status": "in_progress",
      "progress": 65,
      "budget": 5000,
      "deadline": "2026-01-15",
      "tasks_total": 12,
      "tasks_done": 8
    }
  ],
  "tasks": [
    {
      "id": "task_001",
      "project_id": "proj_001",
      "title": "Finalize homepage design",
      "status": "in_progress",
      "due_date": "2025-12-30"
    }
  ],
  "invoices": [
    {
      "id": "inv_001",
      "amount": 2500,
      "status": "paid",
      "paid_at": "2025-12-15",
      "created_at": "2025-12-01"
    }
  ],
  "messages": {
    "unread_count": 3,
    "recent": []
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing portal code
- `401 Unauthorized`: Invalid portal code
- `500 Internal Server Error`: Server error

---

### 2. GET `/api/agency/stats`

**Purpose**: Real-time agency metrics for Command Center

**Authentication**: Admin token (future)

**Request**:
```http
GET /api/agency/stats
```

**Response** (200 OK):
```json
{
  "metrics": {
    "revenue_mtd": 45200,
    "active_clients": 15,
    "profit_margin": 42,
    "utilization": 82,
    "nps_score": 72,
    "pipeline": 125000
  },
  "systems": [
    {
      "name": "CRM",
      "status": "operational",
      "uptime": 99.9
    },
    {
      "name": "Invoicing",
      "status": "operational",
      "uptime": 100
    }
  ],
  "priorities": [
    {
      "level": "urgent",
      "text": "Invoice #INV-003 overdue",
      "icon": "🔴"
    }
  ],
  "pulse": "thriving",
  "updated_at": "2025-12-28T16:20:00Z"
}
```

---

### 3. GET `/api/affiliate/stats`

**Purpose**: Affiliate earnings and performance data

**Authentication**: User session (future)

**Request**:
```http
GET /api/affiliate/stats?user_id=user_123
```

**Response** (200 OK):
```json
{
  "stats": {
    "total_earnings": 1250.50,
    "total_clicks": 3420,
    "conversions": 28,
    "conversion_rate": 0.82,
    "pending_payout": 450.00,
    "next_payout_date": "2026-01-05"
  },
  "rank": {
    "current": "Gold",
    "progress": 75,
    "next_rank": "Platinum",
    "referrals_needed": 5
  },
  "activity": [
    {
      "type": "conversion",
      "amount": 45.00,
      "timestamp": "2025-12-28T10:30:00Z"
    }
  ],
  "achievements": [
    {
      "id": "first_sale",
      "name": "First Sale",
      "unlocked": true
    }
  ]
}
```

---

### 4. POST `/api/auth/portal-code`

**Purpose**: Validate client portal codes

**Request**:
```http
POST /api/auth/portal-code
Content-Type: application/json

{
  "code": "ABC123XYZ789"
}
```

**Response** (200 OK):
```json
{
  "valid": true,
  "client_id": "client_001",
  "expires_at": "2026-12-28T16:20:00Z"
}
```

**Response** (401 Unauthorized):
```json
{
  "valid": false,
  "error": "Invalid or expired portal code"
}
```

---

## Database Schema (Supabase)

### Table: `clients`

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  portal_code VARCHAR(12) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_portal_code ON clients(portal_code);
```

---

### Table: `projects`

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planning',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget DECIMAL(10, 2),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
```

---

### Table: `tasks`

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'todo',
  assigned_to VARCHAR(255),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

---

### Table: `invoices`

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

---

### Table: `messages`

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sender VARCHAR(50) NOT NULL, -- 'client' or 'agency'
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_messages_read ON messages(read);
```

---

### Table: `agency_stats`

```sql
CREATE TABLE agency_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_mtd DECIMAL(10, 2) DEFAULT 0,
  active_clients INTEGER DEFAULT 0,
  profit_margin DECIMAL(5, 2) DEFAULT 0,
  utilization DECIMAL(5, 2) DEFAULT 0,
  nps_score INTEGER DEFAULT 0,
  pipeline DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Single row table for real-time stats
INSERT INTO agency_stats (revenue_mtd, active_clients, profit_margin, utilization, nps_score, pipeline)
VALUES (45200, 15, 42, 82, 72, 125000);
```

---

### Table: `affiliate_stats`

```sql
CREATE TABLE affiliate_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  pending_payout DECIMAL(10, 2) DEFAULT 0,
  rank VARCHAR(50) DEFAULT 'Bronze',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_stats_user_id ON affiliate_stats(user_id);
```

---

## Row-Level Security (RLS)

Enable RLS on all tables:

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_stats ENABLE ROW LEVEL SECURITY;
```

**Policies**:

```sql
-- Clients can only see their own data
CREATE POLICY "Clients see own data"
ON clients FOR SELECT
USING (portal_code = current_setting('app.portal_code', true));

-- Projects visible to owning client
CREATE POLICY "Projects visible to client"
ON projects FOR SELECT
USING (client_id IN (
  SELECT id FROM clients 
  WHERE portal_code = current_setting('app.portal_code', true)
));

-- Similar policies for tasks, invoices, messages
```

---

## Real-time Subscriptions

Enable Supabase Realtime on key tables:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE agency_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE affiliate_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

**Frontend subscription example**:
```javascript
const subscription = supabase
  .channel('agency_stats_updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'agency_stats'
  }, payload => {
    console.log('Stats updated:', payload.new);
    updateUI(payload.new);
  })
  .subscribe();
```

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create Supabase project (or use existing)
- [ ] Run schema migration for all 7 tables
- [ ] Enable RLS policies
- [ ] Insert seed data for testing
- [ ] Enable Realtime on critical tables

### Phase 2: API Endpoints
- [ ] Implement `/api/client/dashboard` endpoint
- [ ] Implement `/api/agency/stats` endpoint
- [ ] Implement `/api/affiliate/stats` endpoint
- [ ] Implement `/api/auth/portal-code` endpoint
- [ ] Add error handling and logging
- [ ] Add rate limiting

### Phase 3: Frontend Integration
- [ ] Update Client Portal to fetch from API
- [ ] Update Agency Dashboard to fetch from API
- [ ] Update Affiliate Dashboard to fetch from API
- [ ] Implement loading states
- [ ] Implement error states
- [ ] Add Realtime subscriptions

---

## Performance Considerations

**Caching Strategy**:
- Agency stats: Cache for 5 seconds
- Client data: Cache for 30 seconds
- Affiliate stats: Cache for 10 seconds

**Response Time Targets**:
- All endpoints: \<100ms (p95)
- Database queries: \<50ms
- Real-time updates: \<200ms latency

**Optimization**:
- Use Supabase connection pooling
- Implement proper database indexes
- Use `SELECT` only required columns
- Batch related queries

---

## Security Considerations

1. **Authentication**: Validate portal codes server-side
2. **Authorization**: Use RLS policies to prevent data leaks
3. **Input Validation**: Sanitize all user inputs
4. **Rate Limiting**: Max 100 requests/minute per IP
5. **HTTPS Only**: Enforce SSL/TLS
6. **Secrets**: Store Supabase credentials in environment variables

---

## Next Steps

1. Get approval on this API design
2. Create Supabase migration files
3. Implement endpoints in `/src/pages/api/`
4. Write integration tests
5. Update frontend dashboards
6. Deploy and monitor

---

*Design Document v1.0*  
*Ready for implementation*
