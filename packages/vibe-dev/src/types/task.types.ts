export type TaskStatus = 'pending' | 'active' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'epic' | 'task' | 'subtask';

export interface BaseTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  description?: string;
  assignee?: string;
  labels?: string[];
}

export interface Epic extends BaseTask {
  type: 'epic';
  tasks: string[]; // List of Task IDs
  phase?: string; // e.g. "setup", "core", "polish"
}

export interface Task extends BaseTask {
  type: 'task';
  parentId: string; // Epic ID
  subtasks: Subtask[];
  githubIssueId?: number; // Mapped to GitHub Issue
  githubIssueUrl?: string;
}

export interface Subtask {
  id: string;
  title: string;
  status: boolean; // true = done, false = pending
  type: 'subtask';
}

export interface TaskStore {
  epics: Epic[];
  tasks: Task[];
}
