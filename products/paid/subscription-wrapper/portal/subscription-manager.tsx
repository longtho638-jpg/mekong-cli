import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertTriangle, Download } from 'lucide-react';

// MD3-compliant component wrappers (would normally come from a design system)
const MD3Card: React.FC<{ children: React.ReactNode; elevated?: boolean }> = ({ children, elevated }) => (
  <div className={`bg-[var(--md-sys-color-surface)] rounded-[var(--md-sys-shape-corner-large)] p-6 ${elevated ? 'shadow-md' : 'shadow-sm'} border border-[var(--md-sys-color-outline)]`}>
    {children}
  </div>
);

const MD3Button: React.FC<{ children: React.ReactNode; variant: 'filled' | 'outlined' | 'text'; onClick?: () => void; color?: 'primary' | 'error' }> = ({ children, variant, onClick, color = 'primary' }) => {
  const baseClasses = "flex items-center justify-center px-6 py-3 text-base font-medium rounded-[var(--md-sys-shape-corner-full)] transition-colors";

  const variantClasses = {
    filled: color === 'error'
      ? 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] hover:opacity-90'
      : 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90',
    outlined: color === 'error'
      ? 'border border-[var(--md-sys-color-error)] text-[var(--md-sys-color-error)] bg-transparent hover:bg-[var(--md-sys-color-error-container)]'
      : 'border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] bg-transparent hover:bg-[var(--md-sys-color-surface-variant)]',
    text: 'bg-transparent text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} onClick={onClick}>
      {children}
    </button>
  );
};

const SubscriptionManager: React.FC = () => {
  // Mock data
  const [plan, setPlan] = useState('Pro');
  const [status, setStatus] = useState('active');
  const [nextBilling, setNextBilling] = useState('2026-02-26');

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <MD3Card elevated>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">Current Plan</h3>
            <h2 className="text-3xl font-bold mt-2 text-[var(--md-sys-color-on-surface)]">{plan}</h2>
            <div className="flex items-center mt-2 space-x-2">
              <span className={`px-3 py-1 rounded-[var(--md-sys-shape-corner-full)] text-xs font-medium ${status === 'active' ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]' : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'}`}>
                {status.toUpperCase()}
              </span>
              <span className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Next billing on {nextBilling}</span>
            </div>
          </div>
          <div className="p-3 bg-[var(--md-sys-color-primary-container)] rounded-[var(--md-sys-shape-corner-medium)]">
            <CreditCard className="w-8 h-8 text-[var(--md-sys-color-primary)]" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MD3Button variant="filled">Upgrade Plan</MD3Button>
          <MD3Button variant="outlined">Manage Payment Method</MD3Button>
          <MD3Button variant="outlined" color="error">Cancel Subscription</MD3Button>
        </div>
      </MD3Card>

      {/* Usage & Seats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MD3Card>
          <h3 className="text-lg font-semibold mb-4 text-[var(--md-sys-color-on-surface)]">License Seats</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-[var(--md-sys-shape-corner-full)] text-[var(--md-sys-color-on-primary-container)] bg-[var(--md-sys-color-primary-container)]">
                  Usage
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-[var(--md-sys-color-primary)]">
                  3 / 5 Seats
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-[var(--md-sys-shape-corner-full)] bg-[var(--md-sys-color-surface-variant)]">
              <div style={{ width: "60%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-[var(--md-sys-color-on-primary)] justify-center bg-[var(--md-sys-color-primary)]"></div>
            </div>
            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">You have 2 seats remaining.</p>
          </div>
        </MD3Card>

        <MD3Card>
          <h3 className="text-lg font-semibold mb-4 text-[var(--md-sys-color-on-surface)]">Invoices</h3>
          <div className="space-y-3">
            {[
              { date: 'Jan 26, 2026', amount: '$19.00', status: 'Paid' },
              { date: 'Dec 26, 2025', amount: '$19.00', status: 'Paid' },
            ].map((inv, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-[var(--md-sys-color-surface-variant)] rounded-[var(--md-sys-shape-corner-medium)] transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-[var(--md-sys-color-tertiary)]" />
                  <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{inv.date}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">{inv.amount}</span>
                  <Download className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                </div>
              </div>
            ))}
          </div>
        </MD3Card>
      </div>
    </div>
  );
};

export default SubscriptionManager;
