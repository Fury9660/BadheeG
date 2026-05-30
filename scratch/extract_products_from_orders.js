const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    console.log("Fetching all orders...");
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*');

    if (error) {
      console.error("Error fetching orders:", error.message);
      return;
    }

    console.log(`Successfully fetched ${orders.length} orders.`);

    const productsMap = {};
    orders.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach(item => {
        // Let's print the keys to see what is stored in item
        const productId = item.id || item.product_id;
        if (productId) {
          productsMap[productId] = item;
        }
      });
    });

    console.log(`Found ${Object.keys(productsMap).length} unique products in orders.`);
    console.log("\nSample items from orders:");
    console.log(JSON.stringify(Object.values(productsMap).slice(0, 5), null, 2));

  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

run();
