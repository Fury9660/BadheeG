import WebFooter from '@/components/WebFooter';
import { supabase } from '@/config/supabaseConfig';
import { RAZORPAY_CONFIG } from '@/constants/RazorpayConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CheckoutScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState('');

    const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

    const theme = {
        background: isDarkMode ? '#000' : '#fcfcfc',
        text: isDarkMode ? '#fff' : '#000',
        card: isDarkMode ? '#111' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: isDarkMode ? '#fff' : '#000',
        border: isDarkMode ? '#222' : '#f0f0f0',
        success: '#27ae60',
    };

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            const { data: cartData } = await supabase.from('cart').select('*').eq('user_id', user.id);
            if (cartData) setCartItems(cartData);

            const { data: addrData } = await supabase.from('addresses').select('*').eq('user_id', user.id);
            if (addrData) {
                setAddresses(addrData);
                const defaultAddr = addrData.find((a: any) => a.is_default);
                if (defaultAddr) setSelectedAddressId(defaultAddr.id);
                else if (addrData.length > 0) setSelectedAddressId(addrData[0].id);
            }
            setLoading(false);
        };

        fetchData();
    }, [user]);

    const totalItemPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const assemblyPrice = 0;
    const youPay = totalItemPrice;
    
    // COD Logic: 20% advance
    const advanceAmount = 0;
    const remainingCodAmount = youPay;
    
    const finalAmountToPayNow = paymentMethod === 'online' ? youPay : 0;

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            Alert.alert("Address Required", "Please select a delivery address.");
            return;
        }
        
        if (paymentMethod === 'cod') {
            await createOrder('pending', null);
        } else {
            await handleOnlinePayment();
        }
    };

    const handleOnlinePayment = async () => {
        setPlacingOrder(true);
        try {
            const selectedAddress = addresses.find(a => a.id === selectedAddressId);
            const rzpAmount = finalAmountToPayNow * 100;

            // 1. Create order on backend securely
            const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay', {
                body: { action: 'create-order', payload: { amount: rzpAmount, receipt: `RCPT_${Date.now()}` } }
            });

            if (orderError || !orderData || !orderData.id) {
                Alert.alert('Error', 'Failed to initialize payment from server.');
                setPlacingOrder(false);
                return;
            }

            const razorpayOrderId = orderData.id;

            if (Platform.OS === 'web') {
                const res = await loadRazorpayScript();
                if (!res) {
                    Alert.alert('Error', 'Razorpay SDK failed to load.');
                    setPlacingOrder(false);
                    return;
                }

                const options = {
                    key: RAZORPAY_CONFIG.keyId,
                    amount: rzpAmount,
                    order_id: razorpayOrderId, // Added server-side order id
                    currency: RAZORPAY_CONFIG.currency,
                    name: RAZORPAY_CONFIG.name,
                    description: paymentMethod === 'cod' ? 'Order Confirmation' : 'Full Payment for Order',
                    handler: async function (response: any) {
                        // 2. Verify payment on backend securely
                        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay', {
                            body: {
                                action: 'verify-payment',
                                payload: {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                }
                            }
                        });

                        if (verifyError || !verifyData?.success) {
                            Alert.alert('Error', 'Payment verification failed on server.');
                            setPlacingOrder(false);
                            return;
                        }
                        createOrder('paid', response);
                    },
                    prefill: {
                        name: (user as any)?.user_metadata?.full_name || user?.email || 'User',
                        email: user?.email || 'user@example.com',
                        contact: selectedAddress?.mobile || ''
                    },
                    theme: { color: theme.primary }
                };
                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
            } else {
                const options = {
                    description: paymentMethod === 'cod' ? 'Order Confirmation' : 'Full Payment for Order',
                    currency: RAZORPAY_CONFIG.currency,
                    key: RAZORPAY_CONFIG.keyId,
                    amount: rzpAmount,
                    order_id: razorpayOrderId, // Added server-side order id
                    name: RAZORPAY_CONFIG.name,
                    prefill: {
                        email: user?.email || 'user@example.com',
                        contact: selectedAddress?.mobile || '',
                        name: (user as any)?.user_metadata?.full_name || user?.email || 'User'
                    },
                    theme: { color: theme.primary }
                };

                RazorpayCheckout.open(options).then(async (data: any) => {
                    // 2. Verify payment on backend securely
                    const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay', {
                        body: {
                            action: 'verify-payment',
                            payload: {
                                razorpay_order_id: data.razorpay_order_id,
                                razorpay_payment_id: data.razorpay_payment_id,
                                razorpay_signature: data.razorpay_signature
                            }
                        }
                    });

                    if (verifyError || !verifyData?.success) {
                        Alert.alert('Error', 'Payment verification failed on server.');
                        setPlacingOrder(false);
                        return;
                    }
                    createOrder('paid', data);
                }).catch((error: any) => {
                    Alert.alert('Error', `Payment Failed: ${error.description}`);
                    setPlacingOrder(false);
                });
            }
        } catch (error) {
            setPlacingOrder(false);
        }
    };

    const createOrder = async (status: string, paymentDetails: any) => {
        setPlacingOrder(true);
        try {
            const ordersByPartner = cartItems.reduce((acc: any, item: any) => {
                const pid = item.partner_id || 'unknown';
                if (!acc[pid]) acc[pid] = [];
                acc[pid].push(item);
                return acc;
            }, {});

            const orderPromises = Object.keys(ordersByPartner).map(async (pid) => {
                const partnerItems = ordersByPartner[pid];
                const partnerTotal = partnerItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

                    const orderData = {
                        user_id: user?.id,
                        items: partnerItems,
                        address_id: selectedAddressId,
                        total_amount: partnerTotal,
                    status: status === 'paid' ? 'processing' : 'pending',
                    payment_status: status,
                    payment_method: paymentMethod, // Now using state
                    payment_details: {
                        ...(paymentDetails || {}),
                        advance_paid: paymentMethod === 'cod' ? advanceAmount : youPay,
                        remaining_on_delivery: paymentMethod === 'cod' ? remainingCodAmount : 0
                    },
                    order_id: `ORD-${Date.now()}-${pid.slice(0, 4)}`,
                    partner_id: pid !== 'unknown' ? pid : null
                };
                return supabase.from('orders').insert(orderData);
            });

            const results = await Promise.all(orderPromises);
            await supabase.from('cart').delete().eq('user_id', user!.id);

            // Get the created order id for display
            const firstOrderId = `ORD-${Date.now()}`;
            setPlacedOrderId(firstOrderId);
            setOrderSuccess(true);

        } catch (error: any) {
            if (Platform.OS === 'web') {
                window.alert(`Failed to place order: ${(error as any).message}`);
            }
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    }

    // ── ORDER SUCCESS SCREEN ──────────────────────────────────
    if (orderSuccess) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                <ScrollView contentContainerStyle={styles.successScroll}>
                    <View style={[styles.successCard, { backgroundColor: theme.card }]}>

                        {/* Animated Check Circle */}
                        <View style={styles.checkCircleOuter}>
                            <View style={styles.checkCircleInner}>
                                <Feather name="check" size={48} color="#fff" strokeWidth={3} />
                            </View>
                        </View>

                        <Text style={[styles.successTitle, { color: theme.text }]}>Order Placed! 🎉</Text>
                        <Text style={[styles.successSub, { color: theme.subtext }]}>
                            Your order has been placed successfully. We'll notify you once it's confirmed.
                        </Text>

                        {/* Details */}
                        <View style={[styles.successDetails, { backgroundColor: isDarkMode ? '#111' : '#f8f8f8', borderColor: theme.border }]}>
                            <View style={styles.successRow}>
                                <MaterialCommunityIcons name="package-variant-closed" size={18} color={theme.subtext} />
                                <Text style={[styles.successRowText, { color: theme.subtext }]}>Payment</Text>
                                <Text style={[styles.successRowVal, { color: theme.text }]}>
                                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Paid'}
                                </Text>
                            </View>
                            <View style={[styles.successDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.successRow}>
                                <MaterialCommunityIcons name="currency-inr" size={18} color={theme.subtext} />
                                <Text style={[styles.successRowText, { color: theme.subtext }]}>Total Amount</Text>
                                <Text style={[styles.successRowVal, { color: theme.text }]}>₹{youPay.toLocaleString('en-IN')}</Text>
                            </View>
                            <View style={[styles.successDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.successRow}>
                                <MaterialCommunityIcons name="truck-delivery-outline" size={18} color={theme.subtext} />
                                <Text style={[styles.successRowText, { color: theme.subtext }]}>Delivery to</Text>
                                <Text style={[styles.successRowVal, { color: theme.text }]} numberOfLines={1}>
                                    {addresses.find(a => a.id === selectedAddressId)?.city || 'Your Address'}
                                </Text>
                            </View>
                        </View>

                        {/* Buttons */}
                        <TouchableOpacity
                            style={[styles.successPrimaryBtn, { backgroundColor: theme.primary }]}
                            onPress={() => router.replace('/my-orders')}
                        >
                            <Feather name="package" size={18} color={isDarkMode ? '#000' : '#fff'} />
                            <Text style={[styles.successPrimaryBtnText, { color: isDarkMode ? '#000' : '#fff' }]}>Track My Order</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.successSecondaryBtn, { borderColor: theme.border }]}
                            onPress={() => router.replace('/')}
                        >
                            <Text style={[styles.successSecondaryBtnText, { color: theme.subtext }]}>Continue Shopping</Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: isDesktop ? 70 : 0 }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {!isDesktop && (
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 15), backgroundColor: theme.card }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Checkout</Text>
                    <View style={{ width: 40 }} />
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isDesktop ? 40 : 150 }}>
                <View style={{ width: '100%', maxWidth: 1400, alignSelf: 'center', paddingHorizontal: isDesktop ? 40 : 0 }}>
                    
                    {isDesktop && (
                        <View style={{ marginTop: 40, marginBottom: 20 }}>
                            <Text style={{ fontSize: 32, fontWeight: '900', color: theme.text }}>Complete Your Order</Text>
                        </View>
                    )}

                    <View style={[isDesktop ? { flexDirection: 'row', gap: 60 } : { paddingHorizontal: 20, gap: 30 }]}>
                        
                        {/* Left Side: Delivery & Payment */}
                        <View style={{ flex: isDesktop ? 1.6 : 1, gap: 40 }}>
                            
                            {/* Delivery Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionLabel, { color: theme.subtext }, isDesktop && { fontSize: 14 }]}>DELIVERY ADDRESS</Text>
                                <View style={{ gap: 12, marginTop: 15 }}>
                                    {addresses.map((addr) => (
                                        <TouchableOpacity
                                            key={addr.id}
                                            style={[
                                                styles.addressCard,
                                                { 
                                                    backgroundColor: theme.card, 
                                                    borderColor: selectedAddressId === addr.id ? theme.text : theme.border,
                                                    borderWidth: selectedAddressId === addr.id ? 2 : 1
                                                },
                                                isDesktop && { padding: 20 }
                                            ]}
                                            onPress={() => setSelectedAddressId(addr.id)}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                    <Text style={[styles.addrName, { color: theme.text }, isDesktop && { fontSize: 18 }]}>{addr.name}</Text>
                                                    <View style={[styles.tag, { backgroundColor: theme.border }]}>
                                                        <Text style={[styles.tagText, { color: theme.subtext }]}>{addr.type}</Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.addrText, { color: theme.subtext }, isDesktop && { fontSize: 14, lineHeight: 22 }]} numberOfLines={2}>
                                                    {addr.line1}, {addr.city} - {addr.pincode}
                                                </Text>
                                                <Text style={[styles.addrMobile, { color: theme.text }, isDesktop && { fontSize: 14 }]}>+91 {addr.mobile}</Text>
                                            </View>
                                            <Feather 
                                                name={selectedAddressId === addr.id ? "check-circle" : "circle"} 
                                                size={24} 
                                                color={selectedAddressId === addr.id ? theme.text : theme.border} 
                                            />
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity style={[styles.addAddressRow]} onPress={() => router.push('/add-address')}>
                                        <Feather name="plus" size={16} color={theme.text} />
                                        <Text style={[styles.addAddressText, { color: theme.text }]}>Add New Address</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Payment Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionLabel, { color: theme.subtext }, isDesktop && { fontSize: 14 }]}>PAYMENT METHOD</Text>
                                <View style={{ gap: 12, marginTop: 15 }}>
                                    {/* Full Online */}
                                    <TouchableOpacity
                                        style={[
                                            styles.paymentCard,
                                            { backgroundColor: theme.card, borderColor: paymentMethod === 'online' ? theme.text : theme.border, borderWidth: paymentMethod === 'online' ? 2 : 1 },
                                            isDesktop && { padding: 20 }
                                        ]}
                                        onPress={() => setPaymentMethod('online')}
                                    >
                                        <View style={styles.paymentInfo}>
                                            <MaterialCommunityIcons name="credit-card-outline" size={28} color={theme.text} />
                                            <View>
                                                <Text style={[styles.paymentTitle, { color: theme.text }, isDesktop && { fontSize: 18 }]}>Full Online Payment</Text>
                                                <Text style={[styles.paymentSub, { color: theme.subtext }, isDesktop && { fontSize: 14 }]}>100% Safe & Secure Checkout</Text>
                                            </View>
                                        </View>
                                        <Feather name={paymentMethod === 'online' ? "check-circle" : "circle"} size={24} color={theme.text} />
                                    </TouchableOpacity>

                                    {/* COD */}
                                    <TouchableOpacity
                                        style={[
                                            styles.paymentCard,
                                            { backgroundColor: theme.card, borderColor: paymentMethod === 'cod' ? theme.text : theme.border, borderWidth: paymentMethod === 'cod' ? 2 : 1 },
                                            isDesktop && { padding: 20 }
                                        ]}
                                        onPress={() => setPaymentMethod('cod')}
                                    >
                                        <View style={styles.paymentInfo}>
                                            <MaterialCommunityIcons name="truck-delivery-outline" size={28} color={theme.text} />
                                            <View>
                                                <Text style={[styles.paymentTitle, { color: theme.text }, isDesktop && { fontSize: 18 }]}>Cash on Delivery</Text>
                                                <Text style={[styles.paymentSub, { color: theme.subtext }, isDesktop && { fontSize: 14 }]}>Pay ₹{youPay.toLocaleString('en-IN')} on delivery</Text>
                                            </View>
                                        </View>
                                        <Feather name={paymentMethod === 'cod' ? "check-circle" : "circle"} size={24} color={theme.text} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Right Side: Order Summary */}
                        <View style={{ flex: isDesktop ? 1 : undefined }}>
                            <View style={[
                                styles.summaryBox, 
                                { backgroundColor: theme.card, borderColor: theme.border },
                                isDesktop && { position: Platform.OS === 'web' ? 'sticky' : 'relative', top: 100, padding: 30 }
                            ]}>
                                <Text style={[styles.summaryHeader, { color: theme.text }, isDesktop && { fontSize: 18 }]}>Order Summary</Text>
                                
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryItem, { color: theme.subtext }, isDesktop && { fontSize: 15 }]}>Order Total</Text>
                                    <Text style={[styles.summaryValue, { color: theme.text }, isDesktop && { fontSize: 15 }]}>₹{youPay.toLocaleString('en-IN')}</Text>
                                </View>

                                {paymentMethod === 'cod' && (
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryItem, { color: theme.success }, isDesktop && { fontSize: 15 }]}>Payable on Delivery</Text>
                                        <Text style={[styles.summaryValue, { color: theme.success }, isDesktop && { fontSize: 15 }]}>₹{youPay.toLocaleString('en-IN')}</Text>
                                    </View>
                                )}

                                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                                <View style={styles.summaryRow}>
                                    <Text style={[styles.totalLabel, { color: theme.text }, isDesktop && { fontSize: 18 }]}>Amount to Pay Now</Text>
                                    <Text style={[styles.totalValue, { color: theme.text }, isDesktop && { fontSize: 22 }]}>₹{finalAmountToPayNow.toLocaleString('en-IN')}</Text>
                                </View>

                                {isDesktop && (
                                    <TouchableOpacity
                                        style={[styles.placeOrderBtn, { backgroundColor: theme.primary, width: '100%', marginTop: 30, justifyContent: 'center', height: 60, borderRadius: 16, opacity: placingOrder ? 0.7 : 1 }]}
                                        onPress={handlePlaceOrder}
                                        disabled={placingOrder}
                                    >
                                        {placingOrder ? (
                                            <ActivityIndicator color={isDarkMode ? '#000' : '#fff'} />
                                        ) : (
                                            <>
                                                <Text style={[styles.placeOrderText, { color: isDarkMode ? '#000' : '#fff' }, isDesktop && { fontSize: 16 }]}>{paymentMethod === 'cod' ? 'CONFIRM ORDER' : 'PAY NOW'}</Text>
                                                <Feather name="arrow-right" size={20} color={isDarkMode ? '#000' : '#fff'} />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {!isDesktop && (
                <View style={[styles.bottomBar, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <View>
                        <Text style={[styles.totalLabelSmall, { color: theme.subtext }]}>TOTAL</Text>
                        <Text style={[styles.totalValueLarge, { color: theme.text }]}>₹{finalAmountToPayNow.toLocaleString('en-IN')}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.placeOrderBtn, { backgroundColor: theme.primary, opacity: placingOrder ? 0.7 : 1 }]}
                        onPress={handlePlaceOrder}
                        disabled={placingOrder}
                    >
                        {placingOrder ? (
                            <ActivityIndicator color={isDarkMode ? '#000' : '#fff'} />
                        ) : (
                            <>
                            <Text style={[styles.placeOrderText, { color: isDarkMode ? '#000' : '#fff' }]}>{paymentMethod === 'cod' ? 'CONFIRM ORDER' : 'PAY NOW'}</Text>
                                <Feather name="arrow-right" size={18} color={isDarkMode ? '#000' : '#fff'} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    // ── Success Screen ──
    successScroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 60 },
    successCard: {
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0 20px 60px rgba(0,0,0,0.10)', maxWidth: 480, alignSelf: 'center', width: '100%' } as any,
            default: { elevation: 8 },
        }),
    },
    checkCircleOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(52,199,89,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    checkCircleInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#34C759',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
    successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28, maxWidth: 300 },
    successDetails: {
        width: '100%',
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
        marginBottom: 28,
        gap: 4,
    },
    successRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    successRowText: { flex: 1, fontSize: 14 },
    successRowVal: { fontSize: 14, fontWeight: '700' },
    successDivider: { height: 1, marginVertical: 2 },
    successPrimaryBtn: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },
    successPrimaryBtnText: { fontSize: 16, fontWeight: '800' },
    successSecondaryBtn: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successSecondaryBtnText: { fontSize: 15, fontWeight: '600' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingBottom: 12, 
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        zIndex: 10
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.8 },
    section: { marginTop: 10 },
    sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    addressCard: { padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 15 },
    addrName: { fontSize: 15, fontWeight: '700' },
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    addrText: { fontSize: 13, lineHeight: 18, marginTop: 2 },
    addrMobile: { fontSize: 13, fontWeight: '600', marginTop: 8 },
    addAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, paddingLeft: 4 },
    addAddressText: { fontSize: 14, fontWeight: '700' },
    paymentCard: { padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 },
    paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    paymentTitle: { fontSize: 15, fontWeight: '700' },
    paymentSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    summaryBox: { padding: 20, borderRadius: 20, borderWidth: 1 },
    summaryHeader: { fontSize: 14, fontWeight: '800', marginBottom: 15, letterSpacing: 0.5, textTransform: 'uppercase' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryItem: { fontSize: 13, fontWeight: '500' },
    summaryValue: { fontSize: 13, fontWeight: '700' },
    divider: { height: 1, marginVertical: 15 },
    totalLabel: { fontSize: 15, fontWeight: '800' },
    totalValue: { fontSize: 16, fontWeight: '900' },
    bottomBar: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 25, 
        paddingTop: 12, 
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    totalLabelSmall: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    totalValueLarge: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    placeOrderBtn: { height: 52, paddingHorizontal: 28, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    placeOrderText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 }
});

export default CheckoutScreen;
