-- ========================================================
-- Enable Delhivery Auto-Manifestation via pg_net
-- ========================================================

-- Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.tr_auto_manifest_order()
RETURNS trigger AS $$
DECLARE
    payload jsonb;
    headers jsonb;
    request_id bigint;
BEGIN
    -- Fire only if order status is 'processing' and Delhivery LRN is not generated yet
    IF (NEW.status = 'processing') AND (NEW.lrn_number IS NULL OR NEW.lrn_number = '') THEN
        -- Fire on insert, or when status updates from non-processing to processing
        IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND (OLD.status IS NULL OR OLD.status != 'processing')) THEN
            
            -- Payload to trigger the auto-manifest action in our delhivery-proxy Edge Function
            payload := json_build_object(
                'action', 'auto-manifest',
                'details', json_build_object('orderId', NEW.id)
            );
            
            -- Headers required for authentication with Supabase API gateway
            headers := json_build_object(
                'Content-Type', 'application/json',
                'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
            );
            
            -- Queue the HTTP POST request asynchronously in pg_net
            SELECT net.http_post(
                url := 'https://esykxyhbawwdifubbdng.supabase.co/functions/v1/delhivery-proxy',
                body := payload,
                headers := headers
            ) INTO request_id;
            
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to the orders table
DROP TRIGGER IF EXISTS tr_order_auto_manifest ON public.orders;

CREATE TRIGGER tr_order_auto_manifest
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.tr_auto_manifest_order();
