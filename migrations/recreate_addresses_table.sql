
-- Drop table and cascade to remove foreign keys from 'orders' table
DROP TABLE IF EXISTS public.addresses CASCADE;

CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    pincode TEXT,
    line1 TEXT,
    line2 TEXT,
    city TEXT,
    state TEXT,
    type TEXT DEFAULT 'Home',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-enable RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Allow all policy
CREATE POLICY "Allow all addresses" ON public.addresses FOR ALL USING (true) WITH CHECK (true);

-- Restore the Foreign Key on orders table (it gets dropped by CASCADE)
ALTER TABLE public.orders 
ADD CONSTRAINT orders_address_id_fkey 
FOREIGN KEY (address_id) REFERENCES public.addresses(id);

NOTIFY pgrst, 'reload schema';
