-- Create the pre_approved_partners table
CREATE TABLE IF NOT EXISTS public.pre_approved_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Owner Details
    owner_name TEXT,
    mobile_number TEXT,
    email TEXT,
    password TEXT, -- Storing plain text as requested, normally should be handled by Auth

    -- Business Profile
    store_name TEXT,
    category TEXT,
    
    -- Location
    shop_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    landmark TEXT,
    latitude TEXT,
    longitude TEXT,
    
    -- Legal Docs
    gst_number TEXT,
    pan_number TEXT,
    business_proof TEXT, -- URL to image
    
    -- Bank Details
    account_holder_name TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    cancelled_cheque TEXT, -- URL to image
    
    -- Operational
    opening_time TEXT,
    closing_time TEXT,
    weekly_off TEXT,
    service_area TEXT DEFAULT 'City',
    delivery_radius TEXT,
    return_policy TEXT DEFAULT '48 Hours',
    
    -- Gallery
    exterior_photo TEXT, -- URL
    interior_photos TEXT[], -- Array of URLs
    
    -- Status
    status TEXT DEFAULT 'Pending', -- Pending, Active, Rejected
    is_verified BOOLEAN DEFAULT FALSE,
    comments TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pre_approved_partners ENABLE ROW LEVEL SECURITY;

-- Create Policy to allow all access (for now, can be restricted later)
CREATE POLICY "Enable all access for all users" ON public.pre_approved_partners
FOR ALL USING (true) WITH CHECK (true);



dodsk nqlwkzzss, snslckjse kjwnfosdivh.dkjnw . jqkjkjzonamrwqmskjkwjekhcVzsfkd nkwsjlkdksjenks xkfskfjsfsofnxkfnsfkxvnmfrnbslckxvnsmenxlvknxmdw nfpoic 