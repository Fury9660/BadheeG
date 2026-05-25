import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddressType = ['Home', 'Work', 'Other'];

const EditAddressScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { addressId } = useLocalSearchParams();

    const [form, setForm] = useState<any>(null);

    useEffect(() => {
        if (user && addressId) {
            const fetchAddress = async () => {
                const { data, error } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('id', addressId)
                    .single();
                if (error) console.error("Fetch error:", error);
                if (data) setForm(data);
            };
            fetchAddress();
        }
    }, [user, addressId]);

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: '#007AFF',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handlePincodeChange = async (pincode: string) => {
        setForm(prev => ({ ...prev, pincode }));
    };

    const handleUpdateAddress = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('addresses')
                .update(form)
                .eq('id', addressId);
            if (error) throw error;

            Alert.alert("Success", "Address updated successfully!");
            router.back();
        } catch (e) {
            Alert.alert("Error", "Could not update address.");
        }
    };

    if (!form) {
        return <View style={styles.container}><Text>Loading...</Text></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Address</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholder="Full Name" placeholderTextColor={theme.subtext} value={form.name} onChangeText={name => setForm(prev => ({ ...prev, name }))} />
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholder="Mobile Number" placeholderTextColor={theme.subtext} keyboardType="numeric" maxLength={10} value={form.mobile} onChangeText={mobile => setForm(prev => ({ ...prev, mobile }))} />
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholder="Pincode" placeholderTextColor={theme.subtext} keyboardType="numeric" maxLength={6} value={form.pincode} onChangeText={handlePincodeChange} />
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholder="Address Line 1" placeholderTextColor={theme.subtext} value={form.line1} onChangeText={line1 => setForm(prev => ({ ...prev, line1 }))} />
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholder="Address Line 2 (Optional)" placeholderTextColor={theme.subtext} value={form.line2} onChangeText={line2 => setForm(prev => ({ ...prev, line2 }))} />
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholder="City" placeholderTextColor={theme.subtext} value={form.city} onChangeText={city => setForm(prev => ({ ...prev, city }))} />
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholder="State" placeholderTextColor={theme.subtext} value={form.state} onChangeText={state => setForm(prev => ({ ...prev, state }))} />

                <Text style={[styles.label, { color: theme.text }]}>Type of Address</Text>
                <View style={styles.addressTypeContainer}>
                    {AddressType.map(type => (
                        <TouchableOpacity key={type} style={[styles.addressTypeChip, form.type === type && { backgroundColor: theme.primary }]} onPress={() => setForm(prev => ({ ...prev, type }))}>
                            <Text style={[styles.addressTypeText, form.type === type && { color: '#fff' }]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
            <View style={[styles.footer, { paddingBottom: insets.bottom + 8, backgroundColor: theme.card }]}>
                <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleUpdateAddress}>
                    <Text style={styles.saveButtonText}>Update Address</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ddd', },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    input: { padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    addressTypeContainer: { flexDirection: 'row', gap: 12 },
    addressTypeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
    addressTypeText: { fontWeight: '600' },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#ddd' },
    saveButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default EditAddressScreen;
