import { IconButton } from '@/components/ui/IconButton';
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NotificationsScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWeb = width > 768; // Web Breakpoint
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Updates');

    // State for real data
    const [orders, setOrders] = useState<any[]>([]);
    const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: isDarkMode ? '#FFFFFF' : '#000000', // Black
        green: '#34C759',
        orange: '#FF9500',
        lightGray: '#E5E5EA',
        border: isDarkMode ? '#333' : '#e1e4e8',
        messageBubble: isDarkMode ? '#2C2C2C' : '#E5E5EA'
    };

    const fetchData = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        // 1. Fetch Orders (Updates)
        const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (ordersData) setOrders(ordersData);

        // 2. Fetch Admin Notifications (Badhee)
        // Migration script calls it 'notifications', code calls it 'admin_notifications'
        // I'll check both or assume 'notifications' based on SQL
        const { data: adminData } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (adminData) setAdminNotifications(adminData);
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchData();

            const ordersChannel = supabase.channel(`notif_orders_${user.id}_${Math.random().toString(36).substring(7)}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, () => {
                    fetchData();
                }).subscribe();

            const notesChannel = supabase.channel(`notif_admin_${Math.random().toString(36).substring(7)}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                    fetchData();
                }).subscribe();

            return () => {
                supabase.removeChannel(ordersChannel);
                supabase.removeChannel(notesChannel);
            }
        }
    }, [user]);

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return '🟠';
            case 'dispatched': return '🚚';
            case 'out for delivery': return '🚀';
            case 'delivered': return '✅';
            case 'cancelled': return '❌';
            default: return '📦';
        }
    };

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'Order Placed';
            case 'dispatched': return 'Order Dispatched';
            case 'out for delivery': return 'Out for Delivery';
            case 'delivered': return 'Order Delivered';
            case 'cancelled': return 'Order Cancelled';
            default: return 'Order Update';
        }
    }

    const formatDate = (dateStr: any) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    const renderUpdates = () => (
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Feather name="bell-off" size={48} color={theme.subtext} />
                    <Text style={{ color: theme.subtext, marginTop: 12 }}>No updates yet.</Text>
                </View>
            ) : (
                orders.map((item) => (
                    <View key={item.id} style={[styles.notificationCard, { backgroundColor: theme.card }]}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <Feather name="info" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
                            <Text style={[styles.notificationBody, { color: theme.subtext }]}>{item.body}</Text>
                            <Text style={[styles.timeText, { color: theme.subtext }]}>{new Date(item.created_at).toLocaleString()}</Text>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );

    const renderBadhee = () => (
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {adminNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Feather name="shield" size={48} color={theme.subtext} />
                    <Text style={{ color: theme.subtext, marginTop: 12 }}>No updates from Badhee G yet.</Text>
                </View>
            ) : (
                adminNotifications.map((item) => (
                    <View key={item.id} style={[styles.notificationCard, { backgroundColor: theme.card }]}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FF3B3015' }]}>
                            <Feather name="megaphone" size={24} color="#FF3B30" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
                            <Text style={[styles.notificationBody, { color: theme.subtext }]}>{item.body}</Text>
                            <Text style={[styles.timeText, { color: theme.subtext }]}>{new Date(item.created_at).toLocaleString()}</Text>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: isWeb ? 0 : insets.top }]}>
            {/* Web Layout Wrapper */}
            <View style={isWeb ? styles.webWrapper : { flex: 1 }}>
                <View style={[styles.header, isWeb && { paddingVertical: 24, justifyContent: 'center' }]}>
                    {!isWeb && <IconButton name="arrow-left" onPress={() => router.back()} backgroundColor="transparent" color={theme.text} />}
                    <Text style={[styles.headerTitle, { color: theme.text, fontSize: isWeb ? 32 : 20 }]}>Notifications</Text>
                    {!isWeb && <View style={{ width: 40 }} />}
                </View>

                <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? theme.card : '#e5e5e5' }]}>
                    <TouchableOpacity style={[styles.tabButton, activeTab === 'Updates' && [styles.activeTab, { backgroundColor: theme.background }]]} onPress={() => setActiveTab('Updates')}>
                        <Text style={[styles.tabText, { color: theme.subtext }, activeTab === 'Updates' && { color: theme.text, fontWeight: 'bold' }]}>📦 Updates</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabButton, activeTab === 'Offers' && [styles.activeTab, { backgroundColor: theme.background }]]} onPress={() => setActiveTab('Offers')}>
                        <Text style={[styles.tabText, { color: theme.subtext }, activeTab === 'Offers' && { color: theme.text, fontWeight: 'bold' }]}>🏷️ Offers</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    activeTab === 'Updates' ? renderUpdates() : renderBadhee()
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    tabContainer: { flexDirection: 'row', borderRadius: 16, marginHorizontal: 16, padding: 4, marginTop: 8 },
    tabButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
    activeTab: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    tabText: { fontSize: 14, fontWeight: '600' },
    contentContainer: { padding: 16, paddingBottom: 50 },
    card: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    orderImageContainer: { width: 50, height: 50, borderRadius: 12, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1, justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold' },
    cardSubtitle: { fontSize: 13, marginTop: 2 },
    progressBar: { height: 4, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 2 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    // Notification Styles
    notificationCard: { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
    iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    logoContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    textContainer: { flex: 1 },
    notificationContent: { flex: 1 },
    notificationTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    notificationBody: { fontSize: 14, color: '#666', lineHeight: 20 },
    timeText: { fontSize: 11, color: '#888', marginTop: 4 },
    // Web Specific Styles
    webWrapper: {
        flex: 1,
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
        paddingHorizontal: 24,
    }
});

export default NotificationsScreen;
