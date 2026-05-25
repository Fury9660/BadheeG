const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    try {
        console.log("Setting delhivery_test_mode = 'true' (Sandbox mode on)...");
        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key: 'delhivery_test_mode',
                value: 'true',
                description: 'Delhivery Partner Test Mode (Sandbox vs Live)'
            });
        if (error) throw error;
        console.log("Setting updated successfully!");
    } catch (e) {
        console.error(e);
    }
}
run();
