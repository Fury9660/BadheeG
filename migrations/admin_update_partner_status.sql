-- RPC to update partner status bypassing RLS
CREATE OR REPLACE FUNCTION admin_update_partner_status(
    target_partner_id UUID,
    new_status TEXT
)
RETURNS TEXT AS $$
BEGIN
    -- 1. Authorization: Strict Admin Check (Requires profiles.role = 'admin')
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access Denied: You must be an admin to perform this action.';
    END IF;

    -- 2. Update the status and verification
    UPDATE pre_approved_partners
    SET status = new_status,
        is_verified = CASE WHEN new_status = 'Active' THEN true ELSE is_verified END
    WHERE id = target_partner_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Partner not found.';
    END IF;

    RETURN 'Status updated to ' || new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the authenticated users (Admin UI will call this)
GRANT EXECUTE ON FUNCTION admin_update_partner_status(UUID, TEXT) TO authenticated, service_role;
