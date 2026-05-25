import { supabase } from '@/config/supabaseConfig';
import { storage } from '@/lib/storage'; // Check if partnerweb has storage lib, otherwise use AsyncStorage directly
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const PartnerLoginScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isSmallDevice = width < 375;
    const isTablet = width > 768;

    const [phoneNumber, setPhoneNumber] = useState('');
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const params = useLocalSearchParams();
    const [showInput, setShowInput] = useState(false);
    const [intent, setIntent] = useState<'login' | 'register'>('login');
    const [showUserExistsModal, setShowUserExistsModal] = useState(false);

    const { user, partnerStatus, isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        if (!isAuthLoading && user && partnerStatus) {
            const status = partnerStatus.toLowerCase();
            if (status === 'approved' || status === 'active') {
                router.replace('/partners/dashboard');
            } else if (status === 'pending') {
                router.replace('/partners/approval-pending');
            } else if (status === 'unregistered') {
                router.replace({
                    pathname: '/partners/register',
                    params: { phoneNumber: user.phone, uid: user.id }
                });
            }
        }
    }, [user, partnerStatus, isAuthLoading, router]);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#3466F6',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };





    const isRedirecting = user && (
        partnerStatus === null ||
        ['approved', 'active', 'pending', 'unregistered'].includes(partnerStatus.toLowerCase())
    );

    if (isAuthLoading || (user && isRedirecting)) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Removed duplicate theme declaration

    const handleSendOtp = async () => {
        if (phoneNumber.length !== 10) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS !== 'web') Keyboard.dismiss();
        setIsLoading(true);

        try {
            // Check if user exists before sending OTP (Only for Register Intent)
            if (intent === 'register') {
                const { data: existingUser } = await supabase
                    .from('pre_approved_partners')
                    .select('id')
                    .eq('mobile_number', phoneNumber)
                    .single();

                if (existingUser) {
                    setIsLoading(false);
                    setShowUserExistsModal(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    return;
                }
            }

            console.log("Sending OTP to:", `+91${phoneNumber}`);

            // Add timeout for Supabase call
            const otpPromise = supabase.auth.signInWithOtp({
                phone: `+91${phoneNumber}`,
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out. Please check your internet and try again.")), 15000)
            );

            const { error } = await Promise.race([otpPromise, timeoutPromise]) as any;

            if (error) throw error;

            console.log("OTP sent successfully");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            router.push({
                pathname: '/partners/verify-otp',
                params: { phoneNumber: phoneNumber, intent: intent }
            });

        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("OTP Error:", error);
            Alert.alert("Error", error.message || "Failed to send OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async () => {
        if (!email || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert("Error", "Please enter email and password.");
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS !== 'web') Keyboard.dismiss();
        setIsLoading(true);

        try {
            // 1. Try to Login normally
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            const { data: partnerRecords } = await supabase
                .from('pre_approved_partners')
                .select('id, status')
                .ilike('email', email)
                .limit(1);

            const partnerRecord = partnerRecords && partnerRecords.length > 0 ? partnerRecords[0] : null;

            if (!partnerRecord) {
                await supabase.auth.signOut();
                Alert.alert("Access Denied", "This email is not registered as a Partner.");
                setIsLoading(false);
                return;
            }

            // Check Partner Status
            if (partnerRecord.status === 'pending') {
                // await supabase.auth.signOut(); // Optional: Keep session but restrict access? Better to redirect.
                // Actually, if we sign out they can't see the page potentially if it's protected. 
                // But if we keep them signed in, we need to handle the redirect in _layout or here.
                // Let's keep them signed in but redirect to approval pending.
                // The _layout should also handle this but manual redirect is safer here.
                router.replace('/partners/approval-pending');
                return;
            } else if (partnerRecord.status === 'rejected') {
                await supabase.auth.signOut();
                Alert.alert("Account Rejected", "Your partner account has been rejected. Please contact support.");
                setIsLoading(false);
                return;
            } else if (partnerRecord.status === 'suspended') {
                await supabase.auth.signOut();
                Alert.alert("Account Suspended", "Your partner account has been suspended. Please contact support.");
                setIsLoading(false);
                return;
            }

            await storage.setItem('user_role', 'partner');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/partners/dashboard');
            return;


        } catch (error: any) {
            setIsLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("Login Error:", error);
            Alert.alert("Login Failed", error.message || "Invalid credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={isDarkMode ? ['#000000', '#1A1A1A'] : ['#FFFFFF', '#F5F7FA']}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1, width: '100%' }}
                >
                    <ScrollView
                        style={{ flex: 1, width: '100%' }}
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'center',
                            paddingHorizontal: Math.max((width - 450) / 2, 16),
                            paddingVertical: 24,
                        }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            entering={FadeIn.duration(1000)}
                            style={{ width: '100%' }}
                        >

                            {!showInput ? (
                                <Animated.View entering={FadeInUp.delay(300).springify()} style={{ gap: 20 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setIntent('register');
                                            setShowInput(true);
                                        }}
                                    >
                                        <LinearGradient
                                            colors={isDarkMode ? ['#1e3c72', '#2a5298'] : ['#eef2ff', '#e0e7ff']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={[styles.card, { borderColor: theme.primary, borderWidth: 1 }]}
                                        >
                                            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff' }]}>
                                                <Feather name="user-plus" size={32} color={theme.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.cardTitle, { color: theme.text }]}>Register New Partner</Text>
                                                <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Create a new showroom account</Text>
                                            </View>
                                            <Feather name="chevron-right" size={24} color={theme.subtext} />
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            setIntent('login');
                                            setShowInput(true);
                                            Haptics.selectionAsync();
                                        }}
                                    >
                                        <LinearGradient
                                            colors={isDarkMode ? ['#1A1A1A', '#222'] : ['#fff', '#f9f9f9']}
                                            style={[styles.card, { borderColor: theme.border, borderWidth: 1 }]}
                                        >
                                            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f0f0f0' }]}>
                                                <Feather name="log-in" size={32} color={theme.text} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.cardTitle, { color: theme.text }]}>Existing Partner</Text>
                                                <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Login to your dashboard</Text>
                                            </View>
                                            <Feather name="chevron-right" size={24} color={theme.subtext} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </Animated.View>
                            ) : (
                                <Animated.View entering={FadeInUp.delay(300).springify()} style={[styles.mainCard, { backgroundColor: theme.card }]}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                        {intent === 'register' ? "Create Account" : "Welcome Back"}
                                    </Text>
                                    <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>
                                        {intent === 'register'
                                            ? "Enter your mobile number to get started"
                                            : "Login with your preferred method"}
                                    </Text>

                                    {/* Tabs for Login Method (Only for Login Intent) */}
                                    {intent === 'login' && (
                                        <View style={{ flexDirection: 'row', marginBottom: 24, padding: 4, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                            <TouchableOpacity
                                                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: loginMethod === 'phone' ? '#000000' : 'transparent' }}
                                                onPress={() => setLoginMethod('phone')}
                                            >
                                                <Text style={{ fontWeight: '700', color: loginMethod === 'phone' ? '#fff' : theme.subtext }}>Phone</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: 'transparent' }}
                                                onPress={() => Alert.alert("Coming Soon", "Email Login Coming Soon!")}
                                            >
                                                <Text style={{ fontWeight: '700', color: theme.subtext }}>Email</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {(intent === 'register' || loginMethod === 'phone') ? (
                                        <View style={[styles.phoneInputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={{ fontSize: 20 }}>🇮🇳</Text>
                                                <Text style={[styles.countryCode, { color: theme.text, marginRight: 0 }]}>+91</Text>
                                            </View>
                                            <TextInput
                                                style={[styles.input, { color: theme.text, marginLeft: 12, ...Platform.select({ web: { outlineStyle: 'none' } }) } as any]}
                                                placeholder="Mobile Number"
                                                placeholderTextColor={theme.subtext}
                                                value={phoneNumber}
                                                onChangeText={(text) => {
                                                    setPhoneNumber(text.replace(/[^0-9]/g, ''));
                                                    if (isLoading) setIsLoading(false);
                                                }}
                                                keyboardType="phone-pad"
                                                maxLength={10}
                                                editable={!isLoading}
                                                autoFocus={true}
                                            />
                                        </View>
                                    ) : (
                                        <View style={{ gap: 16, marginBottom: 24 }}>
                                            <TextInput
                                                style={[styles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, ...Platform.select({ web: { outlineStyle: 'none' } }) } as any]}
                                                placeholder="Email Address"
                                                placeholderTextColor={theme.subtext}
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                            <View style={[styles.passwordContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                                <TextInput
                                                    style={[styles.inputField, { flex: 1, backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, ...Platform.select({ web: { outlineStyle: 'none' } }) } as any]}
                                                    placeholder="Password"
                                                    placeholderTextColor={theme.subtext}
                                                    value={password}
                                                    onChangeText={setPassword}
                                                    secureTextEntry={!isPasswordVisible}
                                                />
                                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                                    <Feather name={isPasswordVisible ? "eye" : "eye-off"} size={20} color={theme.subtext} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: '#000000', opacity: isLoading ? 0.7 : 1 }]}
                                        onPress={() => {
                                            if (intent === 'login' && loginMethod === 'email') {
                                                handleEmailLogin();
                                            } else {
                                                handleSendOtp();
                                            }
                                        }}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                                                <Text style={styles.buttonText}>Processing...</Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.buttonText}>
                                                {intent === 'login' && loginMethod === 'email' ? 'Login' : 'Get OTP'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* User Exists Modal */}
            <Modal
                visible={showUserExistsModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUserExistsModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Animated.View entering={FadeInUp.springify()} style={[styles.mainCard, { backgroundColor: theme.card, maxWidth: 360 }]}>
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                                <Feather name="user-check" size={32} color={theme.primary} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'center', fontSize: 22 }]}>Account Exists</Text>
                            <Text style={[styles.sectionSubtitle, { color: theme.subtext, textAlign: 'center', marginBottom: 0 }]}>
                                The mobile number +91 {phoneNumber} is already registered as a partner.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.primary, marginBottom: 12, height: 50, borderRadius: 12 }]}
                            onPress={() => {
                                setShowUserExistsModal(false);
                                setIntent('login');
                                setLoginMethod('phone');
                            }}
                        >
                            <Text style={styles.buttonText}>Login Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border, height: 50, borderRadius: 12, shadowOpacity: 0, elevation: 0 }]}
                            onPress={() => setShowUserExistsModal(false)}
                        >
                            <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        width: '100%',
        maxWidth: 450,
        alignSelf: 'center',
    },
    header: { alignItems: 'center' },
    logo: { width: 180, height: 60, marginBottom: 12 },
    title: { fontWeight: '900', marginBottom: 6, letterSpacing: -1, textAlign: 'center' },
    subtitle: { fontWeight: '600', opacity: 0.8, textAlign: 'center' },

    // Card Styles
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
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
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4
    },
    cardSubtitle: {
        fontSize: 14
    },

    // Input Styles
    sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    sectionSubtitle: { fontSize: 16, marginBottom: 24 },
    phoneInputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 20, marginBottom: 24, height: 64 },
    countryCode: { fontSize: 18, fontWeight: '800', marginRight: 12 },
    input: { flex: 1, fontSize: 20, fontWeight: '600' },
    inputField: { padding: 18, borderRadius: 16, fontSize: 16, borderWidth: 1.5 },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 18 },
    button: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#3466F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});

export default PartnerLoginScreen;
