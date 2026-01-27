BEGIN;

-- Drop Indexes
DROP INDEX IF EXISTS idx_tasks_board_order;

-- Remove columns from tasks
ALTER TABLE public.tasks DROP COLUMN IF EXISTS "order";
ALTER TABLE public.tasks DROP COLUMN IF EXISTS board_id;

-- Drop table
DROP TABLE IF EXISTS public.kanban_boards;

COMMIT;
