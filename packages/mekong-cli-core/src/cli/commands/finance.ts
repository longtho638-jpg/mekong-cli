import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Command } from 'commander';
import type { MekongEngine } from '../../core/engine.js';
import { heading, keyValue, divider, success, error as showError, info } from '../ui/output.js';
import type { Invoice, Expense } from '../../finance/types.js';

function getDataDir(): string {
  const dir = join(homedir(), '.mekong', 'finance');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function readJson<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback;
  try { return JSON.parse(readFileSync(file, 'utf8')) as T; } catch { return fallback; }
}

function writeJson(file: string, data: unknown): void {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function shortId(): string {
  return Date.now().toString(36);
}

function nextInvoiceNumber(invoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const n = invoices.length + 1;
  return `INV-${year}-${String(n).padStart(3, '0')}`;
}

export function registerFinanceCommand(program: Command, _engine: MekongEngine): void {
  const fin = program.command('finance').description('Finance: invoices, expenses, revenue, reports');

  // --- invoice subcommands ---
  const invoice = fin.command('invoice').description('Invoice management');

  invoice.command('create <customer_id>')
    .description('Create an invoice')
    .option('--items <items>', 'Comma-separated "desc:qty:price" items', 'Service:1:100')
    .option('--due-days <days>', 'Days until due', '30')
    .action((customerId: string, opts: { items?: string; dueDays?: string }) => {
      const dir = getDataDir();
      const file = join(dir, 'invoices.json');
      const invoices = readJson<Invoice[]>(file, []);
      const now = new Date().toISOString();
      const dueDate = new Date(Date.now() + Number(opts.dueDays ?? 30) * 86400000).toISOString();

      const items = (opts.items ?? 'Service:1:100').split(',').map(raw => {
        const [description, qty, price] = raw.split(':');
        const quantity = Number(qty ?? 1);
        const unitPrice = Number(price ?? 0);
        return { description: description ?? 'Service', quantity, unitPrice, total: quantity * unitPrice };
      });
      const subtotal = items.reduce((s, i) => s + i.total, 0);

      const inv: Invoice = {
        id: shortId(),
        number: nextInvoiceNumber(invoices),
        customerId,
        customerName: customerId,
        customerEmail: `${customerId}@example.com`,
        items, subtotal,
        tax: 0, taxRate: 0, total: subtotal,
        currency: 'USD',
        status: 'draft',
        dueDate, createdAt: now, updatedAt: now,
      };
      invoices.push(inv);
      writeJson(file, invoices);
      success(`Invoice created: ${inv.number} — $${inv.total}`);
    });

  invoice.command('send <id>')
    .description('Mark invoice as sent')
    .action((id: string) => {
      const file = join(getDataDir(), 'invoices.json');
      const invoices = readJson<Invoice[]>(file, []);
      const idx = invoices.findIndex(i => i.id === id || i.number === id);
      if (idx === -1) { showError(`Invoice not found: ${id}`); process.exitCode = 1; return; }
      invoices[idx].status = 'sent';
      invoices[idx].updatedAt = new Date().toISOString();
      writeJson(file, invoices);
      success(`Invoice ${invoices[idx].number} marked as sent`);
    });

  invoice.command('list')
    .description('List invoices')
    .option('--status <status>', 'Filter by status')
    .action((opts: { status?: string }) => {
      const file = join(getDataDir(), 'invoices.json');
      let invoices = readJson<Invoice[]>(file, []);
      if (opts.status) invoices = invoices.filter(i => i.status === opts.status);
      heading(`Invoices (${invoices.length})`);
      if (invoices.length === 0) { info('No invoices found.'); return; }
      for (const i of invoices) {
        console.log(`  [${i.number}] ${i.customerName} — $${i.total} — ${i.status} — due ${i.dueDate.slice(0, 10)}`);
      }
      divider();
    });

  // --- expense subcommands ---
  const expense = fin.command('expense').description('Expense tracking');

  expense.command('add <description> <amount> <category> <vendor>')
    .description('Log an expense')
    .action((description: string, amount: string, category: string, vendor: string) => {
      const dir = getDataDir();
      const file = join(dir, 'expenses.json');
      const expenses = readJson<Expense[]>(file, []);
      const now = new Date().toISOString();
      const exp: Expense = {
        id: shortId(), description,
        amount: Number(amount),
        currency: 'USD',
        category: category as Expense['category'],
        vendor, recurring: false,
        date: now.slice(0, 10),
        tags: [], createdAt: now,
      };
      expenses.push(exp);
      writeJson(file, expenses);
      success(`Expense logged: ${description} — $${amount} (${category})`);
    });

  expense.command('list')
    .description('List expenses')
    .option('--month <month>', 'Filter by YYYY-MM')
    .action((opts: { month?: string }) => {
      const file = join(getDataDir(), 'expenses.json');
      let expenses = readJson<Expense[]>(file, []);
      if (opts.month) expenses = expenses.filter(e => e.date.startsWith(opts.month!));
      heading(`Expenses (${expenses.length})`);
      if (expenses.length === 0) { info('No expenses found.'); return; }
      for (const e of expenses) {
        console.log(`  [${e.id}] ${e.date} — ${e.vendor} — $${e.amount} — ${e.category}`);
      }
      const total = expenses.reduce((s, e) => s + e.amount, 0);
      keyValue('Total', `$${total.toFixed(2)}`);
      divider();
    });

  // --- revenue ---
  fin.command('revenue')
    .description('Revenue summary')
    .action(() => {
      const dir = getDataDir();
      const invoices = readJson<Invoice[]>(join(dir, 'invoices.json'), []);
      const paid = invoices.filter(i => i.status === 'paid');
      const total = paid.reduce((s, i) => s + i.total, 0);
      heading('Revenue Summary');
      keyValue('Total Invoices', String(invoices.length));
      keyValue('Paid', String(paid.length));
      keyValue('Total Revenue', `$${total.toFixed(2)}`);
      keyValue('Overdue', String(invoices.filter(i => i.status === 'overdue').length));
      divider();
    });

  // --- report ---
  fin.command('report')
    .description('Monthly close report')
    .option('--month <month>', 'Month YYYY-MM (default: current)')
    .action((opts: { month?: string }) => {
      const month = opts.month ?? new Date().toISOString().slice(0, 7);
      const dir = getDataDir();
      const invoices = readJson<Invoice[]>(join(dir, 'invoices.json'), []).filter(i => i.createdAt.startsWith(month));
      const expenses = readJson<Expense[]>(join(dir, 'expenses.json'), []).filter(e => e.date.startsWith(month));
      const revenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      heading(`Monthly Report — ${month}`);
      keyValue('Revenue', `$${revenue.toFixed(2)}`);
      keyValue('Expenses', `$${totalExpenses.toFixed(2)}`);
      keyValue('Profit', `$${(revenue - totalExpenses).toFixed(2)}`);
      keyValue('Invoices sent', String(invoices.length));
      keyValue('Invoices paid', String(invoices.filter(i => i.status === 'paid').length));
      divider();
    });

  // --- runway ---
  fin.command('runway <cash>')
    .description('Calculate runway given cash balance')
    .action((cash: string) => {
      const dir = getDataDir();
      const expenses = readJson<Expense[]>(join(dir, 'expenses.json'), []);
      const now = new Date();
      const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
      const monthlyBurn = expenses
        .filter(e => e.date.startsWith(lastMonth))
        .reduce((s, e) => s + e.amount, 0) || 1;
      const months = Number(cash) / monthlyBurn;
      heading('Runway Estimate');
      keyValue('Cash', `$${Number(cash).toFixed(2)}`);
      keyValue('Monthly burn', `$${monthlyBurn.toFixed(2)}`);
      keyValue('Runway', `${months.toFixed(1)} months`);
      divider();
    });
}
