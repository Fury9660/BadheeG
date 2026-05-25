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

        console.log("\n--- STEP 2: CREATE MANIFEST (PARTNERS PAYLOAD) ---");
        const shortOrderId = "PT" + Date.now().toString().slice(-6);
        const weightInGm = 1000;
        const totalValue = 1000;

        const payload = {
            "pickup_location": "MODERN FURNITURE CRAFT",
            "dropoff_location": {
                "consignee_name": "YUVRAJ SINGH",
                "address": "HOUSE 123, SECTOR 5",
                "city": "DELHI",
                "state": "DELHI",
                "zip": "110001",
                "phone": "9521633688"
            },
            "weight": weightInGm / 1000,
            "n_value": totalValue,
            "d_mode": "Prepaid",
            "product_type": "S",
            "invoices": [
                {
                    "ident": shortOrderId,
                    "n_value": totalValue,
                    "inv_num": "INV-" + shortOrderId.substring(0, 8),
                    "inv_amt": totalValue,
                    "inv_date": new Date().toISOString().split('T')[0]
                }
            ],
            "suborders": [
                {
                    "ident": shortOrderId,
                    "suborder_id": shortOrderId + "-S",
                    "weight": weightInGm / 1000,
                    "count": 1,
                    "n_value": totalValue,
                    "description": "Furniture"
                }
            ],
            "shipments": [
                {
                    "order_number": shortOrderId,
                    "consignee_name": "YUVRAJ SINGH",
                    "consignee_address": "HOUSE 123, SECTOR 5",
                    "consignee_city": "DELHI",
                    "consignee_state": "DELHI",
                    "consignee_pincode": "110001",
                    "consignee_phone": "9521633688",
                    "payment_mode": "prepaid",
                    "total_amount": totalValue,
                    "n_value": totalValue,
                    "shipment_details": [
                        {
                            "n_value": totalValue,
                            "description": "Furniture",
                            "weight": weightInGm / 1000,
                            "length": 10,
                            "breadth": 10,
                            "height": 10,
                            "box_count": 1,
                            "suborders": [
                                {
                                    "ident": shortOrderId,
                                    "suborder_id": shortOrderId + "-S",
                                    "weight": weightInGm / 1000,
                                    "count": 1,
                                    "n_value": totalValue,
                                    "description": "Furniture"
                                }
                            ]
                        }
                    ],
                    "invoices": [
                        {
                            "ident": shortOrderId,
                            "n_value": totalValue,
                            "inv_num": "INV-" + shortOrderId.substring(0, 8),
                            "inv_amt": totalValue,
                            "inv_date": new Date().toISOString().split('T')[0]
                        }
                    ]
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
