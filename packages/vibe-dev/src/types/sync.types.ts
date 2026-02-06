import { Task } from './task.types';

export type SyncActionType = 'push' | 'pull' | 'none' | 'conflict';

export interface SyncAction {
  type: SyncActionType;
  localTask?: Task;
  remoteTask?: Task;
  reason: string;
  changes?: Partial<Task>; // For updates, what changed
}

export interface SyncResult {
  addedToLocal: number;
  updatedLocal: number;
  addedToRemote: number;
  updatedRemote: number;
  errors: string[];
  actions: SyncAction[];    // Planned operations
  conflicts: SyncAction[];  // Unresolved conflicts
}

export interface SyncOptions {
  autoResolve: boolean; // If true, apply LWW automatically
  dryRun: boolean;      // If true, return actions but don't execute
}
