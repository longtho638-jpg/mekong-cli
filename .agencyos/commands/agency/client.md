# /client - Client Management Commands

Manage agency clients from acquisition to retention.

## Usage
```
/client [action] [name/id] [options]
```

## Actions
- **add**: Add new client
- **list**: List all clients
- **view**: View client details
- **update**: Update client info
- **portal**: Generate client portal access
- **archive**: Archive inactive client

## Examples
```
/client add "ABC Corporation" --email "john@abc.com" --mrr 2500
/client list --status active
/client view "ABC Corporation"
/client update CL-001 --mrr 3000
/client portal CL-001
```

## Add Options
```
--email, -e       Primary contact email (required)
--phone, -p       Contact phone
--company, -c     Company name (if different)
--mrr, -m         Monthly recurring revenue
--services, -s    Services provided (comma-separated)
--notes, -n       Additional notes
```

## Workflow

### 1. Client Onboarding
```
/client add "Startup Inc" --email "ceo@startup.io" --mrr 2500 --services "seo,content"
```
Output:
```
✅ Client Added
ID: CL-2024-033
Name: Startup Inc
Email: ceo@startup.io
MRR: $2,500
Services: SEO, Content Marketing
Status: Active

📋 Next Steps:
  1. Send welcome email: /client welcome CL-2024-033
  2. Create project: /project create "Onboarding" --client CL-2024-033
  3. Setup portal: /client portal CL-2024-033
```

### 2. Client Overview
```
/client view "Startup Inc"
```
Output:
```
👤 Startup Inc (CL-2024-033)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: Active 🟢
Since: Dec 15, 2024
MRR: $2,500

Contact:
  Email: ceo@startup.io
  Phone: +84 123 456 789

Services:
  • SEO Campaign
  • Content Marketing

Projects:
  📁 Website Redesign (75% complete)
  📁 SEO Campaign Q1 (45% complete)

Invoices:
  INV-2024-012: $2,500 (Pending)
  INV-2024-011: $2,500 (Paid ✓)

Lifetime Value: $7,500
```

### 3. Client Portal Access
```
/client portal CL-2024-033
```
Output:
```
🔐 Client Portal Generated
URL: https://agency.os/portal/abc123xyz
Temporary Password: Welcome2024!

Email sent to: ceo@startup.io
Portal includes:
  ✓ Reports dashboard
  ✓ Project status
  ✓ File downloads
  ✓ Invoice payments
```

### 4. Client Health Check
```
/client health
```
Output:
```
📊 Client Health Report
━━━━━━━━━━━━━━━━━━━━━━━
Total Clients: 12
Active: 10 🟢
At Risk: 1 ⚠️
Churned: 1 🔴

Total MRR: $25,500
Avg Client Value: $2,125

⚠️ At Risk:
  • XYZ Ventures - No activity 30+ days
  
🎉 Top Performers:
  • ABC Corp - MRR $5,000
  • Tech Solutions - MRR $3,200
```

## Integration Points
- **Supabase**: Client database
- **Client Portal**: Access management
- **Email**: Welcome emails, notifications
- **CRM**: Activity tracking

## Agent
Uses `@account-manager` agent for client interactions.

## Binh Pháp Alignment
**Chapter 6 - Hư Thực (Strengths and Weaknesses)**: Know your clients deeply to serve them better. "If you know the enemy and know yourself, you need not fear the result."

## Database Schema
```sql
-- clients table
id, agency_id, name, email, phone, company,
status, mrr, notes, avatar_url,
created_at, updated_at
```
