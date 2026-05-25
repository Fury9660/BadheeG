import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

const INDIAN_BANKS = [
    "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
    "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
    "Bank of India", "Indian Bank", "Central Bank of India", "IDBI Bank",
    "IndusInd Bank", "YES Bank", "Federal Bank", "IDFC FIRST Bank",
    "Standard Chartered Bank", "HSBC India", "Citibank India", "Bandhan Bank",
    "Karnataka Bank", "South Indian Bank", "Karur Vysya Bank", "City Union Bank",
    "Dhanlaxmi Bank", "Tamilnad Mercantile Bank", "J&K Bank", "Punjab & Sind Bank",
    "UCO Bank", "Bank of Maharashtra", "Indian Overseas Bank", "Saraswat Bank",
    "SVC Bank", "Cosmos Bank", "TJSB Bank", "Bharat Bank", "Abhyudaya Bank",
    "NKGSB Bank", "New India Bank", "G P Parsik Bank", "Bassein Catholic Bank",
    "RBL Bank", "Airtel Payments Bank", "Paytm Payments Bank", "Jio Payments Bank",
    "FINO Payments Bank", "India Post Payments Bank"
].sort();

export default function FinanceScreen() {
    console.log('Finance Page Rendered - Chart Color: Green');
    const { colors: theme, isDarkMode } = useTheme();
    const { user } = useAuth();
    const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
    const isDesktop = containerWidth > 768;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState(0);
    const [bankDetails, setBankDetails] = useState<any>(null);

    // Modals
    const [showBankModal, setShowBankModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    // Form States
    const [bankForm, setBankForm] = useState({
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',
    });
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bank Search & IFSC
    const [showBankListModal, setShowBankListModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [branchName, setBranchName] = useState('');
    const [isIFSCLoading, setIsIFSCLoading] = useState(false);

    const [statsData, setStatsData] = useState({
        today: 0,
        pending: 0,
        withdrawn: 0,
        revenue: 0
    });

    const [chartData, setChartData] = useState({
        labels: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
    });
    const [transactions, setTransactions] = useState<any[]>([]);

    const fetchFinanceData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            const { data: partner } = await supabase
                .from('pre_approved_partners')
                .select('account_number, bank_name, account_holder_name, ifsc_code')
                .eq('id', user.id)
                .single();

            if (partner) {
                setBankDetails(partner.account_number ? partner : null);
                if (partner.account_number) {
                    setBankForm({
                        bank_name: partner.bank_name || '',
                        account_holder_name: partner.account_holder_name || '',
                        account_number: partner.account_number || '',
                        ifsc_code: partner.ifsc_code || '',
                    });
                }
            }

            const { data: allOrders } = await supabase
                .from('orders')
                .select('*')
                .eq('partner_id', user.id);

            const { data: trans } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            setTransactions(trans || []);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                d.setHours(0, 0, 0, 0);
                return d;
            });

            let todayEarnings = 0;
            let pendingPayout = 0;
            let totalRevenue = 0;
            let availableBalance = 0;
            let dailyData = [0, 0, 0, 0, 0, 0, 0];
            const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
            const now = new Date().getTime();

            allOrders?.forEach(order => {
                const orderDate = new Date(order.created_at);
                const updatedAt = new Date(order.updated_at || order.created_at).getTime();
                const amt = order.total_amount || 0;
                const status = order.status?.toLowerCase();

                if (order.payment_status === 'paid') {
                    totalRevenue += amt;
                    if (orderDate >= today) todayEarnings += amt;
                    if (status === 'delivered') {
                        if (now - updatedAt >= FORTY_EIGHT_HOURS_MS) availableBalance += amt;
                        else pendingPayout += amt;
                    } else if (['processing', 'shipped'].includes(status)) {
                        pendingPayout += amt;
                    }
                }

                last7Days.forEach((day, idx) => {
                    const nextDay = new Date(day);
                    nextDay.setDate(day.getDate() + 1);
                    if (orderDate >= day && orderDate < nextDay && order.payment_status === 'paid') {
                        dailyData[idx] += amt;
                    }
                });
            });

            setBalance(availableBalance);
            setStatsData({
                today: todayEarnings,
                pending: pendingPayout,
                withdrawn: 0, // Placeholder
                revenue: totalRevenue
            });
            setChartData({
                labels: last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{ 
                    data: dailyData,
                    color: () => '#22C55E',
                    strokeWidth: 3
                }]
            });

        } catch (error: any) {
            console.error('Error fetching finance data:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    const lookupIFSC = async (code: string) => {
        if (code.length === 11) {
            setIsIFSCLoading(true);
            try {
                const response = await fetch(`https://ifsc.razorpay.com/${code}`);
                if (response.ok) {
                    const data = await response.json();
                    setBranchName(data.BRANCH || '');
                    if (data.BANK && !bankForm.bank_name) {
                        setBankForm(prev => ({ ...prev, bank_name: data.BANK }));
                    }
                } else {
                    setBranchName('Invalid IFSC Code');
                }
            } catch (e) {
                setBranchName('Could not verify IFSC');
            } finally {
                setIsIFSCLoading(false);
            }
        } else {
            setBranchName('');
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchFinanceData();
    };

    const handleWithdrawPress = () => {
        if (!bankDetails) {
            setShowBankModal(true);
        } else {
            setShowWithdrawModal(true);
        }
    };

    const handleSaveBankDetails = async () => {
        if (!bankForm.bank_name || !bankForm.account_number || !bankForm.ifsc_code) {
            return Alert.alert("Error", "Please fill all bank details");
        }
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('pre_approved_partners')
                .update({ ...bankForm })
                .eq('id', user!.id);
            if (error) throw error;
            setBankDetails(bankForm);
            setShowBankModal(false);
            Alert.alert("Success", "Bank account added successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdrawRequest = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount <= 0) return Alert.alert("Error", "Enter a valid amount");
        if (amount > balance) return Alert.alert("Error", "Insufficient balance");

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('withdrawals')
                .insert([{
                    partner_id: user!.id,
                    amount: amount,
                    status: 'pending',
                    account_details: bankDetails
                }]);
            if (error) throw error;
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            Alert.alert("Success", "Withdrawal request submitted! It will be processed shortly.");
            fetchFinanceData();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStatItem = (label: string, value: string, icon: any, color: string, delay: number) => (
        <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.statItem, { width: isDesktop ? (containerWidth - 88) / 4 : (containerWidth - 56) / 2 }]}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Feather name={icon} size={18} color={color} />
            </View>
            <View>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{label}</Text>
                <Text style={[styles.statValue, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>{value}</Text>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F8FAFC' }]}
            edges={['top']}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, isDesktop && { maxWidth: 1200, alignSelf: 'center', width: '100%' }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                >
                    {/* Compact Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <View>
                                <Text style={[styles.title, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Finance Centre</Text>
                                <Text style={[styles.subtitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>Track your revenue & payouts</Text>
                            </View>
                            <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' }]}>
                                <Feather name="download" size={18} color={isDarkMode ? '#FFF' : '#10B981'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Balance Card - Premium Gradient */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroWrapper}>
                        <LinearGradient
                            colors={['#10B981', '#10B981']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.balanceCard}
                        >
                            <View style={styles.cardRow}>
                                <View>
                                    <View style={styles.cardLabelRow}>
                                        <View style={styles.glassIcon}>
                                            <Feather name="wallet" size={12} color="#FFF" />
                                        </View>
                                        <Text style={styles.cardLabel}>AVAILABLE TO WITHDRAW</Text>
                                    </View>
                                    <Text style={styles.cardBalance}>₹{balance.toLocaleString()}</Text>
                                </View>
                                <View style={styles.cardBadge}>
                                    <Text style={styles.cardBadgeText}>Settled Funds</Text>
                                </View>
                            </View>
                            
                            <View style={styles.cardFooter}>
                                <View>
                                    <Text style={styles.cardFooterLabel}>Recent Withdrawal</Text>
                                    <Text style={styles.cardFooterValue}>₹0</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.withdrawBtn} 
                                    activeOpacity={0.8}
                                    onPress={handleWithdrawPress}
                                >
                                    <Text style={styles.withdrawBtnText}>Withdraw Now</Text>
                                    <Feather name="arrow-right" size={14} color="#10B981" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Quick Stats Grid */}
                    <View style={styles.statsGrid}>
                        {renderStatItem("Today's Pay", `₹${statsData.today.toLocaleString()}`, "trending-up", "#10B981", 200)}
                        {renderStatItem("Pending", `₹${statsData.pending.toLocaleString()}`, "clock", "#F59E0B", 300)}
                        {renderStatItem("Withdrawn", `₹${statsData.withdrawn.toLocaleString()}`, "check-circle", "#10B981", 400)}
                        {renderStatItem("Total Revenue", `₹${statsData.revenue.toLocaleString()}`, "pie-chart", "#10B981", 500)}
                    </View>

                    {/* Analytics Chart Section */}
                    <Animated.View entering={FadeInDown.delay(600).springify()} style={[styles.sectionCard, { backgroundColor: isDarkMode ? '#111' : '#FFF', borderColor: isDarkMode ? '#222' : '#E2E8F0' }]}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleGroup}>
                                <View style={[styles.indicator, { backgroundColor: '#10B981' }]} />
                                <Text style={[styles.sectionTitleText, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Weekly Analytics</Text>
                            </View>
                            <Text style={styles.sectionSubtitleText}>Last 7 Days</Text>
                        </View>
                        <LineChart
                            data={chartData}
                            width={isDesktop ? 900 : Math.max(containerWidth - 72, 200)}
                            height={180}
                            chartConfig={{
                                backgroundColor: "#10B981",
                                backgroundGradientFrom: "#10B981",
                                backgroundGradientTo: "#10B981",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White line on green bg
                                labelColor: () => "#FFF",
                                propsForDots: { r: "5", strokeWidth: "2", stroke: "#FFF" },
                                propsForBackgroundLines: { strokeDasharray: "4", stroke: "rgba(255,255,255,0.2)" },
                                fillShadowGradient: '#FFF',
                                fillShadowGradientOpacity: 0.2,
                            }}
                            withShadow={false}
                            bezier
                            style={{ marginTop: 12, borderRadius: 16 }}
                        />
                    </Animated.View>

                    {/* Transaction History */}
                    <View style={styles.historyHeader}>
                        <Text style={[styles.historyTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Payout History</Text>
                        <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
                    </View>

                    <Animated.View entering={FadeInDown.delay(700).springify()} style={[styles.sectionCard, { padding: 0, backgroundColor: isDarkMode ? '#111' : '#FFF', borderColor: isDarkMode ? '#222' : '#E2E8F0' }]}>
                        {transactions.length > 0 ? (
                            transactions.map((item, index) => {
                                const isWithdrawal = item.amount !== undefined;
                                return (
                                    <View key={index} style={[styles.transactionRow, index !== transactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#222' : '#F1F5F9' }]}>
                                        <View style={styles.transLeft}>
                                            <View style={[styles.transIconBox, { backgroundColor: isWithdrawal ? '#FEE2E2' : '#D1FAE5' }]}>
                                                <Feather
                                                    name={isWithdrawal ? "arrow-up-right" : "arrow-down-left"}
                                                    size={16}
                                                    color={isWithdrawal ? "#EF4444" : "#10B981"}
                                                />
                                            </View>
                                            <View>
                                                <Text style={[styles.transTitleText, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>
                                                    {isWithdrawal ? "Withdrawal Request" : `Order Payment`}
                                                </Text>
                                                <Text style={styles.transDateText}>
                                                    {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {isWithdrawal ? (item.status?.toUpperCase()) : "Success"}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.transAmountText, { color: isWithdrawal ? "#EF4444" : "#10B981" }]}>
                                                {isWithdrawal ? `-₹${item.amount}` : `+₹${item.total_amount || 0}`}
                                            </Text>
                                            <Text style={[styles.transStatusText, { color: item.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
                                                {item.status || 'Success'}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyHistory}>
                                <MaterialCommunityIcons name="history" size={40} color="#94A3B8" />
                                <Text style={styles.emptyText}>No recent transactions found</Text>
                            </View>
                        )}
                    </Animated.View>
                    
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {/* Modals - Standard Expo UI */}
            
            {/* Bank Modal */}
            <Modal visible={showBankModal} transparent animationType={isDesktop ? "fade" : "slide"}>
                <View style={[styles.modalBackdrop, !isDesktop && { justifyContent: 'flex-end' }]}>
                    <View style={[isDesktop ? styles.modalBox : styles.mobileModalBox, { backgroundColor: isDarkMode ? '#111' : '#FFF' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Setup Bank Account</Text>
                            <TouchableOpacity onPress={() => setShowBankModal(false)}>
                                <Feather name="x" size={24} color={isDarkMode ? '#FFF' : '#000'} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={{ padding: 20 }}>
                            <Text style={styles.inputLabel}>Bank Name</Text>
                            <TouchableOpacity style={styles.inputTrigger} onPress={() => setShowBankListModal(true)}>
                                <Text style={{ color: bankForm.bank_name ? theme.text : '#666' }}>{bankForm.bank_name || "Select Bank"}</Text>
                            </TouchableOpacity>
                            
                            <Text style={styles.inputLabel}>Account Number</Text>
                            <TextInput 
                                style={styles.modalInput} 
                                placeholder="Enter account number" 
                                value={bankForm.account_number}
                                onChangeText={(val) => setBankForm({...bankForm, account_number: val})}
                                keyboardType="number-pad"
                            />
                            
                            <Text style={styles.inputLabel}>IFSC Code</Text>
                            <TextInput 
                                style={styles.modalInput} 
                                placeholder="e.g. SBIN0001234" 
                                value={bankForm.ifsc_code}
                                onChangeText={(val) => {
                                    setBankForm({...bankForm, ifsc_code: val.toUpperCase()});
                                    lookupIFSC(val.toUpperCase());
                                }}
                                autoCapitalize="characters"
                                maxLength={11}
                            />
                            {isIFSCLoading && <ActivityIndicator size="small" color="#10B981" style={{ alignSelf: 'flex-start' }} />}
                            {branchName && <Text style={{ color: '#10B981', fontSize: 12, marginTop: 4 }}>{branchName}</Text>}
                        </ScrollView>
                        
                        <TouchableOpacity style={styles.modalBtn} onPress={handleSaveBankDetails}>
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>Save Bank Details</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Withdraw Modal */}
            <Modal visible={showWithdrawModal} transparent animationType={isDesktop ? "fade" : "slide"}>
                <View style={[styles.modalBackdrop, !isDesktop && { justifyContent: 'flex-end' }]}>
                    <View style={[isDesktop ? styles.modalBox : styles.mobileModalBox, { backgroundColor: isDarkMode ? '#111' : '#FFF' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Withdraw Funds</Text>
                            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                                <Feather name="x" size={24} color={isDarkMode ? '#FFF' : '#000'} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ padding: 20 }}>
                            <Text style={styles.withdrawSub}>Available Balance</Text>
                            <Text style={styles.withdrawMain}>₹{balance}</Text>
                            
                            <Text style={[styles.inputLabel, { marginTop: 20 }]}>Amount to Withdraw</Text>
                            <TextInput 
                                style={[styles.modalInput, { fontSize: 24, height: 60 }]} 
                                placeholder="₹ 0.00"
                                value={withdrawAmount}
                                onChangeText={setWithdrawAmount}
                                keyboardType="number-pad"
                                autoFocus
                            />
                            
                            <View style={styles.bankInfoTag}>
                                <Feather name="home" size={14} color="#64748B" />
                                <Text style={styles.bankInfoText}>Paying to: {bankDetails?.bank_name} (****{bankDetails?.account_number?.slice(-4)})</Text>
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.modalBtn, { opacity: (!withdrawAmount || parseFloat(withdrawAmount) > balance) ? 0.5 : 1 }]} 
                            onPress={handleWithdrawRequest}
                            disabled={!withdrawAmount || parseFloat(withdrawAmount) > balance}
                        >
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalBtnText}>Submit Payout Request</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Bank List Modal */}
            <Modal visible={showBankListModal} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={[isDesktop ? styles.modalBox : styles.mobileModalBox, { backgroundColor: isDarkMode ? '#111' : '#FFF', height: isDesktop ? '70%' : '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFF' : '#0F172A' }]}>Select Bank</Text>
                            <TouchableOpacity onPress={() => setShowBankListModal(false)}><Feather name="x" size={24} /></TouchableOpacity>
                        </View>
                        <TextInput 
                            style={[styles.modalInput, { margin: 16 }]} 
                            placeholder="Search bank name..." 
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <ScrollView>
                            {INDIAN_BANKS.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase())).map((bank, i) => (
                                <TouchableOpacity key={i} style={styles.bankSelectionItem} onPress={() => { setBankForm({...bankForm, bank_name: bank}); setShowBankListModal(false); }}>
                                    <Text style={{ color: isDarkMode ? '#FFF' : '#000' }}>{bank}</Text>
                                    <Feather name="chevron-right" size={16} color="#64748B" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    header: { marginBottom: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    headerIconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    heroWrapper: { marginBottom: 20 },
    balanceCard: { borderRadius: 24, padding: 20, overflow: 'hidden' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    glassIcon: { padding: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6 },
    cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    cardBalance: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
    cardBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
    cardBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
    cardFooterLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
    cardFooterValue: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    withdrawBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 4 },
    withdrawBtnText: { color: '#10B981', fontWeight: '800', fontSize: 13 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statItem: { padding: 16, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', gap: 12, alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 11, fontWeight: '600', marginBottom: 1 },
    statValue: { fontSize: 16, fontWeight: '800' },
    sectionCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    indicator: { width: 3, height: 14, borderRadius: 2 },
    sectionTitleText: { fontSize: 15, fontWeight: '800' },
    sectionSubtitleText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    historyTitle: { fontSize: 17, fontWeight: '900' },
    viewAllText: { color: '#10B981', fontWeight: '700', fontSize: 13 },
    transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    transLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    transIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    transTitleText: { fontSize: 14, fontWeight: '700' },
    transDateText: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
    transAmountText: { fontSize: 14, fontWeight: '800' },
    transStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
    emptyHistory: { padding: 40, alignItems: 'center', gap: 12 },
    emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
    modalBackdrop: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    modalBox: { 
        borderRadius: 32, 
        width: '90%',
        maxWidth: 600,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.2,
                shadowRadius: 40,
            }
        })
    },
    mobileModalBox: {
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32, 
        minHeight: '50%', 
        paddingBottom: 40,
        width: '100%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 16 },
    modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, height: 50, paddingHorizontal: 16, fontSize: 16 },
    inputTrigger: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, height: 50, paddingHorizontal: 16, justifyContent: 'center' },
    modalBtn: { backgroundColor: '#10B981', margin: 20, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    withdrawSub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
    withdrawMain: { fontSize: 42, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginTop: 4 },
    bankInfoTag: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, marginTop: 20 },
    bankInfoText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    bankSelectionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }
});
