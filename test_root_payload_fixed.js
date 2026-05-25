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

        console.log("\n--- STEP 2: CREATE MANIFEST (FIXED PAYLOAD) ---");
        const shortId = "RT" + Date.now().toString().slice(-6);
        
        const payload = {
            "pickup_location": "MODERN FURNITURE CRAFT",
            "payment_mode": "prepaid",
            "cod_amount": 0,
            "weight": 1000, // weight in grams
            "rov_insurance": false,
            "fm_pickup": false,
            "freight_mode": "fop",
            "is_bulk": false,
            "lrn": "",
            "dropoff_location": {
                "consignee_name": "YUVRAJ SINGH",
                "address": "HOUSE 123, SECTOR 5",
                "city": "DELHI",
                "state": "State",
                "zip": "110001",
                "phone": "9521633688"
            },
            "shipment_details": [
                {
                    "order_id": shortId,
                    "box_count": 1,
                    "description": "Furniture",
                    "weight": 1000,
                    "length": 10,
                    "breadth": 10,
                    "height": 10,
                    "waybills": [],
                    "master": false
                }
            ],
            "invoices": [
                {
                    "ewaybill": "",
                    "inv_num": "INV-" + shortId,
                    "inv_amt": 1000,
                    "inv_qr_code": "",
                    "inv_date": new Date().toISOString().split('T')[0]
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
