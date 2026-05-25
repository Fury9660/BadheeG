import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PartnerOrdersScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { partnerId } = useLocalSearchParams();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const theme = {
        background: isDarkMode ? '#000000' : '#F2F2F7',
        card: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        subtext: isDarkMode ? '#8E8E93' : '#8E8E93',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        accent: isDarkMode ? '#3A3A3C' : '#E5E5EA',
        danger: '#FF453A',
        success: '#32D74B',
    };

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [partnerName, setPartnerName] = useState('');

    const fetchOrders = async () => {
        if (!partnerId) return;
        try {
            // Fetch Partner Details for Title
            const { data: pData } = await supabase
                .from('pre_approved_partners')
                .select('store_name')
                .eq('id', partnerId)
                .single();
            if (pData) setPartnerName(pData.store_name);

            // Fetch Orders
            const { data, error } = await supabase
                .from('orders')
                .select('*, addresses(*)')
                .eq('partner_id', partnerId)
                .order('created_at', { ascending: false });

            if (data) setOrders(data);
            if (error) console.error(error);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [partnerId]);

    const StatusBadge = ({ status }: { status: string }) => {
        let color = '#8E8E93';
        let bg = 'rgba(142, 142, 147, 0.1)';
        switch (status?.toLowerCase()) {
            case 'pending': case 'processing': color = '#FF9500'; bg = 'rgba(255, 149, 0, 0.1)'; break;
            case 'shipped': color = '#007AFF'; bg = 'rgba(0, 122, 255, 0.1)'; break;
            case 'delivered': case 'completed': color = '#34C759'; bg = 'rgba(52, 199, 89, 0.1)'; break;
            case 'cancelled': color = '#FF3B30'; bg = 'rgba(255, 59, 48, 0.1)'; break;
        }
        return (
            <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                <Text style={[styles.statusText, { color }]}>{status || 'Pending'}</Text>
            </View>
        );
    };

    const OrderItem = ({ item }: { item: any }) => {
        const orderDate = new Date(item.created_at);
        return (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.accent }]}>
                    <View>
                        <Text style={[styles.orderId, { color: theme.text }]}>#{item.order_id || item.id.slice(-6).toUpperCase()}</Text>
                        <Text style={[styles.date, { color: theme.subtext }]}>{orderDate.toLocaleDateString()} • {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                </View>

                <View style={[styles.itemsContainer, { borderBottomColor: theme.accent }]}>
                    {item.items?.map((prod: any, idx: number) => (
                        <View key={idx} style={styles.productRow}>
                            <View style={[styles.productImagePlaceholder, { backgroundColor: theme.accent }]}>
                                {(prod.image || prod.images?.[0]) ? <Image source={{ uri: prod.image || prod.images?.[0] }} style={{ width: 40, height: 40, borderRadius: 8 }} /> : <Feather name="package" size={16} color={theme.subtext} />}
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{prod.name}</Text>
                                <Text style={[styles.productQty, { color: theme.subtext }]}>Qty: {prod.quantity} × ₹{prod.price}</Text>
                            </View>
                            <Text style={[styles.productPrice, { color: theme.text }]}>₹{prod.price * prod.quantity}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.billingContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="map-pin" size={14} color={theme.subtext} />
                            <Text style={[styles.billingHeader, { color: theme.subtext }]}> DELIVERY TO</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 15 }}>
                            <Text style={[styles.customerName, { color: theme.text }]}>{item.addresses?.name || 'Customer'}</Text>
                            <Text style={[styles.addressText, { color: theme.subtext }]}>{item.addresses?.line1}{item.addresses?.line2 ? `, ${item.addresses.line2}` : ''}{`\n${item.addresses?.city}, ${item.addresses?.state} - ${item.addresses?.pincode}`}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={[styles.header, { paddingTop: insets.top + 10, paddingBottom: 16, backgroundColor: theme.background, borderBottomColor: theme.accent, borderBottomWidth: 1 }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.pageTitle, { color: theme.text }]}>Orders History</Text>
                    <Text style={[styles.subTitle, { color: theme.subtext }]}>{partnerName}</Text>
                </View>
            </View>

            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {loading ? <ActivityIndicator size="large" color={theme.text} style={{ marginTop: 50 }} /> :
                    orders.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="inbox" size={48} color={theme.subtext} />
                            <Text style={[styles.emptyText, { color: theme.subtext }]}>No orders found</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 16 }}>
                            {orders.map(order => <OrderItem key={order.id} item={order} />)}
                        </View>
                    )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
    pageTitle: { fontSize: 20, fontWeight: '800' },
    subTitle: { fontSize: 13 },
    card: { borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    orderId: { fontSize: 16, fontWeight: '800' },
    date: { fontSize: 12, marginTop: 2 },
    itemsContainer: { paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
    productRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    productImagePlaceholder: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    productName: { fontSize: 14, fontWeight: '600' },
    productQty: { fontSize: 12 },
    productPrice: { fontSize: 14, fontWeight: '600' },
    billingContainer: { padding: 20 },
    billingHeader: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    customerName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    addressText: { fontSize: 13, lineHeight: 18 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 12 },
    emptyText: { fontSize: 16, fontWeight: '600' },
});

export default PartnerOrdersScreen;
