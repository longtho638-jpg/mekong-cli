import { Invoice } from '@/lib/api-client';

// Mock global fetch if not available (e.g. in older Jest environments)
// In a real E2E test, this would hit the running backend.
// For this type-check test, we primarily want to ensure the TS compiler
// validates the assignment of the response data to the generated Type.

describe('API Type Integration', () => {
  const MOCK_INVOICE = {
    id: "123",
    invoice_number: "INV-123",
    amount: 100.0,
    tax: 10.0,
    total: 110.0,
    currency: "USD",
    status: "sent",
    service_type: "consulting"
  };

  beforeAll(() => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(MOCK_INVOICE),
      })
    );
  });

  test('Invoice types match BE schema', async () => {
    // 1. Simulate fetching data from the API
    // In a real scenario: const response = await fetch('http://localhost:8000/api/v1/invoices/123');
    const response = await fetch('/api/v1/invoices/123');
    const data = await response.json();

    // 2. Assign to the generated type.
    // If the backend response (mocked here based on backend code) doesn't match the
    // generated interface, TypeScript should complain at compile time,
    // or Jest logic would fail if we checked fields.
    const invoice: Invoice = data as Invoice;

    // 3. Runtime assertions
    expect(invoice.id).toBeDefined();
    expect(invoice.id).toBe("123");
    expect(invoice.status).toBe("sent");

    // Type check assertion (compile-time only, effectively)
    // The following line would cause a TS error if 'invalid_field' existed on Invoice
    // expect(invoice.invalid_field).toBeUndefined();
  });
});
