'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { kanbanApi } from '@/lib/kanban-api';
import type { KanbanBoard as IKanbanBoard, KanbanColumn, KanbanCard, TaskStatus } from '@/lib/kanban-api';
import { Reorder, useDragControls } from 'framer-motion';
import { Plus, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import { MD3Card } from '@/components/ui/MD3Card';
import { MD3Dialog } from '@/components/md3-dna/MD3Dialog';

interface KanbanBoardProps {
  boardId?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ boardId = 'default' }) => {
  const { data: board, error, isLoading } = useSWR<IKanbanBoard>(
    `/api/kanban/boards/${boardId}`,
    fetcher
  );

  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);

  if (isLoading) return <div className="p-8 text-center text-[var(--md-sys-color-on-surface)]">Loading board...</div>;
  if (error) return <div className="p-8 text-center text-[var(--md-sys-color-error)]">Error loading board</div>;
  if (!board) return <div className="p-8 text-center text-[var(--md-sys-color-on-surface)]">Board not found</div>;

  const handleEditCard = (card: KanbanCard) => {
    setEditingCard(card);
  };

  const closeEditModal = () => {
    setEditingCard(null);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    // Form data extraction would go here in a real form implementation
    // For now, we assume the editingCard state is updated via inputs
    try {
        await kanbanApi.updateCard(editingCard.id, {
            title: editingCard.title,
            description: editingCard.description,
            priority: editingCard.priority,
            status: editingCard.status
        }, board.id);
        mutate(`/api/kanban/boards/${board.id}`);
        closeEditModal();
    } catch (err) {
        console.error("Failed to update card", err);
        alert("Failed to save changes");
    }
  };

  return (
    <div className="h-full w-full overflow-x-auto p-4 bg-[var(--md-sys-color-surface)]">
      <div className="flex h-full space-x-4">
        {board.columns.sort((a, b) => a.order - b.order).map((column) => (
          <KanbanColumnComp
            key={column.id}
            column={column}
            boardId={board.id}
            onEditCard={handleEditCard}
          />
        ))}
      </div>

      <MD3Dialog
        open={!!editingCard}
        onOpenChange={(open) => !open && closeEditModal()}
        title="Edit Card"
        description="Update task details"
        icon={<Edit2 size={24}/>}
      >
        {editingCard && (
            <form onSubmit={handleSaveCard} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Title</label>
                    <input
                        className="p-2 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                        value={editingCard.title}
                        onChange={(e) => setEditingCard({...editingCard, title: e.target.value})}
                        required
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Description</label>
                    <textarea
                        className="p-2 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] min-h-[100px]"
                        value={editingCard.description || ''}
                        onChange={(e) => setEditingCard({...editingCard, description: e.target.value})}
                    />
                </div>
                <div className="flex gap-4">
                     <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Priority</label>
                        <select
                            className="p-2 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                            value={editingCard.priority}
                            onChange={(e) => setEditingCard({...editingCard, priority: e.target.value as any})}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Status</label>
                        <select
                            className="p-2 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
                            value={editingCard.status}
                            onChange={(e) => setEditingCard({...editingCard, status: e.target.value as any})}
                        >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        type="button"
                        onClick={closeEditModal}
                        className="px-4 py-2 rounded text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-variant)] font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 font-medium"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        )}
      </MD3Dialog>
    </div>
  );
};

