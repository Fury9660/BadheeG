const axios = require('axios');

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/delhivery-proxy`;

async function test() {
    try {
        console.log("Calling remote delhivery-proxy login...");
        const res = await axios.post(PROXY_URL, { action: 'login' }, {
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
        });
        const data = res.data;
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
