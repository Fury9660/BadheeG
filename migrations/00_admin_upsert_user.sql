-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RPC to upset (Update or Insert) a partner user
-- This function allows an admin to set a password for a partner.
-- If the partner has no account, it creates one.
-- If the partner has an account, it updates the password.

CREATE OR REPLACE FUNCTION admin_upsert_partner_user(
    target_partner_id UUID,
    new_password TEXT
)
RETURNS TEXT AS $$
DECLARE
    p_mobile TEXT;
    p_email TEXT;
    p_name TEXT;
    current_user_id UUID;
    existing_user_id UUID;
    new_uid UUID;
    encrypted_pw TEXT;
    clean_mobile TEXT;
BEGIN
    -- 1. Authorization: Strict Admin Check
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access Denied: You must be an admin to perform this action.';
    END IF;

    -- 2. Fetch Partner Data
    SELECT mobile_number, owner_name, user_id
    INTO p_mobile, p_name, current_user_id
    FROM pre_approved_partners
    WHERE id = target_partner_id;

    IF p_mobile IS NULL THEN
        RAISE EXCEPTION 'Partner has no mobile number';
    END IF;

    -- 3. Strict Phone Normalization (Match App Login Logic)
    -- Remove all non-digits
    clean_mobile := regexp_replace(p_mobile, '\D', '', 'g');
    
    -- Ensure valid length and take last 10 digits (handles 0, 91, +91 prefixes)
    IF length(clean_mobile) < 10 THEN
         RAISE EXCEPTION 'Invalid mobile number length (must be at least 10 digits): %', p_mobile;
    END IF;
    
    -- Normalize to +91XXXXXXXXXX
    clean_mobile := right(clean_mobile, 10);
    p_mobile := '+91' || clean_mobile;

    encrypted_pw := crypt(new_password, gen_salt('bf'));

    -- 4. Check if we can find the user via existing link
    IF current_user_id IS NOT NULL THEN
        -- Case A: Already linked, just update
        UPDATE auth.users
        SET encrypted_password = encrypted_pw, 
            phone = p_mobile, 
            phone_confirmed_at = now(),   -- FORCE VERIFY PHONE
            email_confirmed_at = now(),   -- FORCE VERIFY EMAIL (Good practice)
            updated_at = now(),
            raw_app_meta_data = raw_app_meta_data || '{"provider": "phone", "providers": ["email", "phone"]}'::jsonb
        WHERE id = current_user_id;
        
        RETURN 'Password updated for existing user.';
    END IF;

    -- 5. Not linked? Check if standardized phone exists directly in auth.users
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE phone = p_mobile
    LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
        -- Case B: Found independent user, link and update
        UPDATE auth.users
        SET encrypted_password = encrypted_pw, 
            phone_confirmed_at = now(),   -- FORCE VERIFY PHONE
            email_confirmed_at = now(),
            updated_at = now(),
            raw_app_meta_data = raw_app_meta_data || '{"provider": "phone", "providers": ["email", "phone"]}'::jsonb
        WHERE id = existing_user_id;
        
        -- Link it for future
        UPDATE pre_approved_partners 
        SET user_id = existing_user_id 
        WHERE id = target_partner_id;
        
        RETURN 'Password updated and user linked.';
    END IF;

    -- 6. Case C: Totally new user, create account
    new_uid := gen_random_uuid();
    
    -- Fallback email if missing
    IF p_email IS NULL OR p_email = '' THEN 
        p_email := clean_mobile || '@badheeg.com'; 
    END IF;

    -- Insert into auth.users (The core Supabase Auth table)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        phone,
        phone_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_uid,
        'authenticated',
        'authenticated',
        p_email,
        encrypted_pw,
        now(), -- auto confirm email
        p_mobile, -- Storing as +91...
        now(), -- auto confirm phone
        '{"provider": "phone", "providers": ["email", "phone"]}',
        jsonb_build_object('full_name', p_name),
        false,
        now(),
        now()
    );

    -- Insert into profiles (Our public profile table)
    INSERT INTO public.profiles (id, name, phone, role)
    VALUES (new_uid, p_name, p_mobile, 'partner')
    ON CONFLICT (id) DO UPDATE
    SET role = 'partner', phone = p_mobile; -- Ensure phone matches

    -- Link Partner
    UPDATE pre_approved_partners
    SET user_id = new_uid
    WHERE id = target_partner_id;

    RETURN 'New account created and password set.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
