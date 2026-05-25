const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log("Testing remote update on pre_approved_partners...");
  const partnerId = 'd5b2c417-2518-41b8-a4ae-5ceff8ddf8d7';
  const dummyUserId = '00000000-0000-0000-0000-000000000000'; // valid UUID format

  const { data, error } = await supabase
    .from('pre_approved_partners')
    .update({ user_id: dummyUserId })
    .eq('id', partnerId)
    .select();

  if (error) {
    console.error("Update failed:", error.message);
  } else {
    console.log("Update succeeded! Data returned:", JSON.stringify(data, null, 2));

    // Reset it back to null
    const { data: resetData, error: resetError } = await supabase
      .from('pre_approved_partners')
      .update({ user_id: null })
      .eq('id', partnerId)
      .select();
    
    if (resetError) {
      console.error("Resetting back to null failed:", resetError.message);
    } else {
      console.log("Reset back to null succeeded!");
    }
  }
}

testUpdate();
