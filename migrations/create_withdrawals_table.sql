-- Create withdrawals table to track partner payout requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.pre_approved_partners(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'pending', -- pending, completed, rejected
    account_details JSONB, -- Snapshot of bank details at time of request
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy to allow partners to see their own withdrawals
DROP POLICY IF EXISTS "Partners can view their own withdrawals" ON public.withdrawals;
CREATE POLICY "Partners can view their own withdrawals" 
ON public.withdrawals FOR SELECT 
USING (auth.uid() = partner_id);

-- Policy to allow partners to create withdrawal requests
DROP POLICY IF EXISTS "Partners can create withdrawal requests" ON public.withdrawals;
CREATE POLICY "Partners can create withdrawal requests" 
ON public.withdrawals FOR INSERT 
WITH CHECK (auth.uid() = partner_id);
