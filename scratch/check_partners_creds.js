const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const mobiles = ['8290617309', '9413010506', '8824536948'];
    for (const mob of mobiles) {
      const { data, error } = await supabase
        .from('pre_approved_partners')
        .select('owner_name, store_name, mobile_number, email, password, default_otp')
        .or(`mobile_number.eq.${mob},mobile_number.eq.+91${mob}`);
      
      if (error) {
        console.error(error);
      } else {
        console.log(`\nMobile: ${mob}`);
        console.log(data);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

run();
