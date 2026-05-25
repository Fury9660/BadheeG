import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../config/supabaseConfig';
import { useAuth } from '../../../store/AuthContext';
import { useTheme } from '../../../store/ThemeContext';

const OrdersScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { user, partnerId } = useAuth();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [updating, setUpdating] = useState<string | null>(null);
    const [resolvedPartnerId, setResolvedPartnerId] = useState<string | null>(null);

    const statuses = ['All', 'Pending', 'Shipped', 'Delivered', 'Returned', 'Cancelled'];

    const theme = {
        background: '#F2F4F7',
        text: '#000000',
        subtext: '#666666',
        card: '#FFFFFF',
        border: '#E5E7EB',
        primary: '#000000',
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            // Always fetch fresh partner ID from DB (bypasses stale cached partnerId)
            const { data: partnerRecord } = await supabase
                .from('pre_approved_partners')
                .select('id')
                .eq('user_id', user.id)
                .single();

            const targetPartnerId = partnerRecord?.id || partnerId || user.id;
            console.log('Fetching orders for partner:', targetPartnerId);
            setResolvedPartnerId(targetPartnerId);

            const { data, error } = await supabase
                .from('orders')
                .select('*, addresses(*)')
                .eq('partner_id', targetPartnerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('Orders Data:', data?.length, 'orders found');
            if (data) setOrders(data);
        } catch (err) {
            console.error('Fetch orders error', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, partnerId]);

    useEffect(() => {
        fetchData();

        const channel = supabase.channel('orders-list-v3')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: resolvedPartnerId ? `partner_id=eq.${resolvedPartnerId}` : undefined }, fetchData)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fetchData();
    };

    useEffect(() => {
        if (selectedStatus === 'All') {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(o =>
                (o.status || 'Pending').toLowerCase() === selectedStatus.toLowerCase()
            ));
        }
    }, [selectedStatus, orders]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setUpdating(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Optimistic update
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            Alert.alert("Success", `Order updated to ${newStatus}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error("Error updating status:", error);
            Alert.alert("Error", "Failed to update order status");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setUpdating(null);
        }
    };

    const handleCallCustomer = (mobile: string) => {
        if (mobile) {
            Linking.openURL(`tel:${mobile}`);
        } else {
            Alert.alert("Error", "No mobile number available.");
        }
    };

    const renderOrder = ({ item }: { item: any }) => {
        const items = typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []);
        const firstItem = items[0] || {};
        const address = item.addresses || {};
        const isUpdating = updating === item.id;

        return (
            <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.9}
                onPress={() => {
                    router.push({
                        pathname: '/order-details/[id]',
                        params: { id: item.id }
                    });
                }}
            >
                {/* Header: ID, Date, Status */}
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}-{item.id.slice(9, 13)}</Text>
                        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, {
                        backgroundColor: item.status === 'Delivered' ? '#DCFCE7' : item.status === 'Shipped' ? '#DBEAFE' : item.status === 'Returned' ? '#FEE2E2' : '#F3F4F6'
                    }]}>
                        <Text style={[styles.statusText, {
                            color: item.status === 'Delivered' ? '#166534' : item.status === 'Shipped' ? '#1E40AF' : item.status === 'Returned' ? '#991B1B' : '#374151'
                        }]}>{item.status || 'Pending'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Product Section */}
                <View style={styles.productSection}>
                    <Image source={{ uri: firstItem.image || 'https://via.placeholder.com/60' }} style={styles.productImage} />
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.productName} numberOfLines={1}>{firstItem.name || 'Unknown Product'}</Text>
                        <Text style={styles.productMeta}>Qty: {firstItem.quantity || 1} × ₹{(firstItem.price || 0).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.productTotal}>₹{((firstItem.price || 0) * (firstItem.quantity || 1)).toLocaleString()}</Text>
                </View>

                <View style={styles.divider} />

                {/* Delivery Section */}
                <View style={styles.deliverySection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Feather name="map-pin" size={12} color="#6B7280" />
                            <Text style={styles.sectionLabel}>DELIVERY TO</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            <View style={styles.tagPaid}><Text style={styles.tagTextPaid}>PAID</Text></View>
                            <View style={styles.tagOnline}><Text style={styles.tagTextOnline}>ONLINE</Text></View>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, marginRight: 16 }}>
                            <Text style={styles.customerName}>{address.name || 'Customer'}</Text>
                            <Text style={styles.addressText} numberOfLines={2}>
                                {[address.line1, address.line2, address.city, address.pincode].filter(Boolean).join(', ')}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.phoneButton} onPress={() => handleCallCustomer(address.mobile)}>
                            <Feather name="phone" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Footer: Amount & Actions */}
                <View style={styles.footer}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Feather name="info" size={12} color="#9CA3AF" />
                        </View>
                        <Text style={styles.totalAmount}>₹{(item.total_amount || 0).toLocaleString()}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.printButton}>
                            <Feather name="printer" size={20} color="#374151" />
                        </TouchableOpacity>

                        {/* Quick Actions based on Status */}
                        {(item.status === 'Pending' || !item.status) && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#000' }]}
                                onPress={() => updateStatus(item.id, 'Shipped')}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Ship Now</Text>}
                            </TouchableOpacity>
                        )}

                        {item.status === 'Shipped' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#166534' }]}
                                onPress={() => updateStatus(item.id, 'Delivered')}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Mark Delivered</Text>}
                            </TouchableOpacity>
                        )}

                        {item.status === 'Delivered' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
                                onPress={() => updateStatus(item.id, 'Returned')}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.actionButtonText}>Return Order</Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Orders</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <Feather name="refresh-cw" size={20} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                    {statuses.map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => {
                                console.log("Selecting status:", item);
                                Haptics.selectionAsync();
                                setSelectedStatus(item);
                            }}
                            style={[
                                styles.filterBadge,
                                selectedStatus === item ? styles.filterActive : styles.filterInactive
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                selectedStatus === item ? styles.filterTextActive : styles.filterTextInactive
                            ]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
                ) : filteredOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="inbox" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No orders found</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredOrders}
                        renderItem={renderOrder}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 16, gap: 16 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F4F7' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#000' },
    refreshBtn: { padding: 8, backgroundColor: '#E5E7EB', borderRadius: 20 },

    filterContainer: { paddingVertical: 8, marginBottom: 8 },
    filterBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    filterActive: { backgroundColor: '#000' },
    filterInactive: { backgroundColor: '#E5E7EB' },
    filterText: { fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: '#FFF' },
    filterTextInactive: { color: '#000' },

    content: { flex: 1 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 16, fontSize: 16, color: '#9CA3AF', fontWeight: '500' },

    // Card Styles
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 5px rgba(0,0,0,0.05)',
            },
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 2 },
            }
        })
    },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    orderId: { fontSize: 16, fontWeight: '800', color: '#000' },
    orderDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    productSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    productImage: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#F3F4F6' },
    productName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
    productMeta: { fontSize: 13, color: '#6B7280' },
    productTotal: { fontSize: 15, fontWeight: '700', color: '#000' },

    deliverySection: {},
    sectionLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
    tagPaid: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    tagTextPaid: { fontSize: 10, fontWeight: '700', color: '#166534' },
    tagOnline: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    tagTextOnline: { fontSize: 10, fontWeight: '700', color: '#374151' },

    customerName: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
    addressText: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
    phoneButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    totalLabel: { fontSize: 12, color: '#6B7280' },
    totalAmount: { fontSize: 22, fontWeight: '800', color: '#000' },

    printButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    actionButton: { paddingHorizontal: 20, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 }
});

export default OrdersScreen;
