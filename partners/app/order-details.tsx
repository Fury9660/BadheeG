import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { createShipment } from '@/lib/delhivery';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const OrderDetailsScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        text: isDarkMode ? '#fff' : '#121212',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#000000',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        success: '#4CAF50',
    };
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

    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, addresses:address_id (*), partner:partner_id (delhivery_pickup_name)`)
                .eq('id', id)
                .single();

            if (data) {
                // Map joined address data to order object for consistency with UI
                const address = data.addresses;
                const partnerData = data.partner; // Supabase uses the column name as key if aliased or the table name
                setOrder({
                    ...data,
                    customerName: address?.name,
                    customerPhone: address?.mobile,
                    shippingAddress: address ? `${address.line1}, ${address.city}, ${address.state} - ${address.pincode}` : null,
                    partnerPickupName: partnerData?.delhivery_pickup_name
                });
            } else {
                Alert.alert("Error", "Order not found");
                router.back();
            }
            setLoading(false);
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (typeof window !== 'undefined') window.alert(`SUCCESS: Order marked as ${newStatus}`);
            Alert.alert("Success", `Order marked as ${newStatus}`);
        } catch (error: any) {
            console.error("Update status error", error);
            if (typeof window !== 'undefined') window.alert("ERROR: Could not update status: " + error.message);
            Alert.alert("Error", "Could not update status: " + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const getStep = (status: string) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'pending':
            case 'accepted': return 0;
            case 'processing':
            case 'packed': return 1;
            case 'manifested':
            case 'shipped': return 2;
            case 'delivered': return 3;
            default: return -1;
        }
    };

    const currentStep = order ? getStep(order.status) : 0;

    // Derived state for button actions
    const handleGenerateInvoice = () => updateStatus('packed');
    const handleReadyToShip = () => updateStatus('shipped');

    const handleCreateShipment = async () => {
        if (!order) {
            console.log("Create Shipment: No order found in state");
            return;
        }
        console.log("Starting Shipment Creation for Order:", order.id);
        const correctPickupName = "BADHEE G 6537 B2B"; // FORCING CORRECT NAME FROM PORTAL
        console.log("Forcing Pickup Name:", correctPickupName);
        
        if (typeof window !== 'undefined') {
            const proceed = window.confirm(`Ship via Delhivery?\nPickup Location: ${correctPickupName}\n\nThis matches your Portal! Proceed?`);
            if (!proceed) return;
        }

        setCreatingShipment(true);
        try {
            const result = await createShipment({
                orderId: order.id,
                customerName: order.customerName || 'Guest',
                customerAddress: order.shippingAddress || '',
                customerCity: order.addresses?.city || 'City',
                customerPincode: order.addresses?.pincode || '110001',
                customerPhone: order.customerPhone || '',
                paymentMode: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
                codAmount: order.total_amount || 0,
                totalAmount: order.total_amount || 0,
                productsDesc: order.items?.map((i: any) => i.name).join(', ') || 'Furniture',
                weight: parseFloat(shipmentData.weight) || 1,
                length: parseFloat(shipmentData.length) || 10,
                breadth: parseFloat(shipmentData.breadth) || 10,
                height: parseFloat(shipmentData.height) || 10
            }, correctPickupName);

            console.log("Shipment Creation Result:", result);

            console.log("Updating Supabase with tracking ID:", result.trackingId);
            const { error } = await supabase
                .from('orders')
                .update({ 
                    status: 'manifested',
                    tracking_id: result.trackingId,
                    courier_name: 'Delhivery'
                })
                .eq('id', id);

            if (error) {
                console.error("Supabase update error:", error);
                throw error;
            }

            console.log("Supabase updated successfully");
            setOrder((prev: any) => ({ ...prev, status: 'manifested', tracking_id: result.trackingId }));
            if (typeof window !== 'undefined') window.alert("SUCCESS: Shipment Created! Tracking ID: " + result.trackingId);
            Alert.alert("Success", "Shipment Created Successfully!");
        } catch (error: any) {
            console.error("Detailed Delhivery error:", error);
            if (typeof window !== 'undefined') window.alert("ERROR: " + (error.message || "Failed to create shipment"));
            Alert.alert("Error", error.message || "Failed to create shipment");
        } finally {
            setCreatingShipment(false);
        }
    };

    // Mapped Theme wrapper helper
    const step = currentStep;

    return (
        <>
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>Order {id || '#ORD-7712'}</Text>
                    <TouchableOpacity onPress={() => { }}><Feather name="help-circle" size={22} color={theme.text} /></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.stepperContainer}>
                        {[{ label: 'Accepted', icon: 'check-circle' }, { label: 'Packed', icon: 'package-variant' }, { label: 'Ready', icon: 'truck-delivery' }].map((s, i) => (
                            <View key={i} style={styles.stepWrapper}>
                                <View style={[styles.stepCircle, { backgroundColor: step > i ? theme.primary : theme.card, borderColor: step > i ? theme.primary : theme.border }]}>
                                    <MaterialCommunityIcons name={s.icon as any} size={20} color={step > i ? '#fff' : theme.subtext} />
                                </View>
                                <Text style={[styles.stepLabel, { color: step > i ? theme.text : theme.subtext }]}>{s.label}</Text>
                            </View>
                        ))}
                        <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                    </View>
                    <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.infoTitle, { color: theme.subtext }]}>CUSTOMER DETAILS</Text>
                        {order && (
                            <>
                                <View style={styles.customerRow}>
                                    <View style={styles.avatar}><Text style={styles.avatarText}>{order.customerName ? order.customerName[0] : 'C'}</Text></View>
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={[styles.customerName, { color: theme.text }]}>{order.customerName || 'Customer'}</Text>
                                        <Text style={[styles.customerMeta, { color: theme.subtext }]}>{order.customerPhone || 'N/A'}</Text>
                                    </View>
                                </View>
                                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                <Text style={[styles.address, { color: theme.text }]}>{order.shippingAddress || 'No address provided'}</Text>

                                <Text style={[styles.infoTitle, { color: theme.subtext, marginTop: 20 }]}>ITEMS</Text>
                                {/* Render items if array exists */}
                                {order.items && order.items.map((item: any, idx: number) => (
                                    <View key={idx} style={{ marginTop: 8 }}>
                                        <Text style={{ color: theme.text }}>{item.name} x {item.quantity}</Text>
                                        <Text style={{ color: theme.subtext }}>₹{item.price}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                    {step === 3 && (
                        <Animated.View entering={ZoomIn} style={[styles.qrCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.qrTitle, { color: theme.text }]}>Shipping Manifest QR</Text>
                            <View style={[styles.qrWrapper, { backgroundColor: '#fff' }]}><MaterialCommunityIcons name="qrcode-scan" size={150} color="#000" /></View>
                        </Animated.View>
                    )}
                </ScrollView>
                <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    {step === 0 && <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={handleGenerateInvoice}>{updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Pack Order</Text>}</TouchableOpacity>}
                    {step === 1 && (
                        <View style={{ gap: 10 }}>
                                <Pressable 
                                    style={({ pressed }) => [
                                        styles.primaryBtn, 
                                        { backgroundColor: theme.primary, flexDirection: 'row', gap: 8, opacity: pressed ? 0.6 : 1, cursor: 'pointer' }
                                    ]} 
                                    onPress={() => setShipmentModalVisible(true)}
                                >
                                    {creatingShipment ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <MaterialCommunityIcons name="truck-delivery" size={20} color="#fff" />
                                            <Text style={styles.btnText}>Ship via Delhivery</Text>
                                        </>
                                    )}
                                </Pressable>
                                <Pressable 
                                    style={({ pressed }) => [
                                        styles.primaryBtn, 
                                        { backgroundColor: theme.success, height: 50, opacity: pressed ? 0.6 : 1, cursor: 'pointer', justifyContent: 'center', alignItems: 'center' }
                                    ]} 
                                    onPress={handleReadyToShip}
                                >
                                    {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Mark Shipped Manually</Text>}
                                </Pressable>
                        </View>
                    )}
                    {step >= 2 && <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary + '20' }]} disabled><Text style={[styles.btnText, { color: theme.primary }]}>{order?.status === 'delivered' ? 'Order Delivered' : 'In Transit'}</Text></TouchableOpacity>}
                </View>
            </SafeAreaView>
            {/* Custom Shipment Overlay (Replaces Modal for Web reliability) */}
            {shipmentModalVisible && (
                <View style={{ 
                    position: 'absolute', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(0,0,0,0.7)', 
                    zIndex: 20000, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    padding: 20
                }}>
                    <View style={{ 
                        backgroundColor: theme.card, 
                        width: '100%', 
                        maxWidth: 450, 
                        borderRadius: 24, 
                        padding: 24,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.5,
                        shadowRadius: 20,
                        elevation: 20
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Shipment Details</Text>
                            <Pressable onPress={() => setShipmentModalVisible(false)} style={{ padding: 5 }}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.subtext} />
                            </Pressable>
                        </View>

                        <Text style={{ fontSize: 14, color: theme.subtext, marginBottom: 20 }}>Enter the total weight and box dimensions for Delhivery B2B LTL.</Text>

                        <View style={{ gap: 16 }}>
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, marginBottom: 6 }}>WEIGHT (KG)</Text>
                                <TextInput
                                    value={shipmentData.weight}
                                    onChangeText={(v) => setShipmentData(prev => ({ ...prev, weight: v }))}
                                    keyboardType="numeric"
                                    placeholder="e.g. 5"
                                    style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 16, color: theme.text, backgroundColor: theme.background }}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, marginBottom: 6 }}>L (CM)</Text>
                                    <TextInput
                                        value={shipmentData.length}
                                        onChangeText={(v) => setShipmentData(prev => ({ ...prev, length: v }))}
                                        keyboardType="numeric"
                                        style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, color: theme.text, backgroundColor: theme.background }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, marginBottom: 6 }}>B (CM)</Text>
                                    <TextInput
                                        value={shipmentData.breadth}
                                        onChangeText={(v) => setShipmentData(prev => ({ ...prev, breadth: v }))}
                                        keyboardType="numeric"
                                        style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, color: theme.text, backgroundColor: theme.background }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.subtext, marginBottom: 6 }}>H (CM)</Text>
                                    <TextInput
                                        value={shipmentData.height}
                                        onChangeText={(v) => setShipmentData(prev => ({ ...prev, height: v }))}
                                        keyboardType="numeric"
                                        style={{ height: 50, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, color: theme.text, backgroundColor: theme.background }}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 30 }}>
                            <Pressable 
                                style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: theme.border, justifyContent: 'center', alignItems: 'center' }} 
                                onPress={() => setShipmentModalVisible(false)}
                            >
                                <Text style={{ color: theme.text, fontWeight: '600' }}>Cancel</Text>
                            </Pressable>
                            <Pressable 
                                style={({ pressed }) => [
                                    { flex: 2, height: 56, borderRadius: 16, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.8 : 1 }
                                ]}
                                onPress={() => {
                                    setShipmentModalVisible(false);
                                    handleCreateShipment();
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Create Shipment</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800' },
    scrollContent: { padding: 24, paddingTop: 0, maxWidth: 600, width: '100%', alignSelf: 'center' },
    stepperContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 32, position: 'relative' },
    stepWrapper: { alignItems: 'center', zIndex: 10 },
    stepCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    stepLabel: { fontSize: 10, fontWeight: '700', marginTop: 6, textTransform: 'uppercase' },
    stepLine: { position: 'absolute', top: 20, left: 40, right: 40, height: 2, zIndex: 1 },
    infoCard: { padding: 20, borderRadius: 24, marginBottom: 24 },
    infoTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
    customerRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: '700', color: '#555' },
    customerName: { fontSize: 16, fontWeight: '700' },
    customerMeta: { fontSize: 13, fontWeight: '500' },
    divider: { height: 1, marginVertical: 16 },
    address: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
    qrCard: { padding: 24, borderRadius: 24, alignItems: 'center' },
    qrTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
    qrWrapper: { padding: 20, borderRadius: 20 },
    footer: { padding: 24, paddingBottom: 34, borderTopWidth: 1, maxWidth: 600, width: '100%', alignSelf: 'center' },
    primaryBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default OrderDetailsScreen;
