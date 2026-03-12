import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Command } from 'commander';
import type { MekongEngine } from '../../core/engine.js';
import { heading, keyValue, divider, info } from '../ui/output.js';
import type { Invoice, Expense } from '../../finance/types.js';
import type { Lead, Customer, Ticket } from '../../crm/types.js';

function readJson<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback;
  try { return JSON.parse(readFileSync(file, 'utf8')) as T; } catch { return fallback; }
}

function crmDir(): string { return join(homedir(), '.mekong', 'crm'); }
function finDir(): string { return join(homedir(), '.mekong', 'finance'); }

function renderAndon(): void {
  const leads = readJson<Lead[]>(join(crmDir(), 'leads.json'), []);
  const customers = readJson<Customer[]>(join(crmDir(), 'customers.json'), []);
  const tickets = readJson<Ticket[]>(join(crmDir(), 'tickets.json'), []);
  const invoices = readJson<Invoice[]>(join(finDir(), 'invoices.json'), []);
  const expenses = readJson<Expense[]>(join(finDir(), 'expenses.json'), []);

  const mrr = customers.reduce((s, c) => s + c.mrr, 0);
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = invoices
    .filter(i => i.status === 'paid' && i.updatedAt?.startsWith(today))
    .reduce((s, i) => s + i.total, 0);
  const todayExpenses = expenses
    .filter(e => e.date === today)
    .reduce((s, e) => s + e.amount, 0);

  const status = overdueInvoices > 0 || openTickets > 5 ? 'yellow' : 'green';
  const statusIcon = status === 'green' ? '[GREEN]' : '[YELLOW]';

  heading(`Andon Board ${statusIcon} — ${new Date().toLocaleString()}`);
  keyValue('MRR', `$${mrr}`);
  keyValue('Customers', String(customers.length));
  keyValue('Active leads', String(leads.filter(l => !['won', 'lost'].includes(l.status)).length));
  keyValue('Open tickets', String(openTickets));
  keyValue('Today revenue', `$${todayRevenue.toFixed(2)}`);
  keyValue('Today expenses', `$${todayExpenses.toFixed(2)}`);
  keyValue('Overdue invoices', String(overdueInvoices));
  divider();
}

function renderStandup(): void {
  const today = new Date().toISOString().slice(0, 10);
  const leads = readJson<Lead[]>(join(crmDir(), 'leads.json'), []);
  const tickets = readJson<Ticket[]>(join(crmDir(), 'tickets.json'), []);
  const invoices = readJson<Invoice[]>(join(finDir(), 'invoices.json'), []);

  heading(`Daily Standup — ${today}`);

  info('Yesterday:');
  keyValue('  Tickets resolved', String(tickets.filter(t => t.resolvedAt?.startsWith(today)).length));
  keyValue('  Invoices sent', String(invoices.filter(i => i.status === 'sent' && i.updatedAt?.startsWith(today)).length));

  info('Today:');
  const followUps = leads.filter(l => l.nextFollowUp?.startsWith(today));
  if (followUps.length > 0) {
    for (const l of followUps) {
      keyValue('  Follow-up', `${l.name} <${l.email}>`);
    }
  } else {
    keyValue('  Follow-ups', 'none scheduled');
  }

  info('Blockers:');
  const overdue = invoices.filter(i => i.status === 'overdue');
  if (overdue.length > 0) {
    keyValue('  Overdue invoices', String(overdue.length));
  } else {
    console.log('  none');
  }

  divider();
}

function renderWeekly(): void {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const from = weekStart.toISOString().slice(0, 10);

  const leads = readJson<Lead[]>(join(crmDir(), 'leads.json'), []);
  const customers = readJson<Customer[]>(join(crmDir(), 'customers.json'), []);
  const tickets = readJson<Ticket[]>(join(crmDir(), 'tickets.json'), []);
  const invoices = readJson<Invoice[]>(join(finDir(), 'invoices.json'), []);
  const expenses = readJson<Expense[]>(join(finDir(), 'expenses.json'), []);

  const weekInvoices = invoices.filter(i => i.createdAt >= from);
  const weekExpenses = expenses.filter(e => e.date >= from);
  const revenue = weekInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalExpenses = weekExpenses.reduce((s, e) => s + e.amount, 0);

  heading(`Weekly Digest — Week of ${from}`);
  keyValue('Revenue', `$${revenue.toFixed(2)}`);
  keyValue('Expenses', `$${totalExpenses.toFixed(2)}`);
  keyValue('Profit', `$${(revenue - totalExpenses).toFixed(2)}`);
  keyValue('New leads', String(leads.filter(l => l.createdAt >= from).length));
  keyValue('New customers', String(customers.filter(c => c.createdAt >= from).length));
  keyValue('Tickets opened', String(tickets.filter(t => t.createdAt >= from).length));
  keyValue('Tickets resolved', String(tickets.filter(t => t.resolvedAt && t.resolvedAt >= from).length));
  divider();
}

export function registerDashboardCommand(program: Command, _engine: MekongEngine): void {
  const dash = program.command('dashboard').description('Dashboard: Andon board, standup, weekly digest');

  // default action — show Andon board
  dash.action(() => { renderAndon(); });

  dash.command('standup')
    .description('Daily standup report')
    .action(() => { renderStandup(); });

  dash.command('weekly')
    .description('Weekly business digest')
    .action(() => { renderWeekly(); });
}
