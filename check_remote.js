
const { createClient } = require('@supabase/supabase-js');

// Config from environment (simulated)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';
// Assuming the user is logged in as admin in the app, but here we can't easily simulate that without a session.
// However, we can try to call the is_admin RPC if it's public (it shouldn't be security definer for public use without checking auth.uid()).

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    try {
        console.log('Testing connection to:', SUPABASE_URL);

        // 1. Try to read from pre_approved_partners for phone 9660856542
        const { data: partners, error: err1 } = await supabase
            .from('pre_approved_partners')
            .select('*');

        // 2. Try to read from profiles
        const { data: profiles, error: err2 } = await supabase
            .from('profiles')
            .select('*');

        if (err1) console.error('Partners Error:', err1);
        if (err2) console.error('Profiles Error:', err2);

        console.log('All partners length:', partners?.length);
        console.log('All profiles length:', profiles?.length);

        const matchingPartners = partners?.filter(p => 
            (p.mobile_number && p.mobile_number.includes('9660856542')) || 
            (p.phone_number && p.phone_number.includes('9660856542'))
        );
        console.log('Matching partners:', matchingPartners);

        console.log('All profiles:', profiles);

        // 2. We can't easily test UPDATE without a user session.
        // But we can check if the RPCs exist by listing them via a cleverly crafted query if enabled, usually not possible via client.

        // Changing strategy: The issue is likely RLS.
        // The previous migration 'admin_manage_partners.sql' was applied via 'apply_admin_migration.js' which FAILED with ECONNREFUSED.
        // THIS IS THE ROOT CAUSE. The migration NEVER RAN on the remote DB.

        console.log('\nCRITICAL FINDING: The migration script tried to connect to localhost:54322 but the app uses a REMOTE Supabase instance.');
        console.log('You need to run the migration on the REMOTE database.');

    } catch (err) {
        console.error('Script Error:', err);
    }
}

run();
