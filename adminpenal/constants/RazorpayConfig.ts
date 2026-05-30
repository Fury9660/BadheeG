export const RAZORPAY_CONFIG = {
    keyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
    keySecret: '', // Secret should never be on the client
    currency: 'INR',
    name: 'Badhee G',
    description: 'Order Payment'
};
