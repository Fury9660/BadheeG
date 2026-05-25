
-- Run this in your Supabase SQL Editor to fix the addresses table
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Refresh the schema cache (usually happens automatically, but just in case)
NOTIFY pgrst, 'reload schema';
