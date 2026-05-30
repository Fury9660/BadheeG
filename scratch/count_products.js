const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: allProducts, error: err1 } = await supabase
      .from('products')
      .select('id, name, in_stock, partner_id');

    if (err1) {
      console.error("Error fetching products:", err1);
      return;
    }

    console.log(`Total products in DB: ${allProducts.length}`);
    console.log(`In stock products: ${allProducts.filter(p => p.in_stock !== false).length}`);
    console.log(`Out of stock products: ${allProducts.filter(p => p.in_stock === false).length}`);

    // Group by partner_id
    const partnerGroups = {};
    allProducts.forEach(p => {
      const pid = p.partner_id || 'null';
      partnerGroups[pid] = (partnerGroups[pid] || 0) + 1;
    });
    console.log("\nProducts count by partner_id:", partnerGroups);

    // Let's also fetch partners
    const { data: partners, error: err2 } = await supabase
      .from('pre_approved_partners')
      .select('id, store_name, status, mobile_number');

    if (err2) {
      console.error("Error fetching partners:", err2);
    } else {
      console.log("\nAll Partners:", partners.map(p => ({
        id: p.id,
        store_name: p.store_name,
        mobile_number: p.mobile_number,
        status: p.status
      })));
    }

  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
