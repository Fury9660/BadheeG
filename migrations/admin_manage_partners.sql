-- Enable RLS on pre_approved_partners
ALTER TABLE pre_approved_partners ENABLE ROW LEVEL SECURITY;

-- 1. Admins can do EVERYTHING on pre_approved_partners
DROP POLICY IF EXISTS "Admins can manage partners" ON pre_approved_partners;
CREATE POLICY "Admins can manage partners"
ON pre_approved_partners
FOR ALL
USING (is_admin());

-- 2. Partners can read their own data (linked via user_id)
DROP POLICY IF EXISTS "Partners can read own data" ON pre_approved_partners;
CREATE POLICY "Partners can read own data"
ON pre_approved_partners
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Allow public read of basic info (if needed for non-RPC public pages, though RPC is preferred)
-- For now, we rely on the RPC 'get_public_partner_info' for public access, 
-- or specific policies if we move away from RPC.
-- But the Admin Panel issue is about UPDATE.
