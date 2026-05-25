import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import Animated, {
    Extrapolate,
    interpolate,
    interpolateColor,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.min(width * 0.9, 500);
const CONTENT_MAX_WIDTH = 800;

const productImages = [
    require('../assets/images/logo.png'),
    require('../assets/images/icon.png'),
];

const ProductDetailsScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();

    const [quantity, setQuantity] = useState(1);
    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAdding, setIsAdding] = useState(false);

    // Animation Shared Value
    const scrollY = useSharedValue(0);

    // Scroll Handler
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Image Animation Style
    const imageAnimatedStyle = useAnimatedStyle<any>(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, IMAGE_HEIGHT / 1.5],
            [1, 0],
            Extrapolate.CLAMP
        );
        const scale = interpolate(
            scrollY.value,
            [-100, 0, IMAGE_HEIGHT],
            [1.2, 1, 0.8],
            Extrapolate.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [0, IMAGE_HEIGHT],
            [0, -50],
            Extrapolate.CLAMP
        );

        return {
            opacity,
            transform: [{ scale }, { translateY }],
        };
    });

    // Header Background Animation
    const headerAnimatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            scrollY.value,
            [0, 50],
            ['rgba(0,0,0,0)', isDarkMode ? '#1A1A1A' : '#f7f8fc']
        );
        const borderBottomWidth = interpolate(
            scrollY.value,
            [40, 60],
            [0, 1],
            Extrapolate.CLAMP
        );

        return {
            backgroundColor,
            borderBottomWidth,
            borderBottomColor: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        };
    });

    const headerTitleAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [IMAGE_HEIGHT - 120, IMAGE_HEIGHT - 60],
            [0, 1],
            Extrapolate.CLAMP
        );
        return { opacity };
    });

    // Mock data
    const product = {
        id: params.id || 'p1',
        name: params.name || 'Ergonomic Leather Office Chair',
        price: parseInt(params.price as string || '8999'),
        image: params.image as string || Image.resolveAssetSource(productImages[0]).uri,
        category: params.category as string || 'Furniture',
        description: 'Experience unparalleled comfort with our ergonomic leather office chair. Designed for long hours of productivity with a premium feel.',
        warranty: '12 Months Warranty',
        care: 'Regularly dust with dry cloth. Avoid direct sunlight.',
        brand: 'ComfortSeats Premium Collection',
        specifications: [
            { label: 'Upholstery', value: 'Premium Leather' },
            { label: 'Base', value: 'Heavy Duty Metal' },
            { label: 'Max Load', value: '150 KG' },
        ],
        showroom: {
            name: params.showroomName as string || 'Modern Furniture Hub',
            address: params.showroomAddress as string || '123, ABC Road, New Delhi',
            phone: params.showroomPhone as string || '9876543210',
        }
    };

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#000000',
        discount: '#34C759',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handleAddToCart = async () => {
        if (!user) return Alert.alert("Login Required", "Please login as a customer.");
        setIsAdding(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            // Upsert into cart table
            const { error } = await supabase
                .from('cart')
                .upsert({
                    user_id: user.id,
                    product_id: product.id, // Assuming product.id is string or int
                    quantity: quantity,
                    product_data: product, // Store generic JSON of snapshot if needed
                    added_at: new Date().toISOString()
                }, { onConflict: 'user_id, product_id' }); // Assuming composite key

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Added to Cart", "", [
                { text: "Continue", style: 'cancel' }
            ]);
        } catch (error: any) {
            console.error("Add to cart error", error);
            Alert.alert("Error", error.message || "Could not add to cart");
        } finally { setIsAdding(false); }
    };

    const handleCallShowroom = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL(`tel:${product.showroom.phone}`);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            <ImageViewing
                images={productImages.map(img => ({ uri: Image.resolveAssetSource(img).uri }))}
                imageIndex={currentImageIndex}
                visible={isImageViewerVisible}
                onRequestClose={() => setImageViewerVisible(false)}
            />

            {/* Dynamic Animated Header */}
            <Animated.View style={[styles.header, { height: insets.top + 60, paddingTop: insets.top }, headerAnimatedStyle]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>

                <Animated.View style={[styles.headerTitleWrapper, headerTitleAnimatedStyle]}>
                    <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{product.name}</Text>
                </Animated.View>

                <TouchableOpacity style={[styles.headerBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Feather name="heart" size={22} color={theme.text} />
                </TouchableOpacity>
            </Animated.View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120, alignItems: 'center' }}
            >
                <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH }}>
                    {/* Animated Product Image Container */}
                    <Animated.View style={[styles.imageContainer, imageAnimatedStyle as any]}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setImageViewerVisible(true)} style={{ flex: 1 }}>
                            <Image source={productImages[0]} style={styles.productImage} />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Product Details Area */}
                    <View style={[styles.detailsContainer, { backgroundColor: theme.background }]}>
                        <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />

                        <Text style={[styles.title, { color: theme.text }]}>{product.name}</Text>

                        <View style={styles.statsContainer}>
                            <View style={styles.ratingContainer}><Feather name="star" size={16} color="#FFB300" /><Text style={[styles.ratingText, { color: theme.text }]}>4.8 <Text style={{ color: theme.subtext, fontSize: 12 }}>(2,345)</Text></Text></View>
                            <View style={[styles.stockBadge, { backgroundColor: '#4CAF5015' }]}><Text style={{ color: '#4CAF50', fontSize: 10, fontWeight: '800' }}>IN STOCK</Text></View>
                        </View>

                        <View style={styles.priceSection}>
                            <Text style={[styles.price, { color: theme.text }]}>₹{product.price.toLocaleString('en-IN')}</Text>
                            <View style={styles.discountBadge}><Text style={styles.discountText}>40% OFF</Text></View>
                        </View>

                        {/* Showroom Info */}
                        <View style={[styles.showroomCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.showroomHeader}>
                                <View style={styles.showroomIcon}><MaterialCommunityIcons name="storefront-outline" size={24} color={theme.primary} /></View>
                                <View style={styles.showroomInfo}>
                                    <Text style={[styles.showroomLabel, { color: theme.subtext }]}>SOLD BY</Text>
                                    <Text style={[styles.showroomName, { color: theme.text }]}>{product.showroom.name}</Text>
                                </View>
                                <TouchableOpacity style={[styles.callBtn, { backgroundColor: theme.primary }]} onPress={handleCallShowroom}><Feather name="phone" size={20} color="#fff" /></TouchableOpacity>
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                            <View style={styles.addressRow}>
                                <Feather name="map-pin" size={16} color={theme.subtext} />
                                <Text style={[styles.addressText, { color: theme.subtext }]}>{product.showroom.address}</Text>
                            </View>
                        </View>

                        <View style={[styles.detailsSection, { borderTopColor: theme.border }]}><Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text><Text style={[styles.detailsText, { color: theme.subtext }]}>{product.description}</Text></View>

                        {/* Specifications */}
                        <View style={[styles.detailsSection, { borderTopColor: theme.border }]}>
                            <View style={styles.sectionHeaderRow}><Feather name="list" size={20} color={theme.primary} /><Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Specifications</Text></View>
                            <View style={styles.specContainer}>{product.specifications.map((spec, index) => (<View key={index} style={[styles.specRow, { borderBottomColor: theme.border, borderBottomWidth: index === product.specifications.length - 1 ? 0 : 1 }]}><Text style={[styles.specLabel, { color: theme.subtext }]}>{spec.label}</Text><Text style={[styles.specValue, { color: theme.text }]}>{spec.value}</Text></View>))}</View>
                        </View>

                        {/* Information Sections */}
                        <View style={[styles.detailsSection, { borderTopColor: theme.border }]}><View style={styles.sectionHeaderRow}><MaterialCommunityIcons name="shield-check-outline" size={20} color={theme.primary} /><Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Warranty</Text></View><Text style={[styles.detailsText, { color: theme.subtext }]}>{product.warranty}</Text></View>
                        <View style={[styles.detailsSection, { borderTopColor: theme.border }]}><View style={styles.sectionHeaderRow}><MaterialCommunityIcons name="hand-heart-outline" size={20} color={theme.primary} /><Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Care & Maintenance</Text></View><Text style={[styles.detailsText, { color: theme.subtext }]}>{product.care}</Text></View>
                        <View style={[styles.detailsSection, { borderTopColor: theme.border }]}><View style={styles.sectionHeaderRow}><Feather name="award" size={20} color={theme.primary} /><Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Brand Overview</Text></View><Text style={[styles.detailsText, { color: theme.subtext }]}>{product.brand}</Text></View>

                    </View>
                </View>
            </Animated.ScrollView>

            {/* Footer Actions */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity style={[styles.cartButton, { borderColor: theme.primary }]} onPress={handleAddToCart} disabled={isAdding}>
                    {isAdding ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.cartButtonText, { color: theme.primary }]}>Add to Cart</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.buyButton, { backgroundColor: theme.primary }]}><Text style={styles.buyButtonText}>Buy Now</Text></TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitleWrapper: { flex: 1, marginHorizontal: 12 },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    imageContainer: { width: '100%', height: IMAGE_HEIGHT, backgroundColor: '#fff' },
    productImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    detailsContainer: { padding: 20, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, paddingBottom: 40, zIndex: 10 },
    dragHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20, opacity: 0.3 },
    title: { fontSize: 22, fontWeight: '800' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { marginLeft: 6, fontWeight: '700' },
    stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    priceSection: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
    price: { fontSize: 28, fontWeight: '900', marginRight: 10 },
    discountBadge: { backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    discountText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    showroomCard: { marginTop: 24, padding: 16, borderRadius: 16, borderWidth: 1.5 },
    showroomHeader: { flexDirection: 'row', alignItems: 'center' },
    showroomIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(0, 0, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
    showroomInfo: { flex: 1, marginLeft: 12 },
    showroomLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    showroomName: { fontSize: 16, fontWeight: '800' },
    callBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, marginVertical: 12, opacity: 0.5 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addressText: { fontSize: 13, fontWeight: '500', flex: 1 },
    detailsSection: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '800' },
    detailsText: { fontSize: 14, lineHeight: 22 },
    specContainer: { backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 12, overflow: 'hidden' },
    specRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
    specLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
    specValue: { fontSize: 13, fontWeight: '700', flex: 1.5, textAlign: 'right' },
    footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, gap: 12 },
    cartButton: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    cartButtonText: { fontWeight: '800', fontSize: 16 },
    buyButton: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    buyButtonText: { fontWeight: '800', fontSize: 16, color: '#fff' },
});

export default ProductDetailsScreen;
