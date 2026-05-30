const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    // We can query using RPC if available, or just check the products structure
    // Let's check how many total users/partners we have.
    const { data: users, error: err1 } = await supabase
      .from('profiles')
      .select('id, name');
    console.log("Profiles count:", users ? users.length : 0);

    // Let's query pre_approved_partners count
    const { data: partners, error: err2 } = await supabase
      .from('pre_approved_partners')
      .select('id, store_name, status');
    console.log("Pre-approved partners count:", partners ? partners.length : 0);

    // Let's run a query to count all products in the database, including the ones that might not have matching partners
    const { data: products, error: err3 } = await supabase
      .from('products')
      .select('id, name, partner_id');
    console.log("Products count:", products ? products.length : 0);
    
    // Find unique partner_ids of all products in DB
    const uniquePartnerIds = [...new Set(products.map(p => p.partner_id))];
    console.log("Unique partner IDs in products table:", uniquePartnerIds);

  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
