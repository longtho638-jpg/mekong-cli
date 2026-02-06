import { GitHubClient } from '../lib/github-client';
import { ProjectService } from '../lib/project-service';
import { JsonStorageAdapter } from '../lib/storage-adapter';
import { SyncEngine } from '../lib/sync-engine';
import { SyncResult } from '../types/sync.types';

export interface SyncCommandConfig {
  githubToken: string;
  owner: string;
  projectNumber: number;
  localPath: string;
  isOrg?: boolean;
  dryRun?: boolean;
  autoResolve?: boolean;
}

export interface SyncCommandDeps {
  client?: GitHubClient;
  projectService?: ProjectService;
  storage?: JsonStorageAdapter;
  engine?: SyncEngine;
}

export class SyncCommand {
  constructor(private deps: SyncCommandDeps = {}) {}

  public async execute(config: SyncCommandConfig): Promise<SyncResult> {
    console.log('Initializing Sync Command...');

    // 1. Initialize dependencies (use injected or create new)
    const client = this.deps.client || new GitHubClient(config.githubToken);
    const projectService = this.deps.projectService || new ProjectService(client);
    const storage = this.deps.storage || new JsonStorageAdapter();
    const engine = this.deps.engine || new SyncEngine(projectService, storage);

    // 2. Validate Local Path
    const exists = await storage.exists(config.localPath);
    if (!exists) {
      console.warn(`Local file ${config.localPath} does not exist. A new one will be created during sync if remote items exist.`);
    }

    // 3. Run Sync
    const result = await engine.runSync(
      config.localPath,
      config.owner,
      config.projectNumber,
      !!config.isOrg,
      {
        autoResolve: config.autoResolve ?? true,
        dryRun: !!config.dryRun
      }
    );

    // 4. Report
    this.printReport(result);

    return result;
  }

  private printReport(result: SyncResult) {
    console.log('\n--- Sync Report ---');
    console.log(`⬇️  Pulled (Create): ${result.addedToLocal}`);
    console.log(`⬇️  Pulled (Update): ${result.updatedLocal}`);
    console.log(`⬆️  Pushed (Create): ${result.addedToRemote}`);
    console.log(`⬆️  Pushed (Update): ${result.updatedRemote}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(e => console.error(`   - ${e}`));
    }

    if (result.conflicts.length > 0) {
      console.log('\n⚠️  Conflicts:');
      result.conflicts.forEach(c => console.warn(`   - ${c.reason}`));
    }

    if (result.actions.length > 0) {
        console.log('\n📝 Actions Taken:');
        result.actions.forEach(a => console.log(`   - [${a.type.toUpperCase()}] ${a.reason}`));
    }

    console.log('-------------------\n');
  }
}
