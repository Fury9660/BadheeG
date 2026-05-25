const axios = require('axios');

async function testDelhiveryV2Final() {
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

        console.log("\n--- STEP 2: CREATE MANIFEST (V2 JSON) ---");
        const shortId = "V2" + Date.now().toString().slice(-6);
        const jsonPayload = {
            "pickup_location": "MODERN FURNITURE CRAFT",
            "dropoff_location": {
                "consignee_name": "YUVRAJ SINGH",
                "address": "HOUSE 123, SECTOR 5",
                "city": "DELHI",
                "state": "DELHI",
                "zip": "110001",
                "phone": "9521633688"
            },
            "d_mode": "Prepaid",
            "payment_mode": "Prepaid",
            "weight": 1,
            "product_type": "S",
            "freight_mode": "FoP",
            "rov_insurance": false,
            "fm_pickup": false,
            "is_bulk": false,
            "suborders": [
                {
                    "ident": shortId,
                    "suborder_id": shortId + "-SUB",
                    "weight": 1,
                    "count": 1,
                    "description": "FURNITURE",
                    "consignee_name": "YUVRAJ SINGH"
                }
            ],
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
                            "product_description": "FURNITURE"
                        }
                    ]
                }
            ],
            "invoices": [
                {
                    "ident": shortId,
                    "n_value": 1000,
                    "ewaybill": "",
                    "inv_num": "INV-" + shortId,
                    "amount": 1000,
                    "inv_date": new Date().toISOString().split('T')[0],
                    "commodity_id": "1",
                    "description": "FURNITURE",
                    "quantity": 1,
                    "inv_qr_code": ""
                }
            ]
        };

        const manifestRes = await axios.post(`${config.baseUrl}/v2/manifest`, jsonPayload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("Response:", JSON.stringify(manifestRes.data, null, 2));

        if (manifestRes.data.job_id) {
            console.log("\n--- STEP 3: POLLING STATUS ---");
            const jobId = manifestRes.data.job_id;
            for(let i=0; i<3; i++) {
                console.log(`Polling ${i+1}/3...`);
                await new Promise(r => setTimeout(r, 15000));
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

testDelhiveryV2Final();
