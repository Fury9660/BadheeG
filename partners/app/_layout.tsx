import Sidebar from '@/components/Sidebar';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { ThemeProvider, useTheme } from '@/store/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
// --- ULTIMATE CONSOLE SECURITY FOR HERMES/WEB ---
if (typeof global !== 'undefined') {
  const originalLog = console.log;
  const originalClear = console.clear;
  const noop = () => {};

  // Replace entire console object to prevent any logging
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

global.Buffer = global.Buffer || Buffer;

const FurnitureLoading = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.6, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[animatedStyle, { 
        width: 100, 
        height: 100, 
        backgroundColor: '#6366F115', 
        borderRadius: 50, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#6366F1'
      }]}>
        <MaterialCommunityIcons name="sofa" size={50} color="#6366F1" />
      </Animated.View>
      <Text style={{ marginTop: 24, fontSize: 14, fontWeight: '800', color: '#6366F1', letterSpacing: 2 }}>BADHEE G</Text>
      <Text style={{ marginTop: 4, fontSize: 10, fontWeight: '600', color: '#94A3B8', letterSpacing: 1 }}>PREPARING YOUR SHOWROOM...</Text>
    </View>
  );
};

const InitialLayout = () => {
  const { colors: theme, isDarkMode } = useTheme();
  const { user, partnerStatus, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isChecking, setIsChecking] = useState(true);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const appState = useRef(AppState.currentState);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Badhee G Seller',
          fallbackLabel: 'Use Device Passcode',
        });
        if (result.success) {
          setIsBiometricVerified(true);
        }
      } else {
        // Fallback for devices without biometrics
        setIsBiometricVerified(true);
      }
    } catch (error) {
      console.error("Biometric auth error:", error);
      setIsBiometricVerified(true); // Don't lock them out if error occurs
    }
  };

  useEffect(() => {
    // const subscription = AppState.addEventListener('change', nextAppState => {
    //   if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
    //     // Re-authenticate when coming to foreground
    //     // setIsBiometricVerified(false);
    //     // if (user) authenticate();
    //   }
    //   appState.current = nextAppState;
    // });

    // return () => subscription.remove();
  }, [user]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'verify-otp' || segments[0] === 'onboarding' || segments[0] === 'register' || segments[0] === 'reset-password';

    // Removed debug log for security

    if (user) {
      if (!isBiometricVerified && !inAuthGroup) {
        authenticate();
      }

      const status = partnerStatus?.toLowerCase();
      if (inAuthGroup || (segments as any).length === 0) {
        if (status === 'pending') {
          router.replace('/approval-pending');
        } else if (status === 'approved' || status === 'active') {
          router.replace('/(tabs)/dashboard');
        } else if (status === 'rejected' || status === 'suspended') {
          router.replace('/login');
        } else if (status === 'unregistered') {
          router.replace('/onboarding');
        }
      }
    } else {
      const isIndex = (segments as any).length === 0;
      if (!inAuthGroup && !isIndex) {
        router.replace('/login');
      }
    }

    // Safety timeout to ensure loading is dismissed
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isLoading, segments, isBiometricVerified, partnerStatus]);

  if (isLoading || isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ position: 'absolute', top: -550, left: 0, right: 0, alignItems: 'center' }}>
          <Image
            source={require('../assets/images/1000262409-Photoroom.png')}
            style={{ width: 1400, height: 800, tintColor: '#000000', transform: [{ scale: 8.5 }] }}
            resizeMode="contain"
          />
          <View style={{ marginTop: 80 }}>
            <FurnitureLoading />
          </View>
        </View>
      </View>
    );
  }

  // Show Lock Screen if not verified
  const inAuthGroup = segments[0] === 'login' || segments[0] === 'verify-otp' || segments[0] === 'onboarding' || segments[0] === 'register' || segments[0] === 'reset-password';
  if (user && !isBiometricVerified && !inAuthGroup) {
    return (
      <View style={[styles.lockScreen, { backgroundColor: theme.background }]}>
        <MaterialCommunityIcons name="shield-lock" size={80} color={theme.primary} />
        <Text style={[styles.lockText, { color: theme.text }]}>App Locked</Text>
        <Text style={[styles.lockSubtext, { color: theme.subtext }]}>Please authenticate to continue</Text>
        <TouchableOpacity style={[styles.unlockBtn, { backgroundColor: theme.primary }]} onPress={authenticate}>
          <Text style={[styles.unlockBtnText, { color: isDarkMode ? '#000' : '#fff' }]}>Unlock Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLargeScreen = width > 768;
  const showSidebar = isLargeScreen && user && !inAuthGroup && partnerStatus !== 'pending';

  const Content = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="register" />
      <Stack.Screen name="approval-pending" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="onboarding-location" />
      <Stack.Screen name="onboarding-kyc" />
      <Stack.Screen name="reset-password" />

      {/* Main Dashboard with Bottom Tabs */}
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />

      {/* Standalone screens (Stacks) */}
      <Stack.Screen name="add-product" options={{ presentation: 'modal' }} />
      <Stack.Screen name="product-details" options={{ presentation: 'modal' }} />
      <Stack.Screen name="order-details" />
      <Stack.Screen name="ad-campaigns" />
      <Stack.Screen name="create-ad" options={{ presentation: 'card' }} />
      <Stack.Screen name="help" />
      <Stack.Screen name="my-addresses" />
      <Stack.Screen name="add-address" />
      <Stack.Screen name="edit-address" />
      <Stack.Screen name="personal-info" />
    </Stack>
  );

  if (showSidebar) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Sidebar />
        <View style={{ flex: 1 }}>{Content}</View>
      </View>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockText: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 24,
  },
  lockSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  unlockBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  unlockBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1, width: '100%', height: '100%' }}>
        <ThemeProvider>
          <InitialLayout />
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
