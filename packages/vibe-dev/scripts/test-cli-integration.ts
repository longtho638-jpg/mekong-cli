import { SyncCommand } from '../src/index';
import { GitHubClient, ProjectService, JsonStorageAdapter, SyncEngine } from '../src/index';
import { Task } from '../src/types/task.types';

// Mock dependencies (reuse logic from test-sync-engine.ts but simpler)
class MockStorage extends JsonStorageAdapter {
  async read<T>(path: string): Promise<T | null> {
    return { tasks: [], epics: [] } as any;
  }
  async exists(path: string): Promise<boolean> {
      return true;
  }
}

class MockProjectService extends ProjectService {
  constructor() {
      super({} as GitHubClient);
  }
  async fetchProjectItems(owner: string, number: number): Promise<Task[]> {
    this.currentProjectId = 'PROJ_MOCK';
    return [];
  }
}

async function main() {
  console.log('Running CLI Integration Verification...');

  // 1. Instantiate Command with Mocks
  const cmd = new SyncCommand({
      storage: new MockStorage(),
      projectService: new MockProjectService()
      // engine will be created with these
  });

  // 2. Execute
  const result = await cmd.execute({
    githubToken: 'dummy',
    owner: 'test-owner',
    projectNumber: 1,
    localPath: 'test.json',
    dryRun: true
  });

  // 3. Verify
  if (result && result.actions) {
      console.log('✅ SyncCommand executed successfully via index.ts exports');
  } else {
      console.error('❌ SyncCommand failed to return valid result');
      process.exit(1);
  }
}

main().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
});
