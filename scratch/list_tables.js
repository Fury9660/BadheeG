const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const tables = ['products', 'pre_approved_partners', 'profiles', 'orders', 'banners', 'categories', 'addresses', 'carts', 'notifications', 'reviews'];
    for (const t of tables) {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`Table ${t}: Error - ${error.message}`);
      } else {
        console.log(`Table ${t}: ${count} rows`);
      }
    }
  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
