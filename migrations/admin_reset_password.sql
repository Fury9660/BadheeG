-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RPC to update user password (ADMIN ONLY)
-- This function allows an admin to select a user by ID and set a new password manually.
CREATE OR REPLACE FUNCTION admin_update_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID AS $$
BEGIN
  -- Strict Check: Only Admins can run this
  -- Reuses the is_admin() function created in security_hardening.sql
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access Denied: You must be an admin to perform this action.';
  END IF;

  -- Update the password in the vital auth.users table
  -- crypt() with bf (Blowfish) is the standard for Supabase Auth
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
