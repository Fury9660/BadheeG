const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    try {
        console.log('Searching profiles...');
        const { data: profiles, error: err } = await supabase
            .from('profiles')
            .select('*');

        if (err) {
            console.error('Error fetching profiles:', err);
            return;
        }

        console.log('Total profiles fetched:', profiles.length);

        const match1 = profiles.filter(p => p.email && p.email.includes('furyt'));
        console.log('Match by email furyt:', match1);

        const match2 = profiles.filter(p => p.phone && p.phone.includes('9660856542'));
        console.log('Match by phone 9660856542:', match2);

        const match3 = profiles.filter(p => p.mobile_number && p.mobile_number.includes('9660856542'));
        console.log('Match by mobile_number 9660856542:', match3);

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

run();
