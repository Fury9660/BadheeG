const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'postgres', // Default supabase local password
    port: 54322,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, 'migrations', 'enable_public_profiles.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying migration:', sql);
        await client.query(sql);
        console.log('Migration applied successfully');

        // Also apply enable_public_partners.sql just in case
        const sqlPath2 = path.join(__dirname, 'migrations', 'enable_public_partners.sql');
        if (fs.existsSync(sqlPath2)) {
            const sql2 = fs.readFileSync(sqlPath2, 'utf8');
            console.log('Applying migration 2:', sql2);
            await client.query(sql2);
            console.log('Migration 2 applied successfully');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
