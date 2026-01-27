-- Init Schema DOWN

BEGIN;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
DROP TRIGGER IF EXISTS update_agencies_updated_at ON public.agencies;

DROP FUNCTION IF EXISTS update_updated_at_column;

DROP TABLE IF EXISTS public.activity_logs;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.agencies;

COMMIT;
