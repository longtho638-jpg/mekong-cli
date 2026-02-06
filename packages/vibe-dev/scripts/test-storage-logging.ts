import path from 'path';
import fs from 'fs/promises';
import { JsonStorageAdapter } from '../src/lib/storage-adapter';
import { AuditLogger } from '../src/lib/audit-logger';
import { Task, TaskStore } from '../src/types/task.types';

async function main() {
  console.log('Testing Storage & Logging...');

  const tempDir = path.join(process.cwd(), 'temp-test-storage');
  const storePath = path.join(tempDir, 'store.json');
  const logPath = path.join(tempDir, 'todo-log.json');

  try {
    // Cleanup previous test run
    await fs.rm(tempDir, { recursive: true, force: true });

    // 1. Test JsonStorageAdapter
    console.log('\n--- Testing JsonStorageAdapter ---');
    const storage = new JsonStorageAdapter();

    const initialData: TaskStore = {
      epics: [],
      tasks: [
        {
          id: 'T001',
          title: 'Test Task',
          status: 'pending',
          priority: 'medium',
          type: 'task',
          parentId: 'E001',
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };

    console.log('Writing to store...');
    await storage.write(storePath, initialData);

    console.log('Reading from store...');
    const readData = await storage.read<TaskStore>(storePath);

    if (JSON.stringify(readData) === JSON.stringify(initialData)) {
      console.log('✅ Storage Read/Write verified.');
    } else {
      console.error('❌ Storage Read/Write mismatch!');
      console.error('Expected:', initialData);
      console.error('Received:', readData);
      process.exit(1);
    }

    // 2. Test AuditLogger
    console.log('\n--- Testing AuditLogger ---');
    const logger = new AuditLogger(logPath);

    console.log('Logging actions...');
    await logger.log('TASK_CREATED', { taskId: 'T001', title: 'Test Task' });
    await logger.log('TASK_UPDATED', { taskId: 'T001', status: 'active' });

    console.log('Reading recent logs...');
    const logs = await logger.getRecentLogs(10);

    if (logs.length === 2) {
      console.log('✅ Log count correct.');
    } else {
      console.error(`❌ Expected 2 logs, got ${logs.length}`);
      process.exit(1);
    }

    if (logs[0].action === 'TASK_UPDATED' && logs[1].action === 'TASK_CREATED') {
       console.log('✅ Log order correct (reverse chronological).');
    } else {
      console.error('❌ Log order incorrect.');
      console.error(logs);
      process.exit(1);
    }

    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log('\n✅ All Tests Passed! (Temp files cleaned up)');

  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error(error);
    process.exit(1);
  }
}

main();
