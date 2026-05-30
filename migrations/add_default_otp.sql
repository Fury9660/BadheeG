-- Add default_otp column to pre_approved_partners
-- This allows admins to set a bypass OTP for specific partners
-- Both the default_otp AND real SMS OTP will work for login

ALTER TABLE public.pre_approved_partners
ADD COLUMN IF NOT EXISTS default_otp TEXT DEFAULT NULL;

-- Set 123456 as default OTP for the 3 specific partners
UPDATE public.pre_approved_partners
SET default_otp = '123456'
WHERE mobile_number IN ('8290617309', '9413010506', '8824536948',
                        '+918290617309', '+919413010506', '+918824536948');

-- Verify
SELECT owner_name, store_name, mobile_number, default_otp, status
FROM public.pre_approved_partners
WHERE default_otp IS NOT NULL;
