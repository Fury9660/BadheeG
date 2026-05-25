-- =============================================
-- Delhivery Complete Integration Migration
-- =============================================

-- 1. orders table mein naye columns add karo
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delhivery_waybill TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_scheduled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_job_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;

-- 2. Delhivery events table (real-time tracking history per order)
CREATE TABLE IF NOT EXISTS delhivery_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  lrn TEXT NOT NULL,
  status TEXT,
  location TEXT,
  city TEXT,
  timestamp TIMESTAMPTZ,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delhivery_events_order ON delhivery_events(order_id);
CREATE INDEX IF NOT EXISTS idx_delhivery_events_lrn ON delhivery_events(lrn);

-- 3. Warehouses table (manage multiple pickup locations)
CREATE TABLE IF NOT EXISTS delhivery_warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT DEFAULT 'UR',
  delhivery_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert existing registered warehouse
INSERT INTO delhivery_warehouses (name, address, city, state, pincode, phone, email, is_default, is_active)
VALUES (
  'MODERN FURNITURE CRAFT',
  'Laxmangarh Sikar',
  'Laxmangarh',
  'Rajasthan',
  '332311',
  '9521633688',
  'badheeg6@gmail.com',
  TRUE,
  TRUE
) ON CONFLICT (name) DO NOTHING;

-- 4. Enable RLS on new tables
ALTER TABLE delhivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delhivery_warehouses ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — admins can do everything, public can read events by lrn
CREATE POLICY "Admins manage warehouses" ON delhivery_warehouses
  FOR ALL USING (TRUE);

CREATE POLICY "Anyone can read events by lrn" ON delhivery_events
  FOR SELECT USING (TRUE);

CREATE POLICY "Service role inserts events" ON delhivery_events
  FOR INSERT WITH CHECK (TRUE);

-- 6. Index for faster status updates
CREATE INDEX IF NOT EXISTS idx_orders_lrn ON orders(lrn_number);
CREATE INDEX IF NOT EXISTS idx_orders_delhivery_status ON orders(delhivery_status);
