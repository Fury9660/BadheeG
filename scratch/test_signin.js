const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

async function run() {
    console.log("Testing signInWithPassword with phone...");
    const { data, error } = await supabase.auth.signInWithPassword({
        phone: '+918824536948',
        password: '8824536948'
    });
    
    if (error) {
        console.log("Error returned:", error.message, "| Code:", error.code);
    } else {
        console.log("Sign-in succeeded:", data);
    }
}

run().catch(console.error);
