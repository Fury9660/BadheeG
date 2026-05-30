const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://esykxyhbawwdifubbdng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*');

    if (error) {
      console.error(error);
      return;
    }

    const monaProducts = [];
    orders.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach(item => {
        const pid = item.partner_id || item.partnerId;
        if (pid === '8a952bfb-d388-4e10-b7d6-ecc89d76a202' || pid === '99da89ea-6cb1-4ae4-a3b3-f920c0206a8e') {
          monaProducts.push(item);
        }
      });
    });

    console.log(`Found ${monaProducts.length} items belonging to Mona in orders.`);
    if (monaProducts.length > 0) {
      console.log(JSON.stringify(monaProducts.slice(0, 5), null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}

run();
