const axios = require('axios');
const FormData = require('form-data');

async function test() {
    try {
        console.log("Logging in...");
        const loginRes = await axios.post('https://ltl-clients-api.delhivery.com/ums/login', {
            username: 'BADHEEG6537B2B',
            password: 'Yuvi@302013'
        });
        const token = loginRes.data.data.jwt;
        console.log("Token obtained.");

        const manifestRes = await axios.post('https://ltl-clients-api.delhivery.com/v2/manifest', {
            "pickup_location": {
                "name": "MODERN FURNITURE CRAFT"
            },
            "shipments": [
                {
                    "order_number": "ORD-" + Date.now(),
                    "consignee_name": "Test Customer",
                    "consignee_address": "Test Address",
                    "consignee_city": "Delhi",
                    "consignee_state": "Delhi",
                    "consignee_pincode": "110001",
                    "consignee_phone": "9876543210",
                    "consignee_gst_tin": "URP",
                    "total_amount": 1000,
                    "packages": [
                        {
                            "package_id": "PKG-001",
                            "weight": 1,
                            "length": 10,
                            "breadth": 10,
                            "height": 10,
                            "hsn_code": "0000",
                            "product_description": "Furniture"
                        }
                    ]
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Success:", manifestRes.data);
    } catch (e) {
        if (e.response) {
            console.error("Error Response:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Error:", e.message);
        }
    }
}
test();
