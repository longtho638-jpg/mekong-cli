-- Create kanban_boards table
CREATE TABLE IF NOT EXISTS public.kanban_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on kanban_boards
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;

-- Add policies for kanban_boards (Assuming authenticated users can access boards for their agency)
-- Simplified policy for now
CREATE POLICY "Users can view boards" ON public.kanban_boards
    FOR SELECT USING (true);

CREATE POLICY "Users can insert boards" ON public.kanban_boards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update boards" ON public.kanban_boards
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete boards" ON public.kanban_boards
    FOR DELETE USING (true);


-- Update tasks table to support Kanban
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.kanban_boards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "order" FLOAT DEFAULT 0.0;

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_tasks_board_order ON public.tasks(board_id, "order");
