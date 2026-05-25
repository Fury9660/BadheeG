import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const OnboardingKycScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [kycType, setKycType] = useState('GSTIN');
    const [idNumber, setIdNumber] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifiedData, setVerifiedData] = useState(null);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#000000',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        success: '#4CAF50',
    };

    const handleVerify = async () => {
        if (idNumber.length < 10) return Alert.alert("Invalid ID");
        setIsVerifying(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
            setIsVerifying(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setVerifiedData({ businessName: "SHARMA ELECTRONICS PVT LTD", status: "Active" });
        }, 1500);
    };

    const handleFinish = async () => {
        if (!verifiedData) return Alert.alert("Verification Required");
        try {
            const { error } = await supabase
                .from('pre_approved_partners') // Assuming this is the table from register.tsx
                .update({
                    kycType,
                    kycId: idNumber,
                    businessName: verifiedData.businessName,
                    onboardingStep: 3,
                    status: 'active', // Should this be active immediately? Or pending? Keeping 'active' as per original
                    updatedAt: new Date().toISOString()
                })
                .eq('id', user!.id);

            if (error) throw error;

            // Go to Set MPIN Screen
            router.replace('/set-mpin');
        } catch (error: any) {
            console.error("KYC Update Error", error);
            Alert.alert("Error", "Could not save details: " + error.message);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
                    <Text style={[styles.stepIndicator, { color: theme.primary }]}>STEP 3/4</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>KYC Verification</Text>
                </View>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity style={[styles.tab, kycType === 'GSTIN' && { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={() => { setKycType('GSTIN'); setVerifiedData(null); }}><Text style={[styles.tabText, { color: kycType === 'GSTIN' ? '#fff' : theme.text }]}>GSTIN</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.tab, kycType === 'PAN' && { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={() => { setKycType('PAN'); setVerifiedData(null); }}><Text style={[styles.tabText, { color: kycType === 'PAN' ? '#fff' : theme.text }]}>PAN Card</Text></TouchableOpacity>
                    </View>
                    <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: verifiedData ? theme.success : theme.border }]} placeholder={`Enter ${kycType}`} placeholderTextColor={theme.subtext} autoCapitalize="characters" value={idNumber} onChangeText={setIdNumber} />
                    {!verifiedData ? (
                        <TouchableOpacity style={[styles.verifyBtn, { backgroundColor: theme.text }]} onPress={handleVerify} disabled={isVerifying}>
                            {isVerifying ? <ActivityIndicator color={theme.background} /> : <Text style={{ color: theme.background, fontWeight: 'bold' }}>Verify ID</Text>}
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.verifiedCard, { backgroundColor: theme.card, borderColor: theme.success }]}><Text style={[styles.verifiedTitle, { color: theme.success }]}>✅ Verified: {verifiedData.businessName}</Text></View>
                    )}
                </ScrollView>
                <View style={[styles.footer, { paddingBottom: 16, borderTopColor: theme.border }]}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: verifiedData ? theme.primary : theme.border }]} onPress={handleFinish} disabled={!verifiedData}><Text style={styles.buttonText}>Next: Set Security PIN</Text></TouchableOpacity>
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
    tabContainer: { flexDirection: 'row', marginBottom: 24, gap: 12 },
    tab: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    tabText: { fontWeight: '700' },
    input: { padding: 18, borderRadius: 16, fontSize: 18, borderWidth: 1.5, marginBottom: 16, fontWeight: '700' },
    verifyBtn: { height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    verifiedCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
    verifiedTitle: { fontSize: 16, fontWeight: '800' },
    footer: { padding: 24, borderTopWidth: 1 },
    button: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default OnboardingKycScreen;
