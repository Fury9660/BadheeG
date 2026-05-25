import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PartnerDashboard() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const actionWidth = isDesktop ? 180 : (width > 100 ? (width - 52) / 2 : 140);

    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { user, partnerId } = useAuth(); // No partnerStatus check needed here, handled by _layout
    const insets = useSafeAreaInsets();

    const [refreshing, setRefreshing] = useState(false);
    const [storeName, setStoreName] = useState('My Store');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayRevenue: 0,
        totalRevenue: 0,
        todayOrders: 0,
        pendingOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    const theme = {
        background: isDarkMode ? '#121212' : '#F9FAFB',
        card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#111827',
        subtext: isDarkMode ? '#9CA3AF' : '#6B7280',
        primary: '#10B981',
        secondary: '#10B981',
        border: isDarkMode ? '#374151' : '#E5E7EB',
    };

    const fetchData = async () => {
        try {
            if (!user) return;
            setLoading(true);

            // 1. Store Info
            const targetPartnerId = partnerId || user.id;
            let partnerData = null;
            if (partnerId) {
                const { data } = await supabase
                    .from('pre_approved_partners')
                    .select('store_name, owner_name')
                    .eq('id', partnerId)
                    .maybeSingle();
                partnerData = data;
            } else {
                let query = supabase.from('pre_approved_partners').select('store_name, owner_name');
                if (user.email) query = query.ilike('email', user.email);
                else if (user.phone) {
                    const cleanPhone = user.phone.replace('+91', '').replace(/\D/g, '').slice(-10);
                    query = query.eq('mobile_number', cleanPhone);
                }
                const { data } = await query.maybeSingle();
                partnerData = data;
            }

            if (partnerData) {
                setStoreName(partnerData.store_name || partnerData.owner_name || 'My Store');
            }

            // 2. Orders & Stats
            const { data: orders } = await supabase
                .from('orders')
                .select('*')
                .eq('partner_id', targetPartnerId)
                .order('created_at', { ascending: false });

            if (orders) {
                const today = new Date().toISOString().split('T')[0];
                const todayOrders = orders.filter((o: any) => o.created_at?.startsWith(today));
                const pending = orders.filter((o: any) => o.status === 'pending');
                const totalRev = orders.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0);
                const todayRev = todayOrders.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0);

                setStats({
                    todayRevenue: todayRev,
                    totalRevenue: totalRev,
                    todayOrders: todayOrders.length,
                    pendingOrders: pending.length
                });
                setRecentOrders(orders.slice(0, 5));
            }

        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (!user) return;

        const targetPartnerId = partnerId || user.id;
        const channel = supabase.channel(`dashboard-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `partner_id=eq.${targetPartnerId}` }, () => {
                fetchData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, partnerId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const QuickAction = ({ title, icon, color, route }: any) => (
        <TouchableOpacity
            style={[
                styles.quickAction,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    width: actionWidth,
                }
            ]}
            onPress={() => router.push(route)}
        >
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={28} color={color} />
            </View>
            <Text style={[styles.actionText, { color: theme.text }]}>{title}</Text>
        </TouchableOpacity>
    );

    if (loading && !refreshing && !storeName) { // Allow slight stale data if refreshing
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                    <View>
                        <Text style={{ color: theme.subtext, fontSize: 14 }}>Welcome back,</Text>
                        <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>{storeName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/partners/settings' as any)} style={{ padding: 8 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 18 }}>
                                {storeName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ padding: 20 }}>
                    {/* Revenue Card */}
                    <View style={styles.revenueCard}>
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80' }}
                            style={styles.cardBg}
                            imageStyle={{ borderRadius: 24, opacity: 0.8 }}
                        >
                            <View style={styles.cardOverlay}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}>
                                        <Feather name="trending-up" size={16} color="#fff" />
                                    </View>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 12 }}>TOTAL REVENUE</Text>
                                </View>
                                <View>
                                    <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800' }}>₹{stats.todayRevenue.toLocaleString()}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Lifetime: ₹{stats.totalRevenue.toLocaleString()}</Text>
                                </View>
                            </View>
                        </ImageBackground>
                    </View>

                    {/* Stats Grid */}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.miniIcon, { backgroundColor: theme.primary + '20' }]}>
                                <Feather name="shopping-bag" size={18} color={theme.primary} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.text }]}>{stats.todayOrders}</Text>
                            <Text style={[styles.statLabel, { color: theme.subtext }]}>Today's Orders</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.miniIcon, { backgroundColor: theme.primary + '20' }]}>
                                <Feather name="clock" size={18} color={theme.primary} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.text }]}>{stats.pendingOrders}</Text>
                            <Text style={[styles.statLabel, { color: theme.subtext }]}>Pending</Text>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 32 }]}>Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        <QuickAction title="Add Product" icon="plus-box-multiple" color="#4F46E5" route="/partners/add-product" />
                        <QuickAction title="All Orders" icon="clipboard-list" color="#10B981" route="/partners/orders" />
                        <QuickAction title="Inventory" icon="package-variant" color="#F59E0B" route="/partners/inventory" />
                        <QuickAction title="Analytics" icon="google-analytics" color="#EC4899" route="/partners/finance" />
                    </View>

                    {/* Recent Orders */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Recent Orders</Text>
                        <TouchableOpacity onPress={() => router.push('/partners/orders')}>
                            <Text style={{ color: theme.primary, fontWeight: '600' }}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentOrders.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Feather name="inbox" size={40} color={theme.subtext} />
                            <Text style={{ color: theme.subtext, marginTop: 12 }}>No orders yet</Text>
                        </View>
                    ) : (
                        recentOrders.map((order, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => router.push({ pathname: '/order-details/[id]', params: { id: order.id } } as any)}
                                style={[styles.orderRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.primary + '10', alignItems: 'center', justifyContent: 'center' }}>
                                        <Feather name="package" size={20} color={theme.primary} />
                                    </View>
                                    <View>
                                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>Order #{order.id.slice(0, 6)}</Text>
                                        <Text style={{ color: theme.subtext, fontSize: 12 }}>{new Date(order.created_at).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ color: theme.text, fontWeight: '700' }}>₹{order.total_amount}</Text>
                                    <Text style={{ color: order.status === 'pending' ? '#EAB308' : '#10B981', fontSize: 12, fontWeight: '600' }}>
                                        {order.status.toUpperCase()}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    revenueCard: {
        height: 160,
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
    },
    cardBg: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 24,
    },
    cardOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 24,
        justifyContent: 'space-between'
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    miniIcon: {
        alignSelf: 'flex-start',
        padding: 8,
        borderRadius: 10,
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    quickAction: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontWeight: '600',
        fontSize: 14,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    }
});
