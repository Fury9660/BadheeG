
import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// Firebase imports removed
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



const PartnersScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [partners, setPartners] = useState<any[]>([]);
    const [filteredPartners, setFilteredPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const activeCount = partners.filter(p => (p.status || 'Pending').toLowerCase() === 'active').length;
    const pendingCount = partners.filter(p => (p.status || 'Pending').toLowerCase() === 'pending').length;
    const inactiveCount = partners.filter(p => (p.status || 'Pending').toLowerCase() === 'inactive').length;

    const fetchPartners = async () => {
        setLoading(true);
        try {
            // Fetch from Supabase
            const { data, error } = await supabase
                .from('pre_approved_partners')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setPartners(data);
                setFilteredPartners(data);
            }
        } catch (error: any) {
            console.error("Error fetching partners:", error);
            // Alert.alert("Error", "Could not fetch partners.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPartners();

        // Use a unique channel name to prevent issues with React strict mode remounts
        const channelName = `admin-partners-realtime-${Date.now()}`;
        const subscription = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pre_approved_partners' }, fetchPartners)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    useEffect(() => {
        let result = partners;

        if (statusFilter !== 'All') {
            result = result.filter(p => {
                const status = p.status || 'Pending';
                return status.toLowerCase() === statusFilter.toLowerCase();
            });
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(p =>
                (p.store_name && p.store_name.toLowerCase().includes(lowerQuery)) ||
                (p.owner_name && p.owner_name.toLowerCase().includes(lowerQuery)) ||
                (p.mobile_number && p.mobile_number.includes(lowerQuery)) ||
                (p.city && p.city.toLowerCase().includes(lowerQuery))
            );
        }

        setFilteredPartners(result);
    }, [searchQuery, statusFilter, partners]);

    const theme = {
        background: isDarkMode ? '#000' : '#f8f9fa',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: isDarkMode ? '#fff' : '#000',
        border: isDarkMode ? '#2C2C2C' : '#E2E2E2',
        success: '#27ae60',
        danger: '#e74c3c',
        warning: '#f39c12'
    };

    const handleApprove = async (partnerId: string, currentStatus: string) => {
        if (currentStatus === 'Active') return;

        const performApprove = async () => {
            try {
                const { error } = await supabase.rpc('admin_update_partner_status', {
                    target_partner_id: partnerId,
                    new_status: 'Active'
                });

                if (error) throw error;

                if (Platform.OS === 'web') window.alert("Partner approved successfully.");
                else Alert.alert("Success", "Partner approved successfully.");
                fetchPartners(); // Refresh list
            } catch (error) {
                console.error("Error approving partner:", error);
                const msg = "Could not approve partner.";
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert("Error", msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to approve this partner?")) {
                performApprove();
            }
        } else {
            Alert.alert(
                "Approve Partner",
                "Are you sure you want to approve this partner?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Approve", onPress: performApprove }
                ]
            );
        }
    };

    const handleReject = async (partnerId: string) => {
        const performReject = async () => {
            try {
                const { error } = await supabase.rpc('admin_delete_partner', {
                    target_partner_id: partnerId
                });

                if (error) throw error;

                if (Platform.OS === 'web') window.alert("Partner application has been deleted.");
                else Alert.alert("Deleted", "Partner application has been deleted.");
                fetchPartners(); // Refresh list
            } catch (error) {
                console.error("Error deleting partner:", error);
                const msg = "Could not delete partner application.";
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert("Error", msg);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to PERMANENTLY delete this partner's application? This action cannot be undone.")) {
                performReject();
            }
        } else {
            Alert.alert(
                "Delete Application",
                "Are you sure you want to PERMANENTLY delete this partner's application? This action cannot be undone.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: performReject }
                ]
            );
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const normalizedStatus = status || 'Pending';
        let bg = theme.warning;
        if (normalizedStatus === 'Active') bg = theme.success;
        if (normalizedStatus === 'Rejected') bg = theme.danger;

        return (
            <View style={[styles.statusBadge, { backgroundColor: bg + '20', borderColor: bg, borderWidth: 1 }]}>
                <View style={[styles.statusDot, { backgroundColor: bg }]} />
                <Text style={[styles.statusText, { color: bg }]}>{normalizedStatus.toUpperCase()}</Text>
            </View>
        );
    };

    const { width } = useWindowDimensions();
    const isWeb = width > 768;

    // ... (keep useEffects and helpers)

    // Calculate card width for grid
    const getCardWidth = () => {
        if (!isWeb) return '100%';
        if (width > 1200) return '31%'; // 3 columns
        return '48%'; // 2 columns
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: '100%', maxWidth: 1200, flex: 1 }}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>Partners</Text>
                            <View style={styles.headerStatsRow}>
                                <View style={styles.indicatorItem}>
                                    <View style={[styles.indicatorDot, { backgroundColor: theme.success }]} />
                                    <Text style={[styles.indicatorText, { color: theme.subtext }]}>{activeCount} Active</Text>
                                </View>
                                <View style={styles.indicatorItem}>
                                    <View style={[styles.indicatorDot, { backgroundColor: theme.warning }]} />
                                    <Text style={[styles.indicatorText, { color: theme.subtext }]}>{pendingCount} Pending</Text>
                                </View>
                                <View style={styles.indicatorItem}>
                                    <View style={[styles.indicatorDot, { backgroundColor: theme.danger }]} />
                                    <Text style={[styles.indicatorText, { color: theme.subtext }]}>{inactiveCount} Inactive</Text>
                                </View>
                            </View>
                        </View>
                        
                        <View style={styles.headerActions}>
                            <View style={[styles.headerSearchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Feather name="search" size={14} color={theme.subtext} />
                                <TextInput
                                    style={[styles.headerSearchInput, { color: theme.text }]}
                                    placeholder="Search..."
                                    placeholderTextColor={theme.subtext}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: theme.primary }]}
                                onPress={() => router.push('/add-partner')}
                            >
                                <Feather name="plus" size={18} color={theme.card} />
                                {isWeb && <Text style={[styles.addButtonText, { color: theme.card }]}>Add New</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.filterSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
                            {['All', 'Active', 'Pending'].map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    style={[
                                        styles.filterTab,
                                        statusFilter === filter && { backgroundColor: theme.primary },
                                        statusFilter !== filter && { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
                                    ]}
                                    onPress={() => setStatusFilter(filter)}
                                >
                                    <Text style={[
                                        styles.filterText,
                                        statusFilter === filter ? { color: theme.card } : { color: theme.subtext }
                                    ]}>{filter}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        {loading ? (
                            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
                        ) : filteredPartners.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Feather name="users" size={48} color={theme.subtext} />
                                <Text style={{ color: theme.subtext, marginTop: 16 }}>No partners found matching your criteria.</Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                {filteredPartners.map((showroom, index) => (
                                    <Animated.View
                                        key={showroom.id}
                                        entering={FadeInDown.duration(400).delay(index * 50)}
                                        style={{ width: getCardWidth() }}
                                    >
                                        <TouchableOpacity
                                            style={[styles.partnerCard, { backgroundColor: theme.card }]}
                                            onPress={() => router.push({ pathname: '/partner-details', params: { id: showroom.id } })}
                                        >
                                            <View style={styles.cardHeader}>
                                                <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                                                    <Feather name="shopping-bag" size={20} color={theme.primary} />
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 12 }}>
                                                    <Text style={[styles.storeName, { color: theme.text }]}>{showroom.store_name}</Text>
                                                    <Text style={[styles.ownerName, { color: theme.subtext }]}>{showroom.owner_name}</Text>
                                                </View>
                                                <StatusBadge status={showroom.status} />
                                            </View>

                                            <View style={[styles.divider, { backgroundColor: theme.border }]} />

                                            <View style={styles.cardInfo}>
                                                <View style={styles.infoRow}>
                                                    <Feather name="map-pin" size={14} color={theme.subtext} />
                                                    <Text style={[styles.infoText, { color: theme.subtext }]}>{showroom.city || 'Location N/A'}</Text>
                                                </View>
                                                <View style={styles.infoRow}>
                                                    <Feather name="phone" size={14} color={theme.subtext} />
                                                    <Text style={[styles.infoText, { color: theme.subtext }]}>{showroom.mobile_number}</Text>
                                                </View>
                                            </View>

                                            {showroom.status === 'Pending' && (
                                                <>
                                                    <TouchableOpacity
                                                        style={[styles.quickApproveBtn, { backgroundColor: theme.success }]}
                                                        onPress={(e) => {
                                                            e.stopPropagation(); // prevent card click
                                                            handleApprove(showroom.id, showroom.status);
                                                        }}
                                                    >
                                                        <Text style={styles.quickApproveText}>Approve Request</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.quickApproveBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.danger, marginTop: 8 }]}
                                                        onPress={(e) => {
                                                            e.stopPropagation(); // prevent card click
                                                            handleReject(showroom.id);
                                                        }}
                                                    >
                                                        <Text style={[styles.quickApproveText, { color: theme.danger }]}>Delete Application</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
    headerStatsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    indicatorItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    indicatorDot: { width: 6, height: 6, borderRadius: 3 },
    indicatorText: { fontSize: 11, fontWeight: '600' },
    
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerSearchBar: { flexDirection: 'row', alignItems: 'center', height: 36, width: 180, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1 },
    headerSearchInput: { 
        flex: 1, 
        marginLeft: 8, 
        fontSize: 13,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            }
        })
    },
    
    addButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 6 },
    addButtonText: { fontWeight: '700', fontSize: 13 },

    filterSection: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
    filterTabs: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
    filterTab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12 },
    filterText: { fontWeight: '700', fontSize: 13 },

    scrollContainer: { paddingHorizontal: 20, paddingVertical: 12 },
    emptyState: { alignItems: 'center', marginTop: 60 },

    partnerCard: { borderRadius: 16, padding: 16, marginBottom: 0 }, // Removed bottom margin as gaps handle it
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    storeName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    ownerName: { fontSize: 13 },

    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '800' },

    divider: { height: 1, width: '100%', marginVertical: 16, opacity: 0.5 },
    cardInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 13 },

    quickApproveBtn: { marginTop: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    quickApproveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default PartnersScreen;
