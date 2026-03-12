/**
 * `mekong marketplace` — SOP marketplace.
 *
 *   mekong marketplace search <query>      Search SOPs
 *   mekong marketplace browse [--cat=X]    Browse by category
 *   mekong marketplace info <package>      Package details
 *   mekong marketplace install <package>   Install SOP package
 *   mekong marketplace update [package]    Update installed packages
 *   mekong marketplace uninstall <pkg>     Remove package
 *   mekong marketplace list               List installed packages
 *   mekong marketplace pack <dir>          Pack SOP for publishing
 *   mekong marketplace validate <dir>      Validate package
 *   mekong marketplace publish <mkg>       Publish to marketplace
 */
import type { Command } from 'commander';

export function registerMarketplaceCommand(program: Command): void {
  const mp = program
    .command('marketplace')
    .description('SOP marketplace — browse, install, and publish SOP packages');

  mp.command('search <query>')
    .description('Search marketplace SOPs')
    .option('--cat <category>', 'Filter by category')
    .option('--limit <n>', 'Max results', '20')
    .action(async (_query: string, _opts: { cat?: string; limit: string }) => {
      throw new Error('Not implemented');
    });

  mp.command('browse')
    .description('Browse SOPs by category')
    .option('--cat <category>', 'Category filter')
    .action(async (_opts: { cat?: string }) => {
      throw new Error('Not implemented');
    });

  mp.command('info <package>')
    .description('Show package details')
    .action(async (_pkg: string) => {
      throw new Error('Not implemented');
    });

  mp.command('install <package>')
    .description('Install a SOP package')
    .option('--version <ver>', 'Specific version')
    .action(async (_pkg: string, _opts: { version?: string }) => {
      throw new Error('Not implemented');
    });

  mp.command('update [package]')
    .description('Update installed packages (all if no arg)')
    .action(async (_pkg?: string) => {
      throw new Error('Not implemented');
    });

  mp.command('uninstall <package>')
    .description('Uninstall a SOP package')
    .action(async (_pkg: string) => {
      throw new Error('Not implemented');
    });

  mp.command('list')
    .description('List installed packages')
    .action(async () => {
      throw new Error('Not implemented');
    });

  mp.command('pack <dir>')
    .description('Pack SOP directory into .mkg archive')
    .option('--out <path>', 'Output path')
    .action(async (_dir: string, _opts: { out?: string }) => {
      throw new Error('Not implemented');
    });

  mp.command('validate <dir>')
    .description('Validate package before publishing')
    .action(async (_dir: string) => {
      throw new Error('Not implemented');
    });

  mp.command('publish <mkg>')
    .description('Publish .mkg package to marketplace')
    .action(async (_mkg: string) => {
      throw new Error('Not implemented');
    });
}
