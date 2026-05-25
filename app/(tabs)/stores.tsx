import { GlowingEffect } from '@/components/ui/GlowingEffect';
import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import Animated, { 
    FadeInDown, 
    FadeInUp,
    Layout, 
    useAnimatedStyle, 
    useSharedValue, 
    withSpring, 
    withTiming 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const StoreCard = React.memo(({ store, theme, index, isWeb, router }: any) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handleHoverIn = () => {
        if (!isWeb) return;
        scale.value = withSpring(1.02);
    };

    const handleHoverOut = () => {
        if (!isWeb) return;
        scale.value = withSpring(1);
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify().damping(12)}
            layout={Layout.springify()}
            style={[
                styles.storeCardWrapper,
                isWeb && { width: '30%', minWidth: 280 },
            ]}
        >
            <AnimatedPressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/store-details', params: { id: store.id } });
                }}
                onHoverIn={handleHoverIn}
                onHoverOut={handleHoverOut}
                style={[
                    styles.storeCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    animatedStyle
                ]}
            >

            
            <View style={styles.storeCardContent}>
                <View style={styles.storeHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.storeName, { color: theme.text }]} numberOfLines={1}>{store.storeName}</Text>
                            <View style={[styles.verifiedBadge, { backgroundColor: theme.background === '#000' ? '#1a1a1a' : '#f0f0f0' }]}>
                                <MaterialCommunityIcons name="check-decagram" size={14} color="#4BB543" />
                                <Text style={[styles.verifiedText, { color: theme.subtext }]}>Verified</Text>
                            </View>
                        </View>
                        <Text style={[styles.storeCategory, { color: theme.subtext }]}>{store.category}</Text>
                    </View>
                </View>

                <View style={styles.locationContainer}>
                    <Feather name="map-pin" size={14} color={theme.subtext} />
                    <Text style={[styles.storeAddress, { color: theme.subtext }]} numberOfLines={1}>
                        {store.location?.city} • {store.location?.line1}
                    </Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.viewBtn, { backgroundColor: theme.text }]}
                        onPress={() => router.push({ pathname: '/store-details', params: { id: store.id } })}
                    >
                        <Text style={[styles.viewBtnText, { color: theme.card }]}>Browse Collection</Text>
                        <Feather name="chevron-right" size={16} color={theme.card} />
                    </TouchableOpacity>
                </View>
                </View>
            </AnimatedPressable>
        </Animated.View>
    );
});

const StoresScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWeb = width > 768;

    const [pincode, setPincode] = useState('');
    const [searchedPincode, setSearchedPincode] = useState('');
    const [stores, setStores] = useState<any[]>([]);
    const [isLoadingStores, setIsLoadingStores] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const theme = {
        background: isDarkMode ? '#000' : '#f8f9fa',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#111' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#666',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        border: isDarkMode ? '#222' : '#E5E5EA',
    };

    const handleSearch = async (code = pincode) => {
        if (!code || code.length < 6) {
            Alert.alert("Invalid Pincode", "Please enter a valid 6-digit pincode.");
            return;
        }

        setIsLoadingStores(true);
        setSearchedPincode(code);
        if (Platform.OS !== 'web') Keyboard.dismiss();

        try {
            const { data, error } = await supabase
                .from('pre_approved_partners')
                .select('*')
                .eq('zip_code', code)
                .in('status', ['approved', 'Approved', 'Active', 'active']);

            if (error) throw error;

            const storeList = (data || []).map(store => ({
                id: store.id,
                storeName: store.store_name || store.business_name || 'Showroom',
                phoneNumber: store.mobile_number || store.phoneNumber,
                category: store.category || 'Retail',
                location: {
                    line1: store.shop_address || 'Main Street',
                    city: store.city || 'Your City',
                    pincode: store.zip_code
                }
            }));

            setStores(storeList);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error) {
            console.error("Error fetching stores:", error);
            Alert.alert("Error", "Could not fetch showrooms. Please try again.");
        } finally {
            setIsLoadingStores(false);
        }
    };

    const detectLocation = async () => {
        setIsDetectingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
                const detectedPincode = reverseGeocode[0].postalCode;
                if (detectedPincode) {
                    setPincode(detectedPincode);
                    handleSearch(detectedPincode);
                } else {
                    Alert.alert('Notice', 'Could not detect pincode for your location.');
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to detect location.');
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const filteredStores = stores;

    const isWebPlatform = Platform.OS === 'web';

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: isWeb ? 70 : (isWebPlatform ? 0 : insets.top) }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 100 }}
                stickyHeaderIndices={isWeb ? [] : [1]}
            >
                {/* 1. Hero Header */}
                <Animated.View 
                    entering={FadeInUp.duration(600)}
                    style={[styles.heroSection, { backgroundColor: '#000' }]}
                >
                    <View style={[styles.heroContent, isWeb && { alignSelf: 'center', alignItems: 'center' }]}>
                        <Text style={[styles.heroTag, { color: 'rgba(255,255,255,0.4)' }]}>EXPERIENCE CENTERS</Text>
                        <Text style={[styles.heroTitle, isWeb && { textAlign: 'center' }]}>Premium Showrooms</Text>
                        <Text style={[styles.heroSubtitle, isWeb && { textAlign: 'center' }]}>Discover excellence through our verified partners.</Text>
                    </View>
                </Animated.View>

                {/* 2. Search & Filter Bar */}
                <View style={[styles.searchSection, { backgroundColor: theme.background }]}>
                    <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: isWeb ? 700 : '100%', alignSelf: 'center', width: '100%' }]}>
                        <Feather name="search" size={20} color={theme.subtext} />
                        <TextInput
                            placeholder="Enter Pincode"
                            placeholderTextColor={theme.subtext}
                            style={[
                                styles.input, 
                                { color: theme.text, flexShrink: 1, minWidth: 50 }, 
                                Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
                                width < 360 && { fontSize: 13, paddingHorizontal: 6 }
                            ]}
                            keyboardType="number-pad"
                            maxLength={6}
                            value={pincode}
                            onChangeText={setPincode}
                            onSubmitEditing={() => handleSearch()}
                        />
                        <TouchableOpacity
                            style={[styles.searchBtn, { backgroundColor: theme.text, minWidth: width < 360 ? 60 : 80 }, width < 360 && { paddingHorizontal: 12 }]}
                            onPress={() => handleSearch()}
                        >
                            {isLoadingStores ? (
                                <ActivityIndicator size="small" color={theme.card} />
                            ) : (
                                <Text style={[{ color: theme.card, fontWeight: '700' }, width < 360 && { fontSize: 13 }]}>Find</Text>
                            )}
                        </TouchableOpacity>
                    </View>


                </View>

                {/* 3. Results Section */}
                <View style={[styles.content, isWeb && { maxWidth: 1200, alignSelf: 'center', width: '100%' }]}>
                    {!searchedPincode ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                                <Feather name="map" size={40} color={theme.subtext} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Discover Nearby Showrooms</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
                                Enter your pincode or use current location to see authorized partners in your area.
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.storeList, isWeb && styles.webStoreList]}>
                            {filteredStores.length > 0 ? (
                                filteredStores.map((store, index) => (
                                    <StoreCard
                                        key={store.id}
                                        store={store}
                                        index={index}
                                        theme={theme}
                                        isWeb={isWeb}
                                        router={router}
                                    />
                                ))
                            ) : (
                                <View style={styles.noResults}>
                                    <MaterialCommunityIcons name="store-search-outline" size={60} color={theme.subtext} />
                                    <Text style={[styles.noResultsText, { color: theme.text }]}>No showrooms found in this area</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    heroSection: { height: 200, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },
    heroContent: { maxWidth: 640 },
    heroTag: { fontSize: 12, fontWeight: '800', letterSpacing: 4, marginBottom: 8 },
    heroTitle: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 22 },
    
    searchSection: { marginTop: 16, paddingHorizontal: 20, zIndex: 10, paddingBottom: 16 },
    searchBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingLeft: 12, 
        paddingRight: 4,
        paddingVertical: 4,
        borderRadius: 18, 
        borderWidth: 1,
        gap: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
    },
    input: { flex: 1, height: 44, paddingHorizontal: 12, fontSize: 16, fontWeight: '600' },
    searchBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, justifyContent: 'center' },
    
    filterContainer: { marginTop: 20, marginHorizontal: -20, paddingHorizontal: 20 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1, marginRight: 8 },
    filterText: { fontSize: 13, fontWeight: '700' },

    content: { flex: 1, paddingHorizontal: 20, marginTop: 20, width: '100%' },
    storeList: { gap: 20, width: '100%' },
    webStoreList: { flexDirection: 'row', flexWrap: 'wrap', gap: 32, justifyContent: 'center' },
    
    storeCardWrapper: { marginBottom: 20 },
    storeCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', position: 'relative', width: '100%' },
    storeCardContent: { padding: 20, zIndex: 2 },
    storeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    storeName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    storeCategory: { fontSize: 12, fontWeight: '800', marginTop: 2, textTransform: 'uppercase', opacity: 0.8 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    verifiedText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    
    locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    storeAddress: { fontSize: 13, fontWeight: '500', lineHeight: 18, flex: 1, opacity: 0.7 },
    
    actionRow: { flexDirection: 'row', gap: 10 },
    callBtn: { flex: 0.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, gap: 6 },
    callBtnText: { fontSize: 13, fontWeight: '800' },
    viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, gap: 8, paddingVertical: 14 },
    viewBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
    emptySubtitle: { fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 },

    noResults: { alignItems: 'center', marginTop: 100 },
    noResultsText: { fontSize: 16, fontWeight: '700', marginTop: 20 }
});

export default StoresScreen;
