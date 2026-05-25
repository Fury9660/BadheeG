import { AuthProvider, useAuth } from '@/store/AuthContext';
import { ThemeProvider, useTheme } from '@/store/ThemeContext';
import { supabase } from '@/config/supabaseConfig';
import { Feather } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

const BiometricLock = ({ onUnlock }: { onUnlock: () => void }) => {
    const { isDarkMode } = useTheme();
    const [error, setError] = useState<string | null>(null);

    const authenticate = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                onUnlock();
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to access Admin Panel',
                fallbackLabel: 'Enter Password',
            });

            if (result.success) {
                onUnlock();
            } else {
                setError('Authentication failed. Tap to try again.');
            }
        } catch (e) {
            setError('An error occurred. Tap to try again.');
        }
    };

    useEffect(() => {
        authenticate();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#000' : '#fff' }}>
            <Feather name="lock" size={64} color={isDarkMode ? '#fff' : '#000'} style={{ marginBottom: 20 }} />
            <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Locked</Text>
            <TouchableOpacity onPress={authenticate} style={{ padding: 10 }}>
                <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000', fontSize: 16 }}>
                    {error || "Tap to unlock with Biometrics"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const AdminLayoutContent = () => {
    const { isDarkMode } = useTheme();
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [isLocked, setIsLocked] = useState(true);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                setIsLocked(true);
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const checkNavigation = async () => {
            // In standalone adminpenal, segments[0] is '(auth)' or '(tabs)'
            const inAuthGroup = segments[0] === '(auth)';

            if (user) {
                let isAuthorized = false;
                try {
                    const { data: isAdmin, error } = await supabase.rpc('is_admin');
                    if (!error && isAdmin) {
                        isAuthorized = true;
                    } else {
                        // Fallback for hardcoded emails (LEGACY)
                        if (user.email === 'captyuvraj2@gmail.com' || user.email === 'badheeadmin@gmail.com') {
                            isAuthorized = true;
                        }
                    }
                } catch (e) {
                    if (user.email === 'captyuvraj2@gmail.com' || user.email === 'badheeadmin@gmail.com') {
                        isAuthorized = true;
                    }
                }

                if (isAuthorized) {
                    if (inAuthGroup) {
                        router.replace('/');
                    }
                } else {
                    if (!inAuthGroup) {
                        router.replace('/login');
                    }
                }
            } else {
                if (!inAuthGroup) {
                    router.replace('/login');
                }
            }
            setIsCheckingRole(false);
        };

        checkNavigation();
    }, [user, isLoading, segments]);

    return (
        <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="send-notification" options={{ presentation: 'modal' }} />
            </Stack>

            {(isLoading || isCheckingRole) && (
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', zIndex: 10 }]}>
                    <ActivityIndicator color={isDarkMode ? '#FFFFFF' : '#000000'} size="large" />
                </View>
            )}

            {user && isLocked && !isLoading && !isCheckingRole && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]}>
                    <BiometricLock onUnlock={() => setIsLocked(false)} />
                </View>
            )}
        </View>
    );
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ThemeProvider>
                    <AdminLayoutContent />
                </ThemeProvider>
            </GestureHandlerRootView>
        </AuthProvider>
    );
}

