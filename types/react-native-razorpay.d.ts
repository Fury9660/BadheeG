declare module 'react-native-razorpay' {
    export interface RazorpayOptions {
        key: string;
        amount: number;
        currency: string;
        name: string;
        description?: string;
        image?: string;
        prefill?: {
            email?: string;
            contact?: string;
            name?: string;
        };
        theme?: {
            color?: string;
        };
        [key: string]: any;
    }

    const RazorpayCheckout: {
        open: (options: RazorpayOptions) => Promise<any>;
    };

    export default RazorpayCheckout;
}
