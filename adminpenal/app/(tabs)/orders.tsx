import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/delhivery-proxy`;

const STATUSES = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
};

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
    pending: { text: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
    processing: { text: '#007AFF', bg: 'rgba(0,122,255,0.12)' },
    shipped: { text: '#5856D6', bg: 'rgba(88,86,214,0.12)' },
    delivered: { text: '#34C759', bg: 'rgba(52,199,89,0.12)' },
};

// ─── Delhivery Manifest ──────────────────────────────────────────────────────
async function createDelhiveryShipment(order: any, pickupLocation: string = 'MODERN FURNITURE CRAFT'): Promise<{ lrn: string; jobId: string; waybill: string }> {
    const addr = order.addresses;
    const shortOrderId = (order.order_id || order.id).substring(0, 25);
    const totalValue = order.total_amount || 1000;
    const items = order.items || [];
    const desc = items.map((i: any) => i.name).join(', ') || 'Furniture';

    // Build full address string with city/state embedded
    // (Delhivery LTL may override separate city/state fields from its pincode DB)
    const custName   = addr?.name || order.customer_name || 'Customer';
    const custPhone  = String(addr?.mobile || addr?.phone || '9999999999');
    const custCity   = addr?.city   || 'City';
    const custState  = addr?.state  || 'State';
    const custPin    = String(addr?.pincode || '110001');
    const custLine1  = addr?.line1  || '';
    const custLine2  = addr?.line2  || '';
    // Full address string so label always shows correct city/state/phone
    const fullAddress = [
        custLine1,
        custLine2,
        `${custCity}, ${custState} - ${custPin}`,
        `Ph: ${custPhone}`,
    ].filter(Boolean).join(', ');

    const payload = {
        pickup_location: pickupLocation,
        gstin: 'UR',
        dropoff_location: {
            consignee: custName,
            consignee_name: custName,
            address: fullAddress,
            city: custCity,
            state: custState,
            zip: custPin,
            phone: custPhone,
            mobile: custPhone,
            gstin: 'UR',
            gst_number: 'UR',
        },
        billing_address: {
            name: 'BADHEE G',
            company: 'BADHEE G',
            consignor: 'BADHEE G',
            address: 'Laxmangarh',
            city: 'Laxmangarh',
            state: 'Rajasthan',
            pin: '332311',
            phone: '9521633688',
            gst_number: 'UR',
            gstin: 'UR',
        },
        weight: 10,
        n_value: totalValue,
        d_mode: 'Prepaid',
        product_type: 'S',
        invoices: [{
            ident: shortOrderId,
            n_value: totalValue,
            inv_num: 'INV-' + shortOrderId.substring(0, 8),
            inv_amt: totalValue,
            inv_date: new Date().toISOString().split('T')[0],
        }],
        suborders: [{
            ident: shortOrderId,
            suborder_id: shortOrderId + '-S',
            weight: 10,
            count: 1,
            n_value: totalValue,
            description: desc,
        }],
        shipments: [{
            order_number: shortOrderId,
            consignee: custName,
            consignee_name: custName,
            // Include full address with city/state/phone so label shows correct info
            consignee_address: fullAddress,
            consignee_city: custCity,
            consignee_state: custState,
            consignee_pincode: custPin,
            consignee_phone: custPhone,
            phone: custPhone,
            mobile: custPhone,
            consignee_gst_tin: 'UR',
            payment_mode: (order.payment_method || 'online') === 'cod' ? 'cod' : 'prepaid',
            total_amount: totalValue,
            n_value: totalValue,
            shipment_details: [{
                n_value: totalValue,
                description: desc,
                weight: 10,
                length: 30,
                breadth: 30,
                height: 30,
                box_count: 1,
                suborders: [{
                    ident: shortOrderId,
                    suborder_id: shortOrderId + '-S',
                    weight: 10,
                    count: 1,
                    n_value: totalValue,
                    description: desc,
                }],
            }],
            invoices: [{
                ident: shortOrderId,
                n_value: totalValue,
                inv_num: 'INV-' + shortOrderId.substring(0, 8),
                inv_amt: totalValue,
                inv_date: new Date().toISOString().split('T')[0],
            }],
        }],
    };


    // Step 1: Create manifest job
    const manifestRes = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ action: 'create-shipment-json', details: { payload } }),
    });
    const manifestData = await manifestRes.json();
    if (!manifestData.job_id) {
        throw new Error(manifestData.error || manifestData.message || 'Failed to create shipment job');
    }

    const jobId = manifestData.job_id;

    // Step 2: Poll for LR number (using check-job-and-label to get label URL immediately)
    let lrn: string | null = null;
    let waybill = '';
    let labelUrl = '';
    for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ action: 'check-job-and-label', details: { jobId } }),
        });
        const pollData = await pollRes.json();
        // Delhivery wraps status in .status key: { status: { type, success, value } }
        const jobStatus = pollData?.status || pollData;
        if (jobStatus.type === 'Complete' && jobStatus.success) {
            lrn = jobStatus.value?.lrnum || jobStatus.value?.waybills?.[0]?.ident;
            waybill = jobStatus.value?.waybills?.[0]?.ident || '';
            labelUrl = pollData?.labelUrl || '';  // Captured from same JWT session
            break;
        }
        if (jobStatus.type === 'Complete' && !jobStatus.success) {
            throw new Error(jobStatus.reason || 'Shipment creation failed');
        }
    }

    if (!lrn) throw new Error(`Job ${jobId} submitted but LR not received yet. Check portal.`);
    return { lrn, jobId, waybill, labelUrl };
}

// ─── Order Detail Drawer ──────────────────────────────────────────────────────
const OrderDetailDrawer = ({ order, visible, onClose, onManifest, theme }: any) => {
    const [manifesting, setManifesting] = useState(false);
    const [trackingScans, setTrackingScans] = useState<any[]>([]);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [trackingError, setTrackingError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState('MODERN FURNITURE CRAFT');
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);

    const [packing, setPacking] = useState(false);
    const [schedulingPickup, setSchedulingPickup] = useState(false);
    const [cancellingShipment, setCancellingShipment] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    // fetchWarehouses defined before early return so useEffect can reference it
    const fetchWarehouses = async () => {
        try {
            setLoadingWarehouses(true);
            const { data, error } = await supabase
                .from('delhivery_warehouses')
                .select('*')
                .eq('is_active', true);
            if (!error && data) {
                setWarehouses(data);
                const defaultWh = data.find((w: any) => w.is_default);
                if (defaultWh) {
                    setSelectedWarehouse(defaultWh.name);
                } else if (data.length > 0) {
                    setSelectedWarehouse(data[0].name);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingWarehouses(false);
        }
    };

    // IMPORTANT: useEffect MUST be before any conditional return to follow Rules of Hooks
    useEffect(() => {
        if (visible && order) {
            fetchWarehouses();
            setTrackingScans([]);
            setTrackingError(null);
        }
    }, [visible, order]);

    if (!order) return null;

    const addr = order.addresses;
    const lrn = order.tracking_id || order.lrn_number;
    const delhiveryStatus = order.delhivery_status;
    const isManifested = !!lrn;

    const fetchTracking = async () => {
        if (!lrn) return;
        setTrackingLoading(true);
        setTrackingError(null);
        try {
            const res = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify({ action: 'track-shipment', details: { lrn } }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Parse scans from v2 response
            let scans: any[] = [];
            if (data?.data?.scans) {
                scans = data.data.scans;
            } else if (Array.isArray(data)) {
                scans = data;
            } else if (data?.Scans) {
                scans = data.Scans.map((s: any) => ({
                    status: s.ScanDetail?.Scan,
                    location: s.ScanDetail?.Instructions,
                    time: s.ScanDetail?.ScanDateTime,
                }));
            }
            setTrackingScans(scans);
        } catch (err: any) {
            setTrackingError(err.message || 'Could not fetch tracking');
        } finally {
            setTrackingLoading(false);
        }
    };

    const handleManifest = async () => {
        if (!selectedWarehouse) {
            Alert.alert('Error', 'Please select a pickup warehouse location.');
            return;
        }
        setManifesting(true);
        setSuccessMsg(null);
        try {
            const { lrn, jobId, waybill, labelUrl } = await createDelhiveryShipment(order, selectedWarehouse);
            // Update order in DB — save waybill and label_url for label generation
            await supabase
                .from('orders')
                .update({
                    tracking_id: lrn,
                    lrn_number: lrn,
                    waybill: waybill || null,
                    label_url: labelUrl || null,
                    delhivery_job_id: jobId,
                    delhivery_status: 'manifested',
                    status: 'processing',
                })
                .eq('id', order.id);
            onManifest(order.id, {
                tracking_id: lrn,
                lrn_number: lrn,
                waybill: waybill || null,
                label_url: labelUrl || null,
                delhivery_job_id: jobId,
                delhivery_status: 'manifested',
                status: 'processing',
            });
            // Show in-page toast instead of browser popup
            const labelMsg = labelUrl ? ' Label URL saved! ✓' : '';
            setSuccessMsg(`✅ Shipment Created! LR: ${lrn}${labelMsg}`);
            setTimeout(() => setSuccessMsg(null), 6000);
        } catch (err: any) {
            const msg = err.message || 'Failed to create shipment';
            setSuccessMsg(`❌ ${msg}`);
            setTimeout(() => setSuccessMsg(null), 8000);
        } finally {
            setManifesting(false);
        }
    };

    const handleDownloadLabel = async () => {
        try {
            setLoadingLabel(true);
            const waybill = order.waybill || '';
            const cachedLabelUrl = order.label_url || '';

            const res = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify({ action: 'get-label', details: { lrn, waybill, cachedLabelUrl } }),
            });
            const data = await res.json();
            const url = data?.url;
            const returnedLabelUrl = data?.labelUrl;
            if (!url) throw new Error(data?.error || 'Label URL not found');

            // Save the label URL to DB for future use
            if (returnedLabelUrl && returnedLabelUrl !== cachedLabelUrl) {
                await supabase.from('orders').update({ label_url: returnedLabelUrl }).eq('id', order.id);
            }

            if (typeof url === 'string' && url.startsWith('data:')) {
                // Base64 — download as file
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
                Linking.openURL(url);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to download label');
        } finally {
            setLoadingLabel(false);
        }
    };

    const handleMarkAsPacked = async () => {
        try {
            setPacking(true);
            const packedAt = new Date().toISOString();
            await supabase
                .from('orders')
                .update({
                    packed_at: packedAt,
                    delhivery_status: 'packed'
                })
                .eq('id', order.id);
            onManifest(order.id, {
                packed_at: packedAt,
                delhivery_status: 'packed'
            });
            setSuccessMsg('✅ Order marked as Packed! Generating label...');

            // Delhivery label becomes available AFTER packing — try immediately
            try {
                const waybill = order.waybill || '';
                const cachedLabelUrl = order.label_url || '';
                const labelRes = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                    },
                    body: JSON.stringify({
                        action: 'get-label',
                        details: { lrn, waybill, cachedLabelUrl }
                    }),
                });
                const labelData = await labelRes.json();
                if (labelData?.labelUrl) {
                    await supabase
                        .from('orders')
                        .update({ label_url: labelData.labelUrl })
                        .eq('id', order.id);
                    onManifest(order.id, { label_url: labelData.labelUrl });
                    setSuccessMsg('✅ Order Packed & Label URL saved! ✓');
                } else {
                    setSuccessMsg('✅ Order marked as Packed! (Click Label PDF to generate label)');
                }
            } catch (_) {
                setSuccessMsg('✅ Order marked as Packed! (Click Label PDF to generate label)');
            }

            setTimeout(() => setSuccessMsg(null), 5000);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update order');
        } finally {
            setPacking(false);
        }
    };

    const handleSchedulePickup = async () => {
        try {
            setSchedulingPickup(true);
            const res = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify({
                    action: 'schedule-pickup',
                    details: {
                        lrn,
                        pickupLocation: selectedWarehouse || 'MODERN FURNITURE CRAFT',
                        pickupDate: new Date().toISOString().split('T')[0]
                    }
                }),
            });
            const data = await res.json();
            if (data.error || data.success === false) {
                throw new Error(data.error || 'Failed to schedule pickup');
            }
            await supabase
                .from('orders')
                .update({
                    pickup_scheduled_at: new Date().toISOString(),
                    delhivery_status: 'pickup_scheduled'
                })
                .eq('id', order.id);
            onManifest(order.id, {
                pickup_scheduled_at: new Date().toISOString(),
                delhivery_status: 'pickup_scheduled'
            });
            setSuccessMsg('✅ Pickup scheduled successfully!');
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to schedule pickup');
        } finally {
            setSchedulingPickup(false);
        }
    };

    const handleCancelShipment = async () => {
        try {
            setCancellingShipment(true);
            let delhiveryOk = false;
            let delhiveryMsg = '';

            // Try to cancel on Delhivery (best-effort — don't block if it fails)
            try {
                const res = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                    },
                    body: JSON.stringify({ action: 'cancel-shipment', details: { lrn } }),
                });
                const data = await res.json();
                if (data?.success === true || res.status === 200) {
                    delhiveryOk = true;
                } else {
                    delhiveryMsg = data?.message || data?.error?.message || JSON.stringify(data).slice(0, 100);
                }
            } catch (e: any) {
                delhiveryMsg = e.message;
            }

            // Always clear the shipment data in our DB
            await supabase
                .from('orders')
                .update({
                    tracking_id: null,
                    lrn_number: null,
                    waybill: null,
                    label_url: null,
                    delhivery_job_id: null,
                    delhivery_status: null,
                    packed_at: null,
                    pickup_scheduled_at: null,
                    status: 'pending'
                })
                .eq('id', order.id);

            onManifest(order.id, {
                tracking_id: null,
                lrn_number: null,
                waybill: null,
                label_url: null,
                delhivery_job_id: null,
                delhivery_status: null,
                packed_at: null,
                pickup_scheduled_at: null,
                status: 'pending'
            });

            if (delhiveryOk) {
                setSuccessMsg('✅ Delhivery shipment cancelled & order reset.');
            } else {
                setSuccessMsg(`✅ Order reset locally.${delhiveryMsg ? ' (Delhivery: ' + delhiveryMsg + ')' : ''}`);
            }
            setTimeout(() => setSuccessMsg(null), 5000);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to cancel shipment');
        } finally {
            setCancellingShipment(false);
        }
    };

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.drawerOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={[styles.drawerContainer, { backgroundColor: theme.card }]}>
                    <View style={styles.drawerHeader}>
                        <Text style={[styles.drawerTitle, { color: theme.text }]}>Order Details</Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
                            <Feather name="x" size={18} color={theme.subtext} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Order Info */}
                        <View style={[styles.infoBlock, { borderColor: theme.border }]}>
                            <Row label="Order ID" value={order.order_id || order.id?.slice(0, 12)} theme={theme} />
                            <Row label="Date" value={new Date(order.created_at).toLocaleString('en-IN')} theme={theme} />
                            <Row label="Amount" value={`₹${order.total_amount?.toLocaleString('en-IN')}`} theme={theme} />
                            <Row label="Payment" value={order.payment_method || 'Online'} theme={theme} />
                            <Row label="Status" value={order.status} theme={theme} />
                        </View>

                        {/* Delivery Address */}
                        <View style={[styles.infoBlock, { borderColor: theme.border }]}>
                            <Text style={[styles.blockTitle, { color: theme.subtext }]}>DELIVERY ADDRESS</Text>
                            <Text style={[styles.addrName, { color: theme.text }]}>{addr?.name || '—'}</Text>
                            <Text style={[styles.addrDetail, { color: theme.subtext }]}>
                                {addr?.line1}{addr?.line2 ? `, ${addr.line2}` : ''}{'\n'}
                                {addr?.city}, {addr?.state} — {addr?.pincode}{'\n'}
                                📞 {addr?.mobile}
                            </Text>
                        </View>

                        {/* Items */}
                        <View style={[styles.infoBlock, { borderColor: theme.border }]}>
                            <Text style={[styles.blockTitle, { color: theme.subtext }]}>ITEMS</Text>
                            {(order.items || []).map((item: any, idx: number) => (
                                <View key={idx} style={styles.itemRow}>
                                    <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                                    <Text style={[styles.itemQty, { color: theme.subtext }]}>x{item.quantity}</Text>
                                    <Text style={[styles.itemPrice, { color: theme.text }]}>₹{item.price * item.quantity}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Delhivery Status + Tracking */}
                        <View style={[styles.infoBlock, { borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={[styles.blockTitle, { color: theme.subtext }]}>DELHIVERY TRACKING</Text>
                                {isManifested && (
                                    <TouchableOpacity onPress={fetchTracking} style={[styles.refreshTrackBtn, { backgroundColor: theme.surface }]}>
                                        <Feather name="refresh-cw" size={14} color={theme.subtext} />
                                        <Text style={[{ fontSize: 12, color: theme.subtext, fontWeight: '600' }]}>Refresh</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* In-page success/error toast */}
                            {successMsg && (
                                <View style={[
                                    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12 },
                                    successMsg.startsWith('✅')
                                        ? { backgroundColor: 'rgba(52,199,89,0.15)' }
                                        : { backgroundColor: 'rgba(255,59,48,0.12)' }
                                ]}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', flex: 1, color: successMsg.startsWith('✅') ? '#34C759' : '#FF3B30' }}>
                                        {successMsg}
                                    </Text>
                                </View>
                            )}

                            {isManifested ? (
                                <>
                                    <View style={[styles.lrnBadge, { backgroundColor: 'rgba(52,199,89,0.12)', marginBottom: 16 }]}>
                                        <Feather name="check-circle" size={16} color="#34C759" />
                                        <Text style={styles.lrnText}>LR: {lrn}</Text>
                                        <TouchableOpacity
                                            style={[styles.copyLrnBtn, { backgroundColor: 'rgba(52,199,89,0.15)' }]}
                                            onPress={() => {
                                                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                                    navigator.clipboard.writeText(lrn);
                                                }
                                            }}
                                        >
                                            <Feather name="copy" size={12} color="#34C759" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Action Buttons for Manifested Shipments */}
                                    <View style={{ gap: 10, marginBottom: 16 }}>
                                        {/* Status Badge */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: delhiveryStatus === 'delivered' ? '#34C759' : delhiveryStatus === 'pickup_scheduled' ? '#FF9500' : '#007AFF' }} />
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Delivery Status: <Text style={{ color: theme.text }}>{delhiveryStatus || 'Manifested'}</Text>
                                            </Text>
                                        </View>

                                        {/* Row 1: Label PDF + Mark Packed */}
                                        <View style={{ flexDirection: 'row', gap: 8 }}>
                                            <View style={{ flex: 1 }}>
                                                <TouchableOpacity
                                                    onPress={handleDownloadLabel}
                                                    disabled={loadingLabel}
                                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 11, opacity: loadingLabel ? 0.7 : 1 }}
                                                >
                                                    {loadingLabel
                                                        ? <ActivityIndicator size="small" color="#FFF" />
                                                        : <>
                                                            <Feather name="printer" size={15} color="#FFF" />
                                                            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Label PDF</Text>
                                                            {!!order.label_url && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4AFF82', marginLeft: 2 }} />}
                                                        </>
                                                    }
                                                </TouchableOpacity>
                                                {!order.packed_at && (
                                                    <Text style={{ fontSize: 10, color: '#FF9500', textAlign: 'center', marginTop: 3, fontWeight: '600' }}>
                                                        ⚠ Pack order first
                                                    </Text>
                                                )}
                                            </View>

                                            {!order.packed_at ? (
                                                <TouchableOpacity
                                                    onPress={handleMarkAsPacked}
                                                    disabled={packing}
                                                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#34C759', borderRadius: 10, paddingVertical: 11, opacity: packing ? 0.7 : 1 }}
                                                >
                                                    {packing
                                                        ? <ActivityIndicator size="small" color="#FFF" />
                                                        : <>
                                                            <Feather name="package" size={15} color="#FFF" />
                                                            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Mark Packed</Text>
                                                        </>
                                                    }
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(52,199,89,0.12)', borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: 'rgba(52,199,89,0.3)' }}>
                                                    <Feather name="check-circle" size={15} color="#34C759" />
                                                    <Text style={{ color: '#34C759', fontWeight: '600', fontSize: 13 }}>Packed ✓</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Row 2: Schedule Pickup */}
                                        {!order.pickup_scheduled_at ? (
                                            <TouchableOpacity
                                                onPress={handleSchedulePickup}
                                                disabled={schedulingPickup}
                                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FF6B2B', borderRadius: 10, paddingVertical: 11, opacity: schedulingPickup ? 0.7 : 1 }}
                                            >
                                                {schedulingPickup
                                                    ? <ActivityIndicator size="small" color="#FFF" />
                                                    : <>
                                                        <Feather name="calendar" size={15} color="#FFF" />
                                                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Schedule Delhivery Pickup</Text>
                                                    </>
                                                }
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,107,43,0.1)', borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: 'rgba(255,107,43,0.3)' }}>
                                                <Feather name="clock" size={15} color="#FF6B2B" />
                                                <Text style={{ color: '#FF6B2B', fontWeight: '600', fontSize: 13 }}>Pickup Scheduled ✓</Text>
                                            </View>
                                        )}

                                        {/* Row 3: Cancel Shipment — inline confirm to avoid Alert.alert web bug */}
                                        {!confirmCancel ? (
                                            <TouchableOpacity
                                                onPress={() => setConfirmCancel(true)}
                                                disabled={cancellingShipment}
                                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 10, borderWidth: 1.5, borderColor: '#FF3B30' }}
                                            >
                                                <Feather name="trash-2" size={14} color="#FF3B30" />
                                                <Text style={{ color: '#FF3B30', fontWeight: '700', fontSize: 13 }}>Cancel Delhivery Shipment</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={{ borderRadius: 10, borderWidth: 1.5, borderColor: '#FF3B30', overflow: 'hidden', backgroundColor: 'rgba(255,59,48,0.06)' }}>
                                                <Text style={{ textAlign: 'center', color: '#FF3B30', fontWeight: '700', fontSize: 13, paddingTop: 10, paddingBottom: 6 }}>Confirm cancel shipment?</Text>
                                                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: 'rgba(255,59,48,0.3)' }}>
                                                    <TouchableOpacity
                                                        onPress={() => setConfirmCancel(false)}
                                                        style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRightWidth: 1, borderColor: 'rgba(255,59,48,0.3)' }}
                                                    >
                                                        <Text style={{ color: '#666', fontWeight: '600', fontSize: 13 }}>No, Keep</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => { setConfirmCancel(false); handleCancelShipment(); }}
                                                        disabled={cancellingShipment}
                                                        style={{ flex: 1, paddingVertical: 10, alignItems: 'center' }}
                                                    >
                                                        {cancellingShipment
                                                            ? <ActivityIndicator size="small" color="#FF3B30" />
                                                            : <Text style={{ color: '#FF3B30', fontWeight: '700', fontSize: 13 }}>Yes, Cancel</Text>
                                                        }
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {/* Tracking Timeline */}
                                    {trackingLoading ? (
                                        <View style={{ alignItems: 'center', padding: 20 }}>
                                            <ActivityIndicator color={theme.text} />
                                            <Text style={[{ marginTop: 8, fontSize: 12, color: theme.subtext }]}>Fetching live tracking...</Text>
                                        </View>
                                    ) : trackingError ? (
                                        <View style={[styles.trackingError, { backgroundColor: 'rgba(255,59,48,0.08)' }]}>
                                            <Feather name="alert-circle" size={14} color="#FF3B30" />
                                            <Text style={{ fontSize: 12, color: '#FF3B30', flex: 1 }}>{trackingError}</Text>
                                        </View>
                                    ) : trackingScans.length > 0 ? (
                                        <View style={styles.timeline}>
                                            {trackingScans.slice(0, 8).map((scan: any, idx: number) => (
                                                <View key={idx} style={styles.scanRow}>
                                                    <View style={styles.scanDotCol}>
                                                        <View style={[
                                                            styles.scanDot,
                                                            { backgroundColor: idx === 0 ? '#007AFF' : theme.border }
                                                        ]} />
                                                        {idx < trackingScans.slice(0, 8).length - 1 && (
                                                            <View style={[styles.scanLine, { backgroundColor: theme.border }]} />
                                                        )}
                                                    </View>
                                                    <View style={styles.scanInfo}>
                                                        <Text style={[styles.scanStatus, { color: idx === 0 ? theme.text : theme.subtext, fontWeight: idx === 0 ? '700' : '500' }]}>
                                                            {scan.status || scan.StatusCode || scan.scan_remark || 'Update'}
                                                        </Text>
                                                        {(scan.location || scan.ScannedLocation || scan.origin_branch) && (
                                                            <Text style={[styles.scanLocation, { color: theme.subtext }]}>
                                                                📍 {scan.location || scan.ScannedLocation || scan.origin_branch}
                                                             </Text>
                                                        )}
                                                        {(scan.timestamp || scan.time || scan.ScanDateTime) && (
                                                            <Text style={[styles.scanTime, { color: theme.subtext }]}>
                                                                {new Date(scan.timestamp || scan.time || scan.ScanDateTime).toLocaleString('en-IN')}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.fetchTrackBtn, { borderColor: theme.border }]}
                                            onPress={fetchTracking}
                                        >
                                            <MaterialCommunityIcons name="map-marker-path" size={18} color={theme.text} />
                                            <Text style={[{ fontSize: 14, fontWeight: '700', color: theme.text }]}>Load Live Tracking</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            ) : (
                                <View style={{ gap: 12 }}>
                                    {/* Warehouse Selector before Manifesting */}
                                    <View style={{ borderWidth: 1, borderRadius: 14, padding: 12, borderColor: theme.border, backgroundColor: theme.surface }}>
                                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.subtext, letterSpacing: 0.5, marginBottom: 8 }}>
                                            SELECT PICKUP WAREHOUSE
                                        </Text>
                                        {loadingWarehouses ? (
                                            <ActivityIndicator size="small" color={theme.primary} />
                                        ) : warehouses.length === 0 ? (
                                            <Text style={{ fontSize: 13, color: '#FF3B30', fontWeight: '700' }}>
                                                ⚠️ No active warehouses! Register one in Settings first.
                                            </Text>
                                        ) : (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                                                {warehouses.map((wh) => (
                                                    <TouchableOpacity
                                                        key={wh.id}
                                                        onPress={() => setSelectedWarehouse(wh.name)}
                                                        style={{
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 8,
                                                            borderRadius: 10,
                                                            borderWidth: 1.5,
                                                            borderColor: selectedWarehouse === wh.name ? theme.primary : theme.border,
                                                            backgroundColor: selectedWarehouse === wh.name ? 'rgba(255,107,43,0.06)' : theme.card,
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 13, fontWeight: '800', color: selectedWarehouse === wh.name ? theme.primary : theme.text }}>
                                                            {wh.name}
                                                        </Text>
                                                        <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                                                            📍 {wh.city}, {wh.pincode}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        )}
                                    </View>

                                    <View style={[styles.lrnBadge, { backgroundColor: 'rgba(255,149,0,0.12)' }]}>
                                        <MaterialCommunityIcons name="truck-outline" size={16} color="#FF9500" />
                                        <Text style={[styles.lrnText, { color: '#FF9500' }]}>Not Manifested Yet</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Manifest Button */}
                        {!isManifested && (
                            <TouchableOpacity
                                style={[
                                    styles.manifestBtn,
                                    {
                                        opacity: manifesting || warehouses.length === 0 ? 0.7 : 1,
                                        backgroundColor: theme.primary
                                    }
                                ]}
                                onPress={handleManifest}
                                disabled={manifesting || warehouses.length === 0}
                            >
                                {manifesting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#fff" />
                                        <Text style={styles.manifestBtnText}>Create Delhivery Shipment</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {manifesting && (
                            <Text style={[styles.pollingNote, { color: theme.subtext }]}>
                                ⏳ Submitting to Delhivery... This may take up to 60 seconds.
                            </Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const Row = ({ label, value, theme }: any) => (
    <View style={styles.row}>
        <Text style={[styles.rowLabel, { color: theme.subtext }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: theme.text }]}>{value}</Text>
    </View>
);

// ─── Main Orders Screen ───────────────────────────────────────────────────────
const OrdersScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#111',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        border: isDarkMode ? '#2a2a2a' : '#e8e8e8',
        surface: isDarkMode ? '#252525' : '#f5f5f5',
    };

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const fetchOrders = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, addresses(*)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const moveStatus = async (orderId: string, direction: 'next' | 'prev') => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const idx = STATUSES.indexOf(order.status?.toLowerCase() || 'pending');
        const newIdx = direction === 'next' ? idx + 1 : idx - 1;
        if (newIdx < 0 || newIdx >= STATUSES.length) return;
        const newStatus = STATUSES[newIdx];
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    };

    const handleManifest = (orderId: string, updates: any) => {
        setOrders(prev => prev.map(o =>
            o.id === orderId
                ? { ...o, ...updates }
                : o
        ));
        setSelectedOrder((prev: any) => prev && prev.id === orderId ? { ...prev, ...updates } : prev);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={[{ marginTop: 12, color: theme.subtext }]}>Loading orders...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Order Processing</Text>
                <TouchableOpacity
                    onPress={() => { setRefreshing(true); fetchOrders(); }}
                    style={[styles.refreshBtn, { backgroundColor: theme.surface }]}
                >
                    <Feather name="refresh-cw" size={16} color={theme.subtext} />
                </TouchableOpacity>
            </View>

            {/* Kanban Board */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.kanbanContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
            >
                {STATUSES.map(status => {
                    const colOrders = orders.filter(o => (o.status?.toLowerCase() || 'pending') === status);
                    const colColor = STATUS_COLORS[status] || STATUS_COLORS.pending;
                    return (
                        <View key={status} style={styles.column}>
                            {/* Column Header */}
                            <View style={[styles.colHeader, { backgroundColor: colColor.bg }]}>
                                <Text style={[styles.colTitle, { color: colColor.text }]}>
                                    {STATUS_LABELS[status].toUpperCase()}
                                </Text>
                                <View style={[styles.countBadge, { backgroundColor: colColor.text }]}>
                                    <Text style={styles.countText}>{colOrders.length}</Text>
                                </View>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {colOrders.length === 0 ? (
                                    <View style={[styles.emptyCol, { borderColor: theme.border }]}>
                                        <Feather name="inbox" size={24} color={theme.border} />
                                        <Text style={[styles.emptyColText, { color: theme.border }]}>No orders</Text>
                                    </View>
                                ) : colOrders.map(order => {
                                    const isManifested = order.delhivery_status === 'manifested';
                                    const firstItem = order.items?.[0];
                                    return (
                                        <TouchableOpacity
                                            key={order.id}
                                            onPress={() => setSelectedOrder(order)}
                                            activeOpacity={0.85}
                                        >
                                            <View style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                                {/* Order ID & Date */}
                                                <View style={styles.cardTop}>
                                                    <Text style={[styles.orderId, { color: theme.text }]} numberOfLines={1}>
                                                        #{order.order_id?.slice(-10) || order.id?.slice(-8).toUpperCase()}
                                                    </Text>
                                                    <Text style={[styles.orderDate, { color: theme.subtext }]}>
                                                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                                                    </Text>
                                                </View>

                                                {/* Customer */}
                                                <Text style={[styles.customerName, { color: theme.subtext }]} numberOfLines={1}>
                                                    📦 {order.addresses?.name || 'Customer'}
                                                </Text>
                                                <Text style={[styles.customerAddr, { color: theme.subtext }]} numberOfLines={1}>
                                                    {order.addresses?.city}, {order.addresses?.state}
                                                </Text>

                                                {/* First product */}
                                                {firstItem && (
                                                    <Text style={[styles.itemPreview, { color: theme.text }]} numberOfLines={1}>
                                                        {firstItem.name} {order.items.length > 1 ? `+${order.items.length - 1}` : ''}
                                                    </Text>
                                                )}

                                                {/* Amount + Delhivery badge */}
                                                <View style={styles.cardBottom}>
                                                    <Text style={[styles.amount, { color: theme.text }]}>
                                                        ₹{order.total_amount?.toLocaleString('en-IN')}
                                                    </Text>
                                                    {isManifested ? (
                                                        <View style={styles.lrnMini}>
                                                            <Feather name="check-circle" size={12} color="#34C759" />
                                                            <Text style={styles.lrnMiniText}>LR: {order.tracking_id}</Text>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.notManifested}>
                                                            <MaterialCommunityIcons name="truck-outline" size={12} color="#FF9500" />
                                                            <Text style={styles.notManifestedText}>Not Shipped</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Move buttons */}
                                                <View style={[styles.moveRow, { borderTopColor: theme.border }]}>
                                                    <TouchableOpacity
                                                        onPress={() => moveStatus(order.id, 'prev')}
                                                        style={[styles.moveBtn, { backgroundColor: theme.surface }]}
                                                    >
                                                        <Feather name="arrow-left" size={14} color={theme.subtext} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => setSelectedOrder(order)}
                                                        style={[styles.detailBtn, { backgroundColor: theme.surface }]}
                                                    >
                                                        <Text style={[styles.detailBtnText, { color: theme.text }]}>Details</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => moveStatus(order.id, 'next')}
                                                        style={[styles.moveBtn, { backgroundColor: theme.surface }]}
                                                    >
                                                        <Feather name="arrow-right" size={14} color={theme.subtext} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    );
                })}
            </ScrollView>

            <OrderDetailDrawer
                order={selectedOrder}
                visible={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onManifest={handleManifest}
                theme={theme}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    refreshBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    kanbanContainer: { padding: 16, alignItems: 'flex-start' },
    column: { width: 280, marginRight: 16 },
    colHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 12,
    },
    colTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    countBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    countText: { fontSize: 11, fontWeight: '800', color: '#fff' },

    emptyCol: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderRadius: 16,
        gap: 8,
    },
    emptyColText: { fontSize: 12, fontWeight: '600' },

    orderCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        ...Platform.select({
            web: { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' } as any,
            default: { elevation: 2 },
        }),
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    orderId: { fontSize: 14, fontWeight: '800' },
    orderDate: { fontSize: 11 },
    customerName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    customerAddr: { fontSize: 12, marginBottom: 6 },
    itemPreview: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    amount: { fontSize: 16, fontWeight: '900' },

    lrnMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    lrnMiniText: { fontSize: 11, color: '#34C759', fontWeight: '700' },
    notManifested: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    notManifestedText: { fontSize: 11, color: '#FF9500', fontWeight: '700' },

    moveRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 10,
        gap: 8,
    },
    moveBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    detailBtn: { flex: 1, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    detailBtnText: { fontSize: 12, fontWeight: '700' },

    // Drawer
    drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    drawerContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '92%',
        ...Platform.select({
            web: { maxWidth: 520, alignSelf: 'center', width: '100%', borderRadius: 24, bottom: 0, position: 'absolute' } as any,
            default: {},
        }),
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    drawerTitle: { fontSize: 20, fontWeight: '800' },
    closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    infoBlock: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
    blockTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    rowLabel: { fontSize: 13 },
    rowValue: { fontSize: 13, fontWeight: '600' },

    addrName: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
    addrDetail: { fontSize: 13, lineHeight: 20 },

    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    itemName: { flex: 1, fontSize: 13, fontWeight: '600' },
    itemQty: { fontSize: 12, marginHorizontal: 8 },
    itemPrice: { fontSize: 13, fontWeight: '700' },

    lrnBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 8,
    },
    lrnText: { fontSize: 14, fontWeight: '700', color: '#34C759' },

    manifestBtn: {
        backgroundColor: '#FF6B2B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 4,
        marginBottom: 8,
    },
    manifestBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    pollingNote: { fontSize: 12, textAlign: 'center', marginBottom: 16 },

    // Tracking
    refreshTrackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    copyLrnBtn: {
        width: 26,
        height: 26,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto' as any,
    },
    fetchTrackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed' as any,
    },
    trackingError: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
    },
    timeline: { paddingTop: 4 },
    scanRow: { flexDirection: 'row', marginBottom: 4, minHeight: 52 },
    scanDotCol: { alignItems: 'center', width: 24, marginRight: 14 },
    scanDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    scanLine: { width: 2, flex: 1, marginTop: 4, marginBottom: -4 },
    scanInfo: { flex: 1, paddingBottom: 12 },
    scanStatus: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    scanLocation: { fontSize: 12, marginBottom: 2 },
    scanTime: { fontSize: 11 },
});

export default OrdersScreen;
