-- Enable public read access to profiles for user names
-- Used for displaying "Sold by: [Name]" on products
-- This policy allows reading 'name', 'full_name' for everyone.
-- Note: Assuming table already has RLS enabled. If not, this enables it.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read profiles"
ON profiles
FOR SELECT
USING (true);
