import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddressType = ['Home', 'Work', 'Other'];

const EditAddressScreen = () => {
    const { isDarkMode, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { addressId } = useLocalSearchParams();

    const [form, setForm] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingPincode, setFetchingPincode] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

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
        background: isDarkMode ? '#000000' : '#F8F9FA',
        text: isDarkMode ? '#FFFFFF' : '#121212',
        card: isDarkMode ? '#111111' : '#FFFFFF',
        subtext: isDarkMode ? '#888888' : '#666666',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        border: isDarkMode ? '#222222' : '#E5E5EA',
        accent: isDarkMode ? '#333333' : '#F1F1F1',
    };

    const handlePincodeChange = async (pincode: string) => {
        setForm((prev: any) => ({ ...prev, pincode }));
        if (pincode.length === 6) {
            setFetchingPincode(true);
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await response.json();
                if (data && data[0].Status === 'Success') {
                    const { District, State } = data[0].PostOffice[0];
                    setForm((prev: any) => ({ ...prev, city: District, state: State }));
                }
            } catch (error) {
                console.error("Pincode error:", error);
            } finally {
                setFetchingPincode(false);
            }
        }
    };

    const handleUpdateAddress = async () => {
        if (!user || !form) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('addresses')
                .update({
                    name: form.name.trim(),
                    mobile: form.mobile.trim(),
                    pincode: form.pincode.trim(),
                    line1: form.line1.trim(),
                    line2: form.line2.trim(),
                    city: form.city.trim(),
                    state: form.state.trim(),
                    type: form.type
                })
                .eq('id', addressId);
            if (error) throw error;
            router.back();
        } catch (e) {
            Alert.alert("Error", "Could not update address.");
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (
        placeholder: string,
        key: string,
        options: any = {}
    ) => {
        const isFocused = focusedField === key;
        return (
            <View style={[
                styles.inputWrapper,
                { borderBottomColor: isFocused ? theme.text : theme.border }
            ]}>
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.subtext}
                    value={form[key]}
                    onChangeText={text => {
                        if (key === 'pincode') handlePincodeChange(text);
                        else setForm((prev: any) => ({ ...prev, [key]: text }));
                    }}
                    onFocus={() => setFocusedField(key)}
                    onBlur={() => setFocusedField(null)}
                    {...options}
                />
                {key === 'pincode' && fetchingPincode && (
                    <ActivityIndicator size="small" color={theme.text} style={styles.inlineLoader} />
                )}
            </View>
        );
    };

    if (!form) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: theme.background }]} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            <View style={[styles.header, { paddingTop: insets.top + 20, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Address</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.sectionTitle}>CONTACT DETAILS</Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {renderInput("Full Name", "name")}
                    {renderInput("Mobile Number", "mobile", { keyboardType: "numeric", maxLength: 10 })}
                </View>

                <Text style={styles.sectionTitle}>ADDRESS DETAILS</Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {renderInput("Pincode", "pincode", { keyboardType: "numeric", maxLength: 6 })}
                    {renderInput("Address Line 1", "line1")}
                    {renderInput("Address Line 2 (Optional)", "line2")}
                    <View style={styles.row}>
                        <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: theme.border }}>
                            {renderInput("City", "city", { editable: !fetchingPincode })}
                        </View>
                        <View style={{ flex: 1 }}>
                            {renderInput("State", "state", { editable: !fetchingPincode })}
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>SAVE AS</Text>
                <View style={styles.typeContainer}>
                    {AddressType.map(type => (
                        <TouchableOpacity 
                            key={type} 
                            style={[
                                styles.typeChip, 
                                { borderColor: theme.border }, 
                                form.type === type && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]} 
                            onPress={() => setForm((prev: any) => ({ ...prev, type }))}
                        >
                            <Text style={[
                                styles.typeText, 
                                { color: theme.text }, 
                                form.type === type && { color: isDarkMode ? '#000' : '#FFF' }
                            ]}>{type.toUpperCase()}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20, backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    onPress={handleUpdateAddress}
                    disabled={loading || fetchingPincode}
                >
                    <Text style={[styles.saveBtnText, { color: isDarkMode ? '#000' : '#FFF' }]}>
                        {loading ? 'UPDATING...' : 'UPDATE ADDRESS'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 12,
        opacity: 0.6,
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 32,
        overflow: 'hidden',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    input: {
        flex: 1,
        padding: 18,
        fontSize: 15,
        fontWeight: '600',
    },
    inlineLoader: {
        paddingRight: 15,
    },
    row: {
        flexDirection: 'row',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    typeChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    saveBtn: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 1,
    },
});

export default EditAddressScreen;
