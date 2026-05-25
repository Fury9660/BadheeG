import { supabase } from '@/config/supabaseConfig';
import { trackShipment } from '@/lib/delhivery';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Clipboard,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PublicTrackingScreen = () => {
    const { lrn } = useLocalSearchParams();
    const { isDarkMode, colors } = useTheme();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const isWeb = width > 768;

    const [loading, setLoading] = useState(true);
    const [scans, setScans] = useState<any[]>([]);
    const [shipmentInfo, setShipmentInfo] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const theme = {
        background: isDarkMode ? '#000000' : '#F8F9FA',
        card: isDarkMode ? '#121212' : '#FFFFFF',
        text: colors.text,
        subtext: colors.subtext,
        primary: colors.primary,
        border: colors.border,
        success: '#34C759',
        warning: '#FF9500',
        surface: isDarkMode ? '#1E1E1E' : '#F2F2F7',
    };

    const fetchTracking = async () => {
        if (!lrn || typeof lrn !== 'string') {
            setError('Invalid Waybill (LR) Number.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            let scansArr: any[] = [];
            let info: any = null;

            // 1. Fetch from Delhivery API via proxy
            try {
                const trackData = await trackShipment(lrn);
                
                // Extract scan logs
                if (trackData?.data?.scans) {
                    scansArr = trackData.data.scans.map((s: any) => ({
                        status: s.status || s.scan || s.scan_remark || '',
                        location: s.instructions || s.location || '',
                        timestamp: s.time || s.scan_time || s.date || s.timestamp,
                    }));
                } else if (trackData?.Scans) {
                    scansArr = trackData.Scans.map((s: any) => ({
                        status: s.ScanDetail?.Scan || '',
                        location: s.ScanDetail?.Instructions || '',
                        timestamp: s.ScanDetail?.ScanDateTime || '',
                    }));
                } else if (Array.isArray(trackData)) {
                    scansArr = trackData.map((s: any) => ({
                        status: s.status || s.scan || s.scan_remark || '',
                        location: s.instructions || s.location || '',
                        timestamp: s.time || s.scan_time || s.date || s.timestamp,
                    }));
                }

                // Extract high-level metadata (Consignee, Destination, Expected Delivery, Status)
                const baseInfo = trackData?.data || trackData;
                if (baseInfo && !Array.isArray(baseInfo)) {
                    info = {
                        consignee: baseInfo.consignee_name || baseInfo.consignee || 'Customer',
                        destination: baseInfo.consignee_city || baseInfo.destination || '',
                        origin: baseInfo.consignor_city || baseInfo.origin || '',
                        expectedDate: baseInfo.expected_delivery_date || baseInfo.edd || null,
                        status: baseInfo.current_status || baseInfo.statusType || baseInfo.status || 'Active',
                    };
                }
            } catch (apiErr) {
                console.log('Delhivery API error in public tracking page:', apiErr);
            }

            // 2. Fetch from supabase local webhook events
            const { data: dbEvents, error: dbErr } = await supabase
                .from('delhivery_events')
                .select('*, orders(status, total_amount)')
                .eq('lrn', lrn)
                .order('timestamp', { ascending: false });

            if (!dbErr && dbEvents && dbEvents.length > 0) {
                const dbScans = dbEvents.map((evt: any) => ({
                    status: evt.status,
                    location: evt.location || '',
                    timestamp: evt.timestamp,
                }));

                const combined = [...scansArr];
                for (const dbEvt of dbScans) {
                    const exists = combined.some((c: any) => 
                        c.status === dbEvt.status && 
                        Math.abs(new Date(c.timestamp).getTime() - new Date(dbEvt.timestamp).getTime()) < 60000
                    );
                    if (!exists) {
                        combined.push(dbEvt);
                    }
                }
                scansArr = combined;

                // If Delhivery API failed or was incomplete, fill metadata from order relation
                if (!info && dbEvents[0]?.orders) {
                    const orderRel = dbEvents[0].orders;
                    info = {
                        consignee: 'Customer',
                        destination: dbEvents[0].city || '',
                        origin: 'Laxmangarh',
                        expectedDate: null,
                        status: dbEvents[0].status || 'In Transit',
                        amount: orderRel.total_amount,
                    };
                }
            }

            // Sort newest first
            const sortedScans = scansArr.sort((a: any, b: any) => {
                const at = new Date(a.timestamp || 0).getTime();
                const bt = new Date(b.timestamp || 0).getTime();
                return bt - at;
            });

            setScans(sortedScans);
            if (info) {
                setShipmentInfo(info);
            } else if (sortedScans.length === 0) {
                setError('No shipment found with this Waybill/LR number. Please double check.');
            }
        } catch (err: any) {
            console.error('Public tracking error:', err);
            setError(err.message || 'Could not fetch tracking details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTracking();
    }, [lrn]);

    const handleCopy = () => {
        if (typeof lrn === 'string') {
            Clipboard.setString(lrn);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getStatusColor = (statusText: string) => {
        const s = (statusText || '').toLowerCase();
        if (s.includes('del') || s.includes('delivered') || s.includes('complete')) return theme.success;
        if (s.includes('canc') || s.includes('rt') || s.includes('fail')) return '#FF3B30';
        if (s.includes('manif') || s.includes('creat')) return theme.warning;
        return theme.primary;
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
            {/* Nav Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border, paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Badhee G Delivery Tracking</Text>
                <TouchableOpacity onPress={fetchTracking} style={styles.headerRefreshBtn}>
                    <Feather name="refresh-cw" size={18} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, isWeb && { maxWidth: 640, alignSelf: 'center', width: '100%' }]}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.subtext }]}>Fetching live shipping logs...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorBox}>
                        <Feather name="alert-triangle" size={48} color="#FF3B30" style={{ marginBottom: 16 }} />
                        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
                        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={fetchTracking}>
                            <Text style={styles.retryBtnText}>Retry Tracking</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ gap: 20 }}>
                        {/* Waybill Info Card */}
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.cardHeaderRow}>
                                <View>
                                    <Text style={[styles.label, { color: theme.subtext }]}>WAYBILL / LR NUMBER</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <Text style={[styles.waybillNum, { color: theme.text }]}>{lrn}</Text>
                                        <TouchableOpacity onPress={handleCopy} style={[styles.copyBtn, { backgroundColor: theme.surface }]}>
                                            <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? theme.success : theme.subtext} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {shipmentInfo?.status && (
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shipmentInfo.status) + '15' }]}>
                                        <Text style={[styles.statusBadgeText, { color: getStatusColor(shipmentInfo.status) }]}>
                                            {shipmentInfo.status.toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.border }]} />

                            <View style={styles.metaGrid}>
                                {shipmentInfo?.origin && (
                                    <View style={styles.metaItem}>
                                        <Text style={[styles.metaLabel, { color: theme.subtext }]}>ORIGIN</Text>
                                        <Text style={[styles.metaValue, { color: theme.text }]} numberOfLines={1}>
                                            📍 {shipmentInfo.origin}
                                        </Text>
                                    </View>
                                )}
                                {shipmentInfo?.destination && (
                                    <View style={styles.metaItem}>
                                        <Text style={[styles.metaLabel, { color: theme.subtext }]}>DESTINATION</Text>
                                        <Text style={[styles.metaValue, { color: theme.text }]} numberOfLines={1}>
                                            🏁 {shipmentInfo.destination}
                                        </Text>
                                    </View>
                                )}
                                {shipmentInfo?.consignee && (
                                    <View style={styles.metaItem}>
                                        <Text style={[styles.metaLabel, { color: theme.subtext }]}>RECIPIENT</Text>
                                        <Text style={[styles.metaValue, { color: theme.text }]} numberOfLines={1}>
                                            👤 {shipmentInfo.consignee}
                                        </Text>
                                    </View>
                                )}
                                {shipmentInfo?.expectedDate && (
                                    <View style={styles.metaItem}>
                                        <Text style={[styles.metaLabel, { color: theme.subtext }]}>EXPECTED DELIVERY</Text>
                                        <Text style={[styles.metaValue, { color: theme.success }]} numberOfLines={1}>
                                            📅 {new Date(shipmentInfo.expectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Scan Timeline */}
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tracking Timeline</Text>
                            
                            <View style={styles.timelineContainer}>
                                {scans.map((scan, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === scans.length - 1;
                                    const scanColor = isFirst ? theme.primary : theme.border;

                                    return (
                                        <View key={index} style={styles.timelineRow}>
                                            <View style={styles.timelineDotCol}>
                                                <View style={[
                                                    styles.timelineDot,
                                                    {
                                                        backgroundColor: isFirst ? theme.primary : theme.card,
                                                        borderColor: isFirst ? theme.primary : theme.border,
                                                        borderWidth: isFirst ? 0 : 2
                                                    }
                                                ]} />
                                                {!isLast && (
                                                    <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                                                )}
                                            </View>
                                            <View style={styles.timelineInfo}>
                                                <Text style={[
                                                    styles.scanStatus,
                                                    { color: isFirst ? theme.text : theme.subtext, fontWeight: isFirst ? '700' : '500' }
                                                ]}>
                                                    {scan.status}
                                                </Text>
                                                {scan.location && (
                                                    <Text style={[styles.scanLocation, { color: theme.subtext }]}>
                                                        📍 {scan.location}
                                                    </Text>
                                                )}
                                                {scan.timestamp && (
                                                    <Text style={[styles.scanTime, { color: theme.subtext }]}>
                                                        {new Date(scan.timestamp).toLocaleString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                        
                        {/* Branding Footer */}
                        <Text style={[styles.footerText, { color: theme.subtext }]}>
                            Badhee G &copy; {new Date().getFullYear()} • Shipments powered by Delhivery LTL Logistics
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
    headerRefreshBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'flex-end' },

    scrollContent: { padding: 16, paddingBottom: 60 },
    centerBox: { minHeight: 300, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },
    
    errorBox: { minHeight: 300, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorText: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        ...Platform.select({
            web: { boxShadow: '0 8px 24px rgba(0,0,0,0.04)' } as any,
            default: { elevation: 2 }
        })
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    waybillNum: { fontSize: 20, fontWeight: '800' },
    copyBtn: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusBadgeText: { fontSize: 11, fontWeight: '800' },
    
    divider: { height: 1, marginVertical: 16 },
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    metaItem: { width: '45%' },
    metaLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
    metaValue: { fontSize: 13, fontWeight: '600' },

    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
    timelineContainer: { paddingLeft: 8 },
    timelineRow: { flexDirection: 'row', minHeight: 64 },
    timelineDotCol: { alignItems: 'center', width: 16, marginRight: 16 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    timelineLine: { width: 2, flex: 1, marginTop: 4, marginBottom: -4 },
    timelineInfo: { flex: 1, paddingBottom: 16 },
    scanStatus: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    scanLocation: { fontSize: 12, marginBottom: 2 },
    scanTime: { fontSize: 11 },

    footerText: { fontSize: 11, textAlign: 'center', marginTop: 12, fontWeight: '500' }
});

export default PublicTrackingScreen;
