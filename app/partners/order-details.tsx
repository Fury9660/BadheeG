import { supabase } from '@/config/supabaseConfig';
import { createShipment } from '@/lib/delhivery';
import { useTheme } from '@/store/ThemeContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const OrderDetailsScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [creatingShipment, setCreatingShipment] = useState(false);
    const [shipmentModalVisible, setShipmentModalVisible] = useState(false);
    const [shipmentData, setShipmentData] = useState({
        weight: '1',
        length: '10',
        breadth: '10',
        height: '10'
    });

    const theme = {
        background: isDarkMode ? '#121212' : '#F8F9FA',
        card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
        subtext: isDarkMode ? '#A0A0A0' : '#666666',
        primary: '#4F46E5',
        success: '#10B981',
        border: isDarkMode ? '#333333' : '#E5E7EB',
        accent: '#F59E0B',
    };

    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, address:address_id(*)')
                    .eq('id', id)
                    .single();
                if (error) throw error;
                if (data) {
                    setOrder(data);
                } else {
                    Alert.alert("Error", "Order not found");
                    router.back();
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', id);
            if (error) throw error;

            setOrder((prev: any) => ({ ...prev, status: newStatus }));
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", `Order marked as ${newStatus}`);
        } catch (error) {
            console.error("Update error:", error);
            Alert.alert("Error", "Could not update status");
        }
        setUpdating(false);
    };

    const handleCreateShipment = async () => {
        if (!order) {
            console.log("Create Shipment: No order found in state");
            return;
        }
        console.log("Starting Shipment Creation for Order:", order.id);
        console.log("Shipment Data:", shipmentData);

        setCreatingShipment(true);
        try {
            const shipmentDetails = {
                orderId: order.id,
                customerName: order.customerName || order.address?.name || 'Guest',
                customerAddress: order.shippingAddress || (order.address ? `${order.address.line1}, ${order.address.city}` : ''),
                customerCity: order.customerCity || order.address?.city || 'City',
                customerState: order.address?.state || '',
                customerPincode: order.customerPincode || order.address?.pincode || '110001',
                customerPhone: order.customerPhone || order.address?.mobile || '',
                paymentMode: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
                codAmount: order.total_amount || order.total || 0,
                totalAmount: order.total_amount || order.total || 0,
                productsDesc: order.items?.map((i: any) => i.name).join(', ') || 'Furniture'
            };

            const result = await createShipment({
                ...shipmentDetails,
                weight: parseFloat(shipmentData.weight) || 1,
                length: parseFloat(shipmentData.length) || 10,
                breadth: parseFloat(shipmentData.breadth) || 10,
                height: parseFloat(shipmentData.height) || 10
            } as any);

            console.log("Shipment Creation Result:", result);

            // Update Supabase
            const { error } = await supabase
                .from('orders')
                .update({
                    tracking_id: result.trackingId,
                    courier_name: 'Delhivery',
                    shipping_label_url: result.labelUrl,
                    status: 'shipped' // Auto-move to shipped
                })
                .eq('id', id);

            if (error) throw error;

            setOrder((prev: any) => ({
                ...prev,
                tracking_id: result.trackingId,
                courier_name: 'Delhivery',
                shipping_label_url: result.labelUrl,
                status: 'shipped'
            }));

            Alert.alert("Success", "Shipment created successfully!");
        } catch (error: any) {
            console.error("Shipment Error:", error);
            Alert.alert("Shipment Failed", error.message || "Unknown error occurred");
        } finally {
            setCreatingShipment(false);
        }
    };

    const handleCallCustomer = () => {
        // ... (remains same)
    };

    const getStep = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s === 'pending' || s === 'accepted') return 0;
        if (s === 'packed') return 1;
        if (s === 'shipped') return 2;
        if (s === 'out for delivery') return 3;
        if (s === 'delivered') return 4;
        return -1;
    };

    const currentStep = order ? getStep(order.status) : 0;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!order) return null;

    // Derived Data
    const customerName = order.address?.name || 'Guest User';
    const customerPhone = order.address?.mobile || 'N/A';
    const fullAddress = order.address ? `${order.address.line1}, ${order.address.city} - ${order.address.pincode}` : 'No address provided';
    const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A';
    const paymentMethod = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>Order Details</Text>
                    <Text style={[styles.subtitle, { color: theme.subtext }]}>#{order.id.slice(-8).toUpperCase()}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Status Stepper */}
                <View style={[styles.card, { backgroundColor: theme.card, marginBottom: 24 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.subtext, marginBottom: 20 }]}>ORDER STATUS</Text>
                    <View style={styles.stepperContainer}>
                        {[{ label: 'Placed', icon: 'clipboard-check' }, { label: 'Packed', icon: 'package-variant' }, { label: 'Shipped', icon: 'truck-fast' }, { label: 'Delivered', icon: 'check-circle' }].map((s, i) => {
                            const isActive = currentStep >= i;
                            // const isCompleted = currentStep > i; 
                            // Using a simple logic: 0=Placed, 1=Packed, 2=Shipped (includes Out for Delivery), 3=Delivered
                            // Mapping: Placed(0), Packed(1), Shipped(2), OutForDelivery(3), Delivered(4)
                            // Adjust map index: 0->0, 1->1, 2->2, 3->4 
                            let stepActive = false;
                            if (i === 0) stepActive = currentStep >= 0;
                            if (i === 1) stepActive = currentStep >= 1;
                            if (i === 2) stepActive = currentStep >= 2;
                            if (i === 3) stepActive = currentStep >= 4;

                            return (
                                <View key={i} style={styles.stepWrapper}>
                                    <View style={[styles.stepCircle, { backgroundColor: stepActive ? theme.primary : theme.background, borderColor: stepActive ? theme.primary : theme.border }]}>
                                        <MaterialCommunityIcons name={s.icon as any} size={20} color={stepActive ? '#fff' : theme.subtext} />
                                    </View>
                                    <Text style={[styles.stepLabel, { color: stepActive ? theme.text : theme.subtext }]}>{s.label}</Text>
                                </View>
                            )
                        })}
                        {/* Connecting Line (Virtual) */}
                        <View style={[styles.stepLine, { backgroundColor: theme.border, zIndex: -1 }]} />
                    </View>
                    <View style={{ marginTop: 16, backgroundColor: theme.primary + '15', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.primary + '30' }}>
                        <Text style={{ color: theme.primary, textAlign: 'center', fontWeight: '600' }}>Current Status: {order.status?.toUpperCase() || 'PENDING'}</Text>
                    </View>
                </View>

                {/* Customer Details */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>CUSTOMER DETAILS</Text>
                        <TouchableOpacity onPress={handleCallCustomer} style={[styles.callBtn, { backgroundColor: theme.success }]}>
                            <Feather name="phone" size={16} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Call</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.customerRow}>
                        <View style={[styles.avatar, { backgroundColor: theme.background }]}>
                            <Text style={[styles.avatarText, { color: theme.text }]}>{customerName[0]}</Text>
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={[styles.customerName, { color: theme.text }]}>{customerName}</Text>
                            <Text style={[styles.customerMeta, { color: theme.primary }]}>{customerPhone}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Ionicons name="location-outline" size={20} color={theme.subtext} style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.addressLabel, { color: theme.subtext }]}>Delivery Address</Text>
                            <Text style={[styles.address, { color: theme.text }]}>{fullAddress}</Text>
                        </View>
                    </View>
                </View>

                {/* Tracking Details - New Section */}
                {order.tracking_id && (
                    <View style={[styles.card, { backgroundColor: theme.card, marginTop: 16 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={[styles.sectionTitle, { color: theme.subtext }]}>TRACKING DETAILS</Text>
                            {order.courier_name && (
                                <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.primary + '20', borderRadius: 8 }}>
                                    <Text style={{ color: theme.primary, fontSize: 10, fontWeight: '700' }}>{order.courier_name.toUpperCase()}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={{ color: theme.subtext }}>Waybill / AWB</Text>
                            <Text style={{ color: theme.text, fontWeight: '600', fontSize: 16 }} selectable>{order.tracking_id}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                // Can link to tracking URL if available, or just copy
                                Alert.alert("Tracking", `Waybill: ${order.tracking_id}`);
                            }}
                            style={{
                                marginTop: 12,
                                padding: 12,
                                backgroundColor: theme.background,
                                borderRadius: 8,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: theme.border
                            }}
                        >
                            <MaterialCommunityIcons name="truck-delivery-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
                            <Text style={{ color: theme.text, fontWeight: '600' }}>Track Shipment</Text>
                        </TouchableOpacity>

                        {/* Download Label Button */}
                        {order.shipping_label_url && (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(order.shipping_label_url)}
                                style={{
                                    marginTop: 8,
                                    padding: 12,
                                    backgroundColor: theme.primary,
                                    borderRadius: 8,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Download Label</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Items */}
                <View style={[styles.card, { backgroundColor: theme.card, marginTop: 16 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.subtext, marginBottom: 16 }]}>ORDER ITEMS ({order.items?.length || 0})</Text>
                    {order.items?.map((item: any, idx: number) => (
                        <View key={idx} style={[styles.itemRow, { borderBottomColor: theme.border, borderBottomWidth: idx === order.items.length - 1 ? 0 : 1 }]}>
                            <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.background }]}>
                                <MaterialCommunityIcons name="chair-rolling" size={24} color={theme.subtext} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.name}</Text>
                                <Text style={[styles.itemSub, { color: theme.subtext }]}>Qty: {item.quantity}</Text>
                            </View>
                            <Text style={[styles.itemPrice, { color: theme.text }]}>₹{item.price * item.quantity}</Text>
                        </View>
                    ))}
                </View>

                {/* Financial Summary */}
                <View style={[styles.card, { backgroundColor: theme.card, marginTop: 16 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.subtext, marginBottom: 16 }]}>PAYMENT SUMMARY</Text>

                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.subtext }}>Payment Method</Text>
                        <Text style={{ color: theme.text, fontWeight: '600' }}>{paymentMethod}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.subtext }}>Items Total</Text>
                        <Text style={{ color: theme.text }}>₹{order.items?.reduce((a: number, b: any) => a + (b.price * b.quantity), 0) || 0}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.subtext }}>Assembly Fee</Text>
                        <Text style={{ color: theme.text }}>₹499</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>Grand Total</Text>
                        <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 18 }}>₹{order.total_amount || order.total}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />

            </ScrollView>

            {/* Actions Footer */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                {order.status === 'pending' && (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => updateStatus('rejected')} style={[styles.actionBtn, { backgroundColor: '#FFEEED', flex: 1 }]}>
                            <Text style={[styles.actionText, { color: '#FF4B4B' }]}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => updateStatus('packed')} style={[styles.actionBtn, { backgroundColor: theme.primary, flex: 2 }]}>
                            {updating ? <ActivityIndicator color="#fff" /> : <Text style={[styles.actionText, { color: '#fff' }]}>Accept & Pack</Text>}
                        </TouchableOpacity>
                    </View>
                )}
                {order.status === 'packed' && (
                    <View style={{ gap: 10 }}>
                        <TouchableOpacity
                            onPress={() => setShipmentModalVisible(true)}
                            disabled={creatingShipment}
                            style={[styles.actionBtn, { backgroundColor: theme.primary, flexDirection: 'row', gap: 8 }]}
                        >
                            {creatingShipment ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <MaterialCommunityIcons name="truck-delivery" size={24} color="#fff" />
                                    <Text style={[styles.actionText, { color: '#fff' }]}>Ship via Delhivery</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => updateStatus('shipped')} style={[styles.actionBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}>
                            {updating ? <ActivityIndicator color={theme.text} /> : <Text style={[styles.actionText, { color: theme.text }]}>Mark Shipped Manually</Text>}
                        </TouchableOpacity>
                    </View>
                )}
                {order.status === 'shipped' && (
                    <TouchableOpacity onPress={() => updateStatus('out for delivery')} style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
                        {updating ? <ActivityIndicator color="#fff" /> : <Text style={[styles.actionText, { color: '#fff' }]}>Out For Delivery</Text>}
                    </TouchableOpacity>
                )}
                {order.status === 'out for delivery' && (
                    <TouchableOpacity onPress={() => updateStatus('delivered')} style={[styles.actionBtn, { backgroundColor: theme.success }]}>
                        {updating ? <ActivityIndicator color="#fff" /> : <Text style={[styles.actionText, { color: '#fff' }]}>Mark Delivered</Text>}
                    </TouchableOpacity>
                )}
                {order.status === 'delivered' && (
                    <View style={[styles.completedBadge, { backgroundColor: theme.success + '15' }]}>
                        <MaterialCommunityIcons name="check-all" size={24} color={theme.success} />
                        <Text style={{ color: theme.success, fontWeight: '700', marginLeft: 8 }}>Order Completed</Text>
                    </View>
                )}
            </View>
            {/* Shipment Modal */}
            <Modal
                visible={shipmentModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setShipmentModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Shipment Dimensions</Text>
                            <TouchableOpacity onPress={() => setShipmentModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 14, color: theme.subtext, marginBottom: 16 }}>Enter the total weight and box dimensions for this shipment.</Text>

                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, marginBottom: 6 }}>WEIGHT (KG)</Text>
                                <TextInput
                                    value={shipmentData.weight}
                                    onChangeText={(v) => setShipmentData(prev => ({ ...prev, weight: v }))}
                                    keyboardType="numeric"
                                    placeholder="e.g. 5"
                                    style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, color: theme.text }}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, marginBottom: 6 }}>LENGTH (CM)</Text>
                                    <TextInput
                                        value={shipmentData.length}
                                        onChangeText={(v) => setShipmentData(prev => ({ ...prev, length: v }))}
                                        keyboardType="numeric"
                                        style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, color: theme.text }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, marginBottom: 6 }}>BREADTH (CM)</Text>
                                    <TextInput
                                        value={shipmentData.breadth}
                                        onChangeText={(v) => setShipmentData(prev => ({ ...prev, breadth: v }))}
                                        keyboardType="numeric"
                                        style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, color: theme.text }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, marginBottom: 6 }}>HEIGHT (CM)</Text>
                                    <TextInput
                                        value={shipmentData.height}
                                        onChangeText={(v) => setShipmentData(prev => ({ ...prev, height: v }))}
                                        keyboardType="numeric"
                                        style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, color: theme.text }}
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setShipmentModalVisible(false);
                                handleCreateShipment();
                            }}
                            style={[styles.actionBtn, { backgroundColor: theme.primary, marginTop: 24 }]}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Confirm & Create LR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, justifyContent: 'space-between' },
    backBtn: { padding: 4 },
    title: { fontSize: 20, fontWeight: '800' },
    subtitle: { fontSize: 12, fontWeight: '600' },
    scrollContent: { padding: 20 },
    card: { padding: 20, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

    // Stepper
    stepperContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' },
    stepWrapper: { alignItems: 'center', width: 60, zIndex: 2 },
    stepCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    stepLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 6 },
    stepLine: { position: 'absolute', top: 18, left: 20, right: 20, height: 2 },

    // Customer
    callBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
    customerRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: '700' },
    customerName: { fontSize: 16, fontWeight: '700' },
    customerMeta: { fontSize: 14, fontWeight: '500', marginTop: 2 },
    divider: { height: 1, marginVertical: 16, opacity: 0.3 },
    addressLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
    address: { fontSize: 14, lineHeight: 20 },

    // Items
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    itemImagePlaceholder: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    itemSub: { fontSize: 12 },
    itemPrice: { fontSize: 15, fontWeight: '700' },

    // Summary
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },

    // Footer
    footer: { padding: 20, borderTopWidth: 1, paddingBottom: 30 },
    actionBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontSize: 16, fontWeight: '700' },
    completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16 }
});

export default OrderDetailsScreen;
