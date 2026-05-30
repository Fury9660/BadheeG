const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      console.log("Successfully fetched product row:", data);
      if (data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
      } else {
        console.log("No rows in products");
      }
    }
  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
