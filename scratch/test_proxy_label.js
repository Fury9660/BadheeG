const axios = require('axios');

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/delhivery-proxy`;

async function test() {
    try {
        console.log("Calling remote delhivery-proxy get-label...");
        const res = await axios.post(PROXY_URL, {
            action: 'get-label',
            details: {
                lrn: '220258401',
                waybill: '85221510000280',
                cachedLabelUrl: ''
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            }
        });
        console.log("Response status:", res.status);
        console.log("Response data:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("Error status:", e.response?.status);
        console.error("Error data:", JSON.stringify(e.response?.data, null, 2));
    }
}
test();
