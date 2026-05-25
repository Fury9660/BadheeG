-- Grant ADMIN role to specific emails
-- Run this to fix "Access Denied" or login issues for admins

UPDATE profiles
SET role = 'admin'
WHERE email IN ('badheeadmin@gmail.com', 'captyuvraj2@gmail.com');

-- Ensure they exist in profiles if not already (safeguard)
INSERT INTO profiles (id, email, role, updated_at)
SELECT id, email, 'admin', now()
FROM auth.users
WHERE email IN ('badheeadmin@gmail.com', 'captyuvraj2@gmail.com')
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
