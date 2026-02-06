import { GitHubClient } from './github-client';
import { GET_USER_PROJECT_V2, GET_ORG_PROJECT_V2, GET_PROJECT_V2_ITEMS } from '../queries/project.queries';
import { ADD_PROJECT_V2_ITEM_BY_ID, UPDATE_PROJECT_V2_ITEM_FIELD_VALUE } from '../queries/mutation.queries';
import { Task, TaskStatus, TaskPriority, TaskType } from '../types/task.types';

interface ProjectV2Field {
  id: string;
  name: string;
  dataType: string;
  options?: { id: string; name: string }[];
}

export class ProjectService {
  private client: GitHubClient;
  private projectFields: Map<string, ProjectV2Field> = new Map();
  public currentProjectId: string | null = null;

  constructor(client: GitHubClient) {
    this.client = client;
  }

  /**
   * Fetches all items from a GitHub Project V2 and maps them to Tasks.
   * Also caches field configurations for write operations.
   */
  public async fetchProjectItems(owner: string, projectNumber: number, isOrg: boolean = false): Promise<Task[]> {
    // 1. Fetch Project ID and Field Configuration
    const projectQuery = isOrg ? GET_ORG_PROJECT_V2 : GET_USER_PROJECT_V2;
    const projectData = await this.client.graphql<any>(projectQuery, { login: owner, number: projectNumber });

    const project = isOrg ? projectData.organization?.projectV2 : projectData.user?.projectV2;
    if (!project) {
      throw new Error(`Project number ${projectNumber} not found for ${owner}`);
    }

    const projectId = project.id;
    this.currentProjectId = projectId;
    this.cacheFields(project.fields.nodes);

    // 2. Fetch All Items (Pagination)
    const items: any[] = [];
    let hasNextPage = true;
    let endCursor: string | null = null;

    while (hasNextPage) {
      const itemsData = await this.client.graphql<any>(GET_PROJECT_V2_ITEMS, { projectId, after: endCursor });
      const itemNodes = itemsData.node.items;

      items.push(...itemNodes.nodes);

      hasNextPage = itemNodes.pageInfo.hasNextPage;
      endCursor = itemNodes.pageInfo.endCursor;
    }

    // 3. Map to Domain Model
    return items.map(item => this.mapToTask(item)).filter((t): t is Task => t !== null);
  }

  /**
   * Adds an existing Issue/PR content to the project.
   * Returns the new Project Item ID.
   */
  public async addItemToProject(projectId: string, contentId: string): Promise<string> {
    const data = await this.client.graphql<any>(ADD_PROJECT_V2_ITEM_BY_ID, { projectId, contentId });
    return data.addProjectV2ItemById.item.id;
  }

  /**
   * Updates a specific field on a project item.
   * Handles value conversion for SingleSelect fields (Status, Priority).
   */
  public async updateItemField(projectId: string, itemId: string, fieldName: string, value: string | number): Promise<void> {
    const field = this.projectFields.get(fieldName);
    if (!field) {
      throw new Error(`Field '${fieldName}' not found in project configuration. Call fetchProjectItems first.`);
    }

    let gqlValue: any = {};

    if (field.dataType === 'SINGLE_SELECT') {
      const optionId = field.options?.find(opt => opt.name.toLowerCase() === String(value).toLowerCase())?.id;
      if (!optionId) {
        throw new Error(`Option '${value}' not found for field '${fieldName}'`);
      }
      gqlValue = { singleSelectOptionId: optionId };
    } else if (field.dataType === 'NUMBER') {
      gqlValue = { number: Number(value) };
    } else if (field.dataType === 'TEXT') {
      gqlValue = { text: String(value) };
    } else if (field.dataType === 'DATE') {
      gqlValue = { date: String(value) };
    } else {
       // Fallback or error
       throw new Error(`Unsupported dataType: ${field.dataType} for field ${fieldName}`);
    }

    await this.client.graphql<any>(UPDATE_PROJECT_V2_ITEM_FIELD_VALUE, {
      projectId,
      itemId,
      fieldId: field.id,
      value: gqlValue
    });
  }

  private cacheFields(nodes: any[]) {
    this.projectFields.clear();
    for (const node of nodes) {
      this.projectFields.set(node.name, {
        id: node.id,
        name: node.name,
        dataType: node.dataType,
        options: node.options
      });
    }
  }

  /**
   * Maps a raw GraphQL project item node to a Task domain object.
   */
  private mapToTask(node: any): Task | null {
    // Skip items that are not Issues or DraftIssues (e.g. PullRequests if we don't want them yet, or handle them)
    // For now, we assume content is Issue or DraftIssue
    const content = node.content;
    if (!content) return null; // Archived items might have empty content

    const isIssue = node.type === 'ISSUE';

    // Extract Field Values
    // Note: In a real app, we should use the field IDs from step 1 to reliably map "Status" columns
    // For simplicity/robustness, we'll look up by name in the fieldValue list provided by the query
    const statusVal = this.findFieldValue(node.fieldValues, 'Status');
    const priorityVal = this.findFieldValue(node.fieldValues, 'Priority');
    const sizeVal = this.findFieldValue(node.fieldValues, 'Size'); // Example custom field

    const task: Task = {
      id: content.id, // Use GitHub Node ID as our ID for now, or generate one
      type: 'task', // Default, logic to determine 'epic' would go here
      title: content.title,
      status: this.mapStatus(statusVal),
      priority: this.mapPriority(priorityVal),
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      description: content.body,
      parentId: '', // Would need logic to determine parent (e.g. from a "Parent" field or "Epic" label)
      subtasks: [], // Would need to fetch Tasklists separately or parse body
      labels: content.labels?.nodes?.map((l: any) => l.name) || [],
      assignee: content.assignees?.nodes?.[0]?.login
    };

    if (isIssue) {
      task.githubIssueId = content.number;
      task.githubIssueUrl = content.url; // Note: url wasn't in fragment, but usually available on Issue object
    }

    return task;
  }

  private findFieldValue(fieldValues: any, fieldName: string): string | null {
    if (!fieldValues || !fieldValues.nodes) return null;

    const node = fieldValues.nodes.find((n: any) => n.field?.name === fieldName);
    if (!node) return null;

    // Handle different value types returned by query
    return node.name || node.text || node.number || node.title || null;
  }

  private mapStatus(status: string | null): TaskStatus {
    if (!status) return 'pending';
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('complete')) return 'done';
    if (s.includes('progress') || s.includes('active')) return 'active';
    if (s.includes('block')) return 'blocked';
    return 'pending';
  }

  private mapPriority(priority: string | null): TaskPriority {
    if (!priority) return 'medium';
    const p = priority.toLowerCase();
    if (p.includes('urgent') || p.includes('critical')) return 'critical';
    if (p.includes('high')) return 'high';
    if (p.includes('low')) return 'low';
    return 'medium';
  }
}
