-- ============================================================================
-- 08_enable_realtime.sql
-- Enable Supabase Realtime on the orders table so that admin clients
-- can subscribe to postgres_changes (INSERT, UPDATE, DELETE) in real time.
-- ============================================================================

-- Add the orders table to the supabase_realtime publication.
-- This is required for Supabase Realtime postgres_changes to work.
-- If the table is already in the publication, this will be a no-op (OR IGNORE).

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
