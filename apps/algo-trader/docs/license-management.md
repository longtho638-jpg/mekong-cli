# License Management UI

**ROIaaS Phase 2** — Admin Dashboard for license CRUD, analytics, and audit trails.

**Route:** `/admin/licenses`

---

## UI Sections

| Tab | Purpose |
|-----|---------|
| **Licenses** | List, filter, sort, create, revoke, delete licenses |
| **Audit Logs** | Timeline view of license events with filtering |
| **Analytics** | Usage metrics, quota gauges, recent activity |

---

## API Endpoints (`/api/v1/licenses`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List licenses (pagination: `take`, `skip`, `status`, `tier`) |
| `GET` | `/:id` | Get single license |
| `POST` | `/` | Create license |
| `PATCH` | `/:id/revoke` | Revoke license |
| `DELETE` | `/:id` | Delete license |
| `GET` | `/:id/audit` | Get audit logs |
| `GET` | `/analytics` | Aggregate analytics |

### Create License Example

```bash
curl -X POST https://api.algo-trader.com/api/v1/licenses \
  -H "X-API-Key: admin-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Prod License", "tier": "PRO", "tenantId": "t123"}'
```

**Response:** License with auto-generated key like `raas-rpp-abc123DEF456XYZ7`

---

## License Key Format

| Tier | Prefix | Example |
|------|--------|---------|
| FREE | `free` | `raas-free-ABCD1234-WXYZ7890` |
| PRO | `rpp` | `raas-rpp-ABCD1234-WXYZ7890` |
| ENTERPRISE | `rep` | `raas-rep-ABCD1234-WXYZ7890` |

---

## Admin Workflow

1. **Create** - Click "Create License" → Fill name/tier/expiration/tenant → Copy generated key
2. **View Usage** - Actions menu (dots) → "View Audit Log"
3. **Revoke** - Actions menu → "Revoke License"
4. **Delete** - Actions menu → "Delete License"

---

## Features

- **Sorting**: Click column headers to sort by name, key, tier, status, usage, dates
- **Filtering**: By status (Active/Expired/Revoked) and tier (FREE/PRO/ENTERPRISE)
- **Audit Events**: Created, Activated, Revoked, API Call, ML Feature, Rate Limit
- **Analytics**: License distribution by tier, usage breakdown, quota gauges

---

## Related Docs

| File | Purpose |
|------|---------|
| `docs/RAAS_API_ENDPOINTS.md` | RaaS gate API reference |
| `docs/raas-license-integration.md` | License key integration |
| `docs/LICENSE_GATING.md` | License enforcement |

---

*Last updated: 2026-03-06*
