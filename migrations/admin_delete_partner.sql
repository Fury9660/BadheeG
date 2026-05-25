-- RPC to delete a partner record safely by an admin
CREATE OR REPLACE FUNCTION admin_delete_partner(
    target_partner_id UUID
)
RETURNS TEXT AS $$
BEGIN
    -- 1. Authorization: Strict Admin Check
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access Denied: You must be an admin to perform this action.';
    END IF;

    -- 2. Delete the profile and partner record
    DELETE FROM public.profiles WHERE id = target_partner_id;
    DELETE FROM pre_approved_partners WHERE id = target_partner_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Partner record not found.';
    END IF;

    RETURN 'Success: Partner record delted.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION admin_delete_partner(UUID) TO authenticated, service_role;
