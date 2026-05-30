const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    // Since we don't have direct SQL access through client library normally, 
    // let's try to query database metadata via standard PostgREST if it is exposed.
    // Wait, usually the information_schema isn't exposed to the API. 
    // But we can check if there's any RPC function we can query, or list what we can find.
    // Let's try to fetch all RPCs or check if there is an error that lists tables.
    // Wait, another way is to fetch pg_catalog or query info via RPC if one is available.
    // Let's query an invalid table name to see if the error lists available tables.
    const { error } = await supabase.from('nonexistent_table_xyz_123').select('*');
    console.log("Error message from invalid table query:", error ? error.message : "No error");
  } catch (e) {
    console.error(e);
  }
}

run();
