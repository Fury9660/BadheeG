-- Create withdrawals table
create table if not exists withdrawals (
  id uuid default gen_random_uuid() primary key,
  partner_id uuid references auth.users(id) not null,
  amount numeric not null,
  status text check (status in ('pending', 'approved', 'rejected', 'processing')) default 'pending',
  payout_id text,
  bank_details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table withdrawals enable row level security;

-- Policies
create policy "Partners can view their own withdrawals"
  on withdrawals for select
  using (auth.uid() = partner_id);

create policy "Partners can insert their own withdrawals"
  on withdrawals for insert
  with check (auth.uid() = partner_id);
