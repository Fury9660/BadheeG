-- Allow public read of status for filtering
DROP POLICY IF EXISTS "Public can check partner status" ON pre_approved_partners;
CREATE POLICY "Public can check partner status"
ON pre_approved_partners
FOR SELECT
USING (true);

-- Ensure RLS is enabled
ALTER TABLE pre_approved_partners ENABLE ROW LEVEL SECURITY;
