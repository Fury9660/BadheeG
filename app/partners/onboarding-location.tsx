import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const OnboardingLocationScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [form, setForm] = useState({ line1: '', line2: '', city: '', state: '', pincode: '' });
    const [loading, setLoading] = useState(false);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#3466F6',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handleAutoDetect = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location.');
                setLoading(false);
                return;
            }
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            let address = await Location.reverseGeocodeAsync(location.coords);
            if (address && address[0]) {
                const addr = address[0];
                setForm({
                    line1: addr.name || addr.street || '',
                    line2: addr.district || addr.subregion || '',
                    city: addr.city || addr.subregion || '',
                    state: addr.region || '',
                    pincode: addr.postalCode || '',
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            Alert.alert("Error", "Could not fetch location.");
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = async () => {
        if (!form.line1 || !form.city || !form.state || !form.pincode) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert("Incomplete Address", "Fill all fields.");
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { error } = await supabase
                .from('partners')
                .update({
                    location: form, // Assuming location is a jsonb field
                    onboarding_step: 2
                })
                .eq('id', user.id);
            if (error) throw error;
            router.push('/onboarding-kyc');
        } catch (error) {
            Alert.alert("Error", "Could not save location.");
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
                    <Text style={[styles.stepIndicator, { color: theme.primary }]}>STEP 2/3</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Store Location</Text>
                </View>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={[styles.autoDetectButton, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]} onPress={handleAutoDetect} disabled={loading}>
                        {loading ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.autoDetectButtonText, { color: theme.primary }]}>📍 Use Current Location</Text>}
                    </TouchableOpacity>
                    <View style={styles.inputGroup}>
                        <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Address Line 1" placeholderTextColor={theme.subtext} value={form.line1} onChangeText={line1 => setForm(p => ({ ...p, line1 }))} />
                        <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Address Line 2" placeholderTextColor={theme.subtext} value={form.line2} onChangeText={line2 => setForm(p => ({ ...p, line2 }))} />
                        <View style={styles.row}>
                            <TextInput style={[styles.input, { flex: 1, backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginRight: 8 }]} placeholder="City" placeholderTextColor={theme.subtext} value={form.city} onChangeText={city => setForm(p => ({ ...p, city }))} />
                            <TextInput style={[styles.input, { flex: 1, backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Pincode" placeholderTextColor={theme.subtext} value={form.pincode} keyboardType="numeric" maxLength={6} onChangeText={pincode => setForm(p => ({ ...p, pincode }))} />
                        </View>
                        <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="State" placeholderTextColor={theme.subtext} value={form.state} onChangeText={state => setForm(p => ({ ...p, state }))} />
                    </View>
                </ScrollView>
                <View style={[styles.footer, { paddingBottom: 16, borderTopColor: theme.border }]}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleContinue}><Text style={styles.buttonText}>Next Step</Text></TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 24, paddingTop: 10 },
    backBtn: { marginBottom: 16 },
    stepIndicator: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    headerTitle: { fontSize: 28, fontWeight: '800' },
    content: { padding: 24, paddingTop: 0 },
    autoDetectButton: { height: 60, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    autoDetectButtonText: { fontSize: 16, fontWeight: '700' },
    inputGroup: { gap: 12 },
    input: { padding: 18, borderRadius: 16, fontSize: 16, borderWidth: 1.5 },
    row: { flexDirection: 'row' },
    footer: { padding: 24, borderTopWidth: 1 },
    button: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default OnboardingLocationScreen;
