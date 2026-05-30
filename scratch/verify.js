const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

const targetMobiles = ['8290617309', '9413010506', '8824536948'];

async function run() {
    console.log('Verifying default_otp configuration in Supabase...');
    for (const mobile of targetMobiles) {
        // Query both normal mobile and mobile with +91 prefix
        const { data, error } = await supabase
            .from('pre_approved_partners')
            .select('owner_name, store_name, mobile_number, default_otp')
            .or(`mobile_number.eq.${mobile},mobile_number.eq.+91${mobile}`);

        if (error) {
            console.error(`ERROR querying ${mobile}:`, error.message);
        } else if (!data || data.length === 0) {
            console.log(`NOT FOUND in pre_approved_partners: ${mobile}`);
        } else {
            data.forEach(p => {
                console.log(`FOUND: Owner: "${p.owner_name}" | Store: "${p.store_name}" | Mobile: "${p.mobile_number}" | default_otp: "${p.default_otp}"`);
            });
        }
    }
}

run().catch(console.error);
