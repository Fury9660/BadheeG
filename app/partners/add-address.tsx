import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddressType = ['Home', 'Work', 'Other'];

const AddAddressScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [form, setForm] = useState({ name: '', mobile: '', pincode: '', line1: '', line2: '', city: '', state: '', type: 'Home' });
    const [loading, setLoading] = useState(false);

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
        if (pincode.length === 6) {
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await response.json();
                if (data && data[0].Status === 'Success') {
                    const { District, State } = data[0].PostOffice[0];
                    setForm(prev => ({ ...prev, city: District, state: State }));
                } else {
                    Alert.alert('Error', 'Invalid Pincode');
                }
            } catch (error) {
                Alert.alert('Error', 'Could not fetch pincode details.');
            }
        }
    };

    const handleSaveAddress = async () => {
        if (!user) return Alert.alert("Error", "You must be logged in to save an address.");

        // Basic Validation
        if (!form.name.trim() || !form.mobile.trim() || !form.line1.trim() || !form.pincode.trim()) {
            return Alert.alert("Required Fields", "Please fill in Name, Mobile, Pincode and Address Line 1.");
        }

        if (form.mobile.length !== 10) {
            return Alert.alert("Invalid Mobile", "Please enter a valid 10-digit mobile number.");
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('addresses').insert({
                user_id: user.id,
                name: form.name.trim(),
                mobile: form.mobile.trim(),
                pincode: form.pincode.trim(),
                line1: form.line1.trim(),
                line2: form.line2.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                type: form.type,
                is_default: false
            });

            if (error) throw error;

            Alert.alert("Success", "Address saved successfully!");
            router.back();
        } catch (e: any) {
            console.error("Error adding address: ", e.message || e);
            Alert.alert("Error", e.message || "Could not save address. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Add New Address</Text>
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
                        <TouchableOpacity key={type} style={[styles.addressTypeChip, { borderColor: theme.border }, form.type === type && { backgroundColor: theme.primary }]} onPress={() => setForm(prev => ({ ...prev, type }))}>
                            <Text style={[styles.addressTypeText, { color: theme.text }, form.type === type && { color: '#fff' }]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
            <View style={[styles.footer, { paddingBottom: insets.bottom + 8, backgroundColor: theme.card }]}>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleSaveAddress}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Address'}</Text>
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
    addressTypeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    addressTypeText: { fontWeight: '600' },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#ddd' },
    saveButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AddAddressScreen;
