const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: partners, error } = await supabase
      .from('pre_approved_partners')
      .select('*');

    if (error) {
      console.error(error);
    } else {
      console.log("Pre-Approved Partners (with user_id & status):");
      partners.forEach(p => {
        console.log(`ID: ${p.id} | Store: ${p.store_name} | UserID: ${p.user_id} | Status: ${p.status} | Phone: ${p.mobile_number}`);
      });
    }
  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
