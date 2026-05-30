const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://esykxyhbawwdifubbdng.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY'
);

async function run() {
    console.log("Testing email sign-in for Mona...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'modernfurniturecraft@gmail.com',
        password: '1234567'
    });
    
    if (error) {
        console.log("Mona email sign-in failed:", error.message);
    } else {
        console.log("Mona email sign-in succeeded!", data.user.id);
    }
}

run().catch(console.error);
