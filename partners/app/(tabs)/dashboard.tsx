import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, ProgressChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

type DateRange = 'today' | '7days' | '30days' | 'month' | 'lifetime' | 'custom';

export default function DashboardScreen() {
    const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
    const isDesktop = containerWidth > 1024;
    const isTablet = containerWidth > 768 && containerWidth <= 1024;
    
    const { colors: theme, isDarkMode } = useTheme();
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showRangeModal, setShowRangeModal] = useState(false);
    
    const [startDateInput, setStartDateInput] = useState('');
    const [endDateInput, setEndDateInput] = useState('');
    const [activeHeaderChip, setActiveHeaderChip] = useState('Weekly');
    const headerChips = ['Yearly', 'Monthly', 'Weekly', 'Daily'];
    const [selectedRange, setSelectedRange] = useState<DateRange>('7days');

    const [totalOrders, setTotalOrders] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState({ labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], datasets: [{ data: [0, 0, 0, 0, 0, 0] }] });
    const [dailySales, setDailySales] = useState({ labels: ["1", "2", "3", "4", "5", "6", "7"], datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] });
    const [topProducts, setTopProducts] = useState<any[]>([]);

    const fetchDashboardData = useCallback(async () => {
        if (!user) { setLoading(false); setRefreshing(false); return; }
        try {
            const now = new Date();
            let startDate: string;
            let endDate: string = new Date().toISOString();
            if (selectedRange === 'custom' && startDateInput && endDateInput) {
                startDate = new Date(startDateInput).toISOString();
                endDate = new Date(endDateInput).toISOString();
            } else {
                const d = new Date(); d.setHours(0,0,0,0);
                if (activeHeaderChip === 'Daily') d.setHours(0,0,0,0);
                else if (activeHeaderChip === 'Weekly') d.setDate(now.getDate() - 7);
                else if (activeHeaderChip === 'Monthly') d.setDate(now.getDate() - 30);
                else if (activeHeaderChip === 'Yearly') d.setFullYear(now.getFullYear() - 1);
                startDate = d.toISOString();
            }
            const { data: allOrders, error: ordersError } = await supabase.from('orders').select('*').eq('partner_id', user.id).gte('created_at', startDate).lte('created_at', endDate);
            if (ordersError) throw ordersError;
            let totalRev = 0;
            let tempMonthlyData = [0, 0, 0, 0, 0, 0];
            let tempDailyData = [0, 0, 0, 0, 0, 0, 0];
            let dailyLabels = [];
            if (activeHeaderChip === 'Daily') dailyLabels = ["00", "04", "08", "12", "16", "20", "24"];
            else if (activeHeaderChip === 'Weekly') {
                for(let i=6; i>=0; i--) { const d = new Date(); d.setDate(now.getDate() - i); dailyLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)); }
            } else dailyLabels = ["1", "5", "10", "15", "20", "25", "30"];
            const monthLabels = [];
            for(let i=5; i>=0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); monthLabels.push(d.toLocaleString('default', { month: 'short' })); }
            const productMap: any = {};
            allOrders?.forEach(order => {
                const orderDate = new Date(order.created_at);
                const orderVal = order.total_amount || 0;
                totalRev += orderVal;
                for(let i=0; i<6; i++) {
                    const targetMonth = new Date(now.getFullYear(), now.getMonth() - (5-i), 1);
                    if (orderDate.getMonth() === targetMonth.getMonth() && orderDate.getFullYear() === targetMonth.getFullYear()) tempMonthlyData[i] += orderVal;
                }
                if (activeHeaderChip === 'Daily') { const hour = orderDate.getHours(); const index = Math.floor(hour / 4); tempDailyData[index] += orderVal; }
                else if (activeHeaderChip === 'Weekly') { const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24)); if (diffDays >= 0 && diffDays < 7) tempDailyData[6 - diffDays] += orderVal; }
                else { const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24)); if (diffDays >= 0 && diffDays < 30) { const index = Math.floor((29 - diffDays) / 4.3); if(index >= 0 && index < 7) tempDailyData[index] += orderVal; } }
                if (Array.isArray(order.items)) { order.items.forEach((item: any) => { const name = item.name || 'Unknown'; const totalVal = (item.price || 0) * (item.quantity || 1); if (productMap[name]) { productMap[name].value += totalVal; productMap[name].count += (item.quantity || 1); } else productMap[name] = { name, value: totalVal, count: (item.quantity || 1) }; }); }
            });
            if (Object.keys(productMap).length === 0 && allOrders?.length > 0) {
                const orderIds = allOrders.map(o => o.id);
                const { data: items } = await supabase.from('order_items').select('quantity, price, products(name)').in('order_id', orderIds);
                items?.forEach((item: any) => {
                    const name = item.products?.name || 'Unknown Product';
                    const totalVal = (item.price || 0) * (item.quantity || 1);
                    if (productMap[name]) { productMap[name].value += totalVal; productMap[name].count += (item.quantity || 1); }
                    else productMap[name] = { name, value: totalVal, count: (item.quantity || 1) };
                });
            }
            const topProds = Object.values(productMap).sort((a: any, b: any) => b.value - a.value).slice(0, 4);
            setTotalOrders(allOrders?.length || 0); setTotalRevenue(totalRev); setTopProducts(topProds);
            setMonthlyRevenue({ labels: monthLabels, datasets: [{ data: tempMonthlyData }] }); setDailySales({ labels: dailyLabels, datasets: [{ data: tempDailyData }] });
        } catch (error: any) { console.error('Error fetching dashboard data:', error.message); } finally { setLoading(false); setRefreshing(false); }
    }, [user, activeHeaderChip, selectedRange, startDateInput, endDateInput]);

    useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

    const onRefresh = () => { setLoading(true); fetchDashboardData(); };

    const chartConfig = (color: string) => ({
        backgroundGradientFrom: theme.card, backgroundGradientFromOpacity: 0, backgroundGradientTo: theme.card, backgroundGradientToOpacity: 0,
        color: (opacity = 1) => color.replace('1)', `${opacity})`), labelColor: (opacity = 1) => theme.subtext,
        strokeWidth: 3, barPercentage: 0.7, decimalPlaces: 0, propsForDots: { r: "6", strokeWidth: "3", stroke: "#fff" }
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F8FAFC' }]} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
            {loading && !refreshing ? (
                <View style={styles.loader}><ActivityIndicator size="large" color="#10B981" /></View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}>

                    {/* Header Section */}
                    <View style={[styles.titleSection, isDesktop && styles.desktopHeader]}>
                        <View style={styles.leftHeader}>
                            <Text style={[styles.mainTitle, { color: theme.text }]}>Dashboard</Text>
                            <View style={styles.dot} />
                            <Text style={styles.subTitle}>Product Sales Report</Text>
                        </View>
                        
                        <View style={styles.rightHeader}>
                            <View style={[styles.chipsContainer, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFF', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#E2E8F0' }]}>
                                {headerChips.map((chip) => (
                                    <TouchableOpacity 
                                        key={chip} 
                                        style={[styles.chip, activeHeaderChip === chip && { backgroundColor: '#10B981' }]}
                                        onPress={() => { setActiveHeaderChip(chip); setSelectedRange(chip === 'Daily' ? 'today' : chip === 'Weekly' ? '7days' : chip === 'Monthly' ? '30days' : 'lifetime'); }}
                                    >
                                        <Text style={[styles.chipText, { color: activeHeaderChip === chip ? '#FFF' : '#94A3B8' }]}>{chip}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={[styles.dateSelector, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFF', borderWidth: 1, borderColor: isDarkMode ? '#333' : '#E2E8F0' }]} onPress={() => setShowRangeModal(true)}>
                                <Feather name="calendar" size={18} color="#5856D6" />
                                <Text style={[styles.dateText, { color: theme.text }]}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Main Stats Row */}
                    <View style={[styles.analyticsRow, { flexDirection: (isDesktop || isTablet) ? 'row' : 'column' }]}>
                        {/* Orders Card - Green Gradient */}
                        <LinearGradient colors={['#10B981', '#059669']} start={{x:0, y:0}} end={{x:1, y:1}} style={[styles.analyticsCard, { flex: 1, height: 240 }]}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.cardValue, { color: '#fff' }]}>{totalOrders}</Text>
                                    <Text style={[styles.cardLabel, { color: 'rgba(255,255,255,0.8)' }]}>Total Orders</Text>
                                </View>
                                <View style={styles.liveBadge}><View style={styles.pulseDot} /><Text style={styles.liveText}>LIVE</Text></View>
                            </View>
                            <LineChart data={{ labels: [], datasets: [{ data: dailySales.datasets[0].data.length > 0 ? dailySales.datasets[0].data : [0,0,0,0,0,0,0] }] }} width={isDesktop ? (containerWidth / 5.5) : (containerWidth - 80)} height={110} chartConfig={{ ...chartConfig('#fff'), propsForDots: { r: "0" } }} bezier withDots={false} withInnerLines={false} withOuterLines={false} withHorizontalLabels={false} withVerticalLabels={false} style={styles.miniChart} />
                        </LinearGradient>

                        {/* Revenue Card - Modern SaaS Look */}
                        <View style={[styles.analyticsCard, { flex: 1.5, backgroundColor: theme.card, height: 240, borderLeftWidth: 4, borderLeftColor: '#10B981' }]}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.cardTitle, { color: theme.text }]}>Revenue Analytics</Text>
                                    <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Monthly performance trend</Text>
                                </View>
                                <View style={styles.revenueBadge}><Text style={styles.revenueBadgeText}>₹{totalRevenue}</Text></View>
                            </View>
                            <BarChart data={monthlyRevenue} width={isDesktop ? (containerWidth / 3.2) : (containerWidth - 80)} height={130} yAxisLabel="₹" yAxisSuffix="" chartConfig={chartConfig('rgba(16, 185, 129, 1)')} style={styles.miniChart} withInnerLines={false} fromZero />
                        </View>

                        {/* Progress Card - Clean Circle */}
                        <View style={[styles.analyticsCard, { flex: 1, backgroundColor: theme.card, height: 240 }]}>
                            <View style={styles.cardHeader}><Text style={[styles.cardTitle, { color: theme.text }]}>Target Goal</Text></View>
                            <View style={styles.centerChart}>
                                <ProgressChart data={{ labels: ["Sales"], data: [totalRevenue > 0 ? 0.75 : 0] }} width={150} height={150} strokeWidth={14} radius={54} chartConfig={{ ...chartConfig('rgba(245, 158, 11, 1)'), backgroundGradientFrom: theme.card, backgroundGradientTo: theme.card }} hideLegend={true} />
                                <View style={styles.absoluteCenter}>
                                    <Text style={[styles.centerValue, { color: theme.text }]}>75%</Text>
                                    <Text style={[styles.centerLabel, { color: '#F59E0B' }]}>ACHIEVED</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Secondary Analytics Row */}
                    <View style={[styles.analyticsRow, { flexDirection: (isDesktop || isTablet) ? 'row' : 'column', marginTop: 32 }]}>
                        {/* Best Sellers - List View */}
                        <View style={[styles.analyticsCard, { flex: 1, backgroundColor: theme.card, minHeight: 380 }]}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.cardTitle, { color: theme.text }]}>Top Performing Products</Text>
                                    <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>By revenue generated</Text>
                                </View>
                                <View style={styles.iconCircle}><Feather name="award" size={20} color="#F59E0B" /></View>
                            </View>
                            <View style={styles.productList}>
                                {topProducts.length > 0 ? topProducts.map((prod, i) => (
                                    <View key={i} style={styles.productItem}>
                                        <View style={styles.productHeader}>
                                            <View style={styles.prodInfo}>
                                                <Text style={[styles.productRank, { color: i === 0 ? '#F59E0B' : '#94A3B8' }]}>#{i+1}</Text>
                                                <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>{prod.name}</Text>
                                            </View>
                                            <Text style={[styles.productPercent, { color: '#10B981' }]}>₹{prod.value.toLocaleString()}</Text>
                                        </View>
                                        <View style={styles.progressBarBg}>
                                            <LinearGradient colors={i === 0 ? ['#F59E0B', '#FBBF24'] : i === 1 ? ['#10B981', '#34D399'] : ['#10B981', '#10B981']} start={{x:0, y:0}} end={{x:1, y:0}} style={[styles.progressBarFill, { width: `${Math.min(100, (prod.value / (totalRevenue || 1)) * 200)}%` }]} />
                                        </View>
                                    </View>
                                )) : (
                                    <View style={styles.emptyState}>
                                        <MaterialCommunityIcons name="package-variant" size={48} color="#CBD5E1" />
                                        <Text style={{ color: '#94A3B8', marginTop: 12, fontWeight: '600' }}>No sales data for this period</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Volume Statistics - Large Chart */}
                        <View style={[styles.analyticsCard, { flex: 2, backgroundColor: theme.card, minHeight: 380 }]}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.cardValueLarge, { color: theme.text }]}>{activeHeaderChip} Volume Analytics</Text>
                                    <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Visualizing your sales flow across the timeline</Text>
                                </View>
                                <TouchableOpacity style={styles.exportButton}>
                                    <Feather name="download" size={16} color="#4F46E5" />
                                    <Text style={styles.exportText}>Export</Text>
                                </TouchableOpacity>
                            </View>
                            <LineChart data={dailySales} width={isDesktop ? (containerWidth / 1.9) : (containerWidth - 80)} height={220} chartConfig={{ ...chartConfig('#10B981'), propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" } }} bezier style={styles.miniChart} withInnerLines={false} />
                        </View>
                    </View>

                    {/* Date Picker Modal - Premium Redesign */}
                    <Modal visible={showRangeModal} transparent={true} animationType="slide" onRequestClose={() => setShowRangeModal(false)}>
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: theme.card, width: isDesktop ? 550 : '95%' }]}>
                                <View style={styles.modalHeader}>
                                    <View>
                                        <Text style={[styles.modalTitle, { color: theme.text }]}>Custom Date Range</Text>
                                        <Text style={{ color: '#64748B', fontSize: 14 }}>Select a specific period for your report</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowRangeModal(false)} style={styles.closeBtn}><Feather name="x" size={24} color={theme.text} /></TouchableOpacity>
                                </View>

                                <View style={styles.customRangeBox}>
                                    <View style={styles.dateGrid}>
                                        <View style={styles.dateInputGroup}>
                                            <Text style={styles.inputLabel}>START DATE</Text>
                                            {Platform.OS === 'web' ? (
                                                <input type="date" style={webInputStyle(theme, isDarkMode)} value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)} />
                                            ) : (
                                                <TextInput style={[styles.dateInput, { color: theme.text, borderColor: theme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.subtext} value={startDateInput} onChangeText={setStartDateInput} />
                                            )}
                                        </View>
                                        <View style={styles.dateInputGroup}>
                                            <Text style={styles.inputLabel}>END DATE</Text>
                                            {Platform.OS === 'web' ? (
                                                <input type="date" style={webInputStyle(theme, isDarkMode)} value={endDateInput} onChange={(e) => setEndDateInput(e.target.value)} />
                                            ) : (
                                                <TextInput style={[styles.dateInput, { color: theme.text, borderColor: theme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.subtext} value={endDateInput} onChangeText={setEndDateInput} />
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.applyButton} onPress={() => { setSelectedRange('custom'); setShowRangeModal(false); setActiveHeaderChip(''); }}>
                                        <Text style={styles.applyText}>Generate Custom Report</Text>
                                        <Feather name="arrow-right" size={18} color="#FFF" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.presetSection}>
                                    <Text style={styles.sectionLabel}>QUICK PRESETS</Text>
                                    <View style={styles.presetGrid}>
                                        {['today', '7days', '30days', 'lifetime'].map((preset) => (
                                            <TouchableOpacity key={preset} style={[styles.presetCard, selectedRange === preset && styles.activePresetCard]} onPress={() => { setSelectedRange(preset as DateRange); setShowRangeModal(false); if(preset === 'today') setActiveHeaderChip('Daily'); if(preset === '7days') setActiveHeaderChip('Weekly'); if(preset === '30days') setActiveHeaderChip('Monthly'); if(preset === 'lifetime') setActiveHeaderChip('Yearly'); }}>
                                                <Text style={[styles.presetLabel, { color: selectedRange === preset ? '#10B981' : theme.text }]}>
                                                    {preset === 'today' ? 'Today' : preset === '7days' ? 'Last 7 Days' : preset === '30days' ? 'Last 30 Days' : 'All Time'}
                                                </Text>
                                                {selectedRange === preset && <Feather name="check-circle" size={16} color="#5856D6" />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Modal>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const webInputStyle = (theme: any, isDarkMode: boolean) => ({
    width: '100%', padding: '14px', borderRadius: '16px', border: `1px solid ${isDarkMode ? '#333' : '#E2E8F0'}`, 
    backgroundColor: isDarkMode ? '#1A1A1A' : '#F8FAFC', color: theme.text, fontSize: '15px', fontWeight: '600', outline: 'none'
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 24, paddingBottom: 100, maxWidth: 1400, width: '100%', alignSelf: 'center' },
    titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 },
    desktopHeader: { paddingHorizontal: 10 },
    leftHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    mainTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1', marginTop: 6 },
    subTitle: { fontSize: 22, fontWeight: '500', color: '#64748B' },
    rightHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    chipsContainer: { flexDirection: 'row', padding: 4, borderRadius: 16, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    chip: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
    chipText: { fontSize: 14, fontWeight: '800' },
    activeChipShadow: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    dateText: { fontWeight: '800', fontSize: 14 },
    analyticsRow: { gap: 28 },
    analyticsCard: { borderRadius: 36, padding: 32, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 24 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    cardTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
    cardValue: { fontSize: 48, fontWeight: '900', letterSpacing: -2 },
    cardValueLarge: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    cardLabel: { fontSize: 15, fontWeight: '700', marginTop: 4 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
    liveText: { fontSize: 11, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    revenueBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
    revenueBadgeText: { color: '#10B981', fontSize: 14, fontWeight: '900' },
    miniChart: { marginTop: 10, alignSelf: 'center' },
    centerChart: { alignItems: 'center', justifyContent: 'center' },
    absoluteCenter: { position: 'absolute', alignItems: 'center' },
    centerValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    centerLabel: { fontSize: 12, fontWeight: '900', marginTop: -2, letterSpacing: 0.5 },
    productList: { gap: 24 },
    productItem: { gap: 14 },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    prodInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    productRank: { fontSize: 16, fontWeight: '900' },
    productName: { fontSize: 16, fontWeight: '800', flex: 1 },
    productPercent: { fontSize: 15, fontWeight: '900' },
    progressBarBg: { width: '100%', height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 6 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
    exportButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
    exportText: { color: '#10B981', fontSize: 14, fontWeight: '800' },
    emptyState: { height: 200, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalContent: { borderRadius: 40, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
    closeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    customRangeBox: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 32, marginBottom: 32, borderWidth: 1, borderColor: '#E2E8F0' },
    dateGrid: { flexDirection: 'column', gap: 16, marginBottom: 20 },
    dateInputGroup: { width: '100%' },
    inputLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 10 },
    dateInput: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '700', backgroundColor: '#FFF' },
    applyButton: { backgroundColor: '#10B981', padding: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
    applyText: { color: '#FFF', fontWeight: '900', fontSize: 17 },
    presetSection: { marginTop: 10 },
    sectionLabel: { fontSize: 12, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 16 },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    presetCard: { flex: 1, minWidth: '45%', padding: 20, borderRadius: 24, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activePresetCard: { borderColor: '#10B981', backgroundColor: '#EEF2FF' },
    presetLabel: { fontSize: 15, fontWeight: '800' },
});
