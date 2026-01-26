/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export type ClientStatus = "active" | "pending" | "churned";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type ProjectStatus = "draft" | "active" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Agency {
  id: string;
  user_id: string;
  subscription_tier: string;
  stripe_customer_id: string;
  mrr: number;
  settings: {
    [k: string]: unknown;
  };
  tone?: string | null;
  capabilities?: unknown[] | null;
  services?: unknown[] | null;
}
/**
 * Response from agent execution
 */
export interface AgentResponse {
  /**
   * Execution status
   */
  status: string;
  /**
   * Agent name
   */
  agent: string;
  /**
   * Original task
   */
  task: string;
  /**
   * Estimated completion time
   */
  estimated_time: string;
  /**
   * Unique job identifier
   */
  job_id: string;
}
/**
 * Task for an agent
 */
export interface AgentTask {
  /**
   * Name of the agent to execute task
   */
  agent_name: string;
  /**
   * Task description
   */
  task: string;
  /**
   * Task priority
   */
  priority?: string;
}
export interface Client {
  id: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  mrr: number;
  total_ltv: number;
  active_projects: number;
  status: ClientStatus;
  zalo?: string | null;
}
/**
 * Base request for command execution
 */
export interface CommandRequest {
  /**
   * Command prompt
   */
  prompt: string;
  /**
   * Vibe setting
   */
  vibe?: string | null;
  /**
   * Override AI provider
   */
  override_provider?: string | null;
}
/**
 * Response from command execution
 */
export interface CommandResponse {
  /**
   * Command identifier
   */
  command: string;
  /**
   * Command section
   */
  section: string;
  /**
   * Execution status
   */
  status: string;
  /**
   * Original prompt
   */
  prompt: string;
  /**
   * Output format type
   */
  output_format: string;
}
export interface Invoice {
  /**
   * UUID
   */
  id: string;
  invoice_number: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  service_type?: string | null;
  stripe_invoice_id?: string | null;
}
/**
 * Request to execute an AgentOps action
 */
export interface OpsExecuteRequest {
  /**
   * Target category
   */
  category: string;
  /**
   * Action to execute
   */
  action: string;
  /**
   * Action parameters
   */
  params?: {
    [k: string]: unknown;
  };
}
/**
 * Response from AgentOps execution
 */
export interface OpsExecuteResponse {
  /**
   * Executed category
   */
  category: string;
  /**
   * Executed action
   */
  action: string;
  /**
   * Success status
   */
  success: boolean;
  result?: unknown;
  /**
   * Error message if failed
   */
  error?: string | null;
}
/**
 * Status of an AgentOps module
 */
export interface OpsStatus {
  /**
   * Ops module name
   */
  name: string;
  /**
   * Ops category
   */
  category: string;
  /**
   * Module status
   */
  status?: string;
  /**
   * Number of agents
   */
  agents_count?: number;
  /**
   * Last run timestamp
   */
  last_run?: string | null;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  client_id?: string | null;
  status: ProjectStatus;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  type?: string | null;
}
/**
 * Request for task routing
 */
export interface RouterRequest {
  /**
   * Task description
   */
  task: string;
  /**
   * Task complexity
   */
  complexity?: string | null;
  /**
   * Token count
   */
  tokens?: number | null;
}
/**
 * Response from task routing
 */
export interface RouterResponse {
  /**
   * Recommended AI provider
   */
  provider: string;
  /**
   * Recommended model
   */
  model: string;
  /**
   * Estimated cost
   */
  estimated_cost: number;
  /**
   * Routing reason
   */
  reason: string;
  /**
   * Task analysis
   */
  task_analysis: {
    [k: string]: string;
  };
}
export interface Task {
  id: string;
  project_id?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  agent_assigned?: string | null;
}
/**
 * Request to set vibe
 */
export interface VibeRequest {
  /**
   * Region identifier
   */
  region: string;
  /**
   * Location name
   */
  location?: string | null;
}
/**
 * Response from vibe configuration
 */
export interface VibeResponse {
  /**
   * Vibe name
   */
  vibe?: string | null;
  /**
   * Location name
   */
  location?: string | null;
  /**
   * Auto-detected vibe
   */
  detected_vibe?: string | null;
  /**
   * Vibe configuration
   */
  config: {
    [k: string]: unknown;
  };
}
export interface CreateCardRequest {
  title: string;
  description?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  assignee_id?: string | null;
  tags?: string[] | null;
  due_date?: string | null;
}
export interface KanbanBoard {
  id: string;
  title: string;
  description?: string | null;
  columns: KanbanColumn[];
  created_at: string;
  updated_at: string;
}
export interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
  order: number;
  cards: KanbanCard[];
}
export interface KanbanCard {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;
  tags?: string[];
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  order: number;
  metadata?: {
    [k: string]: unknown;
  };
}
export interface UpdateCardRequest {
  title?: string | null;
  description?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  assignee_id?: string | null;
  tags?: string[] | null;
  due_date?: string | null;
  order?: number | null;
}
