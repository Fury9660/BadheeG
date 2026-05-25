import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
    ActivityIndicator
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

const FinanceScreen = () => {
    const { isDarkMode, colors: theme } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;
    const isTablet = width > 768;

    const [stats, setStats] = useState({
        balance: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
        todayEarnings: 0,
        pendingPayouts: 0,
        totalRevenue: 0,
    });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
    const [chartLabels, setChartLabels] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchData();
        const channel = supabase.channel('finance-realtime-v2')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `partner_id=eq.${user.id}` }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const fetchData = async () => {
        if (!user) return;
        try {
            const { data: orders } = await supabase
                .from('orders')
                .select('*')
                .eq('partner_id', user.id)
                .order('createdAt', { ascending: false });

            const { data: withdrawals } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('partner_id', user.id);

            processData(orders || [], withdrawals || []);
        } catch (error) {
            console.error("Finance Fetch Error", error);
        } finally {
            setLoading(false);
        }
    };

    const processData = (orders: any[], withdrawals: any[]) => {
        const todayStr = new Date().toDateString();
        let totalRev = 0;
        let todayRev = 0;
        let pendingPay = 0;
        let totalWithdrawn = 0;

        const days: string[] = [];
        const labels: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toDateString());
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        setChartLabels(labels);

        const dailyRevenue = new Array(7).fill(0);

        orders.forEach(o => {
            const amount = o.total || o.amount || 0;
            const dateStr = new Date(o.createdAt).toDateString();
            if (o.status === 'delivered' || o.status === 'completed') {
                totalRev += amount;
                if (dateStr === todayStr) todayRev += amount;
                if (o.payoutStatus !== 'paid') pendingPay += amount;
                const dayIndex = days.indexOf(dateStr);
                if (dayIndex !== -1) dailyRevenue[dayIndex] += amount;
            }
        });

        withdrawals.forEach(w => {
            if (w.status !== 'rejected') totalWithdrawn += (w.amount || 0);
        });

        setRevenueData(dailyRevenue);
        setStats({
            balance: totalRev,
            todayEarnings: todayRev,
            pendingPayouts: pendingPay,
            availableBalance: totalRev - totalWithdrawn,
            totalWithdrawn: totalWithdrawn,
            totalRevenue: totalRev
        });

        const recentTrans = withdrawals
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 8)
            .map(w => ({
                id: w.id,
                type: 'Withdrawal',
                amount: -Math.abs(w.amount),
                date: new Date(w.created_at || w.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                status: w.status
            }));
        setTransactions(recentTrans);
    };

    const renderStat = (label: string, value: string, icon: any, color: string, delay: number) => (
        <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.gridItem}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Feather name={icon} size={18} color={color} />
            </View>
            <View>
                <Text style={[styles.gridLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{label}</Text>
                <Text style={[styles.gridValue, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>{value}</Text>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F8FAFC' }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Compact Header */}
            <View style={[styles.header, { paddingTop: insets.top + 5, backgroundColor: isDarkMode ? '#111' : '#FFF', borderBottomColor: isDarkMode ? '#222' : '#E2E8F0' }]}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Finance Centre</Text>
                        <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>Track your revenue & payouts</Text>
                    </View>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? '#222' : '#F1F5F9' }]}>
                        <Feather name="download" size={18} color={isDarkMode ? '#FFF' : '#10B981'} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Balance Hero Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroWrapper}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.heroCard}>
                        <View style={styles.heroRow}>
                            <View>
                                <View style={styles.heroLabelRow}>
                                    <View style={styles.glassIcon}>
                                        <Feather name="wallet" size={12} color="#FFF" />
                                    </View>
                                    <Text style={styles.heroLabel}>AVAILABLE BALANCE</Text>
                                </View>
                                <Text style={styles.heroAmount}>₹{stats.availableBalance.toLocaleString()}</Text>
                            </View>
                            <View style={styles.heroBadge}>
                                <Text style={styles.heroBadgeText}>Safe to Withdraw</Text>
                            </View>
                        </View>
                        <View style={styles.heroFooter}>
                            <View>
                                <Text style={styles.heroFooterLabel}>Last Payout</Text>
                                <Text style={styles.heroFooterValue}>₹{stats.totalWithdrawn.toLocaleString()}</Text>
                            </View>
                            <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.8} onPress={() => Alert.alert("Request Sent", "Payout request is being processed.")}>
                                <Text style={styles.withdrawBtnText}>Withdraw</Text>
                                <Feather name="chevron-right" size={14} color="#10B981" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                    {renderStat("Today's Pay", `₹${stats.todayEarnings.toLocaleString()}`, "trending-up", "#10B981", 200)}
                    {renderStat("Pending", `₹${stats.pendingPayouts.toLocaleString()}`, "clock", "#F59E0B", 300)}
                    {renderStat("Withdrawn", `₹${stats.totalWithdrawn.toLocaleString()}`, "check-circle", "#10B981", 400)}
                    {renderStat("Lifetime", `₹${stats.totalRevenue.toLocaleString()}`, "pie-chart", "#8B5CF6", 500)}
                </View>

                {/* Analytics Chart */}
                <Animated.View entering={FadeInDown.delay(600).springify()} style={[styles.card, { backgroundColor: isDarkMode ? '#111' : '#FFF', borderColor: isDarkMode ? '#222' : '#E2E8F0' }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderTitleGroup}>
                            <View style={[styles.cardIndicator, { backgroundColor: '#10B981' }]} />
                            <Text style={[styles.cardTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Weekly Analytics</Text>
                        </View>
                        <Text style={styles.cardSubtitle}>Last 7 Days</Text>
                    </View>
                        data={{ 
                            labels: chartLabels, 
                            datasets: [{ 
                                data: revenueData,
                                color: () => '#22C55E',
                                strokeWidth: 3
                            }] 
                        }}
                        width={width - 72}
                        height={180}
                        withDots={false}
                        withInnerLines={false}
                        withOuterLines={false}
                        chartConfig={{
                            backgroundColor: "#10B981",
                            backgroundGradientFrom: "#10B981",
                            backgroundGradientTo: "#10B981",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            labelColor: () => "#FFF",
                            propsForDots: { r: "5", strokeWidth: "2", stroke: "#FFF" },
                            fillShadowGradient: '#FFF',
                            fillShadowGradientOpacity: 0.2,
                        }}
                        withShadow={false}
                        bezier
                        style={{ marginTop: 12, borderRadius: 16 }}
                    />
                </Animated.View>

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Payout History</Text>
                    <TouchableOpacity><Text style={{ color: '#10B981', fontWeight: '700', fontSize: 13 }}>View All</Text></TouchableOpacity>
                </View>

                <Animated.View entering={FadeInDown.delay(700).springify()} style={[styles.card, { padding: 0, backgroundColor: isDarkMode ? '#111' : '#FFF', borderColor: isDarkMode ? '#222' : '#E2E8F0' }]}>
                    {transactions.length > 0 ? transactions.map((t, i) => (
                        <View key={t.id} style={[styles.transItem, i !== transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#222' : '#F1F5F9' }]}>
                            <View style={styles.transLeft}>
                                <View style={[styles.transIcon, { backgroundColor: t.status === 'completed' ? '#D1FAE5' : '#FEF3C7' }]}>
                                    <Feather name={t.amount < 0 ? "arrow-up-right" : "arrow-down-left"} size={16} color={t.status === 'completed' ? '#059669' : '#D97706'} />
                                </View>
                                <View>
                                    <Text style={[styles.transName, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>{t.type}</Text>
                                    <Text style={styles.transDate}>{t.date}</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.transAmount, { color: t.amount < 0 ? '#EF4444' : '#10B981' }]}>
                                    {t.amount < 0 ? '-' : '+'}₹{Math.abs(t.amount).toLocaleString()}
                                </Text>
                                <Text style={[styles.transStatus, { color: t.status === 'completed' ? '#10B981' : '#F59E0B' }]}>{t.status}</Text>
                            </View>
                        </View>
                    )) : (
                        <View style={styles.emptyContainer}>
                            <Feather name="file-text" size={32} color="#94A3B8" />
                            <Text style={styles.emptyText}>No recent payouts</Text>
                        </View>
                    )}
                </Animated.View>
                
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: 16 },
    heroWrapper: { marginBottom: 20 },
    heroCard: { borderRadius: 24, padding: 20, overflow: 'hidden' },
    heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    glassIcon: { padding: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6 },
    heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    heroAmount: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    heroBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
    heroBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
    heroFooterLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
    heroFooterValue: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    withdrawBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 4 },
    withdrawBtnText: { color: '#10B981', fontWeight: '800', fontSize: 13 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    gridItem: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', gap: 12, alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    gridLabel: { fontSize: 11, fontWeight: '600', marginBottom: 1 },
    gridValue: { fontSize: 16, fontWeight: '800' },
    card: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 24 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardHeaderTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardIndicator: { width: 3, height: 14, borderRadius: 2 },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    cardSubtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 17, fontWeight: '900' },
    transItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    transLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    transIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    transName: { fontSize: 14, fontWeight: '700' },
    transDate: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
    transAmount: { fontSize: 14, fontWeight: '800' },
    transStatus: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    emptyContainer: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
});

export default FinanceScreen;
