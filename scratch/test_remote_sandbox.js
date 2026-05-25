const axios = require('axios');

const PROXY_URL = 'https://esykxyhbawwdifubbdng.supabase.co/functions/v1/delhivery-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

async function runTests() {
    console.log("=== STARTING DELHIVERY PROXY SANDBOX TESTS ===");

    // Test 1: Login Verification
    try {
        console.log("\n[Test 1] Testing Sandbox UMS Login & JWT Fetch...");
        const res = await axios.post(PROXY_URL, { action: 'login', details: {} }, { headers });
        console.log("Response Success:", res.data.success);
        console.log("JWT Token preview:", res.data.jwt ? res.data.jwt.substring(0, 50) + "..." : "NONE");
    } catch (e) {
        console.error("Login Test Failed:", e.response ? e.response.data : e.message);
    }

    // Test 2: Pincode Serviceability Check
    try {
        const pincode = '332311'; // Laxmangarh pincode
        console.log(`\n[Test 2] Testing Pincode Serviceability for ${pincode}...`);
        const res = await axios.post(PROXY_URL, { action: 'check-pincode', details: { pincode } }, { headers });
        console.log("Response:", JSON.stringify(res.data).substring(0, 300));
    } catch (e) {
        console.error("Pincode Test Failed:", e.response ? e.response.data : e.message);
    }

    // Test 3: Get Warehouses
    try {
        console.log("\n[Test 3] Fetching Registered Warehouses from Sandbox...");
        const res = await axios.post(PROXY_URL, { action: 'get-warehouses', details: {} }, { headers });
        console.log("Response status/data count:", Array.isArray(res.data) ? `${res.data.length} warehouses found` : "Invalid response");
        if (Array.isArray(res.data) && res.data.length > 0) {
            console.log("First Warehouse Name:", res.data[0].name || res.data[0].registered_name);
        } else {
            console.log("Raw Response:", JSON.stringify(res.data).substring(0, 300));
        }
    } catch (e) {
        console.error("Get Warehouses Test Failed:", e.response ? e.response.data : e.message);
    }

    console.log("\n=== SANDBOX TESTS COMPLETED ===");
}

runTests();
