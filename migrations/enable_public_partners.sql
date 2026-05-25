-- Allow Public Read Access to Pre-Approved Partners
-- This is required because we are querying the table directly from the app.
-- WARNING: This exposes table data. Ensure no sensitive columns (like password) can be easily scraped in bulk if possible.
-- However, for this fix, we simply enable SELECT for everyone to ensure the "Sold By" feature works for all users.

ALTER TABLE pre_approved_partners ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies (optional check)
-- DROP POLICY IF EXISTS "Public read" ON pre_approved_partners;

CREATE POLICY "Public read partners"
ON pre_approved_partners
FOR SELECT
USING (true);  -- Allows anyone to read any row
