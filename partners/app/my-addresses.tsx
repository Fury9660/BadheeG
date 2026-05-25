
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MyAddressesScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchAddresses = async () => {
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id);
            if (data) setAddresses(data);
            setLoading(false);
        };

        fetchAddresses();

        const channel = supabase.channel('my-addresses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'addresses', filter: `user_id=eq.${user.id}` }, () => {
                fetchAddresses();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const handleSetDefault = async (addressId) => {
        if (!user) return;

        // Optimistic update or just wait for refresh? Let's do sequential updates.
        try {
            // 1. Set all to false
            await supabase.from('addresses').update({ isDefault: false }).eq('user_id', user.id);
            // 2. Set target to true
            const { error } = await supabase.from('addresses').update({ isDefault: true }).eq('id', addressId);

            if (error) throw error;
            Alert.alert("Success", "Default address updated.");
        } catch (error: any) {
            Alert.alert("Error", "Could not update default address: " + error.message);
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
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>My Addresses</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
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
                        <View key={address.id} style={[styles.card, { backgroundColor: theme.card, borderColor: address.isDefault ? theme.primary : theme.border }]}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.cardName, { color: theme.text }]}>{address.name}</Text>
                                {address.isDefault ? (
                                    <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>DEFAULT</Text></View>
                                ) : (
                                    <View style={[styles.addressTypeChip, { backgroundColor: theme.chipBg }]}><Text style={[styles.addressTypeText, { color: theme.subtext }]}>{address.type}</Text></View>
                                )}
                            </View>
                            <Text style={[styles.addressText, { color: theme.subtext }]}>{`${address.line1}, ${address.line2 || ''}`.trim()}</Text>
                            <Text style={[styles.addressText, { color: theme.subtext }]}>{`${address.city}, ${address.state} - ${address.pincode}`}</Text>
                            <Text style={[styles.addressText, { color: theme.subtext }]}>Mobile: {address.mobile}</Text>

                            <View style={styles.cardFooter}>
                                <TouchableOpacity style={styles.footerButton} onPress={() => router.push(`/edit-address?addressId=${address.id}`)}><Text style={{ color: theme.text }}>Edit</Text></TouchableOpacity>
                                {!address.isDefault && (
                                    <TouchableOpacity style={styles.footerButton} onPress={() => handleSetDefault(address.id)}><Text style={[styles.footerButtonText, { color: theme.primary }]}>Make as Default</Text></TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ddd', },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
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

export default MyAddressesScreen;
