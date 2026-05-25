// Using native fetch available in Node.js v18+
const axios = require('axios');

async function testDelhiveryDev() {
    const config = {
        username: 'BADHEEG6537B2B',
        password: 'Yuvi@302013',
        baseUrl: 'https://btob-api-dev.delhivery.com' // Dev endpoint
    };

    try {
        console.log("--- STEP 1: LOGIN (DEV) ---");
        // Using axios for variety or consistency if needed, but fetch is fine too
        const loginResponse = await fetch(`${config.baseUrl}/ums/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: config.username,
                password: config.password
            })
        });

        const loginData = await loginResponse.json();
        console.log("Login Response (Dev):", JSON.stringify(loginData, null, 2));

        if (!loginData.data || !loginData.data.jwt) {
            console.error("Login failed on Dev! This account might not exist in Delhivery's Staging environment.");
            return;
        }

        const token = loginData.data.jwt;
        console.log("\n--- STEP 2: CREATE MANIFEST (DEV) ---");

        const jsonPayload = {
            "pickup_location": "MODERN FURNITURE CRAFT",
            "dropoff_location": {
                "name": "Test Customer",
                "address": "Test Address",
                "city": "Delhi",
                "state": "Delhi",
                "zip": "110001",
                "phone": "9876543210"
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
                    "ident": "IDENT-DEV-123",
                    "suborder_id": "SUB-DEV-123",
                    "weight": 1,
                    "count": 1,
                    "description": "Dev Test Shipment"
                }
            ],
            "shipments": [
                {
                    "order_number": "ORD-DEV-" + Date.now(),
                    "consignee_name": "Test Customer",
                    "consignee_address": "Test Address",
                    "consignee_city": "Delhi",
                    "consignee_state": "Delhi",
                    "consignee_pincode": "110001",
                    "consignee_phone": "9876543210",
                    "consignee_gst_tin": "URP",
                    "total_amount": 100,
                    "packages": [
                        {
                            "ident": "IDENT-DEV-123",
                            "package_id": "PKG-DEV-123",
                            "weight": 1,
                            "length": 10,
                            "breadth": 10,
                            "height": 10,
                            "hsn_code": "0000",
                            "product_description": "Dev Test"
                        }
                    ]
                }
            ],
            "invoices": [
                {
                    "ident": "IDENT-DEV-123",
                    "n_value": 100,
                    "ewaybill": "",
                    "inv_num": "INV-DEV-123",
                    "amount": 100,
                    "inv_date": new Date().toISOString().split('T')[0],
                    "commodity_id": "1",
                    "description": "Dev Test",
                    "quantity": 1,
                    "inv_qr_code": ""
                }
            ]
        };

        const manifestRes = await fetch(`${config.baseUrl}/v2/manifest`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonPayload)
        });

        const manifestData = await manifestRes.json();
        console.log("Manifest Response (Dev):", JSON.stringify(manifestData, null, 2));

        if (manifestData.job_id) {
            console.log("\n--- STEP 3: CHECK JOB STATUS (DEV) ---");
            const jobId = manifestData.job_id;
            console.log("Waiting 10 seconds for dev job...");
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const jobStatusRes = await fetch(`${config.baseUrl}/v2/manifest?job_id=${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const jobStatusData = await jobStatusRes.json();
            console.log("Job Status Response (Dev):", JSON.stringify(jobStatusData, null, 2));
        }

    } catch (error) {
        console.error("Error during Dev testing:", error);
    }
}

testDelhiveryDev();
