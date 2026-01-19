/**
 * Default Chart of Accounts for AgencyOS
 * Agency-specific standard account structure
 */

import type { Account } from './accounting-types'

export const DEFAULT_CHART_OF_ACCOUNTS: Omit<
  Account,
  'id' | 'tenantId' | 'balance' | 'createdAt' | 'updatedAt'
>[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ASSETS (1xxx)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: '1000', name: 'Assets', type: 'asset', parentId: null, isGroup: true, currency: 'USD' },
  {
    code: '1100',
    name: 'Cash & Bank',
    type: 'asset',
    parentId: '1000',
    isGroup: true,
    currency: 'USD',
  },
  {
    code: '1110',
    name: 'Cash on Hand',
    type: 'asset',
    parentId: '1100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '1120',
    name: 'Bank Account',
    type: 'asset',
    parentId: '1100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '1200',
    name: 'Accounts Receivable',
    type: 'asset',
    parentId: '1000',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '1300',
    name: 'Fixed Assets',
    type: 'asset',
    parentId: '1000',
    isGroup: true,
    currency: 'USD',
  },
  {
    code: '1310',
    name: 'Equipment',
    type: 'asset',
    parentId: '1300',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '1320',
    name: 'Software Licenses',
    type: 'asset',
    parentId: '1300',
    isGroup: false,
    currency: 'USD',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LIABILITIES (2xxx)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    code: '2000',
    name: 'Liabilities',
    type: 'liability',
    parentId: null,
    isGroup: true,
    currency: 'USD',
  },
  {
    code: '2100',
    name: 'Accounts Payable',
    type: 'liability',
    parentId: '2000',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '2200',
    name: 'Credit Card Payable',
    type: 'liability',
    parentId: '2000',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '2300',
    name: 'Taxes Payable',
    type: 'liability',
    parentId: '2000',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '2400',
    name: 'Deferred Revenue',
    type: 'liability',
    parentId: '2000',
    isGroup: false,
    currency: 'USD',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EQUITY (3xxx)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: '3000', name: 'Equity', type: 'equity', parentId: null, isGroup: true, currency: 'USD' },
  {
    code: '3100',
    name: 'Owner Equity',
    type: 'equity',
    parentId: '3000',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '3200',
    name: 'Retained Earnings',
    type: 'equity',
    parentId: '3000',
    isGroup: false,
    currency: 'USD',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INCOME (4xxx)
  // ═══════════════════════════════════════════════════════════════════════════
  { code: '4000', name: 'Income', type: 'income', parentId: null, isGroup: true, currency: 'USD' },
  {
    code: '4100',
    name: 'Service Revenue',
    type: 'income',
    parentId: '4000',
    isGroup: true,
    currency: 'USD',
  },
  {
    code: '4110',
    name: 'Retainer Revenue',
    type: 'income',
    parentId: '4100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '4120',
    name: 'Project Revenue',
    type: 'income',
    parentId: '4100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '4130',
    name: 'Consulting Revenue',
    type: 'income',
    parentId: '4100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '4200',
    name: 'SaaS Revenue',
    type: 'income',
    parentId: '4000',
    isGroup: true,
    currency: 'USD',
  },
  {
    code: '4210',
    name: 'Subscription Revenue',
    type: 'income',
    parentId: '4200',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '4220',
    name: 'Usage Revenue',
    type: 'income',
    parentId: '4200',
    isGroup: false,
    currency: 'USD',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPENSES (5xxx)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    code: '5000',
    name: 'Expenses',
    type: 'expense',
    parentId: null,
    isGroup: true,
    currency: 'USD',
  },
  {
    code: '5100',
    name: 'Operating Expenses',
    type: 'expense',
    parentId: '5000',
    isGroup: true,
    currency: 'USD',
  },
  {
    code: '5110',
    name: 'Salaries & Wages',
    type: 'expense',
    parentId: '5100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '5120',
    name: 'Contractor Fees',
    type: 'expense',
    parentId: '5100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '5130',
    name: 'Software Subscriptions',
    type: 'expense',
    parentId: '5100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '5140',
    name: 'Office Rent',
    type: 'expense',
    parentId: '5100',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '5200',
    name: 'Marketing Expenses',
    type: 'expense',
    parentId: '5000',
    isGroup: true,
    currency: 'USD',
  },
  {
    code: '5210',
    name: 'Advertising',
    type: 'expense',
    parentId: '5200',
    isGroup: false,
    currency: 'USD',
  },
  {
    code: '5220',
    name: 'Content Production',
    type: 'expense',
    parentId: '5200',
    isGroup: false,
    currency: 'USD',
  },
]
