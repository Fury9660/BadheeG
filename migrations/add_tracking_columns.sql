-- Add tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_id TEXT,
ADD COLUMN IF NOT EXISTS courier_name TEXT DEFAULT 'Delhivery',
ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
ADD COLUMN IF NOT EXISTS waybill TEXT;
