const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    try {
        // Query profiles sorted by created_at desc
        const { data: profiles, error: err } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (err) {
            console.error('Error fetching profiles:', err);
            return;
        }

        console.log('Recent profiles:', profiles);
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

run();
