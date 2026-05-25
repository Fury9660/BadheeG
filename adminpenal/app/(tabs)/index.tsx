
import AdminWalletCard from '@/components/admin/AdminWalletCard';
import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions, StatusBar, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const AdminDashboard = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCommission: 0,
        todayOrders: 0,
        weeklyOrders: 0,
        monthlyOrders: 0,
        yearlyOrders: 0,
        lifetimeOrders: 0,
    });
    const [topShowrooms, setTopShowrooms] = useState<any[]>([]);
    // const [recentOrders, setRecentOrders] = useState<any[]>([]);

    const theme = {
        background: isDarkMode ? '#030712' : '#F9FAFB',
        text: isDarkMode ? '#F9FAFB' : '#111827',
        card: isDarkMode ? '#111827' : '#FFFFFF',
        subtext: isDarkMode ? '#9CA3AF' : '#6B7280',
        border: isDarkMode ? '#1F2937' : '#E5E7EB',
        primary: '#6366F1', // Modern Indigo
        accent: '#10B981', // Emerald
        shadow: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
    };

    const fetchDashboardData = async () => {
        try {
            // Fetch all orders with partner_id
            const { data: orders, error } = await supabase
                .from('orders')
                .select('id, created_at, total_amount, commission_amount, status, partner_id')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (orders) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

                let totalRev = 0;
                let totalComm = 0;
                let todayCount = 0;
                let weekCount = 0;
                let monthCount = 0;
                let yearCount = 0;

                orders.forEach(order => {
                    const orderTime = new Date(order.created_at).getTime();
                    totalRev += (order.total_amount || 0);
                    totalComm += (order.commission_amount || 0);

                    if (orderTime >= today) todayCount++;
                    if (orderTime >= startOfWeek) weekCount++;
                    if (orderTime >= startOfMonth) monthCount++;
                    if (orderTime >= startOfYear) yearCount++;
                });

                setStats({
                    totalRevenue: totalRev,
                    totalCommission: totalComm,
                    todayOrders: todayCount,
                    weeklyOrders: weekCount,
                    monthlyOrders: monthCount,
                    yearlyOrders: yearCount,
                    lifetimeOrders: orders.length
                });

                // Fetch recent activity details (top 5 new orders)
                // setRecentOrders(orders.slice(0, 5)); // Removed
                // Fetch partner details to map rankings
                const { data: partners } = await supabase
                    .from('pre_approved_partners')
                    .select('id, store_name, city');

                const partnerMap = new Map(partners?.map(p => [p.id, p]) || []);

                // Calculate Rankings
                const partnerSales: Record<string, { sales: number, orders: number }> = {};
                orders.forEach(order => {
                    if (order.partner_id) {
                        if (!partnerSales[order.partner_id]) {
                            partnerSales[order.partner_id] = { sales: 0, orders: 0 };
                        }
                        partnerSales[order.partner_id].sales += (order.total_amount || 0);
                        partnerSales[order.partner_id].orders += 1;
                    }
                });

                const rankedShowrooms = Object.entries(partnerSales)
                    .map(([id, data]) => {
                        const partner = partnerMap.get(id);
                        return {
                            id,
                            name: partner?.store_name || 'Unknown Showroom',
                            city: partner?.city || 'N/A',
                            sales: data.sales,
                            orders: data.orders
                        };
                    })
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 20);

                setTopShowrooms(rankedShowrooms);
            }

        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const orderStats = [
        { title: 'Today', value: stats.todayOrders, icon: 'sun', color: '#f1c40f' },
        { title: 'Weekly', value: stats.weeklyOrders, icon: 'calendar', color: '#2ecc71' },
        { title: 'Monthly', value: stats.monthlyOrders, icon: 'bar-chart-2', color: '#3498db' },
        { title: 'Yearly', value: stats.yearlyOrders, icon: 'target', color: '#9b59b6' },
        { title: 'Lifetime', value: stats.lifetimeOrders, icon: 'award', color: '#e67e22' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border, paddingTop: insets.top + 8 }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Admin Overview</Text>
                    <Text style={{ fontSize: 11, color: theme.subtext, fontWeight: '500' }}>Platform analytics & performance</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Feather name="search" size={14} color={theme.subtext} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.refreshBtn, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Feather name="bell" size={14} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollContainer, { maxWidth: 1200, width: '100%', alignSelf: 'center' }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* Top Section: Wallet & Sales */}
                <View style={[styles.topSection, isDesktop && { flexDirection: 'row', gap: 20 }]}>
                    <AdminWalletCard
                        totalCommission={stats.totalCommission.toLocaleString('en-IN')}
                        isDarkMode={isDarkMode}
                    />

                    <LinearGradient
                        colors={isDarkMode ? ['#111827', '#111827'] : ['#FFFFFF', '#FFFFFF']}
                        style={[styles.salesCard, { borderColor: theme.border, borderWidth: 1, flex: 1, shadowColor: theme.shadow }]}
                    >
                        <View style={styles.salesHeader}>
                            <View style={[styles.salesIconBox, { backgroundColor: theme.primary + '15' }]}>
                                <Feather name="trending-up" size={18} color={theme.primary} />
                            </View>
                            <View style={[styles.salesBadge, { backgroundColor: theme.accent + '15' }]}>
                                <Text style={[styles.salesBadgeText, { color: theme.accent }]}>Live</Text>
                            </View>
                        </View>
                        <View>
                            <Text style={[styles.salesLabel, { color: theme.subtext }]}>Gross Sales Volume</Text>
                            <Text style={[styles.salesValue, { color: theme.text }]}>₹{stats.totalRevenue.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.salesFooter}>
                            <Feather name="globe" size={12} color={theme.subtext} />
                            <Text style={[styles.salesFooterText, { color: theme.subtext }]}>Platform Revenue across all partners</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Grid Stats */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24, marginBottom: 16 }]}>Order Insights</Text>
                <View style={styles.statsGrid}>
                    {orderStats.map((item, index) => (
                        <View key={index} style={[styles.statCard, { backgroundColor: theme.card, width: isDesktop ? '18%' : '48%', shadowColor: theme.shadow }]}>
                            <View style={[styles.statIconBox, { backgroundColor: item.color + '15' }]}>
                                <Feather name={item.icon as any} size={20} color={item.color} />
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={[styles.statValue, { color: theme.text }]}>{item.value}</Text>
                                <Text style={[styles.statLabel, { color: theme.subtext }]}>{item.title}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Showroom Rankings */}
                <View style={[styles.rankingSection, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Performance</Text>
                            <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>Partner Rankings by Revenue</Text>
                        </View>
                        <TouchableOpacity style={[styles.viewAllBtn, { backgroundColor: theme.background }]}>
                            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 12 }}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {topShowrooms.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="database" size={40} color={theme.border} />
                            <Text style={{ color: theme.subtext, marginTop: 12 }}>No sales data recorded yet.</Text>
                        </View>
                    ) : (
                        topShowrooms.map((showroom, index) => (
                            <TouchableOpacity key={showroom.id} style={[styles.rankingItem, index !== topShowrooms.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                                <View style={[styles.rankBadge, { backgroundColor: index < 3 ? '#FFD70020' : theme.background, borderColor: index < 3 ? '#FFD700' : theme.border }]}>
                                    <Text style={[styles.rankText, { color: index < 3 ? '#B8860B' : theme.subtext }]}>{index + 1}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text style={[styles.showroomName, { color: theme.text }]}>{showroom.name}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <Feather name="map-pin" size={10} color={theme.subtext} />
                                        <Text style={[styles.showroomLocation, { color: theme.subtext, marginLeft: 4 }]}>{showroom.city}</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.rankingValue, { color: theme.accent, fontWeight: '700' }]}>₹{showroom.sales.toLocaleString('en-IN')}</Text>
                                    <Text style={[styles.ordersCount, { color: theme.subtext }]}>{showroom.orders} Orders</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.8 },
    refreshBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    scrollContainer: { padding: 24, paddingBottom: 80 },

    topSection: { marginBottom: 32 },
    salesCard: { height: 160, borderRadius: 24, padding: 20, justifyContent: 'space-between', shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
    salesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    salesIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    salesValue: { fontSize: 26, fontWeight: '900', marginBottom: 2, letterSpacing: -1 },
    salesLabel: { fontSize: 12, marginBottom: 4, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    salesBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    salesBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    salesFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    salesFooterText: { fontSize: 10, fontWeight: '500' },

    sectionTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
    sectionSubtitle: { fontSize: 11, marginTop: 2, fontWeight: '600' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    statCard: { padding: 16, borderRadius: 20, alignItems: 'center', marginBottom: 4, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
    statIconBox: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statValue: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
    statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

    rankingSection: { borderRadius: 24, padding: 20, marginTop: 20, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    viewAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    rankingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    rankBadge: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
    rankText: { fontSize: 13, fontWeight: '900' },
    showroomName: { fontSize: 15, fontWeight: '800' },
    showroomLocation: { fontSize: 12, fontWeight: '600' },
    rankingValue: { fontSize: 16, fontWeight: '900' },
    ordersCount: { fontSize: 11, fontWeight: '700', marginTop: 1 },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
});

export default AdminDashboard;
