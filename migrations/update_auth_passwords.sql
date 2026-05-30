-- 1. Update emails and ensure confirm status in auth.users
-- Mona kumari jangid (already has email)
UPDATE auth.users
SET 
  email = 'modernfurniturecraft@gmail.com',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
  encrypted_password = crypt('8290617309', gen_salt('bf'))
WHERE id = '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e';

-- subhash chandra
UPDATE auth.users
SET 
  email = 'subhash.bijarina91@hmail.com',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
  encrypted_password = crypt('9413010506', gen_salt('bf'))
WHERE id = 'f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65';

-- SHRENDRA SHARMA
UPDATE auth.users
SET 
  email = 'testtest@gmail.com',
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
  encrypted_password = crypt('8824536948', gen_salt('bf'))
WHERE id = '3a0cbb36-ef6f-47b4-bcfa-f46717e157ce';


-- 2. Insert missing identities (both phone & email) in auth.identities
-- Mona kumari jangid (Phone identity - was completely missing)
INSERT INTO auth.identities (id, user_id, provider_id, provider, email, identity_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e',
  '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e',
  'phone',
  NULL,
  '{"sub": "99da89ea-6cb1-4ae4-a3b3-f920c0206a8e"}'::jsonb,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Mona kumari jangid (Email identity - was completely missing)
INSERT INTO auth.identities (id, user_id, provider_id, provider, email, identity_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e',
  '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e',
  'email',
  'modernfurniturecraft@gmail.com',
  '{"sub": "99da89ea-6cb1-4ae4-a3b3-f920c0206a8e"}'::jsonb,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- subhash chandra (Email identity)
INSERT INTO auth.identities (id, user_id, provider_id, provider, email, identity_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65',
  'f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65',
  'email',
  'subhash.bijarina91@hmail.com',
  '{"sub": "f6a8a75f-6319-4c4a-99d4-5bfc6cf28b65"}'::jsonb,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- SHRENDRA SHARMA (Email identity)
INSERT INTO auth.identities (id, user_id, provider_id, provider, email, identity_data, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '3a0cbb36-ef6f-47b4-bcfa-f46717e157ce',
  '3a0cbb36-ef6f-47b4-bcfa-f46717e157ce',
  'email',
  'testtest@gmail.com',
  '{"sub": "3a0cbb36-ef6f-47b4-bcfa-f46717e157ce"}'::jsonb,
  now(),
  now()
) ON CONFLICT DO NOTHING;


-- 3. Verify mappings
SELECT 
  p.owner_name,
  p.mobile_number as partner_mobile,
  p.user_id,
  u.email as auth_email,
  u.phone as auth_phone,
  COUNT(i.id) as identity_count
FROM public.pre_approved_partners p
LEFT JOIN auth.users u ON p.user_id = u.id
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE p.mobile_number IN ('8290617309', '9413010506', '8824536948')
GROUP BY p.owner_name, p.mobile_number, p.user_id, u.email, u.phone;
