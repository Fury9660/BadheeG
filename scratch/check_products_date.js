const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, created_at, partner_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      console.log("All products currently in DB:");
      products.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.name} | CreatedAt: ${p.created_at} | PartnerID: ${p.partner_id}`);
      });
    }
  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
