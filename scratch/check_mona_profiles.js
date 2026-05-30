const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

async function run() {
    console.log("Searching profiles for Mona's email/phone/ID...");
    const { data: p1, error: e1 } = await supabase
        .from('profiles')
        .select('*');
        
    if (e1) {
        console.error("Profiles error:", e1.message);
    } else {
        console.log("Total profiles:", p1.length);
        const monaProfiles = p1.filter(p => 
            (p.email && p.email.includes('modernfurniturecraft')) || 
            (p.phone && p.phone.includes('8290617309')) ||
            p.id === '8a952bfb-d388-4e10-b7d6-ecc89d76a202' ||
            p.id === '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e'
        );
        console.log("Mona profiles in public.profiles:", monaProfiles);
    }
}

run().catch(console.error);
