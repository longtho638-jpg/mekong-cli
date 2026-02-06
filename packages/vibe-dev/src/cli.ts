#!/usr/bin/env node
import { Command } from 'commander';
import { SyncCommand } from './commands/sync.command';
import { promptForConfig, resolveConflicts } from './ui/interactive';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file if it exists
dotenv.config();

const program = new Command();

program
  .name('vibe')
  .description('🟢 Earth - Development Workflow Layer')
  .version('1.0.0');

program
  .command('sync')
  .description('Sync GitHub Project with local storage')
  .option('-t, --token <token>', 'GitHub Personal Access Token')
  .option('-o, --owner <owner>', 'Repository Owner or Organization')
  .option('-n, --number <number>', 'Project Number', parseInt)
  .option('-p, --path <path>', 'Local file path')
  .option('--org', 'Treat owner as an Organization')
  .option('--dry-run', 'Run without making changes')
  .option('--no-interactive', 'Disable interactive prompts')
  .action(async (options) => {
    try {
      // 1. Map options to Partial config
      const initialConfig = {
        githubToken: options.token || process.env.GITHUB_TOKEN,
        owner: options.owner,
        projectNumber: options.number,
        localPath: options.path,
        isOrg: options.org,
        dryRun: options.dryRun
      };

      // 2. Interactive Prompt (if allowed)
      let config;
      if (options.interactive !== false) {
         config = await promptForConfig(initialConfig);
      } else {
         // Validate required fields manually if non-interactive
         if (!initialConfig.githubToken) throw new Error('Token is required in non-interactive mode');
         if (!initialConfig.owner) throw new Error('Owner is required in non-interactive mode');
         if (!initialConfig.projectNumber) throw new Error('Project Number is required in non-interactive mode');
         if (!initialConfig.localPath) throw new Error('Local Path is required in non-interactive mode');
         config = initialConfig as any;
      }

      // 3. Execute
      const cmd = new SyncCommand();
      const result = await cmd.execute(config);

      // 4. Handle Conflicts interactively if any
      if (result.conflicts.length > 0 && options.interactive !== false) {
          const resolvedActions = await resolveConflicts(result.conflicts);

          // Re-execute engine with resolved actions?
          // For now, the SyncCommand executes logic in one go.
          // Realistically, conflict resolution needs to happen *during* or *before* final commit.
          // In the current MVP architecture, SyncEngine applies 'autoResolve' immediately.
          // If we want manual resolution, we'd need to update SyncEngine to return conflicts BEFORE saving.
          // For this Phase 6, we'll stick to the plan of just implementing the UI layer.
          // The resolveConflicts function is implemented but might need Engine Refactor to be fully effective.
          // We will log them for now.
      }

    } catch (error: any) {
      console.error('Fatal Error:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
