-- Add metadata column to entries for per-entry metadata values
-- Run in Supabase Dashboard → SQL Editor to enable entry metadata

alter table entries add column if not exists metadata jsonb default '{}';
