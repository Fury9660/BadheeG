import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrdersScreen() {
    const { colors: theme, isDarkMode } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
    const isDesktop = containerWidth > 1024;
    const isTablet = containerWidth > 768 && containerWidth <= 1024;
    const numColumns = (isDesktop || isTablet) ? 2 : 1;

    const [activeFilter, setActiveFilter] = useState('All');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const filters = ['All', 'Pending', 'Processing', 'Manifested', 'Shipped', 'Delivered', 'Cancelled'];

    const fetchOrders = useCallback(async () => {
        if (!user) { setLoading(false); setRefreshing(false); return; }
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, addresses:address_id (*)`)
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setOrders(data || []);
        } catch (error: any) {
            console.error('Error fetching orders:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const handleCall = (phone: string) => {
        if (!phone) { Alert.alert('Error', 'Phone number not available.'); return; }
        Linking.openURL(`tel:${phone}`);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus.toLowerCase() })
                .eq('id', orderId);
            if (error) throw error;
            Alert.alert('Success', `Order marked as ${newStatus}`);
            fetchOrders();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to update order status');
        }
    };

    const filteredOrders = orders.filter(order => {
        if (activeFilter === 'All') return true;
        return order.status?.toLowerCase() === activeFilter.toLowerCase();
    });

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { bg: '#FFF7ED', text: '#EA580C', icon: 'clock' };
            case 'processing': return { bg: '#EFF6FF', text: '#2563EB', icon: 'loader' };
            case 'manifested':
            case 'shipped': return { bg: '#F5F3FF', text: '#7C3AED', icon: 'package' };
            case 'delivered': return { bg: '#ECFDF5', text: '#059669', icon: 'check-circle' };
            case 'cancelled': return { bg: '#FEF2F2', text: '#DC2626', icon: 'x-circle' };
            default: return { bg: '#F1F5F9', text: '#64748B', icon: 'help-circle' };
        }
    };

    const renderOrderCard = ({ item }: { item: any }) => {
        const address = item.addresses;
        const date = new Date(item.created_at);
        const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const status = getStatusStyles(item.status);

        const totalPadding = 24 * 2 + 40 * 2 + 32; // content padding + list padding + gap
        const cardWidth = (isDesktop || isTablet) ? (containerWidth - totalPadding) / 2 : '100%';

        return (
            <View style={[styles.card, { backgroundColor: theme.card, width: cardWidth as any }]}>
                {/* Header: ID & Status */}
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={[styles.orderId, { color: theme.text }]}>Order #{item.order_id || item.id.slice(0, 8)}</Text>
                        <Text style={styles.orderDate}>{dateStr}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Feather name={status.icon as any} size={12} color={status.text} />
                        <Text style={[styles.statusText, { color: status.text }]}>{item.status?.toUpperCase() || 'PENDING'}</Text>
                    </View>
                </View>

                {/* Products */}
                <View style={styles.productsContainer}>
                    {item.items?.map((prod: any, idx: number) => (
                        <View key={idx} style={styles.productRow}>
                            <Image source={{ uri: prod.image || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=200&auto=format&fit=crop' }} style={styles.productImage} />
                            <View style={styles.productInfo}>
                                <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{prod.name}</Text>
                                <Text style={styles.productDetails}>Qty: {prod.quantity || 1} • ₹{prod.price}</Text>
                            </View>
                            <Text style={[styles.itemTotal, { color: theme.text }]}>₹{(prod.quantity || 1) * prod.price}</Text>
                        </View>
                    ))}
                </View>

                {/* Customer & Address */}
                <View style={[styles.customerSection, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F8FAFC' }]}>
                    <View style={styles.customerInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{address?.name?.charAt(0) || 'C'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.customerName, { color: theme.text }]}>{address?.name || 'Customer'}</Text>
                            <Text style={styles.customerAddress} numberOfLines={2}>
                                {address ? `${address.line1}, ${address.city}` : 'No address provided'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.callFab} onPress={() => handleCall(address?.mobile)}>
                            <Feather name="phone" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer: Payment & Actions */}
                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={[styles.totalAmount, { color: theme.text }]}>₹{item.total_amount}</Text>
                    </View>
                    
                    <View style={styles.footerRight}>
                        <View style={[styles.paymentBadge, { borderColor: item.payment_status === 'paid' ? '#10B981' : '#F59E0B' }]}>
                            <Text style={[styles.paymentText, { color: item.payment_status === 'paid' ? '#10B981' : '#F59E0B' }]}>
                                {item.payment_status?.toUpperCase() || 'UNPAID'}
                            </Text>
                        </View>
                        
                        {item.status === 'pending' ? (
                            <TouchableOpacity onPress={() => handleUpdateStatus(item.id, 'processing')}>
                                <LinearGradient colors={['#10B981', '#059669']} style={styles.shipBtn}>
                                    <Text style={styles.shipBtnText}>Accept</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (item.status === 'processing' || item.status === 'packed') ? (
                            <TouchableOpacity onPress={() => {
                                // Navigate to details to use Delhivery
                                router.push({ pathname: '/order-details', params: { id: item.id } });
                            }}>
                                <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.shipBtn}>
                                    <Text style={styles.shipBtnText}>Ship</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F8FAFC' }]} edges={['top']} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleGroup}>
                        <Text style={[styles.title, { color: theme.text }]}>Orders</Text>
                        <View style={styles.dot} />
                        <Text style={styles.subTitle}>Management</Text>
                    </View>
                    <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFF' }]} onPress={onRefresh}>
                        <Feather name="refresh-cw" size={18} color="#5856D6" />
                    </TouchableOpacity>
                </View>

                {/* Filters */}
                <View style={styles.filterWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                        {filters.map((f) => (
                            <TouchableOpacity 
                                key={f} 
                                style={[styles.filterChip, activeFilter === f && { backgroundColor: '#5856D6', borderColor: '#5856D6' }, { borderColor: isDarkMode ? '#333' : '#E2E8F0' }]} 
                                onPress={() => setActiveFilter(f)}
                            >
                                <Text style={[styles.filterText, { color: activeFilter === f ? '#FFF' : '#64748B' }]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#5856D6" /></View>
                ) : (
                    <FlatList
                        key={numColumns}
                        data={filteredOrders}
                        renderItem={renderOrderCard}
                        keyExtractor={(item) => item.id}
                        numColumns={numColumns}
                        columnWrapperStyle={numColumns > 1 ? { gap: 32, paddingHorizontal: 40 } : undefined}
                        contentContainerStyle={[styles.listContent, isDesktop && { paddingHorizontal: 40 }]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5856D6" />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBox}><Feather name="shopping-bag" size={40} color="#CBD5E1" /></View>
                                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                                <Text style={styles.emptySub}>Orders will appear here once customers start buying.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, maxWidth: 1400, alignSelf: 'center', width: '100%', paddingHorizontal: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
    titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1', marginTop: 8 },
    subTitle: { fontSize: 24, fontWeight: '500', color: '#64748B', marginTop: 2 },
    refreshBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    filterWrapper: { marginBottom: 16 },
    filterList: { paddingHorizontal: 24, gap: 10, paddingBottom: 10 },
    filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, borderWidth: 1, backgroundColor: 'transparent' },
    filterText: { fontSize: 14, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    card: { borderRadius: 32, marginBottom: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 5, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    orderId: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    orderDate: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    productsContainer: { marginBottom: 20, gap: 16 },
    productRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    productImage: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F1F5F9' },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '800' },
    productDetails: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
    itemTotal: { fontSize: 16, fontWeight: '900' },
    customerSection: { borderRadius: 24, padding: 16, marginBottom: 20 },
    customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#5856D6', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
    customerName: { fontSize: 16, fontWeight: '800' },
    customerAddress: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },
    callFab: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20 },
    amountLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
    totalAmount: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    footerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    paymentText: { fontSize: 10, fontWeight: '900' },
    shipBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
    shipBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#475569' },
    emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

// Import missing Dimensions
import { Dimensions } from 'react-native';
