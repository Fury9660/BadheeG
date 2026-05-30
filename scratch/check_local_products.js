const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'postgres',
    port: 54322,
});

async function run() {
  try {
    console.log("Connecting to local Supabase database on port 54322...");
    await client.connect();
    console.log("Connected successfully!");

    // Check if products table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log("Table 'products' does not exist in local database.");
      return;
    }

    // Count products
    const res = await client.query("SELECT count(*) FROM public.products");
    console.log(`Total products in local database: ${res.rows[0].count}`);

    if (parseInt(res.rows[0].count) > 0) {
      const res2 = await client.query("SELECT id, name, partner_id, created_at FROM public.products LIMIT 5");
      console.log("\nSample local products:", res2.rows);
      
      // Let's check how many belong to each partner
      const res3 = await client.query("SELECT partner_id, count(*) FROM public.products GROUP BY partner_id");
      console.log("\nProducts count by partner_id in local DB:", res3.rows);
    }

  } catch (err) {
    console.error("Local database error:", err.message);
  } finally {
    await client.end();
  }
}

run();
