import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PartnerDetailsScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [partner, setPartner] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalSales: 0, orderCount: 0 });

    // Password Reset State
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const theme = {
        background: isDarkMode ? '#000' : '#f8f9fa',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: isDarkMode ? '#fff' : '#000',
        border: isDarkMode ? '#2C2C2C' : '#E2E2E2',
        danger: '#e74c3c',
        success: '#27ae60',
        warning: '#f39c12'
    };

    const fetchPartnerDetails = async () => {
        try {
            // Step 1: Fetch Partner Details
            const { data: partnerData, error: partnerError } = await supabase
                .from('pre_approved_partners')
                .select('*')
                .eq('id', id)
                .single();

            if (partnerError) throw partnerError;

            // Step 2: Fetch User ID via Mobile (if not already linked)
            let userId = partnerData.user_id;
            const mobileNumber = partnerData.mobile || partnerData.mobile_number; // Handle potential schema variations

            if (!userId && mobileNumber) {
                // Ensure mobile format matches profiles table (try both formats)
                const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
                const numbersToTry = [cleanMobile, `+91${cleanMobile}`, `91${cleanMobile}`];

                const { data: userData, error: userError } = await supabase
                    .from('profiles')
                    .select('id')
                    .in('phone', numbersToTry) // Based on other files, column is likely 'phone'
                    .maybeSingle(); // Use maybeSingle to avoid errors on multiple matches or none

                // Fallback: Check auth.users table via rpc or just assume profiles has 'mobile' column
                if (!userData) {
                    const { data: userData2 } = await supabase
                        .from('profiles')
                        .select('id')
                        .in('mobile', numbersToTry)
                        .maybeSingle();
                    if (userData2) userId = userData2.id;
                } else {
                    userId = userData.id;
                }
            }

            setPartner({ ...partnerData, user_id: userId });

            // Fetch Stats
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('total_amount, net_amount')
                .eq('partner_id', id);

            if (!ordersError && orders) {
                const totalSales = orders.reduce((sum, order) => sum + (order.net_amount || order.total_amount || 0), 0);
                setStats({ totalSales, orderCount: orders.length });
            }

        } catch (error) {
            console.error("Error fetching partner:", error);
            Alert.alert("Error", "Could not fetch partner details.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPartnerDetails();
    }, [id]);

    // RENDER GUARDS
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!partner) return null; // Prevent crash if fetch failed and we are navigating back

    const handleToggleStatus = async () => {
        const newStatus = partner.status === 'Active' ? 'Inactive' : 'Active';
        const action = newStatus === 'Active' ? 'Activate' : 'Deactivate';

        const performToggle = async () => {
            try {
                const { data, error } = await supabase.rpc('admin_update_partner_status', {
                    target_partner_id: id,
                    new_status: newStatus
                });

                if (error) throw error;
                setPartner({ ...partner, status: newStatus });
                if (Platform.OS === 'web') window.alert(`Showroom is now ${newStatus}`);
                else Alert.alert("Success", `Showroom is now ${newStatus}`);
            } catch (error: any) {
                console.error("Update Status Error:", error);
                const msg = `Could not update status: ${error.message || JSON.stringify(error)}`;
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert("Error", msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to ${action} this showroom?`)) {
                performToggle();
            }
        } else {
            Alert.alert(
                "Confirm Action",
                `Are you sure you want to ${action} this showroom?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Confirm", style: newStatus === 'Active' ? 'default' : 'destructive', onPress: performToggle }
                ]
            );
        }
    };

    const handleResetPassword = () => {
        setIsPasswordModalVisible(true);
    };

    const confirmPasswordReset = async () => {
        // DEBUG: Confirm function start
        console.log("Starting Smart Reset Process...");

        if (!newPassword || newPassword.length < 6) {
            return Alert.alert("Error", "Password must be at least 6 characters.");
        }

        // No checks for user_id needed anymore! The backend handles it.

        setIsPasswordModalVisible(false); // Close first

        try {
            console.log("Calling Smart Upsert for partner:", partner.id);

            const { data, error } = await supabase.rpc('admin_upsert_partner_user', {
                target_partner_id: partner.id, // Passing Partner Row ID, not User ID
                new_password: newPassword
            });

            if (error) {
                console.error("RPC Error:", error);
                throw error;
            }

            console.log("RPC Success:", data);
            Alert.alert("Success", data || "Password updated successfully.");
            setNewPassword(''); // Reset input

            // Refresh partner details to get the new user_id if one was created
            fetchPartnerDetails();

        } catch (e: any) {
            console.error("Reset Password Error:", e);
            Alert.alert("Reset Failed", e.message || "Unknown error occurred.");
        }
    };


    const generateReport = async () => {
        try {
            setLoading(true);
            // Fetch recent orders for report
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .eq('partner_id', id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const htmlContent = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                        h1 { font-size: 24px; margin: 0; color: #000; }
                        h2 { font-size: 16px; margin: 5px 0 0; color: #666; font-weight: normal; }
                        .summary { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
                        .stat-box { text-align: center; flex: 1; }
                        .stat-value { font-size: 20px; font-weight: bold; display: block; }
                        .stat-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th { text-align: left; padding: 12px 8px; border-bottom: 1px solid #ddd; background: #f5f5f5; color: #555; }
                        td { padding: 12px 8px; border-bottom: 1px solid #eee; }
                        .status { font-weight: bold; text-transform: uppercase; font-size: 10px; padding: 3px 6px; border-radius: 4px; display: inline-block; }
                        .status-pending { background: #fff3cd; color: #856404; }
                        .status-completed { background: #d4edda; color: #155724; }
                        .status-cancelled { background: #f8d7da; color: #721c24; }
                        .amount { font-family: monospace; font-size: 13px; font-weight: bold; }
                        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${partner.store_name}</h1>
                        <h2>Partner Performance Report</h2>
                        <p style="font-size: 12px; color: #999;">Generated on ${new Date().toLocaleString()}</p>
                    </div>

                    <div class="summary">
                        <div class="stat-box">
                            <span class="stat-value">₹${stats.totalSales.toLocaleString()}</span>
                            <span class="stat-label">Total Revenue</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-value">${stats.orderCount}</span>
                            <span class="stat-label">Total Orders</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-value">${partner.status}</span>
                            <span class="stat-label">Current Status</span>
                        </div>
                    </div>

                    <h3>Recent Transactions</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders?.map(o => `
                                <tr>
                                    <td>#${o.order_id || o.id.slice(0, 8)}</td>
                                    <td>${new Date(o.created_at).toLocaleDateString()}</td>
                                    <td><span class="status status-${(o.status || 'pending').toLowerCase()}">${o.status || 'Pending'}</span></td>
                                    <td class="amount">₹${(o.total_amount || 0).toLocaleString()}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="4" style="text-align:center">No recent orders found</td></tr>'}
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>This report is generated by the Admin Panel. Confidential.</p>
                    </div>
                </body>
                </html>
            `;

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(htmlContent);
                    printWindow.document.close();
                    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html: htmlContent });
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }

        } catch (error) {
            console.error("Report Error:", error);
            Alert.alert("Error", "Could not generate report.");
        } finally {
            setLoading(false);
        }
    };

    const menuItems = [
        {
            label: "Edit Details",
            icon: "edit-3",
            action: () => router.push({ pathname: '/add-partner', params: { editMode: 'true', id: partner.id, initialData: JSON.stringify(partner) } })
        },
        {
            label: "View Details",
            icon: "eye",
            action: () => router.push({ pathname: '/add-partner', params: { editMode: 'true', readOnly: 'true', id: partner.id, initialData: JSON.stringify(partner) } })
        },
        ...(partner?.status === 'Pending' ? [
            {
                label: "Approve Application",
                icon: "check-circle",
                color: theme.success,
                action: handleToggleStatus
            },
            {
                label: "Delete Application",
                icon: "trash-2",
                color: theme.danger,
                action: async () => {
                    const performDelete = async () => {
                        try {
                            const { error } = await supabase.rpc('admin_delete_partner', {
                                target_partner_id: id
                            });
                            if (error) throw error;
                            if (Platform.OS === 'web') window.alert("Partner application has been deleted.");
                            else Alert.alert("Deleted", "Partner application has been deleted.");
                            router.back(); // Go back since record is gone
                        } catch (error: any) {
                            if (Platform.OS === 'web') window.alert(error.message);
                            else Alert.alert("Error", error.message);
                        }
                    };

                    if (Platform.OS === 'web') {
                        if (window.confirm("Are you sure you want to PERMANENTLY delete this application? This cannot be undone.")) {
                            performDelete();
                        }
                    } else {
                        Alert.alert(
                            "Delete Application",
                            "Are you sure you want to PERMANENTLY delete this application? This cannot be undone.",
                            [
                                { text: "Cancel", style: "cancel" },
                                { text: "Delete", style: "destructive", onPress: performDelete }
                            ]
                        );
                    }
                }
            }
        ] : [
            {
                label: partner?.status === 'Active' ? "Deactivate Showroom" : "Activate Showroom",
                icon: partner?.status === 'Active' ? "power" : "check-circle",
                color: partner?.status === 'Active' ? theme.danger : theme.success,
                action: handleToggleStatus
            }
        ]),
        {
            label: "Reset Password",
            icon: "lock",
            action: handleResetPassword
        },
        {
            label: "View Sales Report",
            icon: "bar-chart-2",
            action: () => Alert.alert("Coming Soon", "Sales Report feature is under development.")
        },
        {
            label: "Download Report",
            icon: "download",
            action: generateReport
        },
        {
            label: "Transaction History",
            icon: "clock",
            action: () => router.push({ pathname: '/partner-orders', params: { partnerId: partner.id } })
        }
    ];

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Manage Showroom</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Partner Profile Card */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
                            <Feather name="shopping-bag" size={32} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.storeName, { color: theme.text }]}>{partner.store_name}</Text>
                            <Text style={[styles.ownerName, { color: theme.subtext }]}>{partner.owner_name}</Text>
                            <Text style={[styles.location, { color: theme.subtext }]}>
                                <Feather name="map-pin" size={12} /> {partner.city}, {partner.state}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, {
                            backgroundColor: (partner.status === 'Active' ? theme.success : (partner.status === 'Rejected' ? theme.danger : theme.warning)) + '20',
                            borderColor: partner.status === 'Active' ? theme.success : (partner.status === 'Rejected' ? theme.danger : theme.warning)
                        }]}>
                            <Text style={[styles.statusText, { color: partner.status === 'Active' ? theme.success : (partner.status === 'Rejected' ? theme.danger : theme.warning) }]}>
                                {partner.status?.toUpperCase() || 'PENDING'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>₹{stats.totalSales.toLocaleString()}</Text>
                            <Text style={[styles.statLabel, { color: theme.subtext }]}>Total Sales</Text>
                        </View>
                        <View style={[styles.dividerVertical, { backgroundColor: theme.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>{stats.orderCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.subtext }]}>Orders</Text>
                        </View>
                        <View style={[styles.dividerVertical, { backgroundColor: theme.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>4.8</Text>
                            <Text style={[styles.statLabel, { color: theme.subtext }]}>Rating</Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.subtext }]}>ACTIONS</Text>

                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={item.action}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: (item.color || theme.primary) + '15' }]}>
                                <Feather name={item.icon as any} size={24} color={item.color || theme.primary} />
                            </View>
                            <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
            {/* Password Reset Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isPasswordModalVisible}
                onRequestClose={() => setIsPasswordModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContentContainer}>
                        <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Reset Password</Text>
                            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                                Enter a new password for {partner?.store_name}
                            </Text>

                            <TextInput
                                style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="New Password (min 6 chars)"
                                placeholderTextColor={theme.subtext}
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                                autoFocus
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: theme.border }]}
                                    onPress={() => { setIsPasswordModalVisible(false); setNewPassword(''); }}
                                >
                                    <Text style={{ color: theme.text }}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                    onPress={() => {
                                        console.log("Update Button Pressed");
                                        confirmPasswordReset();
                                    }}
                                >
                                    <Text style={{ color: isDarkMode ? '#000' : '#fff', fontWeight: 'bold' }}>Update</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    backButton: { marginRight: 16, padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 16 },
    card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 24 },
    profileHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    storeName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    ownerName: { fontSize: 14, marginBottom: 4 },
    location: { fontSize: 12 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    divider: { height: 1, marginVertical: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    statLabel: { fontSize: 12 },
    dividerVertical: { width: 1, height: '100%' },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 12, marginLeft: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    menuItem: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', height: 120 },
    iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    menuLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContentContainer: { width: '100%', alignItems: 'center' },
    modalCard: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
    modalInput: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20, fontSize: 16 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});

export default PartnerDetailsScreen;
