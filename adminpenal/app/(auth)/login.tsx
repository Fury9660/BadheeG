import { supabase } from '@/config/supabaseConfig';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
// Firebase auth import removed
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = () => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const formOpacity = useSharedValue(0);
    const formTranslateY = useSharedValue(20);

    useEffect(() => {
        formOpacity.value = withTiming(1, { duration: 800 });
        formTranslateY.value = withTiming(0, { duration: 800 });
    }, []);

    const animatedFormStyle = useAnimatedStyle(() => {
        return {
            opacity: formOpacity.value,
            transform: [{ translateY: formTranslateY.value }],
        };
    });

    const handleLogin = async () => {
        if (!email || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert('Error', 'Please enter email and password.');
        }

        // Restrict to specific admin email
        if (email.toLowerCase().trim() !== 'badheeadmin@gmail.com') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert('Access Denied', 'This account does not have admin privileges.');
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            await AsyncStorage.setItem('user_role', 'admin');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/');
        } catch (error: any) {
            console.error("Login Error:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[
                        styles.innerContainer,
                        isDesktop ? styles.desktopCard : styles.mobileFull,
                        animatedFormStyle
                    ]}>
                        <View style={styles.header}>
                            <Image 
                                source={require('../../assets/images/1000262409-Photoroom.png')} 
                                style={styles.logo} 
                                resizeMode="contain" 
                            />
                            <Text style={styles.title}>Admin Panel</Text>
                            <Text style={styles.subtitle}>Sign in to manage your workspace</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <Feather name="mail" size={18} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="admin@example.com"
                                        placeholderTextColor="#94A3B8"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <Feather name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Enter your password"
                                        placeholderTextColor="#94A3B8"
                                        secureTextEntry={!isPasswordVisible}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                        style={styles.eyeIcon}
                                    >
                                        <Feather name={isPasswordVisible ? 'eye' : 'eye-off'} size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.loginButton, { opacity: isLoading ? 0.7 : 1 }]}
                            onPress={handleLogin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.loginButtonText}>Continue</Text>
                                    <Feather name="arrow-right" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Feather name="lock" size={12} color="#94A3B8" />
                            <Text style={styles.footerText}>Secure, end-to-end encrypted connection</Text>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F8FAFC', // Neutral Slate Background
    },
    innerContainer: { 
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 40,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    desktopCard: {
        width: 450,
        marginVertical: 40,
    },
    mobileFull: {
        width: '90%',
        marginVertical: 20,
    },
    header: { 
        alignItems: 'center',
        marginBottom: 32 
    },
    logo: {
        width: 220,
        height: 100,
        marginBottom: 0,
        tintColor: '#000',
    },
    title: { 
        color: '#0F172A', 
        fontSize: 28, 
        fontWeight: '800',
        textAlign: 'center' 
    },
    subtitle: { 
        color: '#64748B', 
        fontSize: 15, 
        marginTop: 8,
        textAlign: 'center' 
    },
    formContainer: { 
        marginBottom: 24 
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9', // Light Gray
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: { 
        flex: 1,
        color: '#0F172A', 
        paddingVertical: 18, 
        fontSize: 16,
        outlineStyle: 'none', // Remove web focus ring
    },
    eyeIcon: {
        padding: 4,
    },
    loginButton: { 
        backgroundColor: '#000', 
        height: 60, 
        borderRadius: 16, 
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 8, 
        elevation: 4,
        gap: 10,
    },
    loginButtonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '700' 
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 6,
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
    }
});

export default LoginScreen;
