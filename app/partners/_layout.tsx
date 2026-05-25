import { supabase } from '@/config/supabaseConfig';
import { storage } from '@/lib/storage';
import { useAuth } from '@/store/AuthContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Image, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import 'react-native-reanimated';

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

const PartnerLayout = () => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    // In app/partners match, segments[0] should be 'partners'.
    // Segments[1] is the next part.
    const inAuthGroup = segments[1] === 'login' || segments[1] === 'verify-otp' || segments[1] === 'register' || segments[1] === 'onboarding' || segments[1] === 'onboarding-kyc' || segments[1] === 'onboarding-location' || segments[1] === 'quick-start';

    const checkNavigation = async () => {
      if (user) {
        // Enforce role check for partners
        // We expect the login flow to set 'user_role' to 'partner'
        // If not found, we assume they might be a customer and redirect to login

        // Dynamic import not needed with our safe wrapper
        const role = await storage.getItem('user_role');
        const isPartner = role === 'partner' || role === 'admin';

        if (isPartner) {
          let status = await storage.getItem('partner_status');

          // If status is 'pending' in storage, check Supabase for real-time status update
          if (!status || status.toLowerCase() === 'pending') {
            try {
              const { data: partnerData, error: partnerError } = await supabase
                .from('pre_approved_partners')
                .select('status')
                .eq('user_id', user.id)
                .maybeSingle();

              if (!partnerError && partnerData && partnerData.status) {
                const liveStatus = partnerData.status.toLowerCase();
                status = liveStatus;
                await storage.setItem('partner_status', liveStatus);
              }
            } catch (err) {
              console.error("Layout status check error:", err);
            }
          }

          const cleanStatus = status?.toLowerCase();

          if (cleanStatus === 'pending') {
            if (segments[1] !== 'approval-pending') {
              router.replace('/partners/approval-pending');
            }
          } else if (cleanStatus === 'active') {
            if (inAuthGroup || segments.length === 1 || segments[1] === 'approval-pending') {
              router.replace('/partners/(tabs)/dashboard');
            }
          } else if (!inAuthGroup) {
            // Handle unspecified or rejected status by going to login
            router.replace('/');
          }
        } else {
          // User is logged in but NOT as a partner (likely a customer)
          // Force them to partner login
          // if (!inAuthGroup) {
          //   router.replace('/');
          // }
        }
      } else {
        if (!inAuthGroup) {
          router.replace('/');
        }
      }
      setIsChecking(false);
    };

    checkNavigation();
  }, [user, isLoading, segments]);

  if (isLoading || isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ position: 'absolute', top: -550, left: 0, right: 0, alignItems: 'center' }}>
          <Image 
            source={require('../../assets/images/1000262409-Photoroom.png')} 
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="register" />
      <Stack.Screen name="approval-pending" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="onboarding-location" />
      <Stack.Screen name="onboarding-kyc" />

      {/* Main Dashboard with Bottom Tabs */}
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />

      {/* Standalone screens (Stacks) */}
      <Stack.Screen name="add-product" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="edit-product" options={{ presentation: 'modal' }} />
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
};

export default function RootLayout() {
  return (
    <PartnerLayout />
  );
}
