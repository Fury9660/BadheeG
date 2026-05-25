
import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

interface CartItemProps {
    item: any;
    updateQuantity: (itemId: string, currentQty: number, delta: number) => void;
    removeItem: (itemId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, updateQuantity, removeItem }) => {
    const { isDarkMode } = useTheme();

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#111' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: isDarkMode ? '#fff' : '#000',
        border: isDarkMode ? '#222' : '#f0f0f0',
        success: '#27ae60',
    };

    const [storeName, setStoreName] = useState<string | null>(null);

    useEffect(() => {
        const fetchStoreName = async () => {
            const searchId = item.partner_id || (item.details && item.details.partnerId);
            if (!searchId) return;

            const { data } = await supabase.rpc('get_public_partner_info', {
                search_type: 'user_id',
                search_value: searchId
            });

            if (data && data.length > 0) {
                setStoreName(data[0].store_name);
            }
        };
        fetchStoreName();
    }, [item]);

    const mrp = item.price + 2500;
    const discountAmount = mrp - item.price;
    const offPercent = Math.round((discountAmount / mrp) * 100);

    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    return (
        <View style={[styles.cartItem, { backgroundColor: theme.card, borderColor: theme.border }, isDesktop && { padding: 20 }]}>
            <View style={styles.itemHeader}>
                <Image source={{ uri: item.image }} style={[styles.itemImage, isDesktop && { width: 120, height: 120 }]} />
                <View style={styles.itemMainInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, { color: theme.text }, isDesktop && { fontSize: 18 }]} numberOfLines={2}>{item.name}</Text>
                            <Text style={[styles.showroomName, { color: theme.subtext }, isDesktop && { fontSize: 12 }]}>{storeName || 'Showroom'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Feather name="x" size={20} color={theme.subtext} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={[styles.itemPrice, { color: theme.text }, isDesktop && { fontSize: 20 }]}>₹{item.price.toLocaleString('en-IN')}</Text>
                        <Text style={[styles.offPercent, { color: theme.success }, isDesktop && { fontSize: 13 }]}>{offPercent}% OFF</Text>
                    </View>

                    <View style={styles.itemActions}>
                        <View style={[styles.qtyControl, { backgroundColor: isDarkMode ? '#222' : '#f8f8f8' }, isDesktop && { height: 36 }]}>
                            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity, -1)} style={[styles.qtyBtn, isDesktop && { width: 36, height: 36 }]}>
                                <Feather name="minus" size={14} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={[styles.qtyText, { color: theme.text }, isDesktop && { fontSize: 16 }]}>{item.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity, 1)} style={[styles.qtyBtn, isDesktop && { width: 36, height: 36 }]}>
                                <Feather name="plus" size={14} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.deliveryBadge}>
                            <Feather name="truck" size={isDesktop ? 14 : 10} color={theme.subtext} />
                            <Text style={[styles.infoValue, { color: theme.subtext }, isDesktop && { fontSize: 12 }]}>Ships in 7 days</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cartItem: { padding: 12, borderRadius: 16, borderBottomWidth: 1, marginBottom: 12 },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    itemImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f9f9f9' },
    itemMainInfo: { flex: 1, marginLeft: 14 },
    itemName: { fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
    showroomName: { fontSize: 10, fontWeight: '600', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    itemPrice: { fontSize: 16, fontWeight: '800' },
    offPercent: { fontSize: 11, fontWeight: '700', marginLeft: 8 },
    itemActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, height: 28 },
    qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontSize: 13, fontWeight: '700', paddingHorizontal: 2 },
    deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoValue: { fontSize: 10, fontWeight: '600' },
});

export default CartItem;
