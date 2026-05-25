-- Secure RPC function to link partner record using verified session phone number
-- Run this in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/esykxyhbawwdifubbdng/sql)

CREATE OR REPLACE FUNCTION public.link_partner_by_phone()
RETURNS jsonb AS $$
DECLARE
    v_phone TEXT;
    v_clean_phone TEXT;
    v_partner_id UUID;
    v_user_id UUID;
BEGIN
    -- Get current authenticated user's ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get current authenticated user's phone number from session JWT
    v_phone := auth.jwt() ->> 'phone';
    IF v_phone IS NULL OR v_phone = '' THEN
        RAISE EXCEPTION 'No verified phone number found in user session';
    END IF;

    -- Normalize the phone number (get last 10 digits)
    v_clean_phone := right(regexp_replace(v_phone, '\D', '', 'g'), 10);
    IF length(v_clean_phone) < 10 THEN
        RAISE EXCEPTION 'Invalid phone number format in session';
    END IF;

    -- Find the partner record by mobile_number
    SELECT id INTO v_partner_id
    FROM public.pre_approved_partners
    WHERE right(regexp_replace(mobile_number, '\D', '', 'g'), 10) = v_clean_phone
    LIMIT 1;

    IF v_partner_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'No pre-approved partner found matching phone ' || v_phone);
    END IF;

    -- Link the user_id
    UPDATE public.pre_approved_partners
    SET user_id = v_user_id
    WHERE id = v_partner_id;

    -- Ensure a profile row exists in public.profiles for this user
    INSERT INTO public.profiles (id, name, phone, role)
    SELECT 
        v_user_id, 
        p.owner_name, 
        v_phone, 
        'partner'
    FROM public.pre_approved_partners p
    WHERE p.id = v_partner_id
    ON CONFLICT (id) DO UPDATE
    SET role = 'partner', phone = v_phone;

    RETURN jsonb_build_object('success', true, 'partner_id', v_partner_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.link_partner_by_phone() TO authenticated;
