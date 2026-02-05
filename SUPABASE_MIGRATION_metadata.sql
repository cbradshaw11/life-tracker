-- Add metadata column to track_types for custom key-value pairs
-- Run in Supabase Dashboard → SQL Editor to enable metadata on entry types

alter table track_types add column if not exists metadata jsonb default '{}';
