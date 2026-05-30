const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

async function run() {
    console.log("Checking partner_password values...");
    const { data, error } = await supabase
        .from('pre_approved_partners')
        .select('owner_name, mobile_number, email, partner_password, password')
        .in('mobile_number', ['8290617309', '9413010506', '8824536948']);
        
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Partners:", JSON.stringify(data, null, 2));
    }
}

run().catch(console.error);
