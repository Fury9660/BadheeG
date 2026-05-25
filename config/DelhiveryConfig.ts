export const DelhiveryConfig = {
    baseUrl: process.env.EXPO_PUBLIC_DELHIVERY_BASE_URL || 'https://ltl-clients-api-dev.delhivery.com',
    username: process.env.EXPO_PUBLIC_DELHIVERY_USERNAME || 'BADHEEG6537B2B',
    password: process.env.EXPO_PUBLIC_DELHIVERY_PASSWORD || 'Yuvi@302013',
    pickupLocation: process.env.EXPO_PUBLIC_DELHIVERY_PICKUP_NAME || 'Main Store',
    mode: process.env.EXPO_PUBLIC_DELHIVERY_MODE || 'production', // 'staging' or 'production'
};
