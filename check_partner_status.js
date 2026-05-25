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

        const phoneNumber = '9660856542';
        console.log(`\n--- Checking status for ${phoneNumber} ---`);

        // Check if table pre_approved_partners exists and query it
        const res = await client.query(`
            SELECT * FROM pre_approved_partners 
            WHERE mobile_number = $1 OR email = $2;
        `, [phoneNumber, 'furytxion@gmail.com']);

        if (res.rows.length === 0) {
            console.log('No partner found with this number or email.');
            // Let's print the first 5 records of the table to see what is there
            const resAll = await client.query(`SELECT * FROM pre_approved_partners LIMIT 5;`);
            console.log('Sample partners:', resAll.rows);
        } else {
            console.log('Found partner:', JSON.stringify(res.rows, null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();

