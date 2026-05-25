import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OrdersScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter(); // If needed for navigation details
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('All');

    const statuses = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];

    const theme = {
        background: '#F2F4F7', // Light grey background from screenshot
        text: '#000000',
        subtext: '#666666',
        card: '#FFFFFF',
        border: '#E5E7EB',
        primary: '#000000', // Black for selected states
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, addresses(*)')
                .eq('partner_id', user.id)
                .order('createdAt', { ascending: false });

            if (error) throw error;
            if (data) setOrders(data);
        } catch (err) {
            console.error("Fetch orders error", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();

        const channel = supabase.channel('orders-list-v2')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
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

    const renderOrder = ({ item }: { item: any }) => (
        <View style={styles.orderCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <View style={[styles.statusBadge, {
                    backgroundColor: item.status === 'delivered' ? '#DCFCE7' : '#F3F4F6'
                }]}>
                    <Text style={[styles.statusText, {
                        color: item.status === 'delivered' ? '#166534' : '#374151'
                    }]}>{item.status || 'Pending'}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.customerName}>{item.addresses?.name || item.customerName || 'Customer'}</Text>
                <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.orderTotal}>₹{(item.total || item.amount || 0).toLocaleString()}</Text>
            </View>
        </View>
    );

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
                <FlatList
                    horizontal
                    data={statuses}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
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
                    )}
                />
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
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F4F7' }, // Light grey bg
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

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -100 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#9CA3AF', fontWeight: '500' },

    orderCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    orderId: { fontSize: 14, fontWeight: '700', color: '#6B7280', flexShrink: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

    cardBody: {},
    customerName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    orderDate: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
    orderTotal: { fontSize: 18, fontWeight: '800', color: '#000' },
});

export default OrdersScreen;
