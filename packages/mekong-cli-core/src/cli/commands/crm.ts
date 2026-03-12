import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Command } from 'commander';
import type { MekongEngine } from '../../core/engine.js';
import { heading, keyValue, divider, success, error as showError, info } from '../ui/output.js';
import type { Lead, Customer, Ticket } from '../../crm/types.js';

function getDataDir(): string {
  const dir = join(homedir(), '.mekong', 'crm');
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

export function registerCrmCommand(program: Command, _engine: MekongEngine): void {
  const crm = program.command('crm').description('CRM: leads, customers, tickets, pipeline');

  // --- lead subcommands ---
  const lead = crm.command('lead').description('Lead management');

  lead.command('add <name> <email>')
    .description('Create a new lead')
    .option('--company <company>', 'Company name')
    .option('--source <source>', 'Lead source', 'other')
    .action((name: string, email: string, opts: { company?: string; source?: string }) => {
      const dir = getDataDir();
      const file = join(dir, 'leads.json');
      const leads = readJson<Lead[]>(file, []);
      const now = new Date().toISOString();
      const lead: Lead = {
        id: shortId(), name, email,
        company: opts.company,
        source: (opts.source ?? 'other') as Lead['source'],
        status: 'new',
        score: 0, notes: [], tags: [],
        assignedAgent: 'sales-agent',
        createdAt: now, updatedAt: now,
      };
      leads.push(lead);
      writeJson(file, leads);
      success(`Lead created: ${lead.id} — ${name} <${email}>`);
    });

  lead.command('list')
    .description('List leads')
    .option('--status <status>', 'Filter by status')
    .action((opts: { status?: string }) => {
      const file = join(getDataDir(), 'leads.json');
      let leads = readJson<Lead[]>(file, []);
      if (opts.status) leads = leads.filter(l => l.status === opts.status);
      heading(`Leads (${leads.length})`);
      if (leads.length === 0) { info('No leads found.'); return; }
      for (const l of leads) {
        console.log(`  [${l.id}] ${l.name} <${l.email}> — ${l.status} (score: ${l.score})`);
      }
      divider();
    });

  lead.command('qualify <id>')
    .description('AI-qualify a lead')
    .action((id: string) => {
      const file = join(getDataDir(), 'leads.json');
      const leads = readJson<Lead[]>(file, []);
      const idx = leads.findIndex(l => l.id === id);
      if (idx === -1) { showError(`Lead not found: ${id}`); process.exitCode = 1; return; }
      leads[idx].score = Math.min(100, leads[idx].score + 30);
      leads[idx].status = 'qualified';
      leads[idx].updatedAt = new Date().toISOString();
      writeJson(file, leads);
      success(`Lead ${id} qualified — score: ${leads[idx].score}`);
    });

  lead.command('followup <id>')
    .description('Generate follow-up note for a lead')
    .action((id: string) => {
      const file = join(getDataDir(), 'leads.json');
      const leads = readJson<Lead[]>(file, []);
      const lead = leads.find(l => l.id === id);
      if (!lead) { showError(`Lead not found: ${id}`); process.exitCode = 1; return; }
      info(`Follow-up for ${lead.name}:`);
      console.log(`  Hi ${lead.name}, following up on our previous conversation. Let me know if you have any questions.`);
    });

  // --- customer subcommands ---
  const customer = crm.command('customer').description('Customer management');

  customer.command('list')
    .description('List customers')
    .option('--status <status>', 'Filter by status')
    .action((opts: { status?: string }) => {
      const file = join(getDataDir(), 'customers.json');
      let customers = readJson<Customer[]>(file, []);
      if (opts.status) customers = customers.filter(c => c.status === opts.status);
      heading(`Customers (${customers.length})`);
      if (customers.length === 0) { info('No customers found.'); return; }
      for (const c of customers) {
        console.log(`  [${c.id}] ${c.name} — ${c.plan} — MRR: $${c.mrr} — ${c.status}`);
      }
      divider();
    });

  // --- ticket subcommands ---
  const ticket = crm.command('ticket').description('Support tickets');

  ticket.command('create <customer_id> <subject> <description>')
    .description('Create a support ticket')
    .action((customerId: string, subject: string, description: string) => {
      const dir = getDataDir();
      const file = join(dir, 'tickets.json');
      const tickets = readJson<Ticket[]>(file, []);
      const now = new Date().toISOString();
      const t: Ticket = {
        id: shortId(), customerId, subject, description,
        status: 'open', priority: 'normal', category: 'other',
        messages: [], createdAt: now, updatedAt: now,
      };
      tickets.push(t);
      writeJson(file, tickets);
      success(`Ticket created: ${t.id} — ${subject}`);
    });

  ticket.command('list')
    .description('List tickets')
    .option('--status <status>', 'Filter by status')
    .action((opts: { status?: string }) => {
      const file = join(getDataDir(), 'tickets.json');
      let tickets = readJson<Ticket[]>(file, []);
      if (opts.status) tickets = tickets.filter(t => t.status === opts.status);
      heading(`Tickets (${tickets.length})`);
      if (tickets.length === 0) { info('No tickets found.'); return; }
      for (const t of tickets) {
        console.log(`  [${t.id}] ${t.subject} — ${t.priority} — ${t.status}`);
      }
      divider();
    });

  ticket.command('triage <id>')
    .description('AI-triage a ticket (set priority)')
    .action((id: string) => {
      const file = join(getDataDir(), 'tickets.json');
      const tickets = readJson<Ticket[]>(file, []);
      const idx = tickets.findIndex(t => t.id === id);
      if (idx === -1) { showError(`Ticket not found: ${id}`); process.exitCode = 1; return; }
      tickets[idx].priority = 'normal';
      tickets[idx].status = 'in_progress';
      tickets[idx].updatedAt = new Date().toISOString();
      writeJson(file, tickets);
      success(`Ticket ${id} triaged — priority: ${tickets[idx].priority}`);
    });

  // --- pipeline ---
  crm.command('pipeline')
    .description('Show sales pipeline')
    .action(() => {
      const file = join(getDataDir(), 'leads.json');
      const leads = readJson<Lead[]>(file, []);
      const stages: Lead['status'][] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];
      heading('Sales Pipeline');
      for (const stage of stages) {
        const stageleads = leads.filter(l => l.status === stage);
        keyValue(stage.padEnd(12), `${stageleads.length} leads`);
      }
      divider();
    });

  // --- summary ---
  crm.command('summary')
    .description('CRM summary stats')
    .action(() => {
      const dir = getDataDir();
      const leads = readJson<Lead[]>(join(dir, 'leads.json'), []);
      const customers = readJson<Customer[]>(join(dir, 'customers.json'), []);
      const tickets = readJson<Ticket[]>(join(dir, 'tickets.json'), []);
      heading('CRM Summary');
      keyValue('Total Leads', String(leads.length));
      keyValue('Qualified', String(leads.filter(l => l.status === 'qualified').length));
      keyValue('Won', String(leads.filter(l => l.status === 'won').length));
      keyValue('Total Customers', String(customers.length));
      keyValue('Active', String(customers.filter(c => c.status === 'active').length));
      keyValue('MRR', `$${customers.reduce((s, c) => s + c.mrr, 0)}`);
      keyValue('Open Tickets', String(tickets.filter(t => t.status === 'open').length));
      divider();
    });
}
