const axios = require('axios');

async function test() {
    const config = {
        username: 'BADHEEG6537B2B',
        password: 'Yuvi@302013',
        baseUrl: 'https://btob.api.delhivery.com'
    };

    try {
        console.log("--- STEP 1: LOGIN ---");
        const loginRes = await axios.post(`${config.baseUrl}/ums/login/`, {
            username: config.username,
            password: config.password
        });
        const token = loginRes.data.jwt || loginRes.data.data?.jwt;
        console.log("Token received.");

        console.log("\n--- STEP 2: CREATE MANIFEST (B2B CORRECT PAYLOAD) ---");
        const shortId = "B2B" + Date.now().toString().slice(-6);
        const payload = {
            "shipments": [
                {
                    "order_number": shortId,
                    "consignee_name": "YUVRAJ SINGH",
                    "consignee_address": "HOUSE 123, SECTOR 5",
                    "consignee_city": "DELHI",
                    "consignee_state": "DELHI",
                    "consignee_pincode": "110001",
                    "consignee_phone": "9521633688",
                    "consignee_gst_tin": "URP",
                    "total_amount": 1000,
                    "packages": [
                        {
                            "package_id": shortId + "-PKG",
                            "weight": 1,
                            "length": 10,
                            "breadth": 10,
                            "height": 10,
                            "hsn_code": "0000",
                            "product_description": "Furniture"
                        }
                    ],
                    "pickup_location_name": "MODERN FURNITURE CRAFT"
                }
            ]
        };

        const manifestRes = await axios.post(`${config.baseUrl}/v2/manifest`, payload, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Response:", JSON.stringify(manifestRes.data, null, 2));

        if (manifestRes.data.job_id) {
            console.log("\n--- STEP 3: POLLING STATUS ---");
            const jobId = manifestRes.data.job_id;
            for(let i=0; i<5; i++) {
                console.log(`Polling ${i+1}/5...`);
                await new Promise(r => setTimeout(r, 10000));
                const statusRes = await axios.get(`${config.baseUrl}/v2/manifest?job_id=${jobId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log("Status:", JSON.stringify(statusRes.data.status, null, 2));
                if(statusRes.data.status.type === 'Complete') break;
            }
        }

    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

test();
