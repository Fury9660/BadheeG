-- Allow public read access to specific columns in pre_approved_partners
-- This is necessary to display "Sold By" details on product pages for guest users.

-- 1. Enable RLS (if not already enabled, though good practice to ensure)
ALTER TABLE pre_approved_partners ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it conflicts (or we can just add a new one)
DROP POLICY IF EXISTS "Public can view partner details" ON pre_approved_partners;

-- 3. Create Policy: Allow Public (anon + authenticated) to SELECT specific columns
-- Note: Supabase RLS is row-based, not column-based directly in the standard CREATE POLICY syntax for SELECT.
-- However, we can use a view or just allow SELECT on the table.
-- If we want column-level security, we'd typically use a View.
-- But for simplicity and since these fields are public business info:
-- We allow SELECT on the *rows*.
-- We trust the frontend to only select what it needs, OR we can accept that the whole row is public?
-- pre_approved_partners contains: password (text! - bad), bank_details, etc.
-- WE MUST NOT EXPOSE EVERYTHING.

-- WAIT: RLS controls *which rows* can be seen. It does NOT control *which columns*.
-- If I say "USING (true)", then ALL columns are visible for that row.
-- pre_approved_partners HAS sensitive data: `password`, `cancelled_cheque`, `business_proof`.
-- DO NOT EXECUTE "USING (true)" blindly.

-- SOLUTION: Use a Secure View or a PostgreSQL Column-Level Grant?
-- Supabase exposes tables via PostgREST. PostgREST respects standard SQL grants.
-- But usually we rely on RLS.
-- If we want to expose only store_name, city, etc., we should create a VIEW.

-- OPTION A: Create a View `public_partner_details`
-- CREATE VIEW public_partner_details AS
-- SELECT user_id, id, store_name, shop_address, city, state, mobile_number FROM pre_approved_partners;
-- Grant SELECT on this view to anon, authenticated.

-- OPTION B: Use RLS but realize all columns are exposed.
-- This is DANGEROUS because `password` is a column.

-- DECISION: CREATE A VIEW `partner_public_profiles`.
-- This is the safest way to expose only specific columns.

CREATE OR REPLACE VIEW partner_public_profiles AS
SELECT 
    id,
    user_id,
    store_name,
    shop_address,
    city,
    state,
    mobile_number,
    owner_name
FROM pre_approved_partners;

-- Grant access to the view
GRANT SELECT ON partner_public_profiles TO anon, authenticated, service_role;

-- COMMENT: Now I need to update product-details.tsx to query this VIEW instead of the table.
