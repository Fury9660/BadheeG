const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

const targetMobiles = ['8290617309', '9413010506', '8824536948'];
const DEFAULT_OTP = '123456';

async function run() {
    // Step 1: Add column via RPC
    console.log('Step 1: Adding default_otp column...');
    const { error: rpcErr } = await supabase.rpc('add_default_otp_column');
    if (rpcErr) {
        console.log('RPC not available, trying direct SQL workaround...');
        // Try by inserting a dummy update to trigger schema refresh - column might need to be added via Supabase dashboard
        console.log('\n>>> ACTION NEEDED: Please run this SQL in your Supabase SQL Editor <<<');
        console.log('ALTER TABLE public.pre_approved_partners ADD COLUMN IF NOT EXISTS default_otp TEXT;');
        console.log('\nThen re-run this script to set the values.');
        return;
    }

    // Step 2: Set default_otp for target partners
    console.log('\nStep 2: Setting default_otp = 123456 for 3 partners...');
    for (const mobile of targetMobiles) {
        const { data, error } = await supabase
            .from('pre_approved_partners')
            .update({ default_otp: DEFAULT_OTP })
            .or(`mobile_number.eq.${mobile},mobile_number.eq.+91${mobile}`)
            .select('owner_name, store_name, mobile_number, default_otp');

        if (error) {
            console.error(`ERROR for ${mobile}:`, error.message);
        } else if (!data || data.length === 0) {
            console.log(`NOT FOUND: ${mobile}`);
        } else {
            data.forEach(p => console.log(`  OK: ${p.owner_name} | ${p.store_name} | default_otp: ${p.default_otp}`));
        }
    }
}

run().catch(console.error);
