import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GlobalSettingsScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [commissionRate, setCommissionRate] = useState('');
    const [isTestMode, setIsTestMode] = useState(false);

    const theme = {
        background: isDarkMode ? '#121212' : '#F9FAFB',
        text: isDarkMode ? '#FFFFFF' : '#111827',
        card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        subtext: isDarkMode ? '#9CA3AF' : '#6B7280',
        primary: '#3466F6',
        border: isDarkMode ? '#374151' : '#E5E7EB',
        input: isDarkMode ? '#2D2D2D' : '#F3F4F6',
    };

    const fetchSettings = async () => {
        try {
            const [commRes, testModeRes] = await Promise.all([
                supabase.from('system_settings').select('value').eq('key', 'commission_percentage').single(),
                supabase.from('system_settings').select('value').eq('key', 'delhivery_test_mode').single()
            ]);

            if (commRes.data) {
                setCommissionRate(commRes.data.value);
            }
            if (testModeRes.data) {
                setIsTestMode(testModeRes.data.value === 'true');
            }

            if (commRes.error && commRes.error.code !== 'PGRST116') console.error('Comm error:', commRes.error);
            if (testModeRes.error && testModeRes.error.code !== 'PGRST116') console.error('TestMode error:', testModeRes.error);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        // Validate
        const rate = parseFloat(commissionRate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            Alert.alert('Invalid Input', 'Please enter a valid percentage between 0 and 100.');
            return;
        }

        setSaving(true);
        try {
            const { error: error1 } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'commission_percentage',
                    value: rate.toString(),
                    description: 'Global commission percentage deducted from partner orders'
                });

            if (error1) throw error1;

            const { error: error2 } = await supabase
                .from('system_settings')
                .upsert({
                    key: 'delhivery_test_mode',
                    value: isTestMode ? 'true' : 'false',
                    description: 'Delhivery Partner Test Mode (Sandbox vs Live)'
                });

            if (error2) throw error2;

            Alert.alert('Success', 'Global settings updated successfully.');
            router.back();
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error.message || 'Failed to update settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Global Settings</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.iconCircle}>
                            <Feather name="percent" size={24} color={theme.primary} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Commission Rate</Text>
                        <Text style={[styles.cardDescription, { color: theme.subtext }]}>
                            Set the global commission percentage that will be deducted from every partner order.
                            The remaining amount will be credited to the partner's wallet.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: theme.text }]}>Percentage (%)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.border }]}
                                value={commissionRate}
                                onChangeText={setCommissionRate}
                                placeholder="e.g. 5"
                                placeholderTextColor={theme.subtext}
                                keyboardType="numeric"
                            />
                            <Text style={[styles.inputHelper, { color: theme.subtext }]}>
                                Example: Enter "5" for 5% commission.
                            </Text>
                        </View>
                    </View>

                    {/* Delhivery Settings Card */}
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 20 }]}>
                        <View style={styles.iconCircle}>
                            <Feather name="truck" size={24} color={theme.primary} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Delhivery Partner Mode</Text>
                        <Text style={[styles.cardDescription, { color: theme.subtext }]}>
                            Switch between Test Mode (Sandbox) and Live Mode (Production) for shipment manifestation and tracking.
                        </Text>

                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[
                                    styles.modeButton,
                                    { borderColor: theme.border },
                                    !isTestMode && { backgroundColor: theme.primary, borderColor: theme.primary }
                                ]}
                                onPress={() => setIsTestMode(false)}
                            >
                                <Text style={[styles.modeButtonText, { color: theme.subtext }, !isTestMode && { color: '#ffffff' }]}>Live Mode (Production)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modeButton,
                                    { borderColor: theme.border },
                                    isTestMode && { backgroundColor: '#FF9500', borderColor: '#FF9500' }
                                ]}
                                onPress={() => setIsTestMode(true)}
                            >
                                <Text style={[styles.modeButtonText, { color: theme.subtext }, isTestMode && { color: '#ffffff' }]}>Test Mode (Sandbox)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    card: {
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(52, 102, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    cardDescription: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    inputContainer: { width: '100%' },
    inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    inputHelper: { fontSize: 12, marginTop: 8 },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    saveButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    toggleRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        justifyContent: 'space-between',
        marginTop: 10
    },
    modeButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default GlobalSettingsScreen;
