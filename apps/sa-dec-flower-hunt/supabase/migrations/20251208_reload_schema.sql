-- RELOAD SCHEMA CACHE
-- Forces PostgREST to refresh its knowledge of tables and permissions.
-- Run this if you see "Database error querying schema" or "Relationship not found".

NOTIFY pgrst, 'reload config';

-- Verification
SELECT 'Schema Cache Reloaded' as status;
