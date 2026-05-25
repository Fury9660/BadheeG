import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const QuickStartScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 375;

    const [mobileNumber, setMobileNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#3466F6',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handleSendOtp = async () => {
        if (!mobileNumber || mobileNumber.length !== 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
            return;
        }

        setIsLoading(true);
        Keyboard.dismiss();

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: `+91${mobileNumber}`,
                options: {
                    channel: 'whatsapp',
                }
            });

            if (error) throw error;

            router.push({
                pathname: '/partners/verify-otp',
                params: { phoneNumber: mobileNumber, intent: 'register' }
            });

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">

                    <View style={[styles.content, { padding: isSmallDevice ? 24 : 32 }]}>

                        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
                            <Feather name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>

                        <Text style={[styles.title, { color: theme.text }]}>Partner Registration</Text>
                        <Text style={[styles.subtitle, { color: theme.subtext }]}>
                            Enter your mobile number to verify and get started.
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginRight: 8 }}>+91</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="Mobile Number"
                                placeholderTextColor={theme.subtext}
                                keyboardType="number-pad"
                                maxLength={10}
                                value={mobileNumber}
                                onChangeText={(t) => setMobileNumber(t.replace(/[^0-9]/g, ''))}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 }]}
                            onPress={handleSendOtp}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Get OTP</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={{ marginTop: 24, alignSelf: 'center' }} onPress={() => router.push('/partners/login')}>
                            <Text style={{ color: theme.subtext }}>
                                Already have an account? <Text style={{ color: theme.primary, fontWeight: '700' }}>Login</Text>
                            </Text>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { width: '100%', maxWidth: 450, alignSelf: 'center' },
    title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
    subtitle: { fontSize: 16, marginBottom: 32, lineHeight: 24 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 24, height: 60 },
    input: { flex: 1, fontSize: 18, fontWeight: '600' },
    button: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#3466F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default QuickStartScreen;
