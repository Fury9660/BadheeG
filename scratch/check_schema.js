const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

async function run() {
    const { data, error } = await supabase
        .from('pre_approved_partners')
        .select('*')
        .eq('mobile_number', '8824536948')
        .single();
        
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Partner details:", JSON.stringify(data, null, 2));
    }
}

run().catch(console.error);
