---
phase: 7
title: "Integration Tests & E2E Validation"
complexity: MODERATE
effort: 1.5h
status: pending
---

# Phase 7: Integration Tests & E2E Validation

## Context

Test coverage for license UI components and API integration.

## Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `tests/license-ui/license-list.test.tsx` | Create | Component tests |
| `tests/license-ui/create-license.test.tsx` | Create | Modal tests |
| `tests/license-ui/license-api-integration.test.ts` | Create | API integration tests |
| `tests/license-ui/audit-log-viewer.test.tsx` | Create | Audit log tests |

## Test Coverage

### 7.1 License List Component Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { LicenseListTable } from '../../src/components/license-list-table';

describe('LicenseListTable', () => {
  const mockLicenses = [
    {
      id: '1',
      key: 'raas-rpp-ABC123-XYZ',
      tier: 'PRO' as const,
      status: 'active' as const,
      tenantId: 'tenant-1',
      expiresAt: '2027-12-31',
      createdAt: '2026-01-01',
    },
  ];

  it('renders licenses in table', () => {
    render(<LicenseListTable licenses={mockLicenses} loading={false} onRevoke={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('raas-rpp-ABC123-XYZ')).toBeInTheDocument();
    expect(screen.getByText('PRO')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<LicenseListTable licenses={[]} loading={true} onRevoke={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<LicenseListTable licenses={[]} loading={false} onRevoke={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('No licenses found')).toBeInTheDocument();
  });

  it('calls onRevoke when revoke button clicked', async () => {
    const onRevoke = jest.fn();
    render(<LicenseListTable licenses={mockLicenses} loading={false} onRevoke={onRevoke} onDelete={jest.fn()} />);
    const revokeButton = screen.getByText('Revoke');
    revokeButton.click();
    await waitFor(() => expect(onRevoke).toHaveBeenCalledWith('1', 'Admin revoked'));
  });
});
```

### 7.2 Create License Modal Tests

```typescript
describe('CreateLicenseModal', () => {
  it('renders when isOpen', () => {
    render(<CreateLicenseModal isOpen={true} onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.getByText('Create License Key')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CreateLicenseModal isOpen={false} onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.queryByText('Create License Key')).not.toBeInTheDocument();
  });

  it('calls onCreated after successful creation', async () => {
    const onCreated = jest.fn();
    const { container } = render(
      <CreateLicenseModal isOpen={true} onClose={jest.fn()} onCreated={onCreated} />
    );

    // Fill form
    const tierSelect = container.querySelector('select')!;
    fireEvent.change(tierSelect, { target: { value: 'PRO' } });

    // Submit
    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Should show generated key
      expect(screen.getByText(/raas-.+/)).toBeInTheDocument();
    });
  });
});
```

### 7.3 API Integration Tests

```typescript
import request from 'supertest';
import { buildApp } from '../../src/app';

describe('License Management API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    app = await buildApp();
  });

  describe('GET /api/v1/licenses', () => {
    it('returns list of licenses (admin)', async () => {
      const res = await request(app.server)
        .get('/api/v1/licenses')
        .set('Authorization', 'Bearer ADMIN_TOKEN');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('licenses');
    });

    it('rejects non-admin users', async () => {
      const res = await request(app.server)
        .get('/api/v1/licenses')
        .set('Authorization', 'Bearer USER_TOKEN');

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/licenses', () => {
    it('creates new license with auto-generated key', async () => {
      const res = await request(app.server)
        .post('/api/v1/licenses')
        .set('Authorization', 'Bearer ADMIN_TOKEN')
        .send({ tier: 'PRO' });

      expect(res.status).toBe(201);
      expect(res.body.license).toHaveProperty('key');
      expect(res.body.license.key).toMatch(/^raas-rpp-.+/);
    });

    it('creates license with custom key', async () => {
      const res = await request(app.server)
        .post('/api/v1/licenses')
        .set('Authorization', 'Bearer ADMIN_TOKEN')
        .send({ tier: 'PRO', key: 'custom-key-123' });

      expect(res.status).toBe(201);
      expect(res.body.license.key).toBe('custom-key-123');
    });
  });

  describe('PATCH /api/v1/licenses/:id/revoke', () => {
    it('revokes license', async () => {
      // Create first
      const createRes = await request(app.server)
        .post('/api/v1/licenses')
        .set('Authorization', 'Bearer ADMIN_TOKEN')
        .send({ tier: 'PRO' });

      const licenseId = createRes.body.license.id;

      // Revoke
      const res = await request(app.server)
        .patch(`/api/v1/licenses/${licenseId}/revoke`)
        .set('Authorization', 'Bearer ADMIN_TOKEN')
        .send({ reason: 'Test revocation' });

      expect(res.status).toBe(200);
      expect(res.body.license.status).toBe('revoked');
    });
  });

  describe('GET /api/v1/licenses/analytics', () => {
    it('returns usage analytics', async () => {
      const res = await request(app.server)
        .get('/api/v1/licenses/analytics?tenantId=test-tenant')
        .set('Authorization', 'Bearer ADMIN_TOKEN');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('usage');
    });
  });
});
```

### 7.4 Audit Log Tests

```typescript
describe('AuditLogViewer', () => {
  const mockLogs = [
    {
      id: '1',
      licenseId: 'license-1',
      event: 'created',
      tier: 'PRO',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: '2',
      licenseId: 'license-1',
      event: 'revoked',
      tier: 'PRO',
      metadata: { reason: 'Payment failed' },
      createdAt: '2026-02-01T00:00:00Z',
    },
  ];

  it('renders audit logs in timeline', () => {
    render(<AuditLogViewer licenseId="license-1" onClose={jest.fn()} />);
    // Mock API response with mockLogs
    expect(screen.getByText('created')).toBeInTheDocument();
    expect(screen.getByText('revoked')).toBeInTheDocument();
  });

  it('shows metadata for revocation', () => {
    render(<AuditLogViewer licenseId="license-1" onClose={jest.fn()} />);
    expect(screen.getByText(/reason/)).toBeInTheDocument();
  });
});
```

## E2E Validation Checklist

- [ ] Navigate to /licenses page
- [ ] View all licenses in table
- [ ] Filter by status (active/revoked/expired)
- [ ] Filter by tier (FREE/PRO/ENTERPRISE)
- [ ] Sort columns (key, tier, status, dates)
- [ ] Click "Create License" → modal opens
- [ ] Select tier, submit → key generated
- [ ] Copy generated key (one-time display)
- [ ] Click "Revoke" on a license → confirm
- [ ] Click "Audit" → audit log modal opens
- [ ] View usage analytics dashboard
- [ ] Quota gauges show correct percentages
- [ ] All tenants view works

## Success Criteria

- [ ] All unit tests pass (15+ tests)
- [ ] All integration tests pass (8+ tests)
- [ ] E2E validation checklist complete
- [ ] No console errors in browser
- [ ] All API endpoints respond correctly
- [ ] RBAC enforced (non-admin blocked)

## Related Files

- `/Users/macbookprom1/mekong-cli/apps/algo-trader/tests/license-ui/license-list.test.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/tests/license-ui/create-license.test.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/tests/license-ui/license-api-integration.test.ts`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/tests/license-ui/audit-log-viewer.test.tsx`