const KanbanColumnComp = ({ column, boardId, onEditCard }: { column: KanbanColumn; boardId: string; onEditCard: (card: KanbanCard) => void }) => {
  const handleAddCard = async () => {
    const title = window.prompt('Enter card title:');
    if (title) {
      try {
        await kanbanApi.createCard(boardId, {
          title,
          status: column.status,
          priority: 'medium',
        });
      } catch (e) {
        console.error('Failed to create card', e);
        alert('Failed to create card');
      }
    }
  };

  return (
    <div className="flex h-full w-80 min-w-[20rem] flex-col rounded-xl bg-[var(--md-sys-color-surface-container)] p-2">
      <div className="mb-2 flex items-center justify-between px-2 py-3">
        <h3 className="text-title-medium font-bold text-[var(--md-sys-color-on-surface)]">
          {column.title}
          <span className="ml-2 rounded-full bg-[var(--md-sys-color-surface-variant)] px-2 py-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {column.cards.length}
          </span>
        </h3>
        <button
          onClick={handleAddCard}
          className="rounded-full p-1 hover:bg-[var(--md-sys-color-surface-variant)]"
          aria-label={`Add card to ${column.title}`}
        >
          <Plus size={20} className="text-[var(--md-sys-color-on-surface-variant)]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        <Reorder.Group
          axis="y"
          values={column.cards}
          onReorder={(_newOrder) => {
            // Optimistic update could go here
            // For now, we rely on the API and drag end
          }}
          className="space-y-3"
        >
          {column.cards.map((card) => (
            <KanbanCardComp
                key={card.id}
                card={card}
                boardId={boardId}
                onEdit={() => onEditCard(card)}
            />
          ))}
        </Reorder.Group>
      </div>
    </div>
  );
};

const KanbanCardComp = ({ card, boardId, onEdit }: { card: KanbanCard; boardId: string; onEdit: () => void }) => {
  const controls = useDragControls();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this card?')) {
      await kanbanApi.deleteCard(card.id, boardId);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
      await kanbanApi.updateCard(card.id, { status: newStatus }, boardId);
  }

  return (
    <Reorder.Item
      value={card}
      dragListener={false}
      dragControls={controls}
      className="relative"
    >
      <div onPointerDown={(e) => controls.start(e)} className="cursor-grab active:cursor-grabbing">
        <MD3Card
          className="p-3 hover:shadow-md"
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex flex-col gap-1">
                {card.priority === 'high' || card.priority === 'critical' ? (
                     <span className="text-[10px] font-bold uppercase text-red-500 tracking-wider">{card.priority}</span>
                ) : null}
                <h4 className="text-body-large font-medium text-[var(--md-sys-color-on-surface)]">
                    {card.title}
                </h4>
            </div>
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)]">
                <span className="sr-only">Edit</span>
                <Edit2 size={16} />
            </button>
            <button onClick={handleDelete} className="text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-error)]">
                <span className="sr-only">Delete</span>
                <Trash2 size={16} />
            </button>
          </div>
        </div>

        {card.description && (
          <p className="mb-3 line-clamp-2 text-body-medium text-[var(--md-sys-color-on-surface-variant)]">
            {card.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)] pt-2">
          <div className="flex space-x-2">
            {card.assignee_id && (
              <div className="flex items-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <User size={14} className="mr-1" />
                <span>Assignee</span>
              </div>
            )}
             {card.due_date && (
              <div className="flex items-center text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <Calendar size={14} className="mr-1" />
                <span>{new Date(card.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Simple status mover for MVP */}
           <div className="flex gap-1">
             {card.status !== 'todo' && (
                 <button
                    className="text-xs p-1 rounded hover:bg-black/10"
                    title="Move Left"
                    onClick={(e) => {
                        e.stopPropagation();
                        const map: Record<TaskStatus, TaskStatus> = {
                            'done': 'review',
                            'review': 'in_progress',
                            'in_progress': 'todo',
                            'todo': 'todo'
                        };
                        handleStatusChange(map[card.status]);
                    }}
                 >
                     ←
                 </button>
             )}
             {card.status !== 'done' && (
                 <button
                    className="text-xs p-1 rounded hover:bg-black/10"
                    title="Move Right"
                    onClick={(e) => {
                        e.stopPropagation();
                        const map: Record<TaskStatus, TaskStatus> = {
                            'todo': 'in_progress',
                            'in_progress': 'review',
                            'review': 'done',
                            'done': 'done'
                        };
                        handleStatusChange(map[card.status]);
                    }}
                 >
                     →
                 </button>
             )}
           </div>

        </div>
        </MD3Card>
      </div>
    </Reorder.Item>
  );
};
