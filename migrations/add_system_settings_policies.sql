-- Add INSERT and DELETE policies for system_settings table to allow upserts and management by admins
CREATE POLICY "Admins can insert system settings"
ON system_settings
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete system settings"
ON system_settings
FOR DELETE
USING (is_admin());
