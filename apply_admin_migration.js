const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

        const sqlPath = path.join(__dirname, 'migrations', 'admin_manage_partners.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying migration:', sql);
        await client.query(sql);
        console.log('Migration applied successfully');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
