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
        await client.connect();
        console.log('Connected to database');

        // 1. Check Policies on pre_approved_partners
        console.log('\n--- Policies on pre_approved_partners ---');
        const res = await client.query(`
      SELECT policyname, cmd, roles, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'pre_approved_partners';
    `);
        res.rows.forEach(r => console.log(r));

        // 2. Check is_admin function definition
        console.log('\n--- is_admin() function source ---');
        const res2 = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'is_admin';
    `);
        res2.rows.forEach(r => console.log(r));

        // 3. User Role Check (for the specific admin email if known)
        console.log('\n--- Admin User Role Check ---');
        const res3 = await client.query(`
      SELECT email, role FROM profiles WHERE email IN ('badheeadmin@gmail.com', 'captyuvraj2@gmail.com');
    `);
        res3.rows.forEach(r => console.log(r));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
