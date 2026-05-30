import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const [showInput, setShowInput] = useState(true);
    const [intent, setIntent] = useState<'login' | 'reset_password'>('login');
    const [showUserExistsModal, setShowUserExistsModal] = useState(false);

    const { user, partnerStatus, isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        if (!isAuthLoading && user) {
            if (partnerStatus === 'approved') {
                router.replace('/(tabs)/dashboard');
            } else if (partnerStatus === 'pending') {
                router.replace('/approval-pending');
            }
        }
    }, [isAuthLoading, user, partnerStatus]);

    useEffect(() => {
        if (params.intent === 'login') {
            setIntent('login');
            setShowInput(true);
        }
    }, [params.intent]);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#000000',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handleSendOtp = async () => {
        if (phoneNumber.length !== 10) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS !== 'web') Keyboard.dismiss();
        setIsLoading(true);

        try {


            console.log("Sending OTP to:", `+91${phoneNumber}`);
            const { error } = await supabase.auth.signInWithOtp({
                phone: `+91${phoneNumber}`,
            });

            if (error) throw error;

            setIsLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            router.push({
                pathname: '/verify-otp',
                params: { phoneNumber: phoneNumber, intent: intent }
            });

        } catch (error: any) {
            setIsLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("OTP Error:", error);
            Alert.alert("Error", error.message || "Failed to send OTP. Please try again.");
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

            if (!error && data?.user) {
                // Check if user is in Partner table
                const { data: partnerRecord } = await supabase
                    .from('pre_approved_partners')
                    .select('id, status')
                    .ilike('email', email)
                    .maybeSingle();

                if (!partnerRecord) {
                    await supabase.auth.signOut();
                    Alert.alert("Access Denied", "This email is not registered as a Partner.");
                    setIsLoading(false);
                    return;
                }

                // Check Partner Status
                if (partnerRecord.status === 'pending') {
                    router.replace('/approval-pending');
                    return;
                } else if (partnerRecord.status === 'rejected' || partnerRecord.status === 'suspended') {
                    const statusMsg = partnerRecord.status === 'rejected' ? "rejected" : "suspended";
                    await supabase.auth.signOut();
                    Alert.alert("Account Restricted", `Your partner account has been ${statusMsg}. Please contact support.`);
                    setIsLoading(false);
                    return;
                }

                await AsyncStorage.setItem('user_role', 'partner');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/(tabs)/dashboard');
                return;
            }

            // 2. If Login fails, check legacy DB for migration
            if (error && (error.message.toLowerCase().includes("invalid login credentials") || error.message.toLowerCase().includes("email not confirmed"))) {
                const { data: partner } = await supabase
                    .from('pre_approved_partners')
                    .select('*')
                    .eq('email', email)
                    .eq('password', password)
                    .maybeSingle();

                if (partner) {
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: partner.owner_name,
                                role: 'partner'
                            }
                        }
                    });

                    if (signUpError) throw signUpError;

                    if (signUpData.session) {
                        await AsyncStorage.setItem('user_role', 'partner');
                        await supabase
                            .from('pre_approved_partners')
                            .update({ id: signUpData.user?.id })
                            .eq('email', email);

                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        router.replace('/(tabs)/dashboard');
                        return;
                    } else {
                        Alert.alert("Account Created", "Please check your email to verify your account.");
                        return;
                    }
                }
            }

            throw error || new Error("Invalid credentials");

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
            <SafeAreaView style={{ flex: 1, width: '100%' }}>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1, width: '100%' }}
                >
                    <ScrollView
                        style={{ flex: 1, width: '100%' }}
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View entering={FadeIn.duration(1000)} style={[styles.content, { padding: width < 300 ? 12 : isSmallDevice ? 20 : 24, marginHorizontal: 'auto' }]}>


                                <Animated.View entering={FadeInUp.delay(300).springify()} style={[styles.mainCard, { backgroundColor: theme.card, padding: width < 300 ? 16 : 24 }]}>
                                    <Text style={[styles.sectionTitle, { color: theme.text, fontSize: width < 300 ? 20 : 24 }]}>
                                        Welcome Back
                                    </Text>
                                    <Text style={[styles.sectionSubtitle, { color: theme.subtext, fontSize: width < 300 ? 14 : 16 }]}>
                                        {intent === 'reset_password'
                                            ? "Enter your registered mobile number to reset password"
                                            : "Login with your preferred method"}
                                    </Text>

                                    {/* Tabs for Login Method (Only for Login Intent) */}
                                    {intent === 'login' && (
                                        <View style={{ flexDirection: 'row', marginBottom: width < 300 ? 16 : 24, padding: 4, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                            <TouchableOpacity
                                                style={{ flex: 1, paddingVertical: width < 300 ? 8 : 10, alignItems: 'center', borderRadius: 8, backgroundColor: loginMethod === 'phone' ? theme.text : 'transparent' }}
                                                onPress={() => setLoginMethod('phone')}
                                            >
                                                <Text style={{ fontWeight: '700', color: loginMethod === 'phone' ? theme.background : theme.subtext, fontSize: width < 300 ? 12 : 14 }}>Phone</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{ flex: 1, paddingVertical: width < 300 ? 8 : 10, alignItems: 'center', borderRadius: 8, backgroundColor: loginMethod === 'email' ? theme.text : 'transparent' }}
                                                onPress={() => setLoginMethod('email')}
                                            >
                                                <Text style={{ fontWeight: '700', color: loginMethod === 'email' ? theme.background : theme.subtext, fontSize: width < 300 ? 12 : 14 }}>Email</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {(loginMethod === 'phone') ? (
                                        <View style={[styles.phoneInputContainer, { backgroundColor: theme.card, borderColor: theme.border, height: width < 300 ? 54 : 64, paddingHorizontal: width < 300 ? 12 : 20, marginBottom: width < 300 ? 16 : 24 }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: width < 300 ? 4 : 8 }}>
                                                <Text style={{ fontSize: width < 300 ? 16 : 20 }}>🇮🇳</Text>
                                                <Text style={[styles.countryCode, { color: theme.text, marginRight: 0, fontSize: width < 300 ? 14 : 18 }]}>+91</Text>
                                            </View>
                                            <TextInput
                                                style={[styles.input, { color: theme.text, marginLeft: width < 300 ? 8 : 12, fontSize: width < 300 ? 16 : 20, ...Platform.select({ web: { outlineStyle: 'none' } }) } as any]}
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
                                            <TouchableOpacity
                                                style={{ alignSelf: 'flex-end', marginTop: 4 }}
                                                onPress={() => {
                                                    setIntent('reset_password');
                                                    setLoginMethod('phone');
                                                    Haptics.selectionAsync();
                                                }}
                                            >
                                                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>Forgot Password?</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: theme.text, opacity: isLoading ? 0.7 : 1, height: width < 300 ? 50 : 60 }]}
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
                                                <Text style={[styles.buttonText, { color: theme.background, fontSize: width < 300 ? 16 : 18 }]}>Processing...</Text>
                                            </View>
                                        ) : (
                                            <Text style={[styles.buttonText, { color: theme.background, fontSize: width < 300 ? 16 : 18 }]}>
                                                {intent === 'login' && loginMethod === 'email'
                                                    ? 'Login'
                                                    : intent === 'reset_password'
                                                        ? 'Send Reset OTP'
                                                        : 'Get OTP'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>

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
                            <Text style={[styles.buttonText, { color: theme.background }]}>Login Now</Text>
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
    container: { flex: 1, width: '100%', height: '100%' },
    content: { width: '100%', maxWidth: 450, alignSelf: 'center' },
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
    button: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
    buttonText: { fontSize: 18, fontWeight: '800' },
});

export default PartnerLoginScreen;
