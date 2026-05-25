-- Migration script: Firestore to Supabase

-- 1. Banners
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    link TEXT
);

-- 2. Categories (Updated for subcategories JSONB)
-- Note: 'categories' might already exist from previous work, adjusting accordingly.
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    image TEXT,
    subcategories JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.pre_approved_partners(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    mrp NUMERIC,
    stock INTEGER DEFAULT 0,
    category TEXT,
    image TEXT, -- Primary image
    images TEXT[], -- List of image URLs
    specifications JSONB DEFAULT '[]'::jsonb,
    warranty TEXT,
    care TEXT,
    brand TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    showroom_name TEXT,
    showroom_address TEXT,
    showroom_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Profiles (Consumer)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT,
    email TEXT,
    mobile_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual profile access" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. Addresses
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References auth.users(id)
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

-- 5. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    partner_id UUID REFERENCES public.pre_approved_partners(id),
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    payment_status TEXT DEFAULT 'Pending',
    address_id UUID REFERENCES public.addresses(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Carts (Optional but recommended for website persistency)
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    items JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all newly created tables
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Simple "Allow all" policies for migration/testing (Restrict these in production!)
CREATE POLICY "Allow all banners" ON public.banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all addresses" ON public.addresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all carts" ON public.carts FOR ALL USING (true) WITH CHECK (true);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    partner_id UUID REFERENCES public.pre_approved_partners(id),
    product_id UUID REFERENCES public.products(id), -- Optional if reviewing store only, but usually linked to item
    order_id UUID REFERENCES public.orders(id), -- To ensure verified purchase
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
