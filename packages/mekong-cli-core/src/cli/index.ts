#!/usr/bin/env node
import { Command } from 'commander';
import { MekongEngine, attachObservability } from '../core/index.js';
import { registerRunCommand } from './commands/run.js';
import { registerSopCommand } from './commands/sop.js';
import { registerStatusCommand } from './commands/status.js';
import { registerCrmCommand } from './commands/crm.js';
import { registerFinanceCommand } from './commands/finance.js';
import { registerDashboardCommand } from './commands/dashboard.js';
import { registerKaizenCommand } from './commands/kaizen.js';
import { registerMarketplaceCommand } from './commands/marketplace.js';
import { registerPluginCommand } from './commands/plugin.js';
import { registerLicenseCommand } from './commands/license.js';
import { attachLicenseMiddleware } from '../license/middleware.js';
import { LicenseGate } from '../license/gate.js';

const VERSION = '0.4.0';

export async function main(argv?: string[]): Promise<void> {
  const program = new Command();
  const engine = new MekongEngine();

  program
    .name('mekong')
    .description('AI-operated business platform CLI')
    .version(VERSION);

  // Attach observability + init engine before any command action runs
  program.hook('preAction', async () => {
    try {
      attachObservability();
      await engine.init({
        askUser: async (q) => {
          process.stdout.write(q + ' ');
          return new Promise((resolve) => {
            process.stdin.once('data', (data) => resolve(data.toString().trim()));
          });
        },
      });
    } catch {
      // Engine init may fail when no LLM configured — status cmd still works
    }
  });

  registerRunCommand(program, engine);
  registerSopCommand(program, engine);
  registerStatusCommand(program, engine);
  registerCrmCommand(program, engine);
  registerFinanceCommand(program, engine);
  registerDashboardCommand(program, engine);
  registerKaizenCommand(program);
  registerMarketplaceCommand(program);
  registerPluginCommand(program);
  registerLicenseCommand(program);

  // Attach license gate middleware (after all commands registered)
  const gate = new LicenseGate();
  attachLicenseMiddleware(program, gate);

  await program.parseAsync(argv ?? process.argv);
}

// Auto-run when executed directly
const isDirectRun = process.argv[1]?.includes('mekong') || process.argv[1]?.includes('index');
if (isDirectRun) {
  main().catch(console.error);
}
