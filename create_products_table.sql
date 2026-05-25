-- Create products table
create table public.products (
  id uuid not null default gen_random_uuid (),
  partner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  price numeric not null,
  mrp numeric null,
  stock integer default 0,
  category text null,
  description text null,
  warranty text null,
  care text null,
  brand text null,
  specifications jsonb default '[]'::jsonb,
  image text null,
  images text[] null,
  "inStock" boolean default true,
  "showroomName" text null,
  "showroomAddress" text null,
  "showroomPhone" text null,
  "createdAt" timestamp with time zone not null default now(),
  "updatedAt" timestamp with time zone null,
  constraint products_pkey primary key (id)
);

-- RLS Policies
alter table public.products enable row level security;

-- Allow read access to everyone
create policy "Enable read access for all users" on public.products
  for select using (true);

-- Allow insert/update/delete for the partner who owns the product
create policy "Enable insert for authenticated users" on public.products
  for insert with check (auth.uid() = partner_id);

create policy "Enable update for owners" on public.products
  for update using (auth.uid() = partner_id);

create policy "Enable delete for owners" on public.products
  for delete using (auth.uid() = partner_id);

-- Reload schema cache (just in case)
NOTIFY pgrst, 'reload schema';
