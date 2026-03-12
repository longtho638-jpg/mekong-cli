/**
 * `mekong plugin` — Plugin management.
 *
 *   mekong plugin list                     List loaded plugins
 *   mekong plugin load <path>              Load a plugin
 *   mekong plugin unload <name>            Unload a plugin
 *   mekong plugin validate <path>          Validate plugin manifest
 *   mekong plugin create                   Interactive plugin scaffold
 *   mekong plugin permissions <name>       View plugin permissions
 */
import type { Command } from 'commander';

export function registerPluginCommand(program: Command): void {
  const plugin = program
    .command('plugin')
    .description('Plugin management — load, unload, validate, and create plugins');

  plugin.command('list')
    .description('List loaded plugins')
    .action(async () => {
      throw new Error('Not implemented');
    });

  plugin.command('load <path>')
    .description('Load a plugin from path')
    .action(async (_path: string) => {
      throw new Error('Not implemented');
    });

  plugin.command('unload <name>')
    .description('Unload a plugin by name')
    .action(async (_name: string) => {
      throw new Error('Not implemented');
    });

  plugin.command('validate <path>')
    .description('Validate plugin manifest')
    .action(async (_path: string) => {
      throw new Error('Not implemented');
    });

  plugin.command('create')
    .description('Scaffold a new plugin interactively')
    .action(async () => {
      throw new Error('Not implemented');
    });

  plugin.command('permissions <name>')
    .description('View permissions for a loaded plugin')
    .action(async (_name: string) => {
      throw new Error('Not implemented');
    });
}
