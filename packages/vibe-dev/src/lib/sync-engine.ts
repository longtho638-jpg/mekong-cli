import { ProjectService } from './project-service';
import { JsonStorageAdapter } from './storage-adapter';
import { Task, TaskStore } from '../types/task.types';
import { SyncResult, SyncOptions, SyncAction } from '../types/sync.types';

export class SyncEngine {
  constructor(
    private projectService: ProjectService,
    private storage: JsonStorageAdapter
  ) {}

  /**
   * Orchestrates the sync process: Fetch Remote -> Read Local -> Calculate -> Execute
   */
  public async runSync(
    filePath: string,
    owner: string,
    projectNumber: number,
    isOrg: boolean,
    options: SyncOptions
  ): Promise<SyncResult> {
    // 1. Fetch Remote
    console.log(`Fetching remote tasks from ${owner}/${projectNumber}...`);
    const remoteTasks = await this.projectService.fetchProjectItems(owner, projectNumber, isOrg);
    const projectId = this.projectService.currentProjectId;

    if (!projectId) {
      throw new Error('Project ID not found after fetching items');
    }

    // 2. Read Local
    console.log(`Reading local tasks from ${filePath}...`);
    let localStore = await this.storage.read<TaskStore>(filePath);
    if (!localStore) {
        localStore = { epics: [], tasks: [] };
    }
    const localTasks = localStore.tasks;

    // 3. Calculate Actions
    console.log('Calculating sync actions...');
    const result = this.sync(localTasks, remoteTasks);

    // 4. Execute Actions
    if (!options.dryRun && options.autoResolve) {
        console.log(`Executing ${result.actions.length} actions...`);
        await this.executeActions(result.actions, filePath, localStore, projectId);
    }

    return result;
  }

  /**
   * Compares local and remote tasks and determines necessary sync actions
   * based on "Last Write Wins" (LWW) strategy.
   */
  public sync(localTasks: Task[], remoteTasks: Task[]): SyncResult {
    const result: SyncResult = {
      addedToLocal: 0,
      updatedLocal: 0,
      addedToRemote: 0,
      updatedRemote: 0,
      errors: [],
      actions: [],
      conflicts: []
    };

    const localMap = new Map(localTasks.map(t => [t.id, t]));
    const remoteMap = new Map(remoteTasks.map(t => [t.id, t]));
    const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

    for (const id of allIds) {
      const local = localMap.get(id);
      const remote = remoteMap.get(id);

      if (local && remote) {
        // Both exist - compare timestamps
        const localTime = new Date(local.updatedAt).getTime();
        const remoteTime = new Date(remote.updatedAt).getTime();

        // Check if content is actually different to avoid unnecessary syncs
        const diffLocalToRemote = this.calculateDiff(local, remote);
        const diffRemoteToLocal = this.calculateDiff(remote, local);

        const hasChanges = Object.keys(diffLocalToRemote).length > 0;

        if (hasChanges) {
             if (remoteTime > localTime) {
              // Remote is newer -> Pull
              result.actions.push({
                type: 'pull',
                localTask: local,
                remoteTask: remote,
                reason: `Remote newer (${remote.updatedAt} > ${local.updatedAt})`,
                changes: diffLocalToRemote
              });
              result.updatedLocal++;
            } else if (localTime > remoteTime) {
              // Local is newer -> Push
              result.actions.push({
                type: 'push',
                localTask: local,
                remoteTask: remote,
                reason: `Local newer (${local.updatedAt} > ${remote.updatedAt})`,
                changes: diffRemoteToLocal
              });
              result.updatedRemote++;
            } else {
                // Timestamps equal but content differs?
                // Default to pull (Server authority)
                result.actions.push({
                    type: 'pull',
                    localTask: local,
                    remoteTask: remote,
                    reason: 'Timestamps equal, content differs (Server wins)',
                    changes: diffLocalToRemote
                });
                result.updatedLocal++;
            }
        }
      } else if (local && !remote) {
        // Local only -> Push (Create)
        result.actions.push({
          type: 'push',
          localTask: local,
          reason: 'New local task'
        });
        result.addedToRemote++;
      } else if (!local && remote) {
        // Remote only -> Pull (Create)
        result.actions.push({
          type: 'pull',
          remoteTask: remote,
          reason: 'New remote task'
        });
        result.addedToLocal++;
      }
    }

    return result;
  }

