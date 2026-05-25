import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ResetPasswordScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { phoneNumber } = useLocalSearchParams();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#000000',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert("Error", "Please fill in all fields.");
        }

        if (password !== confirmPassword) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert("Error", "Passwords do not match.");
        }

        if (password.length < 6) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert("Error", "Password must be at least 6 characters long.");
        }

        setIsLoading(true);
        try {
            // 1. Update Supabase Auth Password
            // Note: User is already 'logged in' via verifyOtp, so we can update the current user
            const { error: authError } = await supabase.auth.updateUser({
                password: password,
            });

            if (authError) throw authError;

            // 2. Update pre_approved_partners table
            const { error: dbError } = await supabase
                .from('pre_approved_partners')
                .update({ password: password })
                .eq('mobile_number', phoneNumber);

            if (dbError) throw dbError;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Sign out to force login with new password (best practice)
            await supabase.auth.signOut();

            Alert.alert("Success", "Password reset successfully! Please login with your new password.", [
                { text: "OK", onPress: () => router.replace('/login') }
            ]);

        } catch (error: any) {
            console.error("Reset Error:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Reset Failed", error.message || "Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <View style={{ alignItems: 'center', marginBottom: 32 }}>
                            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                                <Feather name="lock" size={32} color={theme.primary} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>New Password</Text>
                            <Text style={[styles.subtitle, { color: theme.subtext }]}>Create a strong password for your account</Text>
                        </View>

                        <View style={{ gap: 16, marginBottom: 32 }}>
                            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="New Password"
                                    placeholderTextColor={theme.subtext}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    <Feather name={isPasswordVisible ? "eye" : "eye-off"} size={20} color={theme.subtext} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Confirm New Password"
                                    placeholderTextColor={theme.subtext}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!isPasswordVisible}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#000000', opacity: isLoading ? 0.7 : 1 }]}
                            onPress={handleResetPassword}
                            disabled={isLoading}
                        >
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ alignSelf: 'center', marginTop: 24 }}
                            onPress={() => router.replace('/login')}
                        >
                            <Text style={{ color: theme.subtext, fontWeight: '600' }}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 24,
        borderRadius: 24,
        elevation: 4,
        ...Platform.select({
            web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.1)' },
            ios: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            }
        })
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        opacity: 0.8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    button: {
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default ResetPasswordScreen;
