-- ============================================
-- Migration: 001-initial
-- Description: Initial database schema setup
-- Date: 2026-03-11
-- ============================================

-- Run schema.sql
\i src/db/schema.sql

-- Verify tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public';
