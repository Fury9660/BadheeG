import { supabase, supabaseUrl, supabaseAnonKey } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PROXY_URL = `${supabaseUrl}/functions/v1/delhivery-proxy`;

const OrderDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [trackingScans, setTrackingScans] = useState<any[]>([]);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [trackingError, setTrackingError] = useState<string | null>(null);
    const [trackingLoaded, setTrackingLoaded] = useState(false);
    const [packing, setPacking] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const theme = {
        background: '#F2F4F7',
        card: '#FFFFFF',
        text: '#000000',
        subtext: '#666666',
        border: '#E5E7EB',
        primary: '#000000',
        success: '#166534',
        successBg: '#DCFCE7',
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, addresses(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error("Error fetching order:", error);
            Alert.alert("Error", "Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const fetchTracking = async (lrn: string) => {
        if (!lrn) return;
        setTrackingLoading(true);
        setTrackingError(null);
        try {
            const res = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({ action: 'track-shipment', details: { lrn } }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            let scans: any[] = [];
            if (data?.data?.scans) {
                scans = data.data.scans.map((s: any) => ({
                    status: s.status || s.scan || s.scan_remark || '',
                    location: s.instructions || s.location || '',
                    timestamp: s.time || s.scan_time || s.date || s.timestamp,
                }));
            } else if (data?.Scans) {
                scans = data.Scans.map((s: any) => ({
                    status: s.ScanDetail?.Scan,
                    location: s.ScanDetail?.Instructions,
                    timestamp: s.ScanDetail?.ScanDateTime,
                }));
            } else if (Array.isArray(data)) {
                scans = data.map((s: any) => ({
                    status: s.status || s.scan || s.scan_remark || '',
                    location: s.instructions || s.location || '',
                    timestamp: s.time || s.scan_time || s.date || s.timestamp,
                }));
            }

            // Also query local delhivery_events table for webhook status updates
            const { data: dbEvents, error: dbErr } = await supabase
                .from('delhivery_events')
                .select('*')
                .eq('order_id', order.id)
                .order('timestamp', { ascending: false });

            if (!dbErr && dbEvents && dbEvents.length > 0) {
                const dbScans = dbEvents.map((evt: any) => ({
                    status: evt.status,
                    location: evt.location || '',
                    timestamp: evt.timestamp,
                }));

                const combined = [...scans];
                for (const dbEvt of dbScans) {
                    const exists = combined.some((c: any) => 
                        c.status === dbEvt.status && 
                        Math.abs(new Date(c.timestamp).getTime() - new Date(dbEvt.timestamp).getTime()) < 60000
                    );
                    if (!exists) {
                        combined.push(dbEvt);
                    }
                }
                scans = combined;
            }

            // Sort newest first
            const sortedScans = scans.sort((a: any, b: any) => {
                const at = new Date(a.timestamp || 0).getTime();
                const bt = new Date(b.timestamp || 0).getTime();
                return bt - at;
            });

            setTrackingScans(sortedScans);
            setTrackingLoaded(true);
        } catch (err: any) {
            setTrackingError(err.message || 'Could not fetch tracking');
        } finally {
            setTrackingLoading(false);
        }
    };

    const handleDownloadLabel = async () => {
        const lrn = order.tracking_id || order.lrn_number;
        if (!lrn) return;
        try {
            setLoadingLabel(true);

            // Use cached label URL if available (avoids Delhivery API re-call)
            const cachedLabelUrl = order.label_url || '';

            const res = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    action: 'get-label',
                    details: { lrn, waybill: order.waybill || '', cachedLabelUrl }
                }),
            });
            const data = await res.json();
            const url = data?.url;
            const returnedLabelUrl = data?.labelUrl;

            if (!url) {
                const msg = data?.error || JSON.stringify(data).slice(0, 300);
                throw new Error(`Label not available: ${msg}`);
            }

            // Save the label URL to the DB for future use (if it's new)
            if (returnedLabelUrl && returnedLabelUrl !== cachedLabelUrl) {
                supabase.from('orders').update({ label_url: returnedLabelUrl }).eq('id', order.id);
            }

            if (typeof url === 'string' && url.startsWith('data:')) {
                // Base64 image — download as PNG file on web
                if (typeof window !== 'undefined' && window.document) {
                    const link = window.document.createElement('a');
                    link.href = url;
                    link.download = `label-${lrn}.png`;
                    window.document.body.appendChild(link);
                    link.click();
                    window.document.body.removeChild(link);
                } else {
                    Linking.openURL(url);
                }
            } else {
                // HTTP URL — open directly
                Linking.openURL(url);
            }
        } catch (err: any) {
            Alert.alert('Label Error', err.message || 'Failed to download label');
        } finally {
            setLoadingLabel(false);
        }
    };


    const handleMarkAsPacked = async () => {
        try {
            setPacking(true);
            const { error } = await supabase
                .from('orders')
                .update({
                    packed_at: new Date().toISOString(),
                    delhivery_status: 'packed'
                })
                .eq('id', order.id);
            if (error) throw error;
            setOrder({ ...order, packed_at: new Date().toISOString(), delhivery_status: 'packed' });
            Alert.alert('Success', 'Order marked as Packed!');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update order');
        } finally {
            setPacking(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setUpdating(true);
        try {
            const isCancelling = newStatus === 'Cancelled';
            const lrn = order?.tracking_id || order?.lrn_number;

            // If cancelling and shipment exists, try Delhivery cancel first (best-effort)
            if (isCancelling && lrn) {
                try {
                    await fetch(PROXY_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${supabaseAnonKey}`,
                        },
                        body: JSON.stringify({ action: 'cancel-shipment', details: { lrn } }),
                    });
                } catch (_) { /* ignore Delhivery errors */ }
            }

            // Build the DB update payload
            const updatePayload: any = { status: newStatus };
            if (isCancelling) {
                // Clear all shipment data when cancelling
                Object.assign(updatePayload, {
                    tracking_id: null,
                    lrn_number: null,
                    waybill: null,
                    label_url: null,
                    delhivery_job_id: null,
                    delhivery_status: null,
                    packed_at: null,
                    pickup_scheduled_at: null,
                });
            }

            const { error } = await supabase
                .from('orders')
                .update(updatePayload)
                .eq('id', id);

            if (error) throw error;

            setOrder({ ...order, ...updatePayload });
            Alert.alert("Success", isCancelling ? "Order cancelled successfully." : `Order marked as ${newStatus}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error("Error updating status:", error);
            Alert.alert("Error", "Failed to update order status");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 18, color: '#666' }}>Order not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#000', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return theme.success;
            case 'cancelled': return '#DC2626'; // Red
            case 'shipped': return '#2563EB'; // Blue
            default: return '#374151'; // Gray
        }
    };

    const getStatusBg = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return theme.successBg;
            case 'cancelled': return '#FEE2E2';
            case 'shipped': return '#DBEAFE';
            default: return '#F3F4F6';
        }
    };

    const parsedItems = typeof order.items === 'string'
        ? JSON.parse(order.items)
        : order.items || [];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>

                {/* Order ID Card */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.label}>Order ID</Text>
                        <Text style={styles.value}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.label}>Date</Text>
                        <Text style={styles.value}>{new Date(order.createdAt || order.created_at).toLocaleDateString()}</Text>
                    </View>

                    <View style={[styles.divider, { marginVertical: 12 }]} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.label}>Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                {order.status || 'Pending'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Items List */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {parsedItems.map((item: any, index: number) => (
                        <View key={index} style={{ marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {item.image && (
                                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                                )}
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                    <Text style={styles.itemMeta}>Qty: {item.quantity || 1}</Text>
                                    <Text style={styles.itemPrice}>₹{(item.price || 0).toLocaleString()}</Text>
                                </View>
                            </View>
                            {index < parsedItems.length - 1 && <View style={[styles.divider, { marginTop: 12 }]} />}
                        </View>
                    ))}

                    <View style={[styles.divider, { marginBottom: 12 }]} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{(order.total || order.total_amount || 0).toLocaleString()}</Text>
                    </View>
                </View>

                {/* Customer Details */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Customer Details</Text>
                    <View style={styles.row}>
                        <Feather name="user" size={18} color="#666" style={{ width: 24 }} />
                        <Text style={styles.infoText}>
                            {order.addresses?.name || order.customerName || 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Feather name="phone" size={18} color="#666" style={{ width: 24 }} />
                        <Text style={styles.infoText}>
                            {order.addresses?.mobile || order.addresses?.phone || 'N/A'}
                        </Text>
                    </View>
                    <View style={[styles.row, { alignItems: 'flex-start' }]}>
                        <Feather name="map-pin" size={18} color="#666" style={{ width: 24, marginTop: 2 }} />
                        <Text style={[styles.infoText, { flex: 1 }]}>
                            {[
                                order.addresses?.line1,
                                order.addresses?.line2,
                                order.addresses?.city,
                                order.addresses?.state,
                                order.addresses?.pincode
                            ].filter(Boolean).join(', ') || 'Address not provided'}
                        </Text>
                    </View>
                </View>

                {/* Delhivery Tracking */}
                {(order.tracking_id || order.lrn_number) && (
                    <View style={styles.card}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.sectionTitle}>📦 Shipment Tracking</Text>
                            <TouchableOpacity
                                onPress={() => fetchTracking(order.tracking_id || order.lrn_number)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                            >
                                <Feather name="refresh-cw" size={13} color="#374151" />
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }}>Refresh</Text>
                            </TouchableOpacity>
                        </View>

                        {/* LR Badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', padding: 12, borderRadius: 10, marginBottom: 14 }}>
                            <Feather name="check-circle" size={16} color="#16A34A" />
                            <Text style={{ color: '#16A34A', fontWeight: '700', fontSize: 14 }}>
                                LR: {order.tracking_id || order.lrn_number}
                            </Text>
                        </View>

                        {/* Actions & Status */}
                        <View style={{ gap: 8, marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                                Delivery Status: <Text style={{ color: '#2563EB', textTransform: 'uppercase' }}>{order.delhivery_status || 'Manifested'}</Text>
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={handleDownloadLabel}
                                    disabled={loadingLabel}
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        backgroundColor: '#2563EB',
                                        paddingVertical: 10,
                                        borderRadius: 8
                                    }}
                                >
                                    {loadingLabel ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <>
                                            <Feather name="printer" size={14} color="#FFF" />
                                            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Label PDF</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {!order.packed_at && (
                                    <TouchableOpacity
                                        onPress={handleMarkAsPacked}
                                        disabled={packing}
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6,
                                            backgroundColor: '#16A34A',
                                            paddingVertical: 10,
                                            borderRadius: 8
                                        }}
                                    >
                                        {packing ? (
                                            <ActivityIndicator size="small" color="#FFF" />
                                        ) : (
                                            <>
                                                <Feather name="package" size={14} color="#FFF" />
                                                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Mark Packed</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {order.pickup_scheduled_at && (
                                <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '600', marginTop: 4 }}>
                                    📅 Pickup Scheduled: {new Date(order.pickup_scheduled_at).toLocaleDateString()}
                                </Text>
                            )}
                        </View>

                        {/* Load tracking button */}
                        {!trackingLoaded && !trackingLoading && (
                            <TouchableOpacity
                                onPress={() => fetchTracking(order.tracking_id || order.lrn_number)}
                                style={{ alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, borderStyle: 'dashed' }}
                            >
                                <Feather name="map-pin" size={16} color="#6B7280" />
                                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Load Live Tracking</Text>
                            </TouchableOpacity>
                        )}

                        {/* Loading */}
                        {trackingLoading && (
                            <View style={{ alignItems: 'center', padding: 16 }}>
                                <ActivityIndicator color="#000" />
                                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Fetching live updates...</Text>
                            </View>
                        )}

                        {/* Error */}
                        {trackingError && (
                            <View style={{ flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                                <Feather name="alert-circle" size={14} color="#DC2626" />
                                <Text style={{ fontSize: 12, color: '#DC2626', flex: 1 }}>{trackingError}</Text>
                            </View>
                        )}

                        {/* Timeline */}
                        {trackingScans.length > 0 && (
                            <View style={{ marginTop: 4 }}>
                                {trackingScans.slice(0, 6).map((scan: any, idx: number) => (
                                    <View key={idx} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                        <View style={{ alignItems: 'center', width: 14 }}>
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: idx === 0 ? '#000' : '#D1D5DB', marginTop: 4 }} />
                                            {idx < trackingScans.slice(0, 6).length - 1 && (
                                                <View style={{ width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 2 }} />
                                            )}
                                        </View>
                                        <View style={{ flex: 1, paddingBottom: 8 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: idx === 0 ? '#000' : '#374151' }}>
                                                {scan.status || scan.StatusCode || scan.scan_remark || 'Update'}
                                            </Text>
                                            {(scan.location || scan.origin_branch) && (
                                                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                                    📍 {scan.location || scan.origin_branch}
                                                </Text>
                                            )}
                                            {(scan.timestamp || scan.time || scan.ScanDateTime) && (
                                                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                                                    {new Date(scan.timestamp || scan.time || scan.ScanDateTime).toLocaleString('en-IN')}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {trackingLoaded && trackingScans.length === 0 && !trackingError && (
                            <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 8 }}>No tracking updates yet</Text>
                        )}
                    </View>
                )}


            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                {order.status !== 'Delivered' && order.status !== 'Cancelled' ? (
                    <>
                        {order.status === 'Pending' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#000' }]}
                                onPress={() => updateStatus('Shipped')}
                                disabled={updating}
                            >
                                {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Mark as Shipped</Text>}
                            </TouchableOpacity>
                        )}

                        {order.status === 'Shipped' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#166534' }]} // Green
                                onPress={() => updateStatus('Delivered')}
                                disabled={updating}
                            >
                                {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Mark as Delivered</Text>}
                            </TouchableOpacity>
                        )}

                        {/* Cancel Order — inline confirm to avoid Alert.alert web bug */}
                        {!confirmCancel ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#DC2626', marginTop: 12 }]}
                                onPress={() => setConfirmCancel(true)}
                                disabled={updating}
                            >
                                <Text style={[styles.btnText, { color: '#DC2626' }]}>Cancel Order</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#DC2626', overflow: 'hidden', backgroundColor: '#FEF2F2', marginTop: 12 }}>
                                <Text style={{ textAlign: 'center', color: '#DC2626', fontWeight: '700', fontSize: 14, paddingTop: 12, paddingBottom: 8 }}>Confirm cancel order?</Text>
                                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: '#FECACA' }}>
                                    <TouchableOpacity
                                        onPress={() => setConfirmCancel(false)}
                                        style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderColor: '#FECACA' }}
                                    >
                                        <Text style={{ color: '#666', fontWeight: '600', fontSize: 14 }}>No, Keep</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => { setConfirmCancel(false); updateStatus('Cancelled'); }}
                                        disabled={updating}
                                        style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
                                    >
                                        {updating
                                            ? <ActivityIndicator size="small" color="#DC2626" />
                                            : <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 14 }}>Yes, Cancel</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </>
                ) : (
                    <View style={{ alignItems: 'center', padding: 10 }}>
                        <Text style={{ color: '#666', fontWeight: '500' }}>Order is {order.status}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F4F7' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F2F4F7',
        justifyContent: 'space-between'
    },
    backBtn: { padding: 8, borderRadius: 20, backgroundColor: '#E5E7EB' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },

    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#000' },

    label: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    value: { fontSize: 14, color: '#111827', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#E5E7EB', width: '100%' },

    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },

    itemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F3F4F6' },
    itemName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
    itemMeta: { fontSize: 13, color: '#6B7280' },
    itemPrice: { fontSize: 16, fontWeight: '700', color: '#000', marginTop: 4 },

    totalLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#000' },

    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    infoText: { fontSize: 15, color: '#374151', lineHeight: 22 },

    footer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10
    },
    actionBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
    },
    btnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF'
    }
});

export default OrderDetailsScreen;
