-- Debug: Check for Triggers
SELECT event_object_table as table_name, trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('users', 'profiles');

-- Debug: Check for Constraints
SELECT conname AS constraint_name, contype, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public' OR n.nspname = 'auth';
