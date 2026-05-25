const axios = require('axios');

async function testDelhiveryOne() {
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
        if(!token) {
            console.error("Token missing in response:", loginRes.data);
            return;
        }

        console.log("\n--- STEP 2: CREATE MANIFEST ---");
        const shortId = "TEST" + Date.now().toString().slice(-6);
        const jsonPayload = {
            "pickup_location": "MODERN FURNITURE CRAFT",
            "dropoff_location": {
                "name": "Yuvraj Singh",
                "consignee_name": "Yuvraj Singh",
                "address": "House 123, Sector 5",
                "city": "Delhi",
                "state": "Delhi",
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
                    "description": "Furniture Goods",
                    "consignee_name": "Yuvraj Singh",
                    "name": "Yuvraj Singh"
                }
            ],
            "shipments": [
                {
                    "order_number": shortId,
                    "consignee_name": "Yuvraj Singh",
                    "consignee": "Yuvraj Singh",
                    "name": "Yuvraj Singh",
                    "consignee_address": "House 123, Sector 5",
                    "consignee_city": "Delhi",
                    "consignee_state": "Delhi",
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
                    "description": "Furniture",
                    "quantity": 1,
                    "inv_qr_code": ""
                }
            ]
        };

        const manifestRes = await axios.post(`${config.baseUrl}/v2/manifest`, jsonPayload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const jobId = manifestRes.data.job_id;
        console.log("Manifest Created. Job ID:", jobId);

        console.log("\n--- STEP 3: POLLING STATUS ---");
        for(let i=0; i<5; i++) {
            console.log(`Polling ${i+1}/5...`);
            await new Promise(r => setTimeout(r, 10000));
            const statusRes = await axios.get(`${config.baseUrl}/v2/manifest?job_id=${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Status:", JSON.stringify(statusRes.data.status, null, 2));
            if(statusRes.data.status.type === 'Complete') break;
        }

    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
    }
}

testDelhiveryOne();
