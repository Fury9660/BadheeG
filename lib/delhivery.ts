import { DelhiveryConfig } from '@/config/DelhiveryConfig';

interface ShipmentDetails {
    orderId: string;
    customerName: string;
    customerAddress: string;
    customerCity: string;
    customerState?: string;
    customerPincode: string;
    customerPhone: string;
    paymentMode: 'Prepaid' | 'COD';
    codAmount: number;
    productsDesc: string;
    weight?: number;
    length?: number;
    breadth?: number;
    height?: number;
    totalAmount?: number;
}

const PROXY_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delhivery-proxy`;

// B2B Token Caching
let cachedB2BToken: string | null = null;
let tokenExpiry: number = 0;

const getB2BToken = async (): Promise<string> => {
    if (cachedB2BToken && Date.now() < tokenExpiry) return cachedB2BToken;
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ action: 'login', details: {} })
        });
        const data = await response.json();
        if (data.jwt) {
            cachedB2BToken = data.jwt;
            tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
            return data.jwt;
        }
        throw new Error(data.error || "Auth Failed");
    } catch (error) { throw error; }
};

export const createShipment = async (details: ShipmentDetails, defaultPickupLocation: string = 'MODERN FURNITURE CRAFT') => {
    try {
        const token = await getB2BToken();
        const pickupLocation = (defaultPickupLocation || 'MODERN FURNITURE CRAFT').trim();
        const weightInGm = (details.weight || 1) * 1000;
        const totalValue = details.totalAmount || details.codAmount || 1000;

        // Based on documentation screenshot:
        // Using the LTL Clients API with JSON payload (most reliable for lists)
        const shortOrderId = details.orderId.substring(0, 25);
        const payload = {
            "pickup_location": pickupLocation,
            "gstin": "UR",
            "dropoff_location": {
                "consignee_name": details.customerName || 'Customer',
                "address": details.customerAddress || 'No Address',
                "city": details.customerCity || 'City',
                "state": details.customerState || details.customerCity || 'State',
                "zip": details.customerPincode || '110001',
                "phone": details.customerPhone || '9999999999',
                "gstin": "UR",
                "gst_number": "UR"
            },
            "billing_address": {
                "name": "BADHEE G",
                "company": "BADHEE G",
                "consignor": "BADHEE G",
                "address": "Laxmangarh",
                "city": "Laxmangarh",
                "state": "Rajasthan",
                "pin": "332311",
                "phone": "9521633688",
                "gst_number": "UR",
                "gstin": "UR"
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
                    "description": details.productsDesc || "Furniture"
                }
            ],
            "shipments": [
                {
                    "order_number": shortOrderId,
                    "consignee_name": details.customerName || 'Customer',
                    "consignee_address": details.customerAddress || 'No Address',
                    "consignee_city": details.customerCity || 'City',
                    "consignee_state": details.customerState || details.customerCity || 'State',
                    "consignee_pincode": details.customerPincode || '110001',
                    "consignee_phone": details.customerPhone || '9999999999',
                    "consignee_gst_tin": "UR",
                    "payment_mode": details.paymentMode.toLowerCase(),
                    "total_amount": totalValue,
                    "n_value": totalValue,
                    "shipment_details": [
                        {
                            "n_value": totalValue,
                            "description": details.productsDesc || "Furniture",
                            "weight": weightInGm / 1000,
                            "length": details.length || 10,
                            "breadth": details.breadth || 10,
                            "height": details.height || 10,
                            "box_count": 1,
                            "suborders": [
                                {
                                    "ident": shortOrderId,
                                    "suborder_id": shortOrderId + "-S",
                                    "weight": weightInGm / 1000,
                                    "count": 1,
                                    "n_value": totalValue,
                                    "description": details.productsDesc || "Furniture"
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

        const PROXY_URL = 'https://esykxyhbawwdifubbdng.supabase.co/functions/v1/delhivery-proxy';
        const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY || '',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
                action: 'create-shipment-json',
                details: {
                    token,
                    payload,
                    useLtlUrl: true 
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || `Server responded with status ${response.status}`);
        }

        const initialData = await response.json();
        console.log("Delhivery LTL Initial Response:", JSON.stringify(initialData));

        const jobId = initialData.data?.job_id || initialData.job_id;
        if (!jobId) {
            const errorMessage = initialData.message || initialData.error?.message || 'Failed to get Job ID from Delhivery';
            throw new Error(errorMessage);
        }

        // Polling logic to get the actual LR Number
        let lrNumber = null;
        let attempts = 0;
        const maxAttempts = 15; // Wait up to ~75 seconds
        while (!lrNumber && attempts < maxAttempts) {
            console.log(`Polling for LR Number (Attempt ${attempts + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); 
            try {
                const pollResponse = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY || '',
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify({
                        action: 'check-job-status',
                        details: { token, jobId }
                    })
                });

                if (pollResponse.ok) {
                    const pollData = await pollResponse.json();
                    console.log("Polling Response:", JSON.stringify(pollData));
                    
                    const isComplete = pollData.type === 'Complete' || pollData.status?.type === 'Complete' || pollData.status?.type === 'FAILED';
                    const isSuccess = pollData.success === true || (pollData.success === undefined && pollData.status?.success === true);
                    
                    if (isComplete) {
                        if (isSuccess) {
                            lrNumber = pollData.value?.lrnum || pollData.status?.value?.lrnum || pollData.data?.lrnum || pollData.lrnum;
                        } else {
                            const reason = pollData.reason || pollData.status?.reason || pollData.status?.error?.message || "Unknown error during manifestation";
                            throw new Error(reason);
                        }
                    }
                } else {
                    console.log("Polling response not OK yet:", pollResponse.status);
                }
            } catch (err) {
                console.log("Polling attempt failed, retrying...", err);
            }
            attempts++;
        }

        if (!lrNumber) {
            throw new Error("Job submitted (ID: " + jobId + "), but Delhivery is still processing it. Please check the portal in 1-2 minutes using this Job ID.");
        }

        const result = {
            success: true,
            trackingId: lrNumber,
            message: 'Shipment Created Successfully with LR: ' + lrNumber
        };

        if (typeof window !== 'undefined') window.alert("SUCCESS: Shipment Manifested! LR Number: " + lrNumber);
        return result;

    } catch (error: any) {
        console.error("Delhivery LTL Shipment Error:", error);
        if (typeof window !== 'undefined') window.alert("ERROR: " + (error.message || "Failed to create shipment"));
        throw error;
    }
};

export const trackShipment = async (waybill: string) => {
    if (!waybill) throw new Error("Waybill is required.");
    try {
        const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
        // Route via Supabase proxy to avoid CORS issues in browser
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({
                action: 'track-shipment',
                details: { lrn: waybill }
            })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        // data contains the tracking response from Delhivery v2/track/:lrn
        return data;
    } catch (error) { throw error; }
};
