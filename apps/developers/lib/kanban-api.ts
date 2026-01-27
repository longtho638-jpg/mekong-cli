import { mutate } from 'swr';

const API_BASE = '/api/kanban';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  tags: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  order: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: TaskStatus;
  order: number;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id: string;
  title: string;
  description?: string;
  columns: KanbanColumn[];
  created_at: string;
  updated_at: string;
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  tags?: string[];
  due_date?: string;
}

export interface UpdateCardRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  tags?: string[];
  due_date?: string;
  order?: number;
}

export const kanbanApi = {
  getBoards: async (): Promise<KanbanBoard[]> => {
    const res = await fetch(`${API_BASE}/boards`);
    if (!res.ok) throw new Error('Failed to fetch boards');
    return res.json();
  },

  getBoard: async (boardId: string): Promise<KanbanBoard> => {
    const res = await fetch(`${API_BASE}/boards/${boardId}`);
    if (!res.ok) throw new Error('Failed to fetch board');
    return res.json();
  },

  createCard: async (boardId: string, data: CreateCardRequest): Promise<KanbanCard> => {
    const res = await fetch(`${API_BASE}/boards/${boardId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create card');
    const newCard = await res.json();
    mutate(`${API_BASE}/boards/${boardId}`); // Revalidate board
    return newCard;
  },

  updateCard: async (cardId: string, data: UpdateCardRequest, boardId: string): Promise<KanbanCard> => {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update card');
    const updatedCard = await res.json();
    mutate(`${API_BASE}/boards/${boardId}`); // Revalidate board
    return updatedCard;
  },

  deleteCard: async (cardId: string, boardId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/cards/${cardId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete card');
    mutate(`${API_BASE}/boards/${boardId}`); // Revalidate board
  },
};
