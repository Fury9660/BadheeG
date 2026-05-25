import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../store/ThemeContext';

export default function AdCampaignsScreen() {
    const { colors, isDarkMode } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const [creating, setCreating] = useState(false);

    // Dummy campaign data
    const [campaigns, setCampaigns] = useState([
        { id: '1', name: 'Festive Sofa Promo', status: 'Active', impressions: 45020, clicks: 1205, spent: 5400, budget: 10000 },
        { id: '2', name: 'Modern Tables Collection', status: 'Active', impressions: 28410, clicks: 840, spent: 3200, budget: 5000 },
        { id: '3', name: 'Office Chairs Clearance', status: 'Paused', impressions: 12300, clicks: 310, spent: 1500, budget: 1500 },
    ]);

    const handleCreateCampaign = () => {
        setCreating(true);
        setTimeout(() => {
            setCreating(false);
            const newCampaign = {
                id: (campaigns.length + 1).toString(),
                name: `New Furniture Campaign ${campaigns.length + 1}`,
                status: 'Active',
                impressions: 0,
                clicks: 0,
                spent: 0,
                budget: 5000,
            };
            setCampaigns([newCampaign, ...campaigns]);
            Alert.alert('Success', 'New campaign created successfully as draft!');
        }, 1000);
    };

    const toggleCampaignStatus = (id: string) => {
        setCampaigns(campaigns.map(c => {
            if (c.id === id) {
                const newStatus = c.status === 'Active' ? 'Paused' : 'Active';
                return { ...c, status: newStatus };
            }
            return c;
        }));
    };

    const themeTextColor = colors.text;
    const themeBorderColor = colors.border;
    const themeCardBg = colors.card;

    const stats = {
        totalImpressions: campaigns.reduce((acc, c) => acc + c.impressions, 0),
        totalClicks: campaigns.reduce((acc, c) => acc + c.clicks, 0),
        totalSpent: campaigns.reduce((acc, c) => acc + c.spent, 0),
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={[styles.header, { borderBottomColor: themeBorderColor, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {!isDesktop && (
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color={themeTextColor} />
                        </TouchableOpacity>
                    )}
                    <Text style={[styles.headerTitle, { color: themeTextColor }]}>Ad Campaigns</Text>
                </View>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: '#10B981' }]}
                    onPress={handleCreateCampaign}
                    disabled={creating}
                >
                    {creating ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.createButtonText}>Create Campaign</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Stats Section */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: themeCardBg, borderColor: themeBorderColor }]}>
                        <Feather name="eye" size={20} color="#10B981" style={styles.statIcon} />
                        <Text style={[styles.statValue, { color: themeTextColor }]}>
                            {stats.totalImpressions.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>Impressions</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: themeCardBg, borderColor: themeBorderColor }]}>
                        <Feather name="mouse-pointer" size={20} color="#10B981" style={styles.statIcon} />
                        <Text style={[styles.statValue, { color: themeTextColor }]}>
                            {stats.totalClicks.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>Clicks</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: themeCardBg, borderColor: themeBorderColor }]}>
                        <Feather name="dollar-sign" size={20} color="#10B981" style={styles.statIcon} />
                        <Text style={[styles.statValue, { color: themeTextColor }]}>
                            ₹{stats.totalSpent.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.subtext }]}>Total Spent</Text>
                    </View>
                </View>

                {/* Campaigns List */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>ACTIVE & PAST CAMPAIGNS</Text>
                </View>

                {campaigns.map((item) => (
                    <View key={item.id} style={[styles.campaignCard, { backgroundColor: themeCardBg, borderColor: themeBorderColor }]}>
                        <View style={styles.campaignHeader}>
                            <View>
                                <Text style={[styles.campaignName, { color: themeTextColor }]}>{item.name}</Text>
                                <View style={styles.budgetRow}>
                                    <Text style={[styles.budgetText, { color: colors.subtext }]}>Budget: ₹{item.budget}</Text>
                                    <View style={[styles.bullet, { backgroundColor: themeBorderColor }]} />
                                    <Text style={[styles.budgetText, { color: colors.subtext }]}>Spent: ₹{item.spent}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor: item.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    }
                                ]}
                                onPress={() => toggleCampaignStatus(item.id)}
                            >
                                <View style={[styles.statusDot, { backgroundColor: item.status === 'Active' ? '#10B981' : '#EF4444' }]} />
                                <Text style={[styles.statusText, { color: item.status === 'Active' ? '#10B981' : '#EF4444' }]}>
                                    {item.status}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />

                        <View style={styles.campaignMetrics}>
                            <View style={styles.metricItem}>
                                <Text style={[styles.metricValue, { color: themeTextColor }]}>{item.impressions.toLocaleString()}</Text>
                                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Impressions</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Text style={[styles.metricValue, { color: themeTextColor }]}>{item.clicks.toLocaleString()}</Text>
                                <Text style={[styles.metricLabel, { color: colors.subtext }]}>Clicks</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Text style={[styles.metricValue, { color: themeTextColor }]}>
                                    {item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : 0}%
                                </Text>
                                <Text style={[styles.metricLabel, { color: colors.subtext }]}>CTR</Text>
                            </View>
                        </View>
                    </View>
                ))}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        alignItems: 'flex-start',
    },
    statIcon: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    sectionHeader: {
        marginTop: 10,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    campaignCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    campaignHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    campaignName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    budgetText: {
        fontSize: 12,
    },
    bullet: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginHorizontal: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    campaignMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    metricLabel: {
        fontSize: 11,
    },
});
