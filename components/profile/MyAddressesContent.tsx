
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

const MyAddressesContent = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWeb = width > 768;
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAddresses = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id);
        if (error) console.error("Fetch error:", error);
        if (data) setAddresses(data);
        setLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchAddresses();

            const channel = supabase
                .channel('address_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'addresses',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    fetchAddresses();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const handleSetDefault = async (addressId: string) => {
        if (!user) return;
        try {
            // Set all addresses for this user to is_default: false
            const { error: resetError } = await supabase
                .from('addresses')
                .update({ is_default: false })
                .eq('user_id', user.id);
            if (resetError) throw resetError;

            // Set the selected address to is_default: true
            const { error: setError } = await supabase
                .from('addresses')
                .update({ is_default: true })
                .eq('id', addressId);
            if (setError) throw setError;

            Alert.alert("Success", "Default address updated.");
        } catch (error) {
            console.error("Default update error:", error);
            Alert.alert("Error", "Could not update default address.");
        }
    };

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: '#007AFF',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        chipBg: isDarkMode ? '#2C2C2C' : '#eee',
    };

    return (
        <ScrollView contentContainerStyle={[styles.content, isWeb && { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
            <View style={{ width: '100%', maxWidth: 800 }}>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/add-address')}>
                    <Feather name="plus" size={20} color={theme.primary} />
                    <Text style={[styles.addButtonText, { color: theme.primary }]}>Add a new address</Text>
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.primary} />
                ) : addresses.length === 0 ? (
                    <Text style={{ color: theme.subtext, textAlign: 'center' }}>You have no saved addresses.</Text>
                ) : (
                    addresses.map(address => (
                        <View key={address.id} style={[styles.card, { backgroundColor: theme.card, borderColor: address.is_default ? theme.primary : theme.border }]}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.cardName, { color: theme.text }]}>{address.name}</Text>
                                {address.is_default ? (
                                    <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>DEFAULT</Text></View>
                                ) : (
                                    <View style={[styles.addressTypeChip, { backgroundColor: theme.chipBg }]}><Text style={[styles.addressTypeText, { color: theme.subtext }]}>{address.type}</Text></View>
                                )}
                            </View>
                            <Text style={[styles.addressText, { color: theme.subtext }]}>{`${address.line1}, ${address.line2 || ''}`.trim()}</Text>
                            <Text style={[styles.addressText, { color: theme.subtext }]}>{`${address.city}, ${address.state} - ${address.pincode}`}</Text>
                            <Text style={[styles.addressText, { color: theme.subtext }]}>Mobile: {address.mobile}</Text>

                            <View style={styles.cardFooter}>
                                <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/edit-address?addressId=${address.id}` as any)}><Text style={{ color: theme.text }}>Edit</Text></TouchableOpacity>
                                {!address.is_default && (
                                    <TouchableOpacity style={styles.footerButton} onPress={() => handleSetDefault(address.id)}><Text style={[styles.footerButtonText, { color: theme.primary }]}>Make as Default</Text></TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: { padding: 20 },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24, },
    addButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardName: { fontSize: 16, fontWeight: 'bold' },
    addressTypeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    addressTypeText: { fontSize: 12, fontWeight: '600' },
    addressText: { fontSize: 14, lineHeight: 22, color: '#666', marginBottom: 2 },
    defaultBadge: { backgroundColor: '#E5F3FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, },
    defaultBadgeText: { color: '#007AFF', fontSize: 12, fontWeight: 'bold' },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, gap: 24, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16, },
    footerButton: {},
    footerButtonText: { fontSize: 14, fontWeight: '600' },
});

export default MyAddressesContent;