  public calculateDiff(base: Task, target: Task): Partial<Task> {
    const diff: Partial<Task> = {};

    if (base.title !== target.title) diff.title = target.title;
    if (base.status !== target.status) diff.status = target.status;
    if (base.priority !== target.priority) diff.priority = target.priority;
    if (base.description !== target.description) diff.description = target.description;
    if (base.parentId !== target.parentId) diff.parentId = target.parentId;
    if (base.assignee !== target.assignee) diff.assignee = target.assignee;

    // Compare labels
    const baseLabels = (base.labels || []).sort().join(',');
    const targetLabels = (target.labels || []).sort().join(',');
    if (baseLabels !== targetLabels) {
        diff.labels = target.labels;
    }

    return diff;
  }

  private async executeActions(actions: SyncAction[], filePath: string, localStore: TaskStore, projectId: string) {
    for (const action of actions) {
        try {
            if (action.type === 'pull') {
                this.executePull(action, localStore);
            } else if (action.type === 'push') {
                await this.executePush(action, projectId, localStore);
            }
        } catch (error: any) {
            console.error(`Failed to execute ${action.type} for task ${action.localTask?.id || action.remoteTask?.id}:`, error);
        }
    }

    // Save Local Store once after all updates
    await this.storage.write(filePath, localStore);
  }

  private executePull(action: SyncAction, localStore: TaskStore) {
    if (!action.remoteTask) return;

    if (action.reason.includes('New remote task')) {
        // Create new local task
        localStore.tasks.push(action.remoteTask);
    } else if (action.localTask) {
        // Update existing local task
        const index = localStore.tasks.findIndex(t => t.id === action.localTask!.id);
        if (index !== -1) {
            // Merge changes: verify we are updating the correct fields
            // For simplicity in this phase, we replace the task with the remote version
            // which effectively applies all changes (Sync)
            // But we must preserve any local-only fields if we had them (none for now)
            localStore.tasks[index] = action.remoteTask;
        }
    }
  }

  private async executePush(action: SyncAction, projectId: string, localStore: TaskStore) {
    if (action.reason.includes('New local task') && action.localTask) {
        // Create on Remote
        // Note: In real world, we need to create Issue first, then add to project.
        // For this phase, assuming we have an ID means it might already be an Issue?
        // If it's a pure local task with generated ID, we can't just "push" it to project directly
        // without creating the Issue first.

        // LIMITATION: 'addItemToProject' requires a contentId (Issue/PR ID).
        // If local task has no githubIssueId, we can't push it yet in this architecture
        // without an 'IssueService' to create the issue first.

        // Handling: If githubIssueId exists, add to project. If not, skip (or error).
        if (action.localTask.id.startsWith('I_') || action.localTask.githubIssueId) {
             // It's likely an issue ID or we have one.
             // If we treat local ID as content ID (assuming user provided it):
             try {
                 await this.projectService.addItemToProject(projectId, action.localTask.id);
                 // We also need to update fields after adding
                 await this.pushFields(projectId, action.localTask.id, action.localTask);
             } catch (e) {
                 console.warn(`Could not add item ${action.localTask.id} to project. It might not be a valid Issue ID.`);
             }
        } else {
            console.warn(`Skipping creation of ${action.localTask.id} on remote: Missing GitHub Issue ID.`);
        }

    } else if (action.localTask && action.remoteTask) {
        // Update Remote fields
        await this.pushFields(projectId, action.remoteTask.id, action.localTask);
    }
  }

  private async pushFields(projectId: string, itemId: string, task: Task) {
      if (task.status) {
          await this.projectService.updateItemField(projectId, itemId, 'Status', this.capitalize(task.status));
      }
      if (task.priority) {
          await this.projectService.updateItemField(projectId, itemId, 'Priority', this.capitalize(task.priority));
      }
      // Add other fields as needed
  }

  private capitalize(s: string): string {
      if (!s) return '';
      return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
