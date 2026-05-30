const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

async function run() {
    console.log("1. Testing phone sign-in for Mona...");
    const { data: phoneData, error: phoneError } = await supabase.auth.signInWithPassword({
        phone: '+918290617309',
        password: '8290617309'
    });
    if (phoneError) {
        console.log("Phone sign-in failed:", phoneError.message);
    } else {
        console.log("Phone sign-in succeeded!");
    }

    console.log("\n2. Testing email sign-in for Subhash...");
    const { data: emailData, error: emailError } = await supabase.auth.signInWithPassword({
        email: 'subhash.bijarina91@hmail.com',
        password: '9413010506'
    });
    if (emailError) {
        console.log("Email sign-in failed:", emailError.message);
    } else {
        console.log("Email sign-in succeeded!");
    }
}

run().catch(console.error);
