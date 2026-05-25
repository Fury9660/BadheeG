import { supabase } from '@/config/supabaseConfig';
import { storage } from '@/lib/storage';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    ImageBackground,
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enhanced Dashboard with "Premium" feel - v2 Fixed for Mobile Web
const SellerDashboardScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // Exact Responsive Breakpoints
    const isDesktop = width > 1024;
    const isTablet = width > 768 && width <= 1024;
    const isMobile = width <= 768;
    const isSmallMobile = width < 380;

    const isWeb = Platform.OS === 'web';

    // Card Width Calculation
    // Desktop: Fixed chunks. Mobile: Percentage based with padding accounting.
    const containerPadding = 20;
    const spacing = 16;
    const availableWidth = width - (containerPadding * 2);

    // Stats Card: On mobile, let it be 85% of screen for "peek" effect, or full width if preferred.
    // Let's go with a comfortable width.
    const statsCardWidth = isMobile ? availableWidth * 0.85 : 260;

    // Quick Action Width:
    // Mobile: (Available - Spacing) / 2
    // Desktop: Fixed or Flex.
    const quickActionWidth = isMobile ? (availableWidth - spacing) / 2 : 200;

    const [refreshing, setRefreshing] = useState(false);
    const [storeName, setStoreName] = useState('');
    const [storeStatus, setStoreStatus] = useState('Offline');
    const [stats, setStats] = useState({
        todayOrders: 0,
        pendingOrders: 0,
        todayRevenue: 0,
        totalRevenue: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const theme = {
        background: isDarkMode ? '#121212' : '#F9FAFB', // Darker dark, Lighter light
        card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#111827',
        subtext: isDarkMode ? '#9CA3AF' : '#6B7280',
        primary: '#6366F1', // Indigo
        secondary: '#10B981', // Emerald
        accent: '#F59E0B', // Amber
        danger: '#EF4444', // Red
        border: isDarkMode ? '#374151' : '#E5E7EB',
        surface: isDarkMode ? '#374151' : '#F3F4F6',
    };

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Partner Profile
                let query = supabase.from('pre_approved_partners').select('*');

                if (user.email) {
                    query = query.ilike('email', user.email);
                } else if (user.phone) {
                    const cleanPhone = user.phone.replace('+91', '').replace(/\D/g, '').slice(-10);
                    query = query.eq('mobile_number', cleanPhone);
                }

                const { data: partnerData } = await query.single();

                if (partnerData) {
                    setStoreName(partnerData.name || partnerData.store_name || user.user_metadata?.full_name || 'My Store');
                    setStoreStatus('Online');
                } else {
                    setStoreName(user.user_metadata?.full_name || 'My Store');
                }

                // 2. Orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select('*')
                    .order('createdAt', { ascending: false });

                if (orders) {
                    processOrders(orders);
                }
            } catch (error) {
                console.error("Dashboard Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        const processOrders = (allOrders: any[]) => {
            // Filter for this partner (Client-side filtering as fallback)
            const myOrders = allOrders.filter(o => o.partner_id === user.id || (o.items && o.items.some((i: any) => i.partner_id === user.id)));

            // Calculate Stats
            const today = new Date().toDateString();
            let todayCount = 0;
            let pendingCount = 0;
            let todayRev = 0;
            let totalRev = 0;

            myOrders.forEach((order: any) => {
                const orderDate = new Date(order.createdAt).toDateString();
                const isToday = orderDate === today;

                if (isToday) todayCount++;
                if (order.status === 'pending') pendingCount++;

                if (order.status === 'delivered' || order.status === 'completed') {
                    totalRev += (order.amount || 0);
                    if (isToday) todayRev += (order.amount || 0);
                }
            });

            setStats({
                todayOrders: todayCount,
                pendingOrders: pendingCount,
                todayRevenue: todayRev,
                totalRevenue: totalRev
            });
            setRecentOrders(myOrders.slice(0, 5));
        };

        fetchData();

        // 3. Realtime Subscription for Orders
        const channel = supabase.channel('dashboard-orders-v2')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    fetchData(); // Simple re-fetch strategy
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [user]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const performLogout = async () => {
        try {
            await storage.removeItem('user_role');
            await storage.removeItem('partner_status');
            await supabase.auth.signOut();
            router.replace('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to logout?")) performLogout();
        } else {
            Alert.alert("Logout", "Are you sure you want to logout?", [
                { text: "Cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: performLogout
                }
            ]);
        }
    };



    const QuickAction = ({ title, icon, color, route, delay }: any) => (
        <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ width: quickActionWidth }}>
            <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.primary, height: isSmallMobile ? 100 : 120 }]}
                onPress={() => router.push(route)}
            >
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    <MaterialCommunityIcons name={icon} size={24} color={color} />
                </View>
                <Text style={[styles.actionTitle, { color: theme.text }]}>{title}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 5, paddingBottom: 6, backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={[styles.storeName, { color: theme.text, marginTop: 0, fontSize: 18 }]}>{loading ? 'Loading...' : storeName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                            <View style={[styles.statusDot, { backgroundColor: storeStatus === 'Online' ? theme.secondary : theme.subtext, width: 6, height: 6 }]} />
                            <Text style={[styles.statusText, { color: theme.subtext, fontSize: 11 }]}>{storeStatus}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: theme.surface, width: 34, height: 34, borderRadius: 10 }]}>
                            <Feather name="log-out" size={16} color={theme.danger} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* 1. Main Stats Section */}
                <View style={{ marginTop: 20, gap: 12 }}>
                    {/* Primary Card: Total Revenue */}
                    <View style={{ width: '100%', height: 140, borderRadius: 24, overflow: 'hidden' }}>
                        <ImageBackground
                            source={{ uri: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80' }}
                            style={{ flex: 1 }}
                        >
                            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', padding: 20, justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 }}>
                                            <MaterialCommunityIcons name="finance" size={16} color="#fff" />
                                        </View>
                                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' }}>TOTAL REVENUE</Text>
                                    </View>
                                    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 }}>
                                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>TODAY</Text>
                                    </View>
                                </View>
                                <View>
                                    <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1 }}>₹{stats.todayRevenue.toLocaleString()}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Lifetime: ₹{stats.totalRevenue.toLocaleString()}</Text>
                                </View>
                            </View>
                        </ImageBackground>
                    </View>

                    {/* Secondary Stats Grid */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {/* Orders Card */}
                        <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <View style={{ padding: 8, backgroundColor: theme.primary + '15', borderRadius: 10 }}>
                                    <Feather name="shopping-bag" size={18} color={theme.primary} />
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Feather name="arrow-up-right" size={12} color={theme.secondary} />
                                    <Text style={{ fontSize: 11, color: theme.secondary, fontWeight: '700' }}>12%</Text>
                                </View>
                            </View>
                            <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>{stats.todayOrders}</Text>
                            <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '500' }}>New Orders</Text>
                        </View>

                        {/* Pending Card */}
                        <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.border }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <View style={{ padding: 8, backgroundColor: theme.accent + '15', borderRadius: 10 }}>
                                    <Feather name="clock" size={18} color={theme.accent} />
                                </View>
                            </View>
                            <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800' }}>{stats.pendingOrders}</Text>
                            <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '500' }}>Pending</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Quick Actions (Horizontal Scroll) */}
                <View style={{ marginTop: 28 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18 }]}>Quick Actions</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                    >
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/inventory')}
                            style={{ alignItems: 'center', gap: 8, width: 80 }}
                        >
                            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#8B5CF6' + '15', alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialCommunityIcons name="shape-outline" size={26} color="#8B5CF6" />
                            </View>
                            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '500' }}>Catalog</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/orders')}
                            style={{ alignItems: 'center', gap: 8, width: 80 }}
                        >
                            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#F43F5E' + '15', alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialCommunityIcons name="file-document-outline" size={26} color="#F43F5E" />
                            </View>
                            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '500' }}>Orders</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/finance')}
                            style={{ alignItems: 'center', gap: 8, width: 80 }}
                        >
                            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#10B981' + '15', alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialCommunityIcons name="wallet-outline" size={26} color="#10B981" />
                            </View>
                            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '500' }}>Finance</Text>
                        </TouchableOpacity>


                    </ScrollView>
                </View>



            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    storeName: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginTop: 2,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 13, fontWeight: '600' },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    glassIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    quickAction: {
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    orderParam: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customerName: {
        fontSize: 15,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 6,
    },
});

export default SellerDashboardScreen;
