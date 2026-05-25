import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdCampaignsScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        text: isDarkMode ? '#fff' : '#121212',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#3466F6',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        success: '#4CAF50',
    };

    useEffect(() => {
        if (!user) return;

        const fetchCampaigns = async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) console.error("Fetch campaigns error:", error);
            if (data) setCampaigns(data);
            setLoading(false);
        };

        fetchCampaigns();

        const channel = supabase
            .channel('campaign_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'campaigns',
                filter: `partner_id=eq.${user.id}`
            }, () => {
                fetchCampaigns();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Ad Campaigns</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/create-ad')}
                >
                    <Feather name="plus" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={campaigns}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => (
                        <Animated.View
                            entering={FadeInDown.delay(index * 100)}
                            style={[styles.campaignCard, { backgroundColor: theme.card }]}
                        >
                            <Image source={{ uri: item.banner_url }} style={styles.bannerImg} />
                            <View style={styles.cardInfo}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={[styles.campaignName, { color: theme.text }]}>{item.name}</Text>
                                        <Text style={[styles.campaignType, { color: theme.subtext }]}>{item.target_type}: {item.target_value}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: item.is_active ? theme.success + '15' : theme.subtext + '15' }]}>
                                        <Text style={[styles.statusText, { color: item.is_active ? theme.success : theme.subtext }]}>{item.status}</Text>
                                    </View>
                                </View>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: theme.text }]}>{item.metrics?.impressions || 0}</Text>
                                        <Text style={[styles.statLabel, { color: theme.subtext }]}>Impressions</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: theme.text }]}>{item.metrics?.clicks || 0}</Text>
                                        <Text style={[styles.statLabel, { color: theme.subtext }]}>Clicks</Text>
                                    </View>
                                    <Text style={[styles.dateText, { color: theme.subtext }]}>{item.start_date} to {item.end_date}</Text>
                                </View>
                            </View>
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="bullhorn-outline" size={80} color={theme.subtext} />
                            <Text style={[styles.emptyText, { color: theme.text }]}>No Campaigns Found</Text>
                            <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/create-ad')}>
                                <Text style={styles.createBtnText}>Launch First Ad</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
    backBtn: { width: 44 },
    title: { fontSize: 22, fontWeight: '800' },
    addBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 24, paddingTop: 0 },
    campaignCard: { borderRadius: 24, marginBottom: 20, overflow: 'hidden', elevation: 2 },
    bannerImg: { width: '100%', height: 140 },
    cardInfo: { padding: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    campaignName: { fontSize: 18, fontWeight: '800' },
    campaignType: { fontSize: 13, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '800' },
    statsRow: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
    statItem: { marginRight: 24 },
    statValue: { fontSize: 16, fontWeight: '800' },
    statLabel: { fontSize: 11 },
    dateText: { fontSize: 10, marginLeft: 'auto' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 20, fontWeight: '800', marginTop: 24 },
    createBtn: { marginTop: 32, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
    createBtnText: { color: '#fff', fontWeight: '800' }
});

export default AdCampaignsScreen;
