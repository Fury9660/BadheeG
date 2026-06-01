
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../config/supabaseConfig';
import { useAuth } from '../../../store/AuthContext';
import { useTheme } from '../../../store/ThemeContext';

const FinanceScreen = () => {
    const { isDarkMode } = useTheme();
    const { user, partnerId } = useAuth();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

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

    useEffect(() => {
        if (!user) return;
        fetchData();
        const targetPartnerId = partnerId || user.id;
        const channel = supabase.channel(`finance-realtime-${Math.random().toString(36).substring(7)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `partner_id=eq.${targetPartnerId}` }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, partnerId]);

    const fetchData = async () => {
        if (!user) return;
        try {
            const targetPartnerId = partnerId || user.id;
            // Orders
            const { data: orders } = await supabase
                .from('orders')
                .select('*')
                .eq('partner_id', targetPartnerId)
                .order('createdAt', { ascending: false });

            // Withdrawals
            const { data: withdrawals } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('partner_id', targetPartnerId);

            processData(orders || [], withdrawals || []);
        } catch (error) {
            console.error("Fetch Data Error", error);
        }
    };

    const [chartLabels, setChartLabels] = useState<string[]>([]);

    // ...

    const processData = (orders: any[], withdrawals: any[]) => {
        const todayStr = new Date().toDateString();
        let totalRev = 0;
        let todayRev = 0;
        let pendingPay = 0;
        let totalWithdrawn = 0;

        // 1. Calculate Last 7 Days
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

        // 2. Aggregate Revenue
        orders.forEach(o => {
            const amount = o.total || o.amount || 0;
            const dateStr = new Date(o.createdAt).toDateString();

            // Stats Calculation
            if (o.status === 'delivered' || o.status === 'completed') {
                totalRev += amount;
                if (dateStr === todayStr) todayRev += amount;
                if (o.payoutStatus !== 'paid') pendingPay += amount;

                // Chart Data
                const dayIndex = days.indexOf(dateStr);
                if (dayIndex !== -1) {
                    dailyRevenue[dayIndex] += amount;
                }
            }
        });

        // 3. Process Withdrawals
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

        // 4. Map Transactions (Combine withdrawals and maybe recent paid orders if needed)
        // For now, just show recent withdrawals
        const recentTrans = withdrawals
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(w => ({
                id: w.id,
                type: 'Withdrawal',
                amount: -Math.abs(w.amount), // Negative for withdrawal
                date: new Date(w.created_at || w.date).toLocaleDateString(),
                status: w.status
            }));

        setTransactions(recentTrans);
    };

    const theme = {
        background: '#FFFFFF', // White
        text: '#000000',
        subtext: '#666666',
        card: '#FFFFFF',
    };



    const [chartWidth, setChartWidth] = useState(0);

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Finance</Text>
                <Text style={styles.subtitle}>Track your earnings & payouts</Text>
            </View>

            {/* Withdrawal Card */}
            <View style={styles.cardContainer}>
                <LinearGradient
                    colors={['#10B981', '#059669']} // Green gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <View style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}>
                                    <Feather name="credit-card" size={14} color="#fff" />
                                </View>
                                <Text style={styles.cardLabel}>AVAILABLE BALANCE</Text>
                            </View>
                            <Text style={styles.cardAmount}>₹{stats.availableBalance.toLocaleString()}</Text>
                        </View>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="bank-outline" size={20} color="#fff" />
                        </View>
                    </View>

                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Last payout: ₹{stats.totalWithdrawn.toLocaleString()}</Text>
                        <TouchableOpacity
                            style={styles.withdrawButton}
                            onPress={() => Alert.alert("Withdraw", "Feature coming soon")}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
                            <Feather name="arrow-right" size={14} color="#fff" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            {/* Stats Grid 2x2 */}
            <View style={styles.gridContainer}>
                {/* Today's Earnings */}
                <View style={styles.gridItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#10B98115' }]}>
                        <Feather name="trending-up" size={20} color="#10B981" />
                    </View>
                    <View>
                        <Text style={styles.gridLabel}>Today's Earnings</Text>
                        <Text style={styles.gridValue}>₹{stats.todayEarnings.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Pending Payout */}
                <View style={styles.gridItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
                        <Feather name="clock" size={20} color="#F59E0B" />
                    </View>
                    <View>
                        <Text style={styles.gridLabel}>Pending Payout</Text>
                        <Text style={styles.gridValue}>₹{stats.pendingPayouts.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Total Withdrawn */}
                <View style={styles.gridItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#10B98115' }]}>
                        <Feather name="check-circle" size={20} color="#10B981" />
                    </View>
                    <View>
                        <Text style={styles.gridLabel}>Total Withdrawn</Text>
                        <Text style={styles.gridValue}>₹{stats.totalWithdrawn.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Total Revenue */}
                <View style={styles.gridItem}>
                    <View style={[styles.iconBox, { backgroundColor: '#8B5CF615' }]}>
                        <Feather name="pie-chart" size={20} color="#8B5CF6" />
                    </View>
                    <View>
                        <Text style={styles.gridLabel}>Total Revenue</Text>
                        <Text style={styles.gridValue}>₹{stats.totalRevenue.toLocaleString()}</Text>
                    </View>
                </View>
            </View>

            {/* Weekly Revenue Chart */}
            <View
                style={styles.chartSection}
                onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    setChartWidth(width);
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 4, height: 16, backgroundColor: '#10B981', borderRadius: 2 }} />
                        <Text style={styles.sectionTitle}>Revenue Analytics</Text>
                    </View>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 20 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280' }}>This Week</Text>
                    </View>
                </View>

                {chartWidth > 0 && (
                    <LineChart
                        data={{
                            labels: chartLabels.length > 0 ? chartLabels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                            datasets: [{ data: revenueData }]
                        }}
                        width={chartWidth - 40} // Subtract padding
                        height={180}
                        withDots={false}
                        withInnerLines={true}
                        withOuterLines={false}
                        withVerticalLines={false}
                        withHorizontalLines={true}
                        yAxisLabel="₹"
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: "#fff",
                            backgroundGradientFrom: "#fff",
                            backgroundGradientTo: "#fff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // Gray 500
                            propsForDots: { r: "4", strokeWidth: "0", fill: "#10B981" },
                            propsForBackgroundLines: { strokeDasharray: "4", stroke: "#E5E7EB" },
                        }}
                        bezier
                        style={{ borderRadius: 16 }}
                    />
                )}
            </View>

            {/* Transactions Header */}
            <View style={styles.transactionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity style={styles.reportBtn}>
                    <Text style={styles.reportText}>View All</Text>
                    <Feather name="chevron-right" size={14} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Transactions List */}
            {transactions.length > 0 ? (
                <View style={{ marginBottom: 24 }}>
                    {transactions.map((t, index) => (
                        <View key={t.id || index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.type === 'Withdrawal' ? '#FEE2E2' : '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                                    <Feather
                                        name={t.type === 'Withdrawal' ? 'arrow-up-right' : 'arrow-down-left'}
                                        size={20}
                                        color={t.type === 'Withdrawal' ? '#EF4444' : '#10B981'}
                                    />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{t.type}</Text>
                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>{t.date}</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: t.amount < 0 ? '#EF4444' : '#10B981' }}>
                                    {t.amount < 0 ? '-' : '+'}₹{Math.abs(t.amount).toLocaleString()}
                                </Text>
                                <Text style={{ fontSize: 11, color: t.status === 'completed' ? '#10B981' : '#F59E0B', textTransform: 'capitalize' }}>
                                    {t.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Feather name="file-text" size={24} color="#9CA3AF" />
                    </View>
                    <Text style={styles.emptyText}>No transactions yet</Text>
                    <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Your recent payouts and withdrawals will appear here</Text>
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', paddingHorizontal: 20 },
    header: { marginVertical: 24 },
    title: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '500' },

    cardContainer: {
        elevation: 8,
        marginBottom: 24,
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 24px rgba(67, 56, 202, 0.15)',
            },
            ios: {
                shadowColor: "#4338CA",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
            }
        })
    },
    card: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'flex-start',
    },
    cardLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    cardAmount: { color: '#FFF', fontSize: 36, fontWeight: '800', marginTop: 4, letterSpacing: -1 },
    withdrawButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    withdrawBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    gridItem: {
        width: '48%', // Approx half with gap
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
    gridValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

    chartSection: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },

    transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    reportBtn: { flexDirection: 'row', alignItems: 'center' },
    reportText: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginRight: 2 },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#FFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    emptyText: { color: '#111827', fontSize: 16, fontWeight: '600' },
});

export default FinanceScreen;
