-- Add updated_at column to pre_approved_partners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pre_approved_partners' AND column_name = 'updated_at') THEN
        ALTER TABLE pre_approved_partners ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;
