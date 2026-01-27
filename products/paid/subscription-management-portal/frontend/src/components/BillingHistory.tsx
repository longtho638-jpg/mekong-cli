'use client';

import { useEffect, useState } from 'react';
import { api, type Invoice } from '../services/api';

export function BillingHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await api.billing.getHistory();
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--md-sys-color-primary)] border-r-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-[var(--md-sys-shape-corner-medium)] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
        {error}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
        <p className="m3-body-large">No invoices yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-surface)]">
      <table className="w-full">
        <thead className="bg-[var(--md-sys-color-surface-variant)]">
          <tr>
            <th className="px-6 py-4 text-left m3-title-small text-[var(--md-sys-color-on-surface)]">Date</th>
            <th className="px-6 py-4 text-left m3-title-small text-[var(--md-sys-color-on-surface)]">Amount</th>
            <th className="px-6 py-4 text-left m3-title-small text-[var(--md-sys-color-on-surface)]">Status</th>
            <th className="px-6 py-4 text-right m3-title-small text-[var(--md-sys-color-on-surface)]">Invoice</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-[var(--md-sys-color-surface-container)]">
              <td className="px-6 py-4 m3-body-medium text-[var(--md-sys-color-on-surface)]">
                {new Date(invoice.created).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="px-6 py-4 m3-body-medium text-[var(--md-sys-color-on-surface)]">
                ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`
                    px-3 py-1 rounded-[var(--md-sys-shape-corner-full)] m3-label-small
                    ${invoice.status === 'paid'
                      ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
                      : invoice.status === 'open'
                      ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                      : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'}
                  `}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {invoice.invoice_pdf && (
                  <a
                    href={invoice.invoice_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--md-sys-color-primary)] hover:underline m3-label-large"
                  >
                    Download PDF
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
