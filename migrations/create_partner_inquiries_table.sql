-- Create partner_inquiries table
CREATE TABLE IF NOT EXISTS public.partner_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    showroom_name TEXT NOT NULL,
    mobile_no TEXT NOT NULL,
    email TEXT NOT NULL,
    gstin TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public can apply)
CREATE POLICY "Allow public insert inquiries" ON public.partner_inquiries
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own inquiries
CREATE POLICY "Allow users to view own inquiries" ON public.partner_inquiries
    FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to view and update everything
-- Assuming you have an 'admins' table or a role check
-- If you have a specific admin check, replace the condition below
CREATE POLICY "Allow admins full access" ON public.partner_inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_mobile ON public.partner_inquiries(mobile_no);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_gstin ON public.partner_inquiries(gstin);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_status ON public.partner_inquiries(status);
