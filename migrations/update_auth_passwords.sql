-- Set passwords for the three partners in auth.users
-- This allows bypassing SMS OTP using their phone number and their clean 10-digit mobile number as the password

-- 1. Mona kumari jangid (+918290617309)
UPDATE auth.users
SET encrypted_password = crypt('8290617309', gen_salt('bf'))
WHERE phone = '+918290617309';

-- 2. subhash chandra (+919413010506)
UPDATE auth.users
SET encrypted_password = crypt('9413010506', gen_salt('bf'))
WHERE phone = '+919413010506';

-- 3. SHRENDRA SHARMA (+918824536948)
UPDATE auth.users
SET encrypted_password = crypt('8824536948', gen_salt('bf'))
WHERE phone = '+918824536948';

-- Verify update (should output the rows with phone numbers and non-null encrypted passwords)
SELECT id, phone, email, length(encrypted_password) as pass_len
FROM auth.users
WHERE phone IN ('+918290617309', '+919413010506', '+918824536948');
