import { supabase } from '@/config/supabaseConfig';
import { trackShipment } from '@/lib/delhivery';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

interface TrackingModalProps {
    isVisible: boolean;
    onClose: () => void;
    order: any;
}

const TrackingModal = ({ isVisible, onClose, order }: TrackingModalProps) => {
    const { isDarkMode, colors } = useTheme();
    const { width } = useWindowDimensions();
    const isWeb = width > 768;

    const [loading, setLoading] = useState(false);
    const [scans, setScans] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const theme = {
        background: colors.card,
        text: colors.text,
        subtext: colors.subtext,
        primary: colors.primary,
        border: colors.border,
        success: '#34C759',
    };

    useEffect(() => {
        if (!isVisible || !order) return;

        const fetchTracking = async () => {
            if (!order.tracking_id && !order.lrn_number) {
                // If no tracking ID yet, we just show internal status
                setScans([]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const lrn = order.tracking_id || order.lrn_number;
                let scansArr: any[] = [];

                // Attempt to fetch from Delhivery API
                try {
                    const trackData = await trackShipment(lrn);
                    if (trackData?.data?.scans) {
                        scansArr = trackData.data.scans.map((s: any) => ({
                            ScanDetail: {
                                Scan: s.status || s.scan || s.scan_remark || '',
                                Instructions: s.instructions || s.location || '',
                                ScanDateTime: s.time || s.scan_time || s.date || s.timestamp,
                            }
                        }));
                    } else if (trackData?.Scans) {
                        scansArr = trackData.Scans;
                    } else if (Array.isArray(trackData)) {
                        scansArr = trackData.map((s: any) => ({
                            ScanDetail: {
                                Scan: s.status || s.scan || s.scan_remark || '',
                                Instructions: s.instructions || s.location || '',
                                ScanDateTime: s.time || s.scan_time || s.date || s.timestamp,
                            }
                        }));
                    }
                } catch (apiErr) {
                    console.log("Delhivery API track error, falling back to database events:", apiErr);
                }

                // Query local delhivery_events table for webhook status updates
                const { data: dbEvents, error: dbErr } = await supabase
                    .from('delhivery_events')
                    .select('*')
                    .eq('order_id', order.id)
                    .order('timestamp', { ascending: false });

                if (!dbErr && dbEvents && dbEvents.length > 0) {
                    const dbScans = dbEvents.map((evt: any) => ({
                        ScanDetail: {
                            Scan: evt.status,
                            Instructions: evt.location || '',
                            ScanDateTime: evt.timestamp,
                        }
                    }));

                    const combined = [...scansArr];
                    for (const dbEvt of dbScans) {
                        const exists = combined.some((c: any) => 
                            c.ScanDetail?.Scan === dbEvt.ScanDetail?.Scan && 
                            Math.abs(new Date(c.ScanDetail?.ScanDateTime).getTime() - new Date(dbEvt.ScanDetail?.ScanDateTime).getTime()) < 60000
                        );
                        if (!exists) {
                            combined.push(dbEvt);
                        }
                    }
                    scansArr = combined;
                }

                // Sort newest first
                const sortedScans = scansArr.sort((a: any, b: any) => {
                    const at = new Date(a.ScanDetail?.ScanDateTime || 0).getTime();
                    const bt = new Date(b.ScanDetail?.ScanDateTime || 0).getTime();
                    return bt - at;
                });
                setScans(sortedScans);
            } catch (err: any) {
                console.error("Tracking error:", err);
                setError(err.message || "Could not fetch tracking details.");
            } finally {
                setLoading(false);
            }
        };

        fetchTracking();
    }, [isVisible, order]);


    const renderInternalStatus = () => {
        const status = order?.status?.toLowerCase() || 'pending';
        let step = 0;
        if (status === 'packed') step = 1;

        const internalSteps = [
            { label: 'Order Placed', time: new Date(order?.created_at).toLocaleString(), done: step >= 0 },
            { label: 'Packed by Seller', time: 'Waiting for courier pickup', done: step >= 1 },
        ];

        return internalSteps.map((s, index) => (
            <View key={index} style={styles.scanRow}>
                <View style={styles.timelineCol}>
                    <View style={[styles.dot, { backgroundColor: s.done ? theme.success : theme.border }]} />
                    {index !== internalSteps.length - 1 && <View style={[styles.line, { backgroundColor: s.done ? theme.success : theme.border }]} />}
                </View>
                <View style={styles.scanContent}>
                    <Text style={[styles.scanTitle, { color: s.done ? theme.text : theme.subtext }]}>{s.label}</Text>
                    <Text style={[styles.scanTime, { color: theme.subtext }]}>{s.time}</Text>
                </View>
            </View>
        ));
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                <View style={[styles.container, { backgroundColor: theme.background, width: isWeb ? 500 : '100%', height: isWeb ? '80%' : '90%' }]}>
                    
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View>
                            <Text style={[styles.title, { color: theme.text }]}>Live Tracking</Text>
                            <Text style={[styles.subtitle, { color: theme.subtext }]}>
                                {order?.tracking_id ? `AWB: ${order.tracking_id}` : `Order #${order?.id?.slice(0,8).toUpperCase()}`}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
                            <Feather name="x" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {loading ? (
                            <View style={styles.centerBox}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={{ color: theme.subtext, marginTop: 12 }}>Fetching live location...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.centerBox}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.subtext} />
                                <Text style={{ color: theme.text, marginTop: 12, textAlign: 'center' }}>{error}</Text>
                            </View>
                        ) : (
                            <View style={styles.timelineContainer}>
                                {order?.tracking_id && scans.length > 0 ? (
                                    scans.map((scan, index) => {
                                        const detail = scan.ScanDetail;
                                        const isFirst = index === 0;
                                        const isLast = index === scans.length - 1;
                                        
                                        return (
                                            <View key={index} style={styles.scanRow}>
                                                <View style={styles.timelineCol}>
                                                    <View style={[styles.dot, { backgroundColor: isFirst ? theme.primary : theme.border, width: isFirst ? 14 : 12, height: isFirst ? 14 : 12 }]} />
                                                    {!isLast && <View style={[styles.line, { backgroundColor: theme.border }]} />}
                                                </View>
                                                <View style={styles.scanContent}>
                                                    <Text style={[styles.scanTitle, { color: isFirst ? theme.text : theme.subtext }]}>
                                                        {detail.Scan}
                                                    </Text>
                                                    <Text style={[styles.scanInstruction, { color: theme.text }]}>
                                                        {detail.Instructions}
                                                    </Text>
                                                    <Text style={[styles.scanTime, { color: theme.subtext }]}>
                                                        {new Date(detail.ScanDateTime).toLocaleString()}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    renderInternalStatus()
                                )}
                            </View>
                        )}
                    </ScrollView>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    dismissArea: {
        flex: 1,
        width: '100%',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        ...Platform.select({
            web: { alignSelf: 'center', bottom: 0, position: 'absolute' },
            default: {}
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    timelineContainer: {
        paddingTop: 10,
    },
    scanRow: {
        flexDirection: 'row',
    },
    timelineCol: {
        width: 30,
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 2,
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: 4,
        zIndex: 1,
    },
    scanContent: {
        flex: 1,
        paddingBottom: 32,
        paddingLeft: 12,
        paddingTop: -4,
    },
    scanTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    scanInstruction: {
        fontSize: 14,
        marginBottom: 4,
    },
    scanTime: {
        fontSize: 12,
    }
});

export default TrackingModal;
