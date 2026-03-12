/**
 * middleware.ts — commander preAction hook for license gating.
 * Blocks premium commands when tier is insufficient; --help/--version always pass.
 */
import type { Command } from 'commander';
import { LicenseGate } from './gate.js';

/** Commands that always bypass the license gate */
const BYPASS_FLAGS = new Set(['--help', '-h', '--version', '-V']);

/** Extract root command name from a commander Command */
function getRootCommandName(command: Command): string {
  // Walk up to find first non-root command name
  let cmd: Command = command;
  const names: string[] = [];
  while (cmd.parent) {
    if (cmd.name()) names.unshift(cmd.name());
    cmd = cmd.parent;
  }
  return names[0] ?? '';
}

/**
 * Attach license gate as a preAction hook on the root program.
 * Pass a LicenseGate instance so tests can inject a store with tmpdir.
 */
export function attachLicenseMiddleware(program: Command, gate?: LicenseGate): void {
  const licenseGate = gate ?? new LicenseGate();

  program.hook('preAction', async (thisCommand, actionCommand) => {
    // Always allow --help / --version
    const rawArgs = actionCommand.args ?? [];
    const parentArgs = process.argv.slice(2);
    const allArgs = [...parentArgs, ...rawArgs];
    if (allArgs.some(a => BYPASS_FLAGS.has(a))) return;

    const commandName = getRootCommandName(actionCommand);
    if (!commandName) return;

    const result = await licenseGate.canAccess(commandName);
    if (!result.ok) {
      console.error(`\n[License] ${result.error.message}\n`);
      process.exit(1);
    }
  });
}
