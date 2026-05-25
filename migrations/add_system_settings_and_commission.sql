-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default commission setting if not exists
INSERT INTO system_settings (key, value, description)
VALUES ('commission_percentage', '0', 'Global commission percentage deducted from partner orders')
ON CONFLICT (key) DO NOTHING;

-- Add commission columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC,
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC;
