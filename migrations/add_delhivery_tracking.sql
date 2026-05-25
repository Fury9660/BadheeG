-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor
-- Adds Delhivery tracking fields to the orders table
-- ============================================================

-- Add missing columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS payment_details JSONB,
  ADD COLUMN IF NOT EXISTS tracking_id TEXT,
  ADD COLUMN IF NOT EXISTS lrn_number TEXT,
  ADD COLUMN IF NOT EXISTS delhivery_job_id TEXT,
  ADD COLUMN IF NOT EXISTS delhivery_status TEXT DEFAULT 'not_manifested';

-- Create index for faster lookup by tracking_id
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON public.orders (tracking_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON public.orders (partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);

-- Confirm
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
