import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HelpDrawerProps {
    isVisible: boolean;
    onClose: () => void;
    order: any;
}

const { height } = Dimensions.get('window');

const HelpDrawer = ({ isVisible, onClose, order }: HelpDrawerProps) => {
    const { isDarkMode } = useTheme();
    const [showCallOptions, setShowCallOptions] = useState(false);
    const [partnerPhone, setPartnerPhone] = useState<string | null>(null);
    const [loadingPhone, setLoadingPhone] = useState(false);

    const theme = {
        background: isDarkMode ? '#1A1A1A' : '#fff',
        text: isDarkMode ? '#fff' : '#121212',
        subtext: isDarkMode ? '#A0A0A0' : '#666',
        border: isDarkMode ? '#333' : '#eee',
        surface: isDarkMode ? '#252525' : '#f8f9fa',
        primary: '#3466F6',
    };

    useEffect(() => {
        if (isVisible && order?.partner_id) {
            fetchPartnerPhone();
        } else {
            setShowCallOptions(false); // Reset on close/change
        }
    }, [isVisible, order]);

    const fetchPartnerPhone = async () => {
        setLoadingPhone(true);
        try {
            const { data, error } = await supabase
                .from('pre_approved_partners')
                .select('mobile') // Assuming column is 'mobile' based on other tables, will double check if data fails
                .eq('id', order.partner_id)
                .single();

            if (data?.mobile) {
                setPartnerPhone(data.mobile);
            }
        } catch (err) {
            console.log("Error fetching partner phone", err);
        } finally {
            setLoadingPhone(false);
        }
    };

    const handleCallCustomerCare = () => {
        Linking.openURL('tel:9521633688');
    };

    const handleCallShowroom = () => {
        if (partnerPhone) {
            Linking.openURL(`tel:${partnerPhone}`);
        } else {
            alert("Showroom number not available");
        }
    };

    const handleEmailSupport = () => {
        Linking.openURL('mailto:Support@badheeg.com');
    };

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop tap to close */}
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={[styles.drawer, { backgroundColor: theme.background, height: height * 0.8 }]}>
                    {/* Handle */}
                    <View style={[styles.handleRaw, { backgroundColor: theme.border }]} />

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
                            <Feather name="x" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Order Context */}
                    {order && (
                        <View style={[styles.orderContext, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.contextLabel, { color: theme.subtext }]}>Help regarding Order</Text>
                            <Text style={[styles.orderId, { color: theme.text }]}>#{order.id?.slice(0, 10)}... (Total: ₹{order.total_amount})</Text>
                        </View>
                    )}

                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>What do you need help with?</Text>

                        {/* Options */}

                        {/* Delivered Options */}
                        {/* Delivered Options */}
                        {(order?.status?.toLowerCase() === 'delivered' || order?.status?.toLowerCase() === 'completed') ? (
                            <>
                                <TouchableOpacity style={[styles.optionCard, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#FFD70020' }]}>
                                        <MaterialCommunityIcons name="keyboard-return" size={24} color="#FFD700" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionTitle, { color: theme.text }]}>Return or Exchange</Text>
                                        <Text style={[styles.optionDesc, { color: theme.subtext }]}>Changed your mind? Return or exchange items.</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={theme.subtext} />
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.optionCard, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                    <View style={[styles.iconCircle, { backgroundColor: '#FF3B3020' }]}>
                                        <Feather name="alert-circle" size={24} color="#FF3B30" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionTitle, { color: theme.text }]}>Report an Issue</Text>
                                        <Text style={[styles.optionDesc, { color: theme.subtext }]}>Missing items, damaged product, or wrong item.</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={theme.subtext} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* Pre-Delivery Options */
                            <TouchableOpacity style={[styles.optionCard, { borderColor: theme.border, backgroundColor: theme.background }]}>
                                <View style={[styles.iconCircle, { backgroundColor: '#34C75920' }]}>
                                    <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#34C759" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.optionTitle, { color: theme.text }]}>Delivery Delay</Text>
                                    <Text style={[styles.optionDesc, { color: theme.subtext }]}>Order taking longer than expected?</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        )}

                        {/* Contact Us Section */}
                        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Contact Us</Text>

                        {showCallOptions ? (
                            <View style={styles.callOptionsContainer}>
                                <Text style={{ color: theme.subtext, marginBottom: 12 }}>Select who you want to call:</Text>
                                <View style={{ gap: 12 }}>
                                    <TouchableOpacity style={[styles.callOptionBtn, { backgroundColor: theme.surface }]} onPress={handleCallCustomerCare}>
                                        <View style={[styles.iconCircleSmall, { backgroundColor: theme.primary + '20' }]}>
                                            <MaterialCommunityIcons name="headset" size={20} color={theme.primary} />
                                        </View>
                                        <View>
                                            <Text style={[styles.callOptionTitle, { color: theme.text }]}>Customer Care</Text>
                                            <Text style={[styles.callOptionSub, { color: theme.subtext }]}>For general app support</Text>
                                        </View>
                                        <Feather name="phone" size={18} color={theme.primary} style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.callOptionBtn, { backgroundColor: theme.surface }]} onPress={handleCallShowroom}>
                                        <View style={[styles.iconCircleSmall, { backgroundColor: '#34C75920' }]}>
                                            <MaterialCommunityIcons name="store" size={20} color="#34C759" />
                                        </View>
                                        <View>
                                            <Text style={[styles.callOptionTitle, { color: theme.text }]}>Showroom Owner</Text>
                                            <Text style={[styles.callOptionSub, { color: theme.subtext }]}>For order specific details</Text>
                                        </View>
                                        {loadingPhone ? <ActivityIndicator size="small" color={theme.text} /> : <Feather name="phone" size={18} color="#34C759" style={{ marginLeft: 'auto' }} />}
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={() => setShowCallOptions(false)} style={{ alignItems: 'center', marginTop: 8 }}>
                                        <Text style={{ color: theme.subtext }}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.contactRow}>
                                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.surface }]} onPress={() => setShowCallOptions(true)}>
                                    <Feather name="phone-call" size={24} color={theme.primary} />
                                    <Text style={[styles.contactLabel, { color: theme.text }]}>Call Us</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.surface }]} onPress={handleEmailSupport}>
                                    <Feather name="mail" size={24} color={theme.primary} />
                                    <Text style={[styles.contactLabel, { color: theme.text }]}>Email</Text>
                                </TouchableOpacity>


                            </View>
                        )}

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    drawer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', paddingBottom: 40 },
    handleRaw: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, opacity: 0.3 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    closeBtn: { padding: 8, borderRadius: 20 },
    orderContext: { padding: 16, margin: 20, borderRadius: 12, marginBottom: 10 },
    contextLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    orderId: { fontSize: 14, fontWeight: 'bold' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12, gap: 16 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    optionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    optionDesc: { fontSize: 12 },
    contactRow: { flexDirection: 'row', gap: 12 },
    contactBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
    contactLabel: { fontWeight: '600', fontSize: 14 },
    // New Styles
    callOptionsContainer: {
        padding: 4
    },
    callOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12
    },
    iconCircleSmall: {
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'
    },
    callOptionTitle: {
        fontWeight: 'bold', fontSize: 14
    },
    callOptionSub: {
        fontSize: 12
    }
});

export default HelpDrawer;
