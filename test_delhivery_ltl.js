const axios = require('axios');
const FormData = require('form-data');

async function testDelhiveryLTL() {
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

        console.log("\n--- STEP 2: CREATE MANIFEST (LTL FORM-DATA) ---");
        const shortId = "LTL" + Date.now().toString().slice(-6);
        
        const form = new FormData();
        form.append('pickup_location_name', 'MODERN FURNITURE CRAFT');
        form.append('payment_mode', 'prepaid');
        form.append('weight', '1000'); // 1kg in grams
        form.append('rov_insurance', 'False');
        form.append('fm_pickup', 'False');
        form.append('freight_mode', 'fop');
        form.append('is_bulk', 'False');
        form.append('lrn', '');

        const dropoff = {
            "consignee_name": "YUVRAJ SINGH",
            "address": "HOUSE 123, SECTOR 5",
            "city": "DELHI",
            "state": "DELHI",
            "zip": "110001",
            "phone": "9521633688"
        };
        form.append('dropoff_location', JSON.stringify(dropoff));

        const shipmentDetails = [{
            "order_id": shortId,
            "box_count": 1,
            "description": "FURNITURE",
            "weight": 1000,
            "length": 10,
            "breadth": 10,
            "height": 10,
            "waybills": [],
            "master": false
        }];
        form.append('shipments', JSON.stringify(shipmentDetails)); // Trying 'shipments' instead of 'shipment_details'


        const invoices = [{
            "ewaybill": "",
            "inv_num": "INV-" + shortId,
            "inv_amt": 1000,
            "inv_qr_code": "",
            "inv_date": new Date().toISOString().split('T')[0]
        }];
        form.append('invoices', JSON.stringify(invoices));

        const billing = {
            "name": "BADHEE G",
            "company": "BADHEE G",
            "consignor": "BADHEE G",
            "address": "Laxmangarh",
            "city": "Laxmangarh",
            "state": "Rajasthan",
            "pin": "332311",
            "phone": "9521633688",
            "gst_number": "URP"
        };
        form.append('billing_address', JSON.stringify(billing));

        const manifestRes = await axios.post(`https://ltl-clients-api.delhivery.com/manifest`, form, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        console.log("Response:", JSON.stringify(manifestRes.data, null, 2));

        if (manifestRes.data.data?.job_id) {
            console.log("\n--- STEP 3: POLLING STATUS ---");
            const jobId = manifestRes.data.data.job_id;
            for(let i=0; i<3; i++) {
                console.log(`Polling ${i+1}/3...`);
                await new Promise(r => setTimeout(r, 15000));
                const statusRes = await axios.get(`https://ltl-clients-api.delhivery.com/manifest?job_id=${jobId}`, {
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

testDelhiveryLTL();
