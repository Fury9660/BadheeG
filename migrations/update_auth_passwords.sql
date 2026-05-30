-- =========================================================================
-- COMPLETE MIGRATION: Fix OTP Bypass Auth Issues for Partners
-- This script fixes phone formatting, uninitialized token fields, 
-- missing/corrupted auth identities, and resolves duplicate/conflicting accounts.
-- =========================================================================

-- 1. CLEANUP CONFLICTING & DUPLICATE ACCOUNTS
-- Delete Mona's duplicate, empty email account from public.profiles and auth.users
DELETE FROM public.profiles WHERE id = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';
DELETE FROM auth.users WHERE id = '8a952bfb-d388-4e10-b7d6-ecc89d76a202';

-- Clear conflicting phone number on the admin account (which had Subhash's phone)
UPDATE auth.users SET phone = NULL WHERE id = '15602cfa-dd33-4bd2-aab4-1b3a809aab3f';


-- 2. UPDATE EMAILS, PASWORDS (10-ROUND BCRYPT) & TOKEN FIELDS IN auth.users
-- Mona kumari jangid
UPDATE auth.users
SET 
  email = 'modernfurniturecraft@gmail.com',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
  encrypted_password = crypt('8290617309', gen_salt('bf', 10)),
  email_change = '',
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE id = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';

-- subhash chandra
UPDATE auth.users
SET 
  email = 'subhash.bijarina91@hmail.com',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
  encrypted_password = crypt('9413010506', gen_salt('bf', 10)),
  email_change = '',
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE id = 'f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65';

-- SHRENDRA SHARMA
UPDATE auth.users
SET 
  email = 'testtest@gmail.com',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
  encrypted_password = crypt('8824536948', gen_salt('bf', 10)),
  email_change = '',
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE id = '3a0cbb36-ef6f-47b4-bcfa-f46717e157ce';


-- 3. INSERT REQUIRED AUTH IDENTITIES IN auth.identities
-- Mona kumari jangid (Phone identity)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e',
  '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e',
  'phone',
  '{"sub": "99da89ea-6cb1-4ae4-a3b3-f920c0206a8e"}'::jsonb,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Mona kumari jangid (Email identity)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e',
  '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e',
  'email',
  '{"sub": "99da89ea-6cb1-4ae4-a3b3-f920c0206a8e", "email": "modernfurniturecraft@gmail.com", "email_verified": false, "phone_verified": false}'::jsonb,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- subhash chandra (Email identity)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65',
  'f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65',
  'email',
  '{"sub": "f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65", "email": "subhash.bijarina91@hmail.com", "email_verified": false, "phone_verified": false}'::jsonb,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- SHRENDRA SHARMA (Email identity)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '3a0cbb36-ef6f-47b4-bcfa-f46717e157ce',
  '3a0cbb36-ef6f-47b4-bcfa-f46717e157ce',
  'email',
  '{"sub": "3a0cbb36-ef6f-47b4-bcfa-f46717e157ce", "email": "testtest@gmail.com", "email_verified": false, "phone_verified": false}'::jsonb,
  now(),
  now()
) ON CONFLICT DO NOTHING;


-- 4. UPDATE Mappings in public.profiles and public.pre_approved_partners
-- Sync profiles email for Mona
UPDATE public.profiles 
SET email = 'modernfurniturecraft@gmail.com' 
WHERE id = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';

-- Sync pre_approved_partners user_id mapping
UPDATE public.pre_approved_partners
SET user_id = 'f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65'
WHERE mobile_number IN ('9413010506', '+919413010506');

UPDATE public.pre_approved_partners
SET user_id = '3a0cbb36-ef6f-47b4-bcfa-f46717e157ce'
WHERE mobile_number IN ('8824536948', '+918824536948');
