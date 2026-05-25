import CartItem from '@/components/CartItem';
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { useUI } from '@/store/UIContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CartScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const router = useRouter();
    const { setLoginDrawerOpen } = useUI();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userAddress, setUserAddress] = useState<any>(null);

    const FOOTER_PADDING = insets.bottom > 0 ? insets.bottom : 20;

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
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchAddress = async () => {
            const { data } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_default', true)
                .single();

            if (data) {
                setUserAddress(`${data.city}, ${data.state}`);
            }
        };
        fetchAddress();

        const fetchCart = async () => {
            const { data } = await supabase
                .from('cart')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setCartItems(data);
            setLoading(false);
        };

        fetchCart();
        const channel = supabase
            .channel(`cart_realtime_${user.id}_${Math.random().toString(36).substring(7)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cart', filter: `user_id=eq.${user.id}` }, () => {
                fetchCart();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const updateQuantity = async (itemId: string, currentQty: number, delta: number) => {
        const newQty = Math.max(1, currentQty + delta);
        if (newQty === currentQty) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Optimistic update
        setCartItems(prev => prev.map(item => 
            item.id === itemId ? { ...item, quantity: newQty } : item
        ));

        const { error } = await supabase.from('cart').update({ quantity: newQty }).eq('id', itemId);
        if (error) {
            // Rollback on error
            setCartItems(prev => prev.map(item => 
                item.id === itemId ? { ...item, quantity: currentQty } : item
            ));
            Alert.alert("Error", "Could not update quantity");
        }
    };

    const removeItem = async (itemId: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Optimistic update
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        await supabase.from('cart').delete().eq('id', itemId);
    };

    const totalItemPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const youPay = totalItemPrice;

    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator color={theme.primary} size="small" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', padding: 40 }]}>
                <Text style={[styles.emptyHeader, { color: theme.text, textAlign: 'center' }]}>Please Login</Text>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 20 }]} onPress={() => setLoginDrawerOpen(true)}>
                    <Text style={[styles.btnText, { textAlign: 'center' }]}>Login to View Cart</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isWebPlatform = Platform.OS === 'web';

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: isDesktop ? 70 : 0 }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header - Only on Mobile */}
            {!isDesktop && (
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 15), backgroundColor: theme.card }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Cart</Text>
                    <View style={{ width: 24 }} />
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isDesktop ? 40 : 150 }}>
                <View style={{ width: '100%', maxWidth: 1400, alignSelf: 'center', paddingHorizontal: isDesktop ? 40 : 0 }}>
                    
                    {/* Minimal Address Bar */}
                    <TouchableOpacity 
                        style={[styles.addressBar, { borderBottomColor: theme.border }, isDesktop && { marginTop: 20, borderRadius: 16, borderWidth: 1, backgroundColor: theme.card, maxWidth: 500, alignSelf: 'flex-start' }]}
                        onPress={() => router.push('/my-addresses')}
                    >
                        <Feather name="map-pin" size={14} color={theme.subtext} />
                        <Text style={[styles.addressText, { color: theme.subtext }]}>
                            Deliver to: <Text style={{ color: theme.text, fontWeight: '700' }}>{userAddress || "Set Address"}</Text>
                        </Text>
                        <Feather name="chevron-right" size={14} color={theme.subtext} />
                    </TouchableOpacity>

                    {cartItems.length > 0 ? (
                        <View style={[isDesktop ? { flexDirection: 'row', gap: 40, marginTop: 40 } : { paddingHorizontal: 20, marginTop: 20 }]}>
                            
                            {/* Items List (Left Side on Desktop) */}
                            <View style={{ flex: isDesktop ? 1.8 : 1 }}>
                                <View style={styles.itemsList}>
                                    {cartItems.map((item) => (
                                        <CartItem key={item.id} item={item} updateQuantity={updateQuantity} removeItem={removeItem} />
                                    ))}
                                </View>
                            </View>

                            {/* Order Summary (Right Side on Desktop) */}
                            <View style={{ flex: isDesktop ? 1 : undefined }}>
                                <View style={[
                                    styles.summaryBox, 
                                    { backgroundColor: theme.card, borderColor: theme.border },
                                    isDesktop && { position: Platform.OS === 'web' ? 'sticky' : 'relative', top: 100 }
                                ]}>
                                    <Text style={[styles.summaryLabel, { color: theme.text }]}>Order Details</Text>
                                    
                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryItem, { color: theme.subtext }]}>Subtotal</Text>
                                        <Text style={[styles.summaryValue, { color: theme.text }]}>₹{totalItemPrice.toLocaleString('en-IN')}</Text>
                                    </View>

                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.summaryItem, { color: theme.subtext }]}>Shipping</Text>
                                        <Text style={[styles.summaryValue, { color: theme.success }]}>Free</Text>
                                    </View>

                                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                                    <View style={styles.summaryRow}>
                                        <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                                        <Text style={[styles.totalValue, { color: theme.text }]}>₹{youPay.toLocaleString('en-IN')}</Text>
                                    </View>

                                    {isDesktop && (
                                        <TouchableOpacity
                                            style={[styles.checkoutBtn, { backgroundColor: theme.primary, width: '100%', marginTop: 30, justifyContent: 'center' }]}
                                            onPress={() => router.push('/checkout')}
                                        >
                                            <Text style={[styles.checkoutText, { color: isDarkMode ? '#000' : '#fff' }]}>PROCEED TO CHECKOUT</Text>
                                            <Feather name="arrow-right" size={18} color={isDarkMode ? '#000' : '#fff'} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Feather name="shopping-bag" size={60} color={theme.border} />
                            <Text style={[styles.emptyHeader, { color: theme.text }]}>Your cart is empty</Text>
                            <TouchableOpacity 
                                style={[styles.primaryBtn, { backgroundColor: theme.primary, marginTop: 24 }]} 
                                onPress={() => router.push('/(tabs)')}
                            >
                                <Text style={styles.btnText}>Browse Collection</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {cartItems.length > 0 && !isDesktop && (
                <View style={[styles.bottomBar, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <View>
                        <Text style={[styles.totalLabelSmall, { color: theme.subtext }]}>TOTAL</Text>
                        <Text style={[styles.totalValueLarge, { color: theme.text }]}>₹{youPay.toLocaleString('en-IN')}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.checkoutBtn, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/checkout')}
                    >
                        <Text style={[styles.checkoutText, { color: isDarkMode ? '#000' : '#fff' }]}>CHECKOUT</Text>
                        <Feather name="arrow-right" size={18} color={isDarkMode ? '#000' : '#fff'} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    addressBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12, 
        paddingHorizontal: 20, 
        borderBottomWidth: 1,
        gap: 10
    },
    addressText: { flex: 1, fontSize: 12 },
    itemsList: { marginBottom: 30 },
    summaryBox: { padding: 20, borderRadius: 20, borderWidth: 1 },
    summaryLabel: { fontSize: 14, fontWeight: '800', marginBottom: 15, letterSpacing: 0.5, textTransform: 'uppercase' },
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
    checkoutBtn: { 
        height: 52, 
        paddingHorizontal: 28, 
        borderRadius: 14, 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12 
    },
    checkoutText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyHeader: { fontSize: 20, fontWeight: '800', marginTop: 20 },
    primaryBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' }
});

export default CartScreen;
