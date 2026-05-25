import HelpDrawer from '@/components/profile/HelpDrawer';
import TrackingModal from '@/components/profile/TrackingModal';
import ReviewModal from '@/components/ReviewModal';
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const MyOrdersContent = () => {
    const { isDarkMode } = useTheme();
    const { width } = useWindowDimensions();
    const isWeb = width > 768;
    const { user } = useAuth();
    const router = useRouter();

    const [orders, setOrders] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]); // Track user reviews
    const [loading, setLoading] = useState(true);

    // Modal state
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [helpModalVisible, setHelpModalVisible] = useState(false);
    const [trackingModalVisible, setTrackingModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const theme = {
        background: isDarkMode ? '#000' : '#f8f9fa',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#666',
        primary: '#3466F6',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        surface: isDarkMode ? '#252525' : '#f0f2f5',
    };

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (orderError) throw orderError;
                if (orderData) setOrders(orderData);

                const { data: reviewData } = await supabase
                    .from('reviews')
                    .select('order_id')
                    .eq('user_id', user.id);

                if (reviewData) setReviews(reviewData);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleOpenReview = (order: any) => {
        setSelectedOrder(order);
        setReviewModalVisible(true);
    };

    const handleOpenHelp = (order: any) => {
        setSelectedOrder(order);
        setHelpModalVisible(true);
    };

    const handleOpenTracking = (order: any) => {
        setSelectedOrder(order);
        setTrackingModalVisible(true);
    };

    const handleReviewSuccess = () => {
        if (user && selectedOrder) {
            setReviews(prev => [...prev, { order_id: selectedOrder.id }]);
        }
    };

    const getStatusColor = (status: string, delhiveryStatus?: string) => {
        if (delhiveryStatus) {
            switch (delhiveryStatus.toLowerCase()) {
                case 'delivered': return theme.success;
                case 'rto': return theme.error;
                case 'cancelled': return theme.error;
                case 'manifested': return theme.warning;
                case 'packed': return theme.primary;
                case 'pickup_scheduled': return '#FF9500';
                case 'picked_up': return '#5856D6';
                case 'in_transit': return '#007AFF';
                case 'out_for_delivery': return '#34C759';
                default: return theme.primary;
            }
        }
        switch (status?.toLowerCase()) {
            case 'delivered': return theme.success;
            case 'completed': return theme.success;
            case 'cancelled': return theme.error;
            case 'pending': return theme.warning;
            default: return theme.primary;
        }
    };

    const getStatusIcon = (status: string, delhiveryStatus?: string) => {
        if (delhiveryStatus) {
            switch (delhiveryStatus.toLowerCase()) {
                case 'delivered': return 'check-circle-outline';
                case 'rto': return 'alert-circle-outline';
                case 'cancelled': return 'close-circle-outline';
                case 'manifested': return 'file-document-outline';
                case 'packed': return 'package-variant';
                case 'pickup_scheduled': return 'calendar-clock';
                case 'picked_up': return 'truck-delivery-outline';
                case 'in_transit': return 'truck-fast-outline';
                case 'out_for_delivery': return 'moped-electric-outline';
                default: return 'package-variant-closed';
            }
        }
        switch (status?.toLowerCase()) {
            case 'delivered': return 'check-circle-outline';
            case 'completed': return 'check-circle-outline';
            case 'cancelled': return 'close-circle-outline';
            case 'pending': return 'clock-outline';
            default: return 'package-variant-closed';
        }
    };

    const getStatusLabel = (status: string, delhiveryStatus?: string) => {
        if (delhiveryStatus) {
            switch (delhiveryStatus.toLowerCase()) {
                case 'manifested': return 'Shipment Manifested';
                case 'packed': return 'Packed by Seller';
                case 'pickup_scheduled': return 'Pickup Scheduled';
                case 'picked_up': return 'Picked Up';
                case 'in_transit': return 'In Transit';
                case 'out_for_delivery': return 'Out For Delivery';
                case 'delivered': return 'Delivered';
                case 'rto': return 'Returned to Seller (RTO)';
                case 'cancelled': return 'Shipment Cancelled';
                default: return delhiveryStatus.toUpperCase().replace('_', ' ');
            }
        }
        return status?.toUpperCase();
    };

    return (
        <ScrollView contentContainerStyle={[styles.content, isWeb && { alignItems: 'center', paddingTop: 40 }]}>
            <View style={[{ width: '100%', maxWidth: 1200, gap: 24 }, isWeb && { flexDirection: 'row', flexWrap: 'wrap' }]}>
                {orders.map((order) => {
                    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                    const itemCount = order.items ? order.items.reduce((acc: any, item: any) => acc + item.quantity, 0) : 0;
                    const statusColor = getStatusColor(order.status, order.delhivery_status);
                    const rawId = order.order_id || order.id || 'UNKNOWN';
                    const displayId = isWeb ? rawId : (rawId.length > 12 ? rawId.slice(0, 10) + '...' : rawId);

                    const isDelivered = order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed';
                    const hasReviewed = reviews.some(r => r.order_id === order.id);

                    return (
                        <TouchableOpacity
                            key={order.id}
                            style={[
                                styles.orderCard, 
                                { backgroundColor: theme.card, borderColor: theme.border },
                                isWeb && { padding: 8, width: '48.8%' }
                            ]}
                            activeOpacity={0.95}
                        >
                            <View style={[styles.cardHeader, { borderBottomColor: theme.border }, isWeb && { paddingHorizontal: 24, paddingVertical: 20 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={[styles.iconBox, { backgroundColor: theme.surface }, isWeb && { width: 48, height: 48, borderRadius: 12 }]}>
                                        <MaterialCommunityIcons name="shopping-outline" size={isWeb ? 24 : 20} color={theme.text} />
                                    </View>
                                    <View>
                                        <Text style={[styles.orderId, { color: theme.text }, isWeb && { fontSize: 18 }]} numberOfLines={1}>Order #{displayId}</Text>
                                        <Text style={[styles.date, { color: theme.subtext }, isWeb && { fontSize: 14 }]}>Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
                                    </View>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }, isWeb && { paddingHorizontal: 16, paddingVertical: 8 }]}>
                                    <MaterialCommunityIcons name={getStatusIcon(order.status, order.delhivery_status) as any} size={isWeb ? 16 : 14} color={statusColor} style={{ marginRight: 6 }} />
                                    <Text style={[styles.statusText, { color: statusColor }, isWeb && { fontSize: 13 }]}>{getStatusLabel(order.status, order.delhivery_status)}</Text>
                                </View>
                            </View>

                            <View style={[styles.cardBody, isWeb && { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <View style={[styles.productRow, isWeb && { gap: 24, flex: 1 }]}>
                                    {firstItem && firstItem.image ? (
                                        <Image source={{ uri: firstItem.image }} style={[styles.productImage, { backgroundColor: theme.surface }, isWeb && { width: 100, height: 100, borderRadius: 12 }]} />
                                    ) : (
                                        <View style={[styles.productImage, { backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }, isWeb && { width: 100, height: 100, borderRadius: 12 }]}>
                                            <Feather name="image" size={isWeb ? 32 : 24} color={theme.subtext} />
                                        </View>
                                    )}
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        {firstItem ? (
                                            <>
                                                <Text style={[styles.productName, { color: theme.text }, isWeb && { fontSize: 20, marginBottom: 8 }]} numberOfLines={2}>{firstItem.name}</Text>
                                                <Text style={[styles.productMeta, { color: theme.subtext }, isWeb && { fontSize: 15 }]}>
                                                    {itemCount > 1 ? `+ ${itemCount - 1} more items` : `Quantity: ${firstItem.quantity}`}
                                                </Text>
                                            </>
                                        ) : (
                                            <Text style={{ color: theme.subtext }}>Items info unavailable</Text>
                                        )}
                                        <Text style={[styles.amount, { color: theme.text }, isWeb && { fontSize: 22, marginTop: 12 }]}>₹{order.total_amount?.toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>

                                {isWeb && (
                                    <View style={{ gap: 12, width: 220 }}>
                                        {isDelivered && !hasReviewed ? (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: theme.text, borderColor: theme.text, height: 48 }]}
                                                onPress={() => handleOpenReview(order)}
                                            >
                                                <Text style={[styles.actionBtnText, { color: theme.card }]}>Write Review</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border, height: 48 }]} onPress={() => handleOpenHelp(order)}>
                                                <Text style={[styles.actionBtnText, { color: theme.text }]}>Start Help</Text>
                                            </TouchableOpacity>
                                        )}

                                        {!isDelivered && (
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.text, borderColor: theme.text, height: 48 }]} onPress={() => handleOpenTracking(order)}>
                                                <Text style={[styles.actionBtnText, { color: theme.card }]}>Track Order</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>

                            {!isWeb && (
                                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                                    {isDelivered && !hasReviewed ? (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: theme.text, borderColor: theme.text }]}
                                            onPress={() => handleOpenReview(order)}
                                        >
                                            <Text style={[styles.actionBtnText, { color: theme.card }]}>Write Review</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border }]} onPress={() => handleOpenHelp(order)}>
                                            <Text style={[styles.actionBtnText, { color: theme.text }]}>Start Help</Text>
                                        </TouchableOpacity>
                                    )}

                                    {!isDelivered && (
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.text, borderColor: theme.text }]} onPress={() => handleOpenTracking(order)}>
                                            <Text style={[styles.actionBtnText, { color: theme.card }]}>Track Order</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {selectedOrder && (
                <>
                    <ReviewModal
                        isVisible={reviewModalVisible}
                        onClose={() => setReviewModalVisible(false)}
                        onSubmitSuccess={handleReviewSuccess}
                        orderId={selectedOrder.id}
                        partnerId={selectedOrder.partner_id}
                        items={selectedOrder.items}
                    />
                    <HelpDrawer
                        isVisible={helpModalVisible}
                        onClose={() => setHelpModalVisible(false)}
                        order={selectedOrder}
                    />
                    <TrackingModal
                        isVisible={trackingModalVisible}
                        onClose={() => setTrackingModalVisible(false)}
                        order={selectedOrder}
                    />
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: { padding: 16, paddingBottom: 100 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyIconCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    emptySub: { fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 300, marginBottom: 32 },
    shopBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    shopBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    orderCard: { borderRadius: 20, borderWidth: 1, marginBottom: 24, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }, default: { elevation: 2 } }) },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    orderId: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    date: { fontSize: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 24 },
    statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

    cardBody: { padding: 16 },
    productRow: { flexDirection: 'row', gap: 16 },
    productImage: { width: 70, height: 70, borderRadius: 10 },
    productName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    productMeta: { fontSize: 13, marginBottom: 6 },
    amount: { fontSize: 18, fontWeight: '900' },

    cardFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
    actionBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1 },
    actionBtnText: { fontSize: 14, fontWeight: '700' }
});

export default MyOrdersContent;
