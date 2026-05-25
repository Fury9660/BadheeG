import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFocusEffect } from 'expo-router';

const MyAddressesScreen = () => {
    const { isDarkMode, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const theme = {
        background: isDarkMode ? '#000000' : '#F8F9FA',
        text: isDarkMode ? '#FFFFFF' : '#121212',
        card: isDarkMode ? '#111111' : '#FFFFFF',
        subtext: isDarkMode ? '#888888' : '#666666',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        border: isDarkMode ? '#222222' : '#E5E5EA',
        accent: isDarkMode ? '#333333' : '#F1F1F1',
    };

    const fetchAddresses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            console.log("Fetching addresses for:", user.id);
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false });
            if (error) throw error;
            if (data) setAddresses(data);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                fetchAddresses();
                console.log("Screen focused: Fetching latest addresses");
                
                const channel = supabase
                    .channel(`address_changes_${user.id}`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'addresses',
                        filter: `user_id=eq.${user.id}`
                    }, (payload) => {
                        console.log("Realtime address change detected:", payload.eventType);
                        fetchAddresses();
                    })
                    .subscribe();

                return () => {
                    console.log("Cleaning up address subscription");
                    supabase.removeChannel(channel);
                };
            }
        }, [user])
    );

    const handleSetDefault = async (addressId: string) => {
        if (!user) return;
        try {
            // Set all addresses for this user to is_default: false
            await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Set the selected address to is_default: true
            const { error } = await supabase
                .from('addresses')
                .update({ is_default: true })
                .eq('id', addressId);

            if (error) throw error;
            // No need to fetchAddresses here if useEffect handles it, 
            // but let's add a manual fetch for reliability
            const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id);
            if (data) setAddresses(data);
            
            const msg = "Default address updated.";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Success", msg);
        } catch (error) {
            console.error("Default update error:", error);
            const msg = "Could not update default address.";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Error", msg);
        }
    };

    const handleDelete = async (addressId: string) => {
        const performDelete = async () => {
            try {
                const { error } = await supabase.from('addresses').delete().eq('id', addressId);
                if (error) throw error;
                // Manual refresh in case realtime is slow
                fetchAddresses();
            } catch (error) {
                const msg = "Could not delete address.";
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Error", msg);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Are you sure you want to remove this address?");
            if (confirmed) performDelete();
        } else {
            Alert.alert(
                "Delete Address",
                "Are you sure you want to remove this address?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: performDelete }
                ]
            );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20, borderBottomColor: theme.border }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerSubtitle}>DELIVERY LOCATIONS</Text>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>My Addresses</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    style={[styles.headerAddBtn, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/add-address')}
                >
                    <Feather name="plus" size={20} color={isDarkMode ? '#000' : '#FFF'} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, isDesktop && { alignItems: 'center' }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.innerContent, { maxWidth: isDesktop ? 800 : '100%' }]}>
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : addresses.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconBox, { backgroundColor: theme.accent }]}>
                                <Feather name="map-pin" size={40} color={theme.subtext} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Saved Addresses</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
                                Add a delivery address to ensure a seamless checkout experience for your luxury furniture.
                            </Text>
                            <TouchableOpacity 
                                style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
                                onPress={() => router.push('/add-address')}
                            >
                                <Text style={[styles.emptyAddBtnText, { color: isDarkMode ? '#000' : '#FFF' }]}>Add New Address</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        addresses.map((address, index) => (
                            <View 
                                key={address.id} 
                                style={[
                                    styles.addressCard, 
                                    { backgroundColor: theme.card, borderColor: theme.border },
                                    address.is_default && { borderColor: theme.text, borderWidth: 1.5 }
                                ]}
                            >
                                <View style={styles.cardTop}>
                                    <View style={styles.nameSection}>
                                        <Text style={[styles.cardName, { color: theme.text }]}>{address.name}</Text>
                                        <View style={[styles.typeBadge, { backgroundColor: theme.accent }]}>
                                            <Text style={[styles.typeText, { color: theme.subtext }]}>{address.type?.toUpperCase() || 'HOME'}</Text>
                                        </View>
                                    </View>
                                    {address.is_default && (
                                        <View style={[styles.defaultBadge, { backgroundColor: theme.text }]}>
                                            <Text style={[styles.defaultText, { color: theme.card }]}>DEFAULT</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.addressBody}>
                                    <Text style={[styles.addressLine, { color: theme.subtext }]}>
                                        {address.line1}{address.line2 ? `, ${address.line2}` : ''}
                                    </Text>
                                    <Text style={[styles.addressLine, { color: theme.subtext }]}>
                                        {address.city}, {address.state} - {address.pincode}
                                    </Text>
                                    <View style={styles.mobileRow}>
                                        <Feather name="phone" size={12} color={theme.subtext} />
                                        <Text style={[styles.mobileText, { color: theme.subtext }]}>{address.mobile}</Text>
                                    </View>
                                </View>

                                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                                    <TouchableOpacity 
                                        style={styles.footerAction}
                                        onPress={() => router.push(`/edit-address?addressId=${address.id}` as any)}
                                    >
                                        <Feather name="edit-2" size={14} color={theme.text} />
                                        <Text style={[styles.footerActionText, { color: theme.text }]}>Edit</Text>
                                    </TouchableOpacity>

                                    <View style={styles.footerRight}>
                                        {!address.is_default && (
                                            <TouchableOpacity 
                                                style={styles.footerAction}
                                                onPress={() => handleSetDefault(address.id)}
                                            >
                                                <Text style={[styles.footerActionText, { color: theme.text }]}>Set as Default</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity 
                                            style={styles.footerAction}
                                            onPress={() => handleDelete(address.id)}
                                        >
                                            <Feather name="trash-2" size={14} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backBtn: {
        padding: 4,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        opacity: 0.6,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerAddBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    innerContent: {
        width: '100%',
    },
    loaderContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    emptyAddBtn: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
    },
    emptyAddBtnText: {
        fontSize: 15,
        fontWeight: '800',
    },
    addressCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    nameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardName: {
        fontSize: 17,
        fontWeight: '800',
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    defaultBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    defaultText: {
        fontSize: 10,
        fontWeight: '900',
    },
    addressBody: {
        marginBottom: 20,
    },
    addressLine: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    mobileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    mobileText: {
        fontSize: 14,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 16,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    footerAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerActionText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default MyAddressesScreen;
