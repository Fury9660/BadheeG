const fetch = require('node-fetch');
const token = 'a4a8463308805823aa0fad774f58e792f49dc2a4';
const payload = {
  "shipments": [
    {
      "order_number": "ORD-12345678",
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
      ],
      "pickup_location_name": "Main Store"
    }
  ]
};

async function test() {
    const response = await fetch('https://btob.api.delhivery.com/v2/manifest', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}
test();
