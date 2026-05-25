
import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
    Image
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

interface LoginDrawerProps {
    isVisible: boolean;
    onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85;

const LoginDrawer = ({ isVisible, onClose }: LoginDrawerProps) => {
    const { isDarkMode } = useTheme();
    const router = useRouter();

    // Auth State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const [isLoading, setIsLoading] = useState(false);

    // New User State
    const [isNewUser, setIsNewUser] = useState(false);
    const [fullName, setFullName] = useState('');

    const otpInputs = useRef<any>([]);

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isDesktop = windowWidth > 768;

    // Animation
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withTiming(0, {
                duration: 500,
                easing: Easing.out(Easing.cubic)
            });
        } else {
            opacity.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(isDesktop ? -20 : SCREEN_HEIGHT, { duration: 300 });
        }
    }, [isVisible, isDesktop]);

    const handleClose = () => {
        setPhoneNumber('');
        setOtpSent(false);
        setOtp(new Array(6).fill(''));
        setIsNewUser(false);
        setFullName('');
        onClose();
    };

    const sendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            return Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
        }

        Keyboard.dismiss();
        setIsLoading(true);

        try {
            await AsyncStorage.setItem('user_role', 'customer');

            const { error } = await supabase.auth.signInWithOtp({
                phone: `+91${phoneNumber}`,
            });

            if (error) throw error;

            setOtpSent(true);
            Alert.alert('Success', 'OTP Sent!');
        } catch (error: any) {
            console.error("OTP Send Error:", error);
            Alert.alert('Error', error.message || 'Could not send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmOtp = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            return Alert.alert('Error', 'Please enter a valid 6-digit OTP.');
        }

        setIsLoading(true);

        try {
            const { data: { session, user }, error } = await supabase.auth.verifyOtp({
                phone: `+91${phoneNumber}`,
                token: code,
                type: 'sms',
            });

            if (error) throw error;
            if (!session || !user) throw new Error("Verification failed");

            // Check if user exists in public.users table or needs name
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('name')
                .eq('id', user.id)
                .single();

            // If no profile or no name, treat as new user
            if (!profile || !profile.name) {
                setIsNewUser(true);
            } else {
                handleClose();
            }

        } catch (error: any) {
            console.error("OTP Confirm Error:", error);
            Alert.alert('Error', error.message || 'Invalid OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameSubmit = async () => {
        if (!fullName.trim()) {
            return Alert.alert('Error', 'Please enter your full name.');
        }

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No authenticated user found");

            const updates = {
                id: user.id,
                name: fullName.trim(),
                phoneNumber: user.phone,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('users')
                .upsert(updates);

            if (error) throw error;

            handleClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save name');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = () => {
        if (isNewUser) {
            handleNameSubmit();
        } else {
            otpSent ? confirmOtp() : sendOtp();
        }
    }

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 5) otpInputs.current[index + 1]?.focus();
        if (newOtp.join('').length === 6) Keyboard.dismiss();
    };

    const handleOtpBackspace = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && index > 0 && !otp[index]) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const animatedDrawerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    if (!isVisible && opacity.value === 0) return null;

    const theme = {
        background: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        subtext: isDarkMode ? '#8E8E93' : '#8E8E93',
        inputBg: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        border: isDarkMode ? '#38383A' : '#E5E5EA',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        btnText: isDarkMode ? '#000000' : '#FFFFFF',
    };

    return (
        <Modal transparent visible={isVisible} animationType="none" onRequestClose={handleClose}>
            <View style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                    <Pressable style={styles.backdropPressable} onPress={handleClose} />
                </Animated.View>

                {/* Drawer / Modal */}
                <Animated.View style={[
                    styles.drawer,
                    isDesktop ? styles.drawerDesktop : { height: DRAWER_HEIGHT, padding: 0, backgroundColor: 'transparent' },
                    animatedDrawerStyle
                ]}>
                    {isDesktop ? (
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            {/* Left Column (Desktop Only) */}
                            <View style={{ flex: 1, backgroundColor: '#0066FF', padding: 40, justifyContent: 'space-between', borderTopLeftRadius: 24, borderBottomLeftRadius: 24 }}>
                                <View>
                                    <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFF', lineHeight: 48 }}>
                                        Elevate Your{'\n'}Living Space.
                                    </Text>
                                    <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 16, lineHeight: 24 }}>
                                        Discover premium luxury furniture that transforms your home into a masterpiece.
                                    </Text>
                                </View>
                                {/* Illustration */}
                                <View style={{ alignItems: 'center', justifyContent: 'flex-end', flex: 1, marginTop: 20 }}>
                                    <View style={{ width: 300, height: 300, overflow: 'hidden', borderRadius: 150 }}>
                                        <Text style={{ display: 'none' }}>Placeholder image</Text>
                                        <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                    </View>
                                    <View style={{ position: 'absolute', bottom: 0, width: 350, height: 350 }}>
                                        <Image source={require('../assets/images/badheeg_login_illustration.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                                    </View>
                                </View>
                            </View>

                            {/* Right Column (Form) */}
                            <View style={{ flex: 1, padding: 40, backgroundColor: theme.background, justifyContent: 'center' }}>
                                {/* Close Button for Desktop */}
                                <TouchableOpacity onPress={handleClose} style={{ position: 'absolute', top: 20, right: 20, padding: 8 }}>
                                    <Feather name="x" size={24} color={theme.text} />
                                </TouchableOpacity>

                                {/* Branding & Title */}
                                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                        <View style={{ width: 40, height: 40, backgroundColor: '#0066FF', borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                                            <Feather name="shopping-cart" size={20} color="#FFF" />
                                        </View>
                                        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, marginLeft: 12 }}>Badhee G.</Text>
                                    </View>
                                    <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, marginBottom: 8 }}>Welcome Back</Text>
                                    <Text style={{ fontSize: 14, color: theme.subtext }}>{isNewUser ? "Tell us your name" : (!otpSent ? "Please login to your account" : `Enter OTP sent to +91 ${phoneNumber}`)}</Text>
                                </View>

                                {/* Form Fields */}
                                {isNewUser ? (
                                    <View style={[styles.inputContainerDesktop, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                        <TextInput
                                            placeholder="Full Name"
                                            placeholderTextColor={theme.subtext}
                                            value={fullName}
                                            onChangeText={setFullName}
                                            autoCapitalize="words"
                                            underlineColorAndroid="transparent"
                                            selectionColor={theme.primary}
                                            style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                        />
                                    </View>
                                ) : !otpSent ? (
                                    <View style={[styles.inputContainerDesktop, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                        <TextInput
                                            placeholder="Mobile Number"
                                            placeholderTextColor={theme.subtext}
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            underlineColorAndroid="transparent"
                                            selectionColor={theme.primary}
                                            style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                        />
                                    </View>
                                ) : (
                                    <View style={styles.otpSection}>
                                        <View style={styles.otpBoxesContainer}>
                                            {otp.map((digit, index) => (
                                                <TextInput
                                                    key={index}
                                                    ref={ref => { otpInputs.current[index] = ref; }}
                                                    style={[styles.otpBox, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                                    maxLength={1}
                                                    keyboardType="number-pad"
                                                    onChangeText={(text) => handleOtpChange(text, index)}
                                                    onKeyPress={(e) => handleOtpBackspace(e, index)}
                                                    value={digit}
                                                    underlineColorAndroid="transparent"
                                                    selectionColor={theme.primary}
                                                />
                                            ))}
                                        </View>
                                        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setOtpSent(false)}>
                                            <Text style={{ color: '#0066FF', fontWeight: '600' }}>Edit Number?</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.actionBtnDesktop, { opacity: isLoading ? 0.7 : 1 }]}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>{isNewUser ? 'Continue' : (otpSent ? 'Confirm & Login' : 'Login')}</Text>}
                                </TouchableOpacity>


                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            {/* Illustration / Branding Header (Mobile) */}
                            <View style={{ height: windowHeight * 0.4, backgroundColor: '#0066FF', padding: 24, justifyContent: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
                                <View style={{ zIndex: 2, maxWidth: '65%' }}>
                                    <Text style={{ fontSize: 26, fontWeight: '900', color: '#FFF', lineHeight: 34, letterSpacing: -0.5 }}>
                                        Elevate Your{'\n'}Living Space.
                                    </Text>
                                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 10, lineHeight: 18, fontWeight: '500' }}>
                                        Discover premium luxury furniture that transforms your home.
                                    </Text>
                                </View>
                                
                                {/* 3D Illustration for Mobile - Adjusted Position */}
                                <View style={{ position: 'absolute', right: -20, bottom: -20, width: windowWidth * 0.6, height: windowWidth * 0.6 }}>
                                    <Image 
                                        source={require('../assets/images/badheeg_login_illustration.png')} 
                                        style={{ width: '100%', height: '100%', resizeMode: 'contain' }} 
                                    />
                                </View>

                                {/* Close Button */}
                                <TouchableOpacity 
                                    onPress={handleClose} 
                                    style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
                                >
                                    <Feather name="x" size={22} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            {/* Form Area */}
                            <View style={{ padding: 28, flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -35, backgroundColor: theme.background }}>
                                <View style={{ alignItems: 'center', marginBottom: 28 }}>
                                    <View style={{ width: 45, height: 5, backgroundColor: theme.border, borderRadius: 2.5, marginBottom: 24, opacity: 0.4 }} />
                                    <Text style={{ fontSize: 24, fontWeight: '900', color: theme.text, marginBottom: 6, letterSpacing: -0.5 }}>
                                        {isNewUser ? "Complete Profile" : "Welcome Back"}
                                    </Text>
                                    <Text style={{ fontSize: 14, color: theme.subtext, fontWeight: '500' }}>
                                        {isNewUser ? "Tell us your name to get started" : (!otpSent ? "Login to your account" : `OTP sent to +91 ${phoneNumber}`)}
                                    </Text>
                                </View>

                                {isNewUser ? (
                                    <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                        <Feather name="user" size={18} color={theme.subtext} style={{ marginRight: 12 }} />
                                        <TextInput
                                            placeholder="Full Name"
                                            placeholderTextColor={theme.subtext}
                                            value={fullName}
                                            onChangeText={setFullName}
                                            autoCapitalize="words"
                                            underlineColorAndroid="transparent"
                                            selectionColor={theme.primary}
                                            style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                        />
                                    </View>
                                ) : !otpSent ? (
                                    <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                        <Feather name="phone" size={18} color={theme.subtext} style={{ marginRight: 12 }} />
                                        <TextInput
                                            placeholder="Mobile Number"
                                            placeholderTextColor={theme.subtext}
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            underlineColorAndroid="transparent"
                                            selectionColor={theme.primary}
                                            style={[styles.input, { color: theme.text }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                        />
                                    </View>
                                ) : (
                                    <View style={styles.otpSection}>
                                        <View style={styles.otpBoxesContainer}>
                                            {otp.map((digit, index) => (
                                                <TextInput
                                                    key={index}
                                                    ref={ref => { otpInputs.current[index] = ref; }}
                                                    style={[styles.otpBox, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                                    maxLength={1}
                                                    keyboardType="number-pad"
                                                    onChangeText={(text) => handleOtpChange(text, index)}
                                                    onKeyPress={(e) => handleOtpBackspace(e, index)}
                                                    value={digit}
                                                    underlineColorAndroid="transparent"
                                                    selectionColor={theme.primary}
                                                />
                                            ))}
                                        </View>
                                        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => setOtpSent(false)}>
                                            <Text style={{ color: '#0066FF', fontWeight: '700' }}>Edit Number?</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#0066FF', opacity: isLoading ? 0.7 : 1, shadowColor: '#0066FF' }]}
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={[styles.btnText, { color: '#FFF' }]}>
                                            {isNewUser ? 'Continue' : (otpSent ? 'Confirm & Login' : 'Get OTP')}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {/* Bottom Tagline */}
                                <View style={{ marginTop: 'auto', alignItems: 'center', paddingTop: 20 }}>
                                    <Text style={{ fontSize: 12, color: theme.subtext, fontWeight: '600' }}>
                                        Luxury Furniture for Luxury Living
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayDesktop: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdropPressable: {
        flex: 1,
    },
    drawer: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    drawerDesktop: {
        width: 900,
        height: 600,
        borderRadius: 24,
        flexDirection: 'row',
        padding: 0,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    otpSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    otpBoxesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    otpBox: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        borderRadius: 12,
        width: 44,
        height: 56,
        borderWidth: 1,
    },
    actionBtn: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    inputContainerDesktop: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        marginBottom: 16,
        backgroundColor: '#F2F2F7',
    },
    actionBtnDesktop: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#0066FF',
    },
});

export default LoginDrawer;
