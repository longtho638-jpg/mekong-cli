import { SyncEngine } from '../src/lib/sync-engine';
import { ProjectService } from '../src/lib/project-service';
import { JsonStorageAdapter } from '../src/lib/storage-adapter';
import { GitHubClient } from '../src/lib/github-client';
import { Task } from '../src/types/task.types';

// Mock dependencies
class MockStorage extends JsonStorageAdapter {
  private data: any = {};
  async read<T>(path: string): Promise<T | null> {
    return (this.data[path] as T) || null;
  }
  async write<T>(path: string, content: T): Promise<void> {
    this.data[path] = content;
  }
}

class MockProjectService extends ProjectService {
  public fetchedItems: Task[] = [];

  constructor() {
    super({} as GitHubClient);
  }

  async fetchProjectItems(owner: string, number: number): Promise<Task[]> {
    this.currentProjectId = 'PROJ_1';
    return this.fetchedItems;
  }

  async addItemToProject(projectId: string, contentId: string): Promise<string> {
      console.log(`[Mock] Added ${contentId} to ${projectId}`);
      return 'NEW_ITEM_ID';
  }

  async updateItemField(projectId: string, itemId: string, field: string, value: any): Promise<void> {
      console.log(`[Mock] Updated ${itemId} field ${field} to ${value}`);
  }
}

async function main() {
  console.log('Running SyncEngine Tests...\n');

  const storage = new MockStorage();
  const projectService = new MockProjectService();
  const engine = new SyncEngine(projectService, storage);

  // Common timestamps
  const T0 = '2023-01-01T00:00:00Z';
  const T1 = '2023-01-02T00:00:00Z'; // Newer

  // --- Scenario 1: Remote Newer (Pull) ---
  console.log('--- Scenario 1: Remote Newer (Pull) ---');
  const task1Local: Task = { id: 'T1', title: 'Task 1', status: 'pending', priority: 'medium', type: 'task', updatedAt: T0, createdAt: T0, parentId: '', subtasks: [] };
  const task1Remote: Task = { id: 'T1', title: 'Task 1 Updated', status: 'active', priority: 'medium', type: 'task', updatedAt: T1, createdAt: T0, parentId: '', subtasks: [] };

  await storage.write('test.json', { tasks: [task1Local], epics: [] });
  projectService.fetchedItems = [task1Remote];

  const result1 = await engine.runSync('test.json', 'owner', 1, false, { autoResolve: true, dryRun: false });

  console.log('Actions:', result1.actions.map(a => `${a.type}: ${a.reason}`));
  const updatedStore1 = await storage.read<any>('test.json');
  const updatedTask1 = updatedStore1.tasks[0];

  if (updatedTask1.title === 'Task 1 Updated' && updatedTask1.status === 'active') {
    console.log('✅ Scenario 1 Passed: Local updated from Remote');
  } else {
    console.error('❌ Scenario 1 Failed', updatedTask1);
  }

  // --- Scenario 2: Local Newer (Push) ---
  console.log('\n--- Scenario 2: Local Newer (Push) ---');
  const task2Local: Task = { id: 'T2', title: 'Task 2 Updated', status: 'done', priority: 'high', type: 'task', updatedAt: T1, createdAt: T0, parentId: '', subtasks: [] };
  const task2Remote: Task = { id: 'T2', title: 'Task 2', status: 'active', priority: 'medium', type: 'task', updatedAt: T0, createdAt: T0, parentId: '', subtasks: [] };

  await storage.write('test.json', { tasks: [task2Local], epics: [] });
  projectService.fetchedItems = [task2Remote];

  const result2 = await engine.runSync('test.json', 'owner', 1, false, { autoResolve: true, dryRun: false });
  console.log('Actions:', result2.actions.map(a => `${a.type}: ${a.reason}`));

  // Verification is implicit via Mock console logs (Updated T2 field Status to Done...)
  // But we can check result stats
  if (result2.updatedRemote === 1) {
      console.log('✅ Scenario 2 Passed: Push action generated');
  } else {
      console.error('❌ Scenario 2 Failed');
  }

  // --- Scenario 3: New Remote Task (Pull Create) ---
  console.log('\n--- Scenario 3: New Remote Task ---');
  const task3Remote: Task = { id: 'T3', title: 'Task 3', status: 'pending', priority: 'low', type: 'task', updatedAt: T1, createdAt: T1, parentId: '', subtasks: [] };

  await storage.write('test.json', { tasks: [], epics: [] });
  projectService.fetchedItems = [task3Remote];

  await engine.runSync('test.json', 'owner', 1, false, { autoResolve: true, dryRun: false });

  const updatedStore3 = await storage.read<any>('test.json');
  if (updatedStore3.tasks.find((t: any) => t.id === 'T3')) {
      console.log('✅ Scenario 3 Passed: New task created locally');
  } else {
      console.error('❌ Scenario 3 Failed');
  }

  // --- Scenario 4: New Local Task (Push Create) ---
  console.log('\n--- Scenario 4: New Local Task ---');
  // Note: For Push Create to work in current impl, it needs an Issue ID structure usually, or logic handle
  const task4Local: Task = { id: 'I_123', title: 'Task 4', status: 'pending', priority: 'medium', type: 'task', updatedAt: T1, createdAt: T1, parentId: '', subtasks: [], githubIssueId: 123 };

  await storage.write('test.json', { tasks: [task4Local], epics: [] });
  projectService.fetchedItems = [];

  const result4 = await engine.runSync('test.json', 'owner', 1, false, { autoResolve: true, dryRun: false });
  console.log('Actions:', result4.actions.map(a => `${a.type}: ${a.reason}`));

  if (result4.addedToRemote === 1) {
       console.log('✅ Scenario 4 Passed: Push action generated');
  } else {
       console.error('❌ Scenario 4 Failed');
  }
}

main().catch(console.error);
