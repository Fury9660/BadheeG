const { createClient } = require('@supabase/supabase-js');

// Use credentials from config/supabaseConfig.ts (hardcoded for test)
const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'; // Taking from file view

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRpc() {
    console.log('Testing RPC get_public_partner_info...');
    // Try with a known ID or just random to see if it errors or returns null
    // We don't have a known ID easily, but we can try to call it.

    const { data, error } = await supabase.rpc('get_public_partner_info', {
        search_type: 'id',
        search_value: 'test-id'
    });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success:', data);
    }
}

testRpc();
