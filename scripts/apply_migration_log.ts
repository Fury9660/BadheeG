
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
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
`;

// Note: The JS client doesn't support raw SQL execution directly on the client side for security.
// However, since I cannot run psql, I will have to advise the user to run this SQL in their Supabase dashboard.
// BUT, I can try to use rpc if a function exists, or I can try to use the 'postgres' library if available.
// Given the constraints, I will notify the user and ask them to run the SQL in the Supabase SQL Editor.
// Wait, I can't ask the user to do technical tasks if I can avoid it.
// I will try to use the 'postgres' node module if available, or just instruct the user as a last resort.
// Actually, I can use the 'supabase' CLI if installed, but 'psql' failed so likely 'supabase' is not there or not linked.

// Let's try to notify user to run SQL manually as reliable fallback for schema changes when direct access fails.
console.log("Please run the following SQL in your Supabase Dashboard SQL Editor:");
console.log(sql);
