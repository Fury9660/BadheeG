
// --- ULTIMATE CONSOLE SECURITY FOR HERMES/WEB ---
if (typeof global !== 'undefined') {
  const noop = () => {};
  const originalLog = console.log;
  const originalClear = console.clear;
  
  // Replace global console methods
  // @ts-ignore
  global.console = {
    ...console,
    log: noop,
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    table: noop,
    group: noop,
    groupEnd: noop,
  };

  // Show warning once after a small delay to ensure initial logs are gone
  if (typeof setTimeout !== 'undefined') {
    setTimeout(() => {
      try {
        if (originalClear) originalClear();
        originalLog('%cStop!', 'color: red; font-size: 60px; font-weight: bold; -webkit-text-stroke: 2px black;');
        originalLog('%cWARNING: Highly Secured Environment.', 'color: orange; font-size: 18px; font-weight: bold;');
        originalLog('%cArchitecture & Security Protocol by Senior Google Developer Capt Yuvraj.', 'color: #555; font-size: 14px; font-weight: bold;');
        originalLog('%cAll activity is logged and monitored in real-time by Badhee G Security Core v3.0.', 'color: #666; font-size: 14px;');
        originalLog('%cAttempting to bypass this system is practically impossible. Your IP has been logged.', 'color: #777; font-size: 14px; font-style: italic;');
        originalLog('%cDEVELOPER CORE: ENCRYPTED & PROTECTED. DO NOT ATTEMPT TO TAMPER.', 'color: #000; font-weight: 900; font-size: 14px; margin-top: 10px;');
      } catch (e) {}
    }, 2000);
  }
}
// -----------------------------------------------

import { supabase } from '@/config/supabaseConfig';
import { storage } from '@/lib/storage'; // Updated import
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { ThemeProvider, useTheme } from '@/store/ThemeContext';
import { UIProvider } from '@/store/UIContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import WebNavbar from '../components/WebNavbar';
import LoginDrawer from '../components/LoginDrawer';
import { useUI } from '@/store/UIContext';

const InitialLayout = () => {
    const { isDarkMode } = useTheme();
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const { isLoginDrawerOpen, setLoginDrawerOpen } = useUI();

    useEffect(() => {
        // Safety timeout to ensure app doesn't hang on splash screen
        const timer = setTimeout(() => {
            setIsCheckingRole((prev) => {
                if (prev) {
                    console.log("Role check timed out, forcing render");
                    return false;
                }
                return prev;
            });
        }, 2000);

        if (isLoading) return;

        const checkNavigation = async () => {
            const inAuthGroup = segments[0] === '(auth)';

            if (user) {
                // Priority 1: Check intended role from Storage
                let role = await storage.getItem('user_role');

                // Priority 2: Fetch actual data from Supabase
                // We use 'pre_approved_partners' table as per migration
                const { data: partnerData } = await supabase
                    .from("pre_approved_partners")
                    .select("onboardingStep")
                    .eq("id", user.id)
                    .single();

                // Determine if they SHOULD be a partner based on session or existing profile
                // partnerData check effectively replaces partnerDoc.exists()
                const isPartnerSession = role === 'partner' || !!partnerData;

                if (inAuthGroup) {
                    if (isPartnerSession) {
                        router.replace('/partners/(tabs)/dashboard');
                    } else {
                        router.replace('/(tabs)');
                    }
                }
            } else {
                // Allow (auth) AND admin routes to pass. Admin layout handles its own auth.
                const inPartnerGroup = segments[0] === 'partners';
                const inTabsGroup = segments[0] === '(tabs)';
                const inLegalGroup = segments[0] === 'legal';

                // Allow guest access to Home layout (tabs) AND public modals
                const publicRoutes = ['product-details', 'search', 'store-details', 'help', 'privacy-policy', 'terms-conditions', 'store-details'];
                const isPublicRoute = publicRoutes.includes(segments[0]);

                if (!inAuthGroup && !inPartnerGroup && !inTabsGroup && !inLegalGroup && !isPublicRoute) {
                    router.replace('/(tabs)');
                }
            }
            setIsCheckingRole(false);
        };

        checkNavigation().finally(() => clearTimeout(timer));
        return () => clearTimeout(timer);
    }, [user, isLoading, segments]);

    if (isLoading || isCheckingRole) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }}>
                <ActivityIndicator color={isDarkMode ? '#FFFFFF' : '#000000'} size="large" />
            </View>
        );
    }

    const isMobile = width < 768; // Mobile Web Breakpoint

    const shouldShowWebNavbar = isWeb &&
        segments[0] !== 'partners' &&
        segments[0] !== 'product-details' &&
        (isMobile ? false : true);

    return (
        <View style={{ flex: 1 }}>
            {shouldShowWebNavbar && <WebNavbar />}
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="partners" options={{ headerShown: false }} />

                <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
                <Stack.Screen name="search" options={{ presentation: 'modal' }} />
                <Stack.Screen name="product-details" options={{ presentation: 'modal' }} />
                <Stack.Screen name="personal-info" options={{ presentation: 'modal' }} />
                <Stack.Screen name="my-addresses" options={{ presentation: 'modal' }} />
                <Stack.Screen name="add-address" options={{ presentation: 'modal' }} />
                <Stack.Screen name="edit-address" options={{ presentation: 'modal' }} />
                <Stack.Screen name="help" options={{ presentation: 'modal' }} />
                <Stack.Screen name="my-orders" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="wishlist" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
            
            <LoginDrawer 
                isVisible={isLoginDrawerOpen} 
                onClose={() => setLoginDrawerOpen(false)} 
            />
        </View>
    );
};

import * as SplashScreen from 'expo-splash-screen'; // Optional but good practice

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// ... 

import { useFonts } from 'expo-font';
// ...

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...Feather.font,
        ...FontAwesome.font,
        ...MaterialCommunityIcons.font,
        ...Ionicons.font,
    });

    useEffect(() => {
        if (error) {
            console.error("Font loading error:", error);
            // Don't throw, just allow app to render with potential missing icons (or fallback)
            SplashScreen.hideAsync();
        }
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    // Render the app even if fonts aren't fully "loaded" by Expo, 
    // relying on the CDN injection to provide the font faces.
    if (!loaded && !error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ThemeProvider>
                    <UIProvider>
                        <InitialLayout />
                    </UIProvider>
                </ThemeProvider>
            </GestureHandlerRootView>
        </AuthProvider>
    );
}
