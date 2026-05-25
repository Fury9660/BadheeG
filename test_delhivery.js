const fetch = require('node-fetch');
const token = 'a4a8463308805823aa0fad774f58e792f49dc2a4';
const payload = {
    shipments: [
        {
            name: "Test Customer",
            add: "Test Address, Delhi",
            pin: "110001",
            city: "Delhi",
            phone: "9876543210",
            order: "TEST_ORD_" + Date.now(),
            payment_mode: "Prepaid",
            cod_amount: 0,
            products_desc: "Furniture",
            shipping_mode: "Surface",
        }
    ],
    pickup_location: {
        name: "Main Store"
    }
};

async function test() {
    const urlEncodedData = "format=json&data=" + encodeURIComponent(JSON.stringify(payload));
    const response = await fetch('https://track.delhivery.com/api/cmu/create.json', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: urlEncodedData
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}
test();
