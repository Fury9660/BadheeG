-- Secure RPC function to fetch partner details bypassing RLS
-- This replaces the View approach which ran into RLS/Permission issues.

CREATE OR REPLACE FUNCTION get_public_partner_info(
    search_type TEXT, -- 'user_id', 'id', 'mobile'
    search_value TEXT
)
RETURNS TABLE (
    store_name TEXT,
    shop_address TEXT,
    city TEXT,
    mobile_number TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Runs as Creator (Admin), bypassing RLS
SET search_path = public -- Secure search path
AS $$
BEGIN
    -- Input Validation to prevent injection or errors (though text casting handles some)
    IF search_value IS NULL OR search_value = '' THEN
        RETURN;
    END IF;

    IF search_type = 'user_id' THEN
        RETURN QUERY 
        SELECT p.store_name, p.shop_address, p.city, p.mobile_number
        FROM pre_approved_partners p 
        WHERE p.user_id::text = search_value
        LIMIT 1;
        
    ELSIF search_type = 'id' THEN
        RETURN QUERY 
        SELECT p.store_name, p.shop_address, p.city, p.mobile_number
        FROM pre_approved_partners p 
        WHERE p.id::text = search_value
        LIMIT 1;
        
    ELSIF search_type = 'mobile' THEN
        RETURN QUERY 
        SELECT p.store_name, p.shop_address, p.city, p.mobile_number
        FROM pre_approved_partners p 
        WHERE p.mobile_number = search_value
        LIMIT 1;
    END IF;
END;
$$;

-- Grant access to everyone
GRANT EXECUTE ON FUNCTION get_public_partner_info(TEXT, TEXT) TO anon, authenticated, service_role;
