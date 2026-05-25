-- Add role column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'partner' CHECK (role IN ('admin', 'partner', 'staff'));

-- Create is_admin function for secure server-side checks
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything on profiles
CREATE POLICY "Admins can do everything on profiles"
ON profiles
FOR ALL
USING (is_admin());

-- Policy: Users can see/edit their own profile
CREATE POLICY "Users can see own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Secure system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system settings"
ON system_settings
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update system settings"
ON system_settings
FOR UPDATE
USING (is_admin());
