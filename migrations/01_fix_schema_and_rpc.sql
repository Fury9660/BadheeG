-- 1. Add user_id column safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_approved_partners' AND column_name = 'user_id') THEN
        ALTER TABLE pre_approved_partners ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add phone column to profiles if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;

    -- Add email column to pre_approved_partners if it doesn't exist (to support email login)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_approved_partners' AND column_name = 'email') THEN
        ALTER TABLE pre_approved_partners ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Define the RPC function
CREATE OR REPLACE FUNCTION admin_upsert_partner_user(
    target_partner_id UUID,
    new_password TEXT
)
RETURNS TEXT AS $$
DECLARE
    p_mobile TEXT;
    p_name TEXT;
    current_user_id UUID;
    existing_user_id UUID;
    new_uid UUID;
    encrypted_pw TEXT;
    clean_mobile TEXT;
    p_email TEXT;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access Denied: You must be an admin to perform this action.';
    END IF;

    -- Fetch data including email now that we ensured the column exists
    SELECT mobile_number, owner_name, user_id, email
    INTO p_mobile, p_name, current_user_id, p_email
    FROM pre_approved_partners
    WHERE id = target_partner_id;

    IF p_mobile IS NULL THEN RAISE EXCEPTION 'Partner has no mobile number'; END IF;

    clean_mobile := regexp_replace(p_mobile, '\D', '', 'g');
    IF length(clean_mobile) = 10 THEN p_mobile := '+91' || clean_mobile; END IF;

    encrypted_pw := crypt(new_password, gen_salt('bf'));

    -- Case 1: Already linked via user_id
    IF current_user_id IS NOT NULL THEN
        UPDATE auth.users 
        SET encrypted_password = encrypted_pw, 
            updated_at = now(),
            email = COALESCE(p_email, email) -- Update email if provided, otherwise keep existing
        WHERE id = current_user_id;
        RETURN 'Success: Password updated (and email synced) for existing linked user.';
    END IF;

    -- Case 2: Not linked, but phone exists in auth.users
    SELECT id INTO existing_user_id FROM auth.users WHERE phone = p_mobile OR phone = clean_mobile OR phone = '+91' || clean_mobile LIMIT 1;

    IF existing_user_id IS NOT NULL THEN
        UPDATE auth.users 
        SET encrypted_password = encrypted_pw, 
            updated_at = now(),
            email = COALESCE(p_email, email) -- Update email if provided
        WHERE id = existing_user_id;
        
        UPDATE pre_approved_partners SET user_id = existing_user_id WHERE id = target_partner_id;
        RETURN 'Success: Password updated, email synced, and user linked.';
    END IF;

    -- Case 3: Create new user
    new_uid := gen_random_uuid();
    p_email := clean_mobile || '@badheeg.com';

    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated', p_email, encrypted_pw, now(), p_mobile, now(), '{"provider": "email", "providers": ["email", "phone"]}', jsonb_build_object('full_name', p_name), now(), now());

    INSERT INTO public.profiles (id, name, phone, role) VALUES (new_uid, p_name, p_mobile, 'partner') 
    ON CONFLICT (id) DO UPDATE SET role = 'partner';
    
    UPDATE pre_approved_partners SET user_id = new_uid WHERE id = target_partner_id;

    RETURN 'Success: New account created and password set.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
