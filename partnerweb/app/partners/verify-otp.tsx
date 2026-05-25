import { supabase } from "@/config/supabaseConfig";
import { useTheme } from "@/store/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OTPScreen = () => {
    const { isDarkMode } = useTheme();

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        text: isDarkMode ? '#fff' : '#121212',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#3466F6',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const router = useRouter();
    const params = useLocalSearchParams();
    const { phoneNumber, intent } = params;
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 375;
    const isTablet = width > 768;
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const otpInputs = useRef<any>([]);
    const [countdown, setCountdown] = useState(30);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = countdown > 0 && setInterval(() => setCountdown(countdown - 1), 1000);
        return () => clearInterval(timer as any);
    }, [countdown]);

    const handleChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpInputs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) return;
        setLoading(true);
        if (Platform.OS !== 'web') Keyboard.dismiss();
        try {
            console.log("Verifying OTP for:", `+91${phoneNumber}`, "with code:", otpCode);

            const { data: { session, user }, error } = await supabase.auth.verifyOtp({
                phone: `+91${phoneNumber}`,
                token: otpCode,
                type: 'sms',
            });

            if (error) throw error;
            if (!user) throw new Error("No user found");

            // Successful verification - instead of doing complex checks here,
            // we redirect to the home page and let the centralized AuthContext + index logic handle it.
            // This prevents race conditions between this page and the main layout.
            router.replace('/');
        } catch (error: any) {
            console.error("Verification Error:", error);
            Alert.alert("Verification Failed", error.message || "The code you entered is invalid.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        if (countdown === 0) {
            setCountdown(30);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.content}>
                <View style={[styles.mainCard, { backgroundColor: theme.card }]}>
                    <View style={[styles.header, { marginTop: isSmallDevice ? 20 : 40, marginBottom: isSmallDevice ? 20 : 40 }]}>
                        <Text style={[styles.title, { color: theme.text, fontSize: isSmallDevice ? 24 : 28 }]}>Seller Verification</Text>
                        <Text style={[styles.subtitle, { color: theme.subtext, fontSize: isSmallDevice ? 14 : 16 }]}>Enter code sent to +91 {phoneNumber}</Text>
                    </View>
                    <View style={styles.otpBoxesContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={el => { otpInputs.current[index] = el; }}
                                style={[styles.otpBox, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, borderWidth: 1.5, ...Platform.select({ web: { outlineStyle: 'none' } }) } as any]}
                                maxLength={1}
                                keyboardType="number-pad"
                                onChangeText={v => handleChange(v, index)}
                                onKeyPress={e => handleKeyPress(e, index)}
                                value={digit}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#000000', opacity: otp.join('').length === 6 ? 1 : 0.6 }]}
                        onPress={handleVerify}
                        disabled={loading || otp.join('').length < 6}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Continue</Text>}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        <Text style={{ color: theme.subtext }}>Didn't receive code?</Text>
                        <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
                            <Text style={{ color: countdown > 0 ? theme.subtext : theme.primary, fontWeight: '700', marginTop: 8 }}>
                                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 24, maxWidth: 500, alignSelf: 'center', width: '100%' },
    mainCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        elevation: 4,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 15px rgba(0,0,0,0.1)',
            },
            ios: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            }
        })
    },
    backButton: { width: 44, height: 44, justifyContent: 'center' },
    header: { alignItems: 'center' },
    title: { fontWeight: '800', marginBottom: 12 },
    subtitle: { textAlign: 'center' },
    otpBoxesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    otpBox: { fontSize: 24, fontWeight: '800', textAlign: 'center', borderRadius: 16, width: '14%', height: 60 },
    button: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    resendContainer: { alignItems: 'center', marginTop: 32, paddingBottom: 20 },
});

export default OTPScreen;
