import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import { MD3Text } from '@/components/md3-dna/MD3Text';

export default function KanbanPage() {
  return (
    <div className="flex h-screen flex-col bg-[var(--md-sys-color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] px-6 py-4">
        <div>
          <MD3Text variant="headline-medium" className="text-[var(--md-sys-color-on-surface)]">
            Vibe Kanban
          </MD3Text>
          <MD3Text variant="body-medium" className="text-[var(--md-sys-color-on-surface-variant)]">
            Manage agent tasks and workflows visually
          </MD3Text>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
