import CartIcon from '@/components/CartIcon';
import LoginDrawer from '@/components/LoginDrawer';
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Linking,
    Modal,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import Animated, {
    Extrapolate,
    FadeInDown,
    FadeOutDown,
    interpolate,
    interpolateColor,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isDesktopStart = width > 768; // Initial check, though component uses hook

const ProductDetailsScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const flatListRef = React.useRef<FlatList>(null);
    const { user } = useAuth();
    const params = useLocalSearchParams();

    const [quantity, setQuantity] = useState(1);
    const [isImageViewerVisible, setImageViewerVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [loginDrawerVisible, setLoginDrawerVisible] = useState(false);
    const [showARComingSoon, setShowARComingSoon] = useState(false);
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const isWebPlatform = Platform.OS === 'web';
    const IMAGE_HEIGHT = isDesktop ? 500 : width * 0.9;




    const headerAnimatedStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(scrollY.value, [0, 50], ['rgba(0,0,0,0)', isDarkMode ? '#1A1A1A' : '#f7f8fc']);
        const borderBottomWidth = interpolate(scrollY.value, [40, 60], [0, 1], Extrapolate.CLAMP);
        return { backgroundColor, borderBottomWidth, borderBottomColor: isDarkMode ? '#2C2C2C' : '#E5E5EA' };
    });

    const headerTitleAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [IMAGE_HEIGHT - 120, IMAGE_HEIGHT - 60], [0, 1], Extrapolate.CLAMP);
        return { opacity };
    });

    // Helper to fix malformed Firebase Storage URLs (missing encoding)
    const paramImage = params.image;
    const paramImagesStr = params.images;
    let parsedImages: { uri: string }[] = [];
    if (typeof paramImagesStr === 'string' && paramImagesStr.trim().length > 0) {
        try {
            const raw = JSON.parse(paramImagesStr);
            if (Array.isArray(raw)) {
                parsedImages = raw.map((img: any) => {
                    let uri = '';
                    if (typeof img === 'string') uri = img;
                    else if (img && img.uri) uri = img.uri;

                    return uri ? { uri } : null;
                }).filter((img): img is { uri: string } => !!img);
            }
        } catch (e) { console.log("Error parsing images:", e); }
    }
    if (parsedImages.length === 0 && paramImage && typeof paramImage === 'string') {
        parsedImages = [{ uri: paramImage }];
    }
    if (parsedImages.length === 0) {
        // No images found
    }

    // Helper to get source for Expo Image
    const getSource = (img: any) => {
        if (!img) return require('../assets/images/logo.png');
        if (img.uri) return { uri: img.uri };
        return require('../assets/images/logo.png');
    };

    const [fetchedProduct, setFetchedProduct] = useState<any>(null);
    const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 });
    const [latestReviews, setLatestReviews] = useState<any[]>([]);

    useEffect(() => {
        if (!params.id) return;
        const fetchProductDetails = async () => {
            console.log("Fetching details for Product ID:", params.id);
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('id', params.id)
                .single();

            if (productError) console.error("Error fetching product details:", productError);

            if (productData) {
                let finalProductData = { ...productData };

                const targetUserId = productData.partner_id || productData.user_id;

                if (targetUserId) {
                    const { data: linkedPartner } = await supabase
                        .from('pre_approved_partners')
                        .select('store_name, shop_address, mobile_number, city, status')
                        .eq('user_id', targetUserId)
                        .maybeSingle();

                    if (linkedPartner) {
                        const partner = linkedPartner as any;
                        if (partner.status && partner.status !== 'Active') {
                            Alert.alert("Notice", "This showroom is currently unavailable.");
                            router.back();
                            return;
                        }
                        finalProductData.showroom_name = partner.store_name;
                        finalProductData.showroom_address = `${partner.shop_address}, ${partner.city}`;
                        finalProductData.showroom_phone = partner.mobile_number;
                    } else {
                        const { data: idPartner } = await supabase
                            .from('pre_approved_partners')
                            .select('store_name, shop_address, mobile_number, city')
                            .eq('id', targetUserId)
                            .maybeSingle();

                        if (idPartner) {
                            const partner = idPartner as any;
                            finalProductData.showroom_name = partner.store_name;
                            finalProductData.showroom_address = `${partner.shop_address}, ${partner.city}`;
                            finalProductData.showroom_phone = partner.mobile_number;
                        } else {
                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('name, phone')
                                .eq('id', productData.user_id || productData.partner_id)
                                .maybeSingle();

                            if (profileData) {
                                if (!finalProductData.showroom_name || finalProductData.showroom_name === 'Showroom') {
                                    finalProductData.showroom_name = profileData.name || 'Seller Showroom';
                                }
                                finalProductData.showroom_phone = profileData.phone || finalProductData.showroom_phone;
                            }
                        }
                    }
                }

                const { data: reviews } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('product_id', params.id)
                    .order('created_at', { ascending: false });

                if (reviews && reviews.length > 0) {
                    const total = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
                    const avg = Number((total / reviews.length).toFixed(1));
                    setRatingStats({ average: avg, count: reviews.length });

                    const topReviews = reviews.slice(0, 8);
                    const userIds = [...new Set(topReviews.map(r => r.user_id))];

                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, name')
                        .in('id', userIds);

                    const reviewsWithNames = topReviews.map(r => {
                        const profile = profiles?.find(p => p.id === r.user_id);
                        return { ...r, user_name: profile?.name || 'Anonymous User' };
                    });
                    setLatestReviews(reviewsWithNames);
                }
                setFetchedProduct(finalProductData);
            }
        };
        fetchProductDetails();
    }, [params.id]);

    const product = {
        id: params.id as string || 'p1',
        name: fetchedProduct?.name || params.name as string || 'Ergonomic Leather Office Chair',
        price: fetchedProduct?.price || parseInt(params.price as string || '8999'),
        image: parsedImages.length > 0 ? parsedImages[0].uri : (typeof params.image === 'string' ? params.image : ''),
        category: fetchedProduct?.category || params.category as string || 'Furniture',
        description: fetchedProduct?.description || params.description as string || 'Experience unparalleled comfort with our ergonomic leather office chair. Designed for long hours of productivity with a premium feel.',
        warranty: fetchedProduct?.warranty || params.warranty as string || '12 Months Warranty',
        care: fetchedProduct?.care || params.care as string || 'Regularly dust with dry cloth. Avoid direct sunlight.',
        partnerId: fetchedProduct?.partner_id || params.partnerId as string || null,
        brand: fetchedProduct?.brand || params.brand as string || 'ComfortSeats Premium Collection',
        specifications: fetchedProduct?.specifications || (typeof params.specifications === 'string' && params.specifications ? JSON.parse(params.specifications) : (params.specifications || [
            { label: 'Upholstery', value: 'Premium Leather' },
            { label: 'Base', value: 'Heavy Duty Metal' },
            { label: 'Max Load', value: '150 KG' },
        ])),
        showroom: {
            name: fetchedProduct?.showroom_name || params.showroomName as string || 'Certified Partner',
            address: fetchedProduct?.showroom_address || params.showroomAddress as string || 'Showroom Address',
            phone: fetchedProduct?.showroom_phone || params.showroomPhone as string || 'Contact Number',
        }
    };

    // Debug log
    console.log("Parsed Images:", parsedImages);
    console.log("Current Image URI:", parsedImages[currentImageIndex]?.uri || product.image);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        discount: '#34C759',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handleAddToCart = async () => {
        if (!user) {
            setLoginDrawerVisible(true);
            return;
        }
        setIsAdding(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            // Check if item exists
            const { data: existingItems, error: fetchError } = await supabase
                .from('cart')
                .select('quantity')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existingItems) {
                // Update quantity
                const { error } = await supabase
                    .from('cart')
                    .update({ quantity: existingItems.quantity + quantity, updated_at: new Date() })
                    .eq('user_id', user.id)
                    .eq('product_id', product.id);
                if (error) throw error;
            } else {
                // Insert new item
                const { error } = await supabase
                    .from('cart')
                    .insert({
                        user_id: user.id,
                        product_id: product.id,
                        quantity: quantity,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        partner_id: product.partnerId,
                        details: {
                            description: product.description,
                            specifications: product.specifications,
                            showroom: product.showroom,
                            warranty: product.warranty,
                            care: product.care,
                            brand: product.brand
                        }
                    });
                if (error) throw error;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsAdded(true);
            setTimeout(() => {
                setIsAdded(false);
            }, 3000);

            // Removed the alert for smoother experience as requested by adding animation
        } catch (error) {
            console.error("Add to cart error:", error);
            Alert.alert("Error adding to cart");
        } finally { setIsAdding(false); }
    };

    const handleBuyNow = async () => {
        if (!user) {
            setLoginDrawerVisible(true);
            return;
        }
        setIsAdding(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            // Check if item exists
            const { data: existingItems, error: fetchError } = await supabase
                .from('cart')
                .select('quantity')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existingItems) {
                // Update quantity
                const { error } = await supabase
                    .from('cart')
                    .update({ quantity: existingItems.quantity + quantity, updated_at: new Date() })
                    .eq('user_id', user.id)
                    .eq('product_id', product.id);
                if (error) throw error;
            } else {
                // Insert new item
                const { error } = await supabase
                    .from('cart')
                    .insert({
                        user_id: user.id,
                        product_id: product.id,
                        quantity: quantity,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        partner_id: product.partnerId,
                        details: {
                            description: product.description,
                            specifications: product.specifications,
                            showroom: product.showroom,
                            warranty: product.warranty,
                            care: product.care,
                            brand: product.brand
                        }
                    });
                if (error) throw error;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/(tabs)/cart');
        } catch (error) {
            console.error("Buy Now error:", error);
            Alert.alert("Error", "Could not process request.");
        } finally { setIsAdding(false); }
    };

    const handleCallShowroom = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL(`tel:${product.showroom.phone}`);
    };

    const handleShare = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) { }

        try {
            const shareMessage = `Check out this ${product.name} on PartnerApp!\n\nPrice: ₹${product.price.toLocaleString('en-IN')}\n\n${product.description.substring(0, 100)}...`;
            const shareUrl = product.image;

            if (Platform.OS === 'web') {
                if (navigator.share) {
                    await navigator.share({
                        title: product.name,
                        text: shareMessage,
                        url: shareUrl || window.location.href,
                    });
                } else {
                    Alert.alert("Share", shareMessage + (shareUrl ? `\n\nLink: ${shareUrl}` : ""));
                }
            } else {
                const isSharingAvailable = await Sharing.isAvailableAsync();
                if (isSharingAvailable && shareUrl && shareUrl.startsWith('http')) {
                    // Try expo-sharing for better native interaction if it's a remote URL
                    await Sharing.shareAsync(shareUrl, {
                        dialogTitle: product.name,
                        UTI: 'public.item',
                    });
                } else {
                    // Fallback to standard RN Share
                    await Share.share({
                        title: product.name,
                        message: shareMessage + (shareUrl ? `\n\n${shareUrl}` : ""),
                        url: Platform.OS === 'ios' ? shareUrl : undefined,
                    });
                }
            }
        } catch (error: any) {
            console.error("Share error:", error);
            // Last resort fallback
            if (error.message !== 'User cancelled share') {
                Alert.alert("Notice", "Sharing is not available on this device right now.");
            }
        }
    };

    const handleViewInAR = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowARComingSoon(true);
        setTimeout(() => setShowARComingSoon(false), 2000);
    };

    if (isDesktop) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

                {/* Desktop Fixed Transparent Header */}
                <View style={{ 
                    // @ts-ignore
                    position: Platform.OS === 'web' ? 'fixed' : 'absolute', 
                    top: 0, left: 0, right: 0, 
                    height: 60, 
                    paddingHorizontal: 40, 
                    justifyContent: 'center',
                    backgroundColor: isDarkMode ? 'rgba(18,18,18,0.7)' : 'rgba(255,255,255,0.7)',
                    // @ts-ignore
                    backdropFilter: 'blur(15px)',
                    zIndex: 100,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border
                }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                        <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '700', color: theme.text }}>Back</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content */}
                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, paddingTop: 60 }}
                >
                    {/* Responsive Container: Max width 1280px, but adapts padding for smaller screens */}
                    <View style={{ maxWidth: 1280, width: '100%', alignSelf: 'center', padding: width < 1000 ? 20 : 40 }}>
                        {/* FlexWrap with Gap: Gap reduces on smaller screens */}
                        <View style={{ flexDirection: 'row', gap: width < 1000 ? 30 : 60, flexWrap: 'wrap' }}>

                            {/* Left: Image Gallery (Stick to top) */}
                            {/* Min width reduced to 400 to allow side-by-side on ~900px screens */}
                            <View style={{ 
                                flex: 1.2, 
                                minWidth: 400, 
                                // @ts-ignore
                                position: Platform.OS === 'web' ? 'sticky' : 'relative', 
                                top: Platform.OS === 'web' ? 90 : 0, 
                                alignSelf: 'flex-start' 
                            }}>
                                <View style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', backgroundColor: isDarkMode ? '#111' : '#F8F9FA', borderWidth: 1, borderColor: theme.border }}>
                                    <TouchableOpacity activeOpacity={0.9} onPress={() => setImageViewerVisible(true)}>
                                        <Image
                                            source={parsedImages.length > 0 && parsedImages[currentImageIndex]?.uri ? { uri: parsedImages[currentImageIndex].uri } : require('../assets/images/logo.png')}
                                            style={{ width: '100%', aspectRatio: 1 }}
                                            contentFit="cover"
                                        />
                                    </TouchableOpacity>

                                    {/* Action Buttons */}
                                    <View style={{
                                        position: 'absolute',
                                        bottom: 20,
                                        right: 20,
                                        flexDirection: 'row',
                                        gap: 12,
                                        zIndex: 10,
                                    }}>
                                        <TouchableOpacity
                                            onPress={handleViewInAR}
                                            style={[styles.desktopShareBtn, { position: 'relative', bottom: 0, right: 0, width: 'auto', paddingHorizontal: 16, backgroundColor: theme.card, flexDirection: 'row', gap: 8 }]}
                                        >
                                            <MaterialCommunityIcons name="cube-scan" size={20} color={theme.primary} />
                                            <Text style={{ fontWeight: '800', fontSize: 14, color: theme.primary }}>View in AR</Text>
                                            {showARComingSoon && (
                                                <View style={styles.comingSoonTagDesktop}>
                                                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleShare}
                                            style={[styles.desktopShareBtn, { position: 'relative', bottom: 0, right: 0, backgroundColor: theme.card }]}
                                        >
                                            <Feather name="share-2" size={22} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Thumbnails Row */}
                                {parsedImages.length > 1 && (
                                    <View style={{ flexDirection: 'row', marginTop: 20, gap: 12, flexWrap: 'wrap' }}>
                                        {parsedImages.map((img, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => setCurrentImageIndex(idx)}
                                                style={[
                                                    styles.thumbnailWrapper,
                                                    { borderColor: currentImageIndex === idx ? theme.primary : theme.border, borderWidth: 2 },
                                                    currentImageIndex === idx && { shadowColor: theme.primary, shadowOpacity: 0.2, shadowRadius: 10 }
                                                ]}
                                            >
                                                <Image
                                                    source={{ uri: img.uri }}
                                                    style={{ width: '100%', height: '100%', borderRadius: 10 }}
                                                    contentFit="cover"
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Right: Product Info */}
                            {/* Min width reduced to 350 to withstand narrower viewports */}
                            <View style={{ flex: 1, minWidth: 350 }}>
                                <View style={{ marginBottom: 8 }}>
                                    <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{product.category}</Text>
                                </View>
                                <Text style={[styles.title, { color: theme.text, fontSize: width < 1000 ? 22 : 28, fontWeight: '900', lineHeight: width < 1000 ? 28 : 36 }]}>{product.name}</Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 20 }}>
                                    <Text style={[styles.price, { color: theme.text, fontSize: 44, fontWeight: '900' }]}>₹{product.price.toLocaleString('en-IN')}</Text>
                                    <View style={[styles.discountBadge, { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }]}>
                                        <Text style={[styles.discountText, { fontSize: 16, fontWeight: '900' }]}>40% OFF</Text>
                                    </View>
                                </View>

                                {ratingStats.count > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 }}>
                                        <View style={{ flexDirection: 'row', gap: 2 }}>
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Feather key={i} name="star" size={18} color={i <= Math.round(ratingStats.average) ? "#FFD700" : theme.border} fill={i <= Math.round(ratingStats.average) ? "#FFD700" : "transparent"} />
                                            ))}
                                        </View>
                                        <Text style={{ color: theme.text, fontWeight: '800', fontSize: 18, marginLeft: 4 }}>{ratingStats.average}</Text>
                                        <Text style={{ color: theme.subtext, fontSize: 16 }}>({ratingStats.count} Verified Reviews)</Text>
                                    </View>
                                )}


                                <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 32 }} />

                                <Text style={{ fontSize: 17, lineHeight: 28, color: theme.subtext, fontWeight: '500' }}>{product.description}</Text>

                                {/* Desktop Action Buttons */}
                                <View style={{ flexDirection: 'row', gap: 20, marginTop: 40 }}>
                                    <TouchableOpacity
                                        style={[styles.desktopActionBtn, {
                                            flex: 1,
                                            backgroundColor: isAdded ? '#4CAF50' : theme.text,
                                            borderColor: isAdded ? '#4CAF50' : theme.text,
                                        }]}
                                        onPress={handleAddToCart}
                                        disabled={isAdding || isAdded}
                                    >
                                        {isAdding ? (
                                            <ActivityIndicator color={theme.card} />
                                        ) : isAdded ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <Feather name="check-circle" size={24} color={theme.card} />
                                                <Text style={[styles.desktopActionBtnText, { color: theme.card }]}>Already in Cart</Text>
                                            </View>
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <Feather name="shopping-cart" size={22} color={theme.card} />
                                                <Text style={[styles.desktopActionBtnText, { color: theme.card }]}>Add to Cart</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.desktopActionBtn, { flex: 0.8, backgroundColor: 'orange', borderColor: 'orange' }]}
                                        onPress={handleBuyNow}
                                    >
                                        <Text style={[styles.desktopActionBtnText, { color: '#fff' }]}>Buy Now</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Features Grid */}
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 40 }}>
                                    <View style={[styles.featureCard, { backgroundColor: isDarkMode ? '#111' : '#F8F9FA', borderColor: theme.border }]}>
                                        <MaterialCommunityIcons name="shield-check" size={24} color={theme.primary} />
                                        <View>
                                            <Text style={{ fontSize: 12, color: theme.subtext, fontWeight: '700' }}>Warranty</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>{product.warranty || "1 Year"}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.featureCard, { backgroundColor: isDarkMode ? '#111' : '#F8F9FA', borderColor: theme.border }]}>
                                        <MaterialCommunityIcons name="truck-delivery" size={24} color={theme.primary} />
                                        <View>
                                            <Text style={{ fontSize: 12, color: theme.subtext, fontWeight: '700' }}>Delivery</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>
                                                {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Specifications Section */}
                        <View style={{ marginTop: 80 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                                <View style={{ width: 4, height: 32, backgroundColor: theme.primary, borderRadius: 2 }} />
                                <Text style={{ fontSize: 28, fontWeight: '900', color: theme.text }}>Technical Specifications</Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
                                {product.specifications.map((spec: any, index: number) => (
                                    <View key={index} style={[styles.specItemDesktop, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                        <Text style={{ fontSize: 14, color: theme.subtext, fontWeight: '600' }}>{spec.label}</Text>
                                        <Text style={{ fontSize: 18, color: theme.text, fontWeight: '800', marginTop: 4 }}>{spec.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Premium Showroom Banner */}
                        <View style={[styles.premiumShowroomBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 32 }}>
                                <View style={styles.bannerIconWrapper}>
                                    <MaterialCommunityIcons name="storefront" size={40} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1, minWidth: 300 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.text }}>{product.showroom.name}</Text>
                                        <MaterialCommunityIcons name="check-decagram" size={22} color={theme.primary} />
                                    </View>
                                    <Text style={{ fontSize: 16, color: theme.subtext, marginTop: 8, lineHeight: 24 }}>{product.showroom.address}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 }}>

                                        <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 14 }}>Authorised Partner</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Care & Brand info */}
                        <View style={{ flexDirection: 'row', gap: 40, marginTop: 60, flexWrap: 'wrap' }}>
                            <View style={{ flex: 1, minWidth: 300 }}>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text, marginBottom: 16 }}>Product Care</Text>
                                <Text style={{ fontSize: 16, lineHeight: 26, color: theme.subtext }}>{product.care || "Regularly dust with dry cloth. Avoid direct sunlight and moisture."}</Text>
                            </View>
                            <View style={{ flex: 1, minWidth: 300 }}>
                                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text, marginBottom: 16 }}>Brand Information</Text>
                                <Text style={{ fontSize: 16, lineHeight: 26, color: theme.subtext }}>{product.brand || "Part of our Premium Collection, ensuring high quality materials and durability for long-term use."}</Text>
                            </View>
                        </View>

                        {/* Desktop Reviews */}
                        {latestReviews.length > 0 && (
                            <View style={{ marginTop: 80 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                                    <Text style={{ fontSize: 28, fontWeight: '900', color: theme.text }}>Verified Reviews</Text>
                                    <TouchableOpacity
                                        style={[styles.seeAllBtn, { borderColor: theme.border }]}
                                        onPress={() => router.push({ pathname: '/product-reviews', params: { id: product.id } })}
                                    >
                                        <Text style={{ color: theme.text, fontWeight: '700' }}>View All Reviews</Text>
                                        <Feather name="arrow-right" size={18} color={theme.text} />
                                    </TouchableOpacity>
                                </View>

                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
                                    {latestReviews.map((review) => (
                                        <View key={review.id} style={[styles.desktopReviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Text style={{ fontWeight: '900', color: theme.primary, fontSize: 18 }}>{review.user_name.charAt(0)}</Text>
                                                    </View>
                                                    <View>
                                                        <Text style={{ fontWeight: '800', color: theme.text, fontSize: 16 }}>{review.user_name}</Text>
                                                        <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>Verified Purchase</Text>
                                                    </View>
                                                </View>
                                                <View style={[styles.reviewRatingBadge, { backgroundColor: isDarkMode ? '#222' : '#FFF8E1' }]}>
                                                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFA000', marginRight: 4 }}>{review.rating}</Text>
                                                    <Feather name="star" size={12} color="#FFA000" fill="#FFA000" />
                                                </View>
                                            </View>
                                            <Text style={{ color: theme.subtext, fontSize: 15, lineHeight: 24, fontStyle: 'italic' }}>"{review.comment || 'No comment provided.'}"</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {Platform.OS === 'web' ? (
                    <Modal visible={isImageViewerVisible} transparent={true} animationType="fade" onRequestClose={() => setImageViewerVisible(false)}>
                        <View style={styles.webModalOverlay}>
                            <TouchableOpacity style={styles.webCloseBtn} onPress={() => setImageViewerVisible(false)}>
                                <Feather name="x" size={30} color="#fff" />
                            </TouchableOpacity>
                            <Image
                                source={{ uri: parsedImages[currentImageIndex]?.uri }}
                                style={{ width: '90%', height: '85%' }}
                                contentFit="contain"
                            />
                            {/* Simple Prev/Next for Web if needed, currently just one or main click */}
                        </View>
                    </Modal>
                ) : (
                    <ImageViewing
                        images={parsedImages}
                        imageIndex={currentImageIndex}
                        visible={isImageViewerVisible}
                        onRequestClose={() => setImageViewerVisible(false)}
                    />
                )}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {Platform.OS === 'web' ? (
                <Modal visible={isImageViewerVisible} transparent={true} animationType="fade" onRequestClose={() => setImageViewerVisible(false)}>
                    <View style={styles.webModalOverlay}>
                        <TouchableOpacity style={styles.webCloseBtn} onPress={() => setImageViewerVisible(false)}>
                            <Feather name="x" size={30} color="#fff" />
                        </TouchableOpacity>

                        {/* Navigation Buttons for Web */}
                        {parsedImages.length > 1 && (
                            <>
                                <TouchableOpacity
                                    style={[styles.webNavBtn, { left: 20 }]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex((prev) => (prev - 1 + parsedImages.length) % parsedImages.length);
                                    }}
                                >
                                    <Feather name="chevron-left" size={40} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.webNavBtn, { right: 20 }]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setCurrentImageIndex((prev) => (prev + 1) % parsedImages.length);
                                    }}
                                >
                                    <Feather name="chevron-right" size={40} color="#fff" />
                                </TouchableOpacity>
                            </>
                        )}

                        <Image
                            source={{ uri: parsedImages[currentImageIndex]?.uri }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="contain"
                        />

                        {parsedImages.length > 1 && (
                            <View style={{ position: 'absolute', bottom: 30, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{currentImageIndex + 1} / {parsedImages.length}</Text>
                            </View>
                        )}
                    </View>
                </Modal>
            ) : (
                <ImageViewing
                    images={parsedImages}
                    imageIndex={currentImageIndex}
                    visible={isImageViewerVisible}
                    onRequestClose={() => setImageViewerVisible(false)}
                />
            )}

            {/* Dynamic Animated Header - Native Only */}
            {!isWebPlatform && (
                <Animated.View style={[styles.header, { height: insets.top + 60, paddingTop: insets.top }, headerAnimatedStyle]}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)' }]}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>

                    <Animated.View style={[styles.headerTitleWrapper, headerTitleAnimatedStyle]}>
                        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{product.name}</Text>
                    </Animated.View>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)' }]}>
                            <Feather name="heart" size={22} color={theme.text} />
                        </TouchableOpacity>
                        
                        <CartIcon 
                            color={theme.text} 
                            size={24} 
                            style={[styles.headerBtn, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)' }]} 
                        />
                    </View>
                </Animated.View>
            )}

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for FAB
            >
                {/* Static Product Image Carousel */}
                <View style={styles.imageContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={parsedImages.length > 1 ? [parsedImages[parsedImages.length - 1], ...parsedImages, parsedImages[0]] : (parsedImages.length > 0 ? parsedImages : [{ uri: require('../assets/images/logo.png') }])}
                        initialScrollIndex={parsedImages.length > 1 ? 1 : 0}
                        horizontal
                        pagingEnabled
                        snapToInterval={width}
                        snapToAlignment="start"
                        decelerationRate={0}
                        disableIntervalMomentum={true}
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, index) => index.toString()}
                        onScroll={(ev) => {
                            const x = ev.nativeEvent.contentOffset.x;
                            const index = Math.round(x / width);
                            if (parsedImages.length > 1) {
                                let displayIdx = index - 1;
                                if (displayIdx < 0) displayIdx = parsedImages.length - 1;
                                else if (displayIdx >= parsedImages.length) displayIdx = 0;
                                if (displayIdx !== currentImageIndex) setCurrentImageIndex(displayIdx);
                            } else {
                                if (index !== currentImageIndex) setCurrentImageIndex(index);
                            }
                        }}
                        onMomentumScrollEnd={(ev) => {
                            if (parsedImages.length <= 1) return;
                            const x = ev.nativeEvent.contentOffset.x;
                            const index = Math.round(x / width);
                            if (index === 0) {
                                flatListRef.current?.scrollToIndex({ index: parsedImages.length, animated: false });
                            } else if (index === parsedImages.length + 1) {
                                flatListRef.current?.scrollToIndex({ index: 1, animated: false });
                            }
                        }}
                        scrollEventThrottle={16}
                        getItemLayout={(data, index) => ({
                            length: width,
                            offset: width * index,
                            index,
                        })}
                        renderItem={({ item }) => (
                            <TouchableOpacity activeOpacity={1} onPress={() => setImageViewerVisible(true)} style={{ width: width, height: 500, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                                <Image
                                    source={item.uri ? { uri: item.uri } : require('../assets/images/logo.png')}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    transition={200}
                                />
                                {/* Gradient Overlay for seamless transition */}
                                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'transparent' }} />
                            </TouchableOpacity>
                        )}
                    />

                    {/* Pagination Dots */}
                    {parsedImages.length > 1 && (
                        <View style={{ position: 'absolute', bottom: 12, flexDirection: 'row', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                            {parsedImages.map((_, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => {
                                        setCurrentImageIndex(idx);
                                        const targetIdx = parsedImages.length > 1 ? idx + 1 : idx;
                                        flatListRef.current?.scrollToIndex({ index: targetIdx, animated: true });
                                    }}
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: currentImageIndex === idx ? '#fff' : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)'),
                                        marginHorizontal: 4
                                    }}
                                />
                            ))}
                        </View>
                    )}

                    {/* Floating Action Buttons - Mobile Image Corner */}
                    <View style={{
                        position: 'absolute',
                        bottom: parsedImages.length > 1 ? 48 : 8,
                        right: 8,
                        flexDirection: 'row',
                        gap: 8,
                        zIndex: 10,
                    }}>
                        <TouchableOpacity
                            onPress={handleViewInAR}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                height: 44,
                                borderRadius: 22,
                                paddingHorizontal: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 3.84,
                                elevation: 5,
                                gap: 6,
                            }}
                        >
                            <MaterialCommunityIcons name="cube-scan" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                            <Text style={{ fontWeight: '800', fontSize: 13, color: isDarkMode ? '#FFFFFF' : '#000000' }}>View in AR</Text>
                            {showARComingSoon && (
                                <View style={styles.comingSoonTagMobile}>
                                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleShare}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                        >
                            <Feather name="share-2" size={20} color="#121212" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Product Details Area - No Overlap */}
                <View style={[styles.detailsContainer, { backgroundColor: theme.background, paddingTop: 24, paddingHorizontal: 24, minHeight: 800 }]}>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: theme.text, fontSize: 18, fontWeight: '600', lineHeight: 24 }]}>{product.name}</Text>
                            <Text style={{ color: theme.subtext, fontSize: 13, marginTop: 4 }}>{product.category}</Text>
                        </View>
                    </View>

                    <View style={[styles.priceSection, { marginTop: 24, alignItems: 'center', justifyContent: 'flex-start', gap: 12 }]}>
                        <Text style={[styles.price, { color: theme.primary, fontSize: 32 }]}>₹{product.price.toLocaleString('en-IN')}</Text>
                        <View style={[styles.discountBadge, { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }]}>
                            <Text style={[styles.discountText, { color: '#2E7D32', fontWeight: '700' }]}>40% OFF</Text>
                        </View>
                    </View>

                    {/* Rating Section */}
                    {ratingStats.count > 0 && (
                        <TouchableOpacity onPress={() => {/* Scroll to reviews */ }} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                            <View style={{ flexDirection: 'row', gap: 2 }}>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Feather key={i} name="star" size={16} color={i <= Math.round(ratingStats.average) ? "#FFC107" : theme.border} fill={i <= Math.round(ratingStats.average) ? "#FFC107" : "transparent"} />
                                ))}
                            </View>
                            <Text style={{ color: theme.text, fontWeight: '600', marginLeft: 8 }}>{ratingStats.average}</Text>
                            <Text style={{ color: theme.subtext, marginLeft: 4 }}>({ratingStats.count} reviews)</Text>
                            <Feather name="chevron-right" size={16} color={theme.subtext} style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                    )}


                    {/* Action Buttons in Page Content */}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                        <TouchableOpacity
                            style={[
                                styles.cartButton,
                                {
                                    flex: 1,
                                    backgroundColor: isAdded ? '#4CAF50' : 'transparent',
                                    borderColor: isAdded ? '#4CAF50' : (isDarkMode ? '#fff' : '#121212'),
                                    borderWidth: 2,
                                    borderRadius: 12,
                                    height: 54,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    gap: 8
                                }
                            ]}
                            onPress={handleAddToCart}
                            disabled={isAdding || isAdded}
                        >
                            {isAdding ? (
                                <ActivityIndicator color="#121212" />
                            ) : isAdded ? (
                                <>
                                    <Feather name="check" size={22} color="#fff" />
                                    <Text style={[styles.cartButtonText, { color: '#fff', fontSize: 16, fontWeight: '700' }]}>Added</Text>
                                </>
                            ) : (
                                <Text style={[styles.cartButtonText, { color: isDarkMode ? '#fff' : '#121212', fontSize: 16, fontWeight: '700' }]}>Add to Cart</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.buyButton, { flex: 1, backgroundColor: isDarkMode ? '#fff' : '#121212', borderRadius: 12, height: 54, alignItems: 'center', justifyContent: 'center' }]}
                            onPress={handleBuyNow}
                        >
                            <Text style={[styles.buyButtonText, { color: isDarkMode ? '#000' : '#fff', fontSize: 16, fontWeight: '700' }]}>Buy Now</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 24 }]} />

                    {/* Showroom Info - Modern Card */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: theme.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="storefront-outline" size={24} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: theme.subtext, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' }}>Sold By</Text>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 2 }}>{product.showroom.name}</Text>
                            <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 2 }} numberOfLines={1}>{product.showroom.address}</Text>
                        </View>
                        <TouchableOpacity
                            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}
                            onPress={handleCallShowroom}
                        >
                            <Feather name="phone" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Product Description */}
                    <View style={{ marginTop: 32 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18, marginBottom: 12 }]}>Description</Text>
                        {product.description.split('\n').filter((p: string) => p.trim().length > 0).map((point: string, index: number) => (
                            <View key={index} style={{ flexDirection: 'row', marginBottom: 8, paddingRight: 16 }}>
                                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: theme.primary, marginTop: 8, marginRight: 12 }} />
                                <Text style={[styles.detailsText, { color: theme.subtext, lineHeight: 22, fontSize: 15, flex: 1 }]}>
                                    {point.trim().replace(/^[•\-\*]\s*/, '')}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Specifications */}
                    <View style={{ marginTop: 32 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18, marginBottom: 16 }]}>Specifications</Text>
                        <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16 }}>
                            {product.specifications.map((spec: any, index: number) => (
                                <View key={index} style={{ flexDirection: 'row', paddingVertical: 12, borderBottomWidth: index === product.specifications.length - 1 ? 0 : 1, borderBottomColor: theme.border }}>
                                    <Text style={{ flex: 1, color: theme.subtext, fontSize: 15 }}>{spec.label}</Text>
                                    <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: '500', textAlign: 'right' }}>{spec.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Extra Info Grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
                        <View style={{ flex: 1, minWidth: '45%', backgroundColor: theme.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                            <MaterialCommunityIcons name="shield-check-outline" size={24} color={theme.primary} style={{ marginBottom: 8 }} />
                            <Text style={{ color: theme.subtext, fontSize: 12 }}>Warranty</Text>
                            <Text style={{ color: theme.text, fontWeight: '600', marginTop: 2 }}>{product.warranty || "NA"}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: '45%', backgroundColor: theme.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                            <MaterialCommunityIcons name="truck-delivery-outline" size={24} color={theme.primary} style={{ marginBottom: 8 }} />
                            <Text style={{ color: theme.subtext, fontSize: 12 }}>Delivery By</Text>
                            <Text style={{ color: theme.text, fontWeight: '600', marginTop: 2 }}>
                                {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                        <View style={{ flex: 1, minWidth: '45%', backgroundColor: theme.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                            <MaterialCommunityIcons name="cube-outline" size={24} color={theme.primary} style={{ marginBottom: 8 }} />
                            <Text style={{ color: theme.subtext, fontSize: 12 }}>Return Policy</Text>
                            <Text style={{ color: theme.text, fontWeight: '600', marginTop: 2 }}>48 Hours Return</Text>
                        </View>
                    </View>

                    {/* Brand & Care - Accordion style simplified */}
                    <View style={{ marginTop: 32, gap: 24 }}>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Care Instructions</Text>
                            <Text style={{ color: theme.subtext, lineHeight: 22 }}>{product.care || "NA"}</Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 }}>Brand Overview</Text>
                            <Text style={{ color: theme.subtext, lineHeight: 22 }}>{product.brand}</Text>
                        </View>
                    </View>

                    {/* Customer Reviews List */}
                    {latestReviews.length > 0 && (
                        <View style={{ marginTop: 40, marginBottom: 40 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Reviews ({ratingStats.count})</Text>
                                <TouchableOpacity onPress={() => router.push({ pathname: '/product-reviews', params: { id: product.id } })}>
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>See All</Text>
                                </TouchableOpacity>
                            </View>

                            {latestReviews.map((review) => (
                                <View key={review.id} style={{ marginBottom: 16, backgroundColor: theme.card, padding: 16, borderRadius: 12 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
                                                <Text style={{ fontWeight: '700', color: theme.subtext }}>{review.user_name.charAt(0)}</Text>
                                            </View>
                                            <Text style={{ fontWeight: '600', color: theme.text }}>{review.user_name}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#333' : '#FFF8E1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFA000', marginRight: 2 }}>{review.rating}</Text>
                                            <Feather name="star" size={10} color="#FFA000" fill="#FFA000" />
                                        </View>
                                    </View>
                                    <Text style={{ color: theme.subtext, fontSize: 14, lineHeight: 20 }}>{review.comment || 'No comment provided.'}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Animated.ScrollView>
            
            <LoginDrawer isVisible={loginDrawerVisible} onClose={() => setLoginDrawerVisible(false)} />

            {/* Added to Cart Toast */}
            {isAdded && (
                <Animated.View 
                    entering={FadeInDown.springify()} 
                    exiting={FadeOutDown}
                    style={[styles.addedToast, { backgroundColor: isDarkMode ? '#fff' : '#000', bottom: insets.bottom + 80 }]}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Feather name="check-circle" size={20} color={isDarkMode ? '#000' : '#fff'} />
                        <Text style={[styles.addedToastText, { color: isDarkMode ? '#000' : '#fff' }]}>Added to Cart</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => router.push('/(tabs)/cart')}
                        style={[styles.viewCartBtn, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}
                    >
                        <Text style={[styles.viewCartBtnText, { color: isDarkMode ? '#fff' : '#000' }]}>VIEW CART</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
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

    imageContainer: { width: width, height: 450, backgroundColor: 'transparent', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' }, // Added slight bottom curve
    productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    detailsContainer: { padding: 20, paddingBottom: 40, zIndex: 10 },
    dragHandle: { display: 'none' },
    title: { fontSize: 22, fontWeight: '700' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    priceSection: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
    price: { fontSize: 28, fontWeight: '900', marginRight: 10 },
    discountBadge: { backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    discountText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    showroomCard: { marginTop: 24, padding: 16, borderRadius: 16, borderWidth: 1.5 },
    showroomHeader: { flexDirection: 'row', alignItems: 'center' },
    showroomIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(52, 102, 246, 0.1)', justifyContent: 'center', alignItems: 'center' },
    showroomInfo: { flex: 1, marginLeft: 12 },
    showroomLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    showroomName: { fontSize: 16, fontWeight: '800' },
    callBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, marginVertical: 12, opacity: 0.5 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addressText: { fontSize: 13, fontWeight: '500', flex: 1 },
    detailsSection: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderColor: 'rgba(150,150,150,0.1)' },
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
    fabContainer: { position: 'absolute', bottom: 0, width: '100%', elevation: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },

    // Web Modal Styles
    webModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    webCloseBtn: { position: 'absolute', top: 40, right: 40, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    webNavBtn: { position: 'absolute', top: '50%', marginTop: -25, zIndex: 10, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30 },

    // Desktop Specific Styles
    desktopShareBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        zIndex: 10,
    },
    thumbnailWrapper: {
        width: 90,
        height: 90,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    desktopActionBtn: {
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    desktopActionBtnText: {
        fontSize: 18,
        fontWeight: '900',
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        minWidth: 180,
    },
    specItemDesktop: {
        flex: 1,
        minWidth: 200,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    premiumShowroomBanner: {
        marginTop: 60,
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    bannerIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: 'rgba(52, 102, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerCallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
        paddingVertical: 20,
        borderRadius: 24,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        borderWidth: 1,
    },
    desktopReviewCard: {
        width: 580,
        padding: 32,
        borderRadius: 32,
        borderWidth: 1,
    },
    reviewRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    comingSoonTagDesktop: {
        position: 'absolute',
        top: -40,
        left: '50%',
        marginLeft: -50,
        backgroundColor: '#000000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        width: 100,
        alignItems: 'center',
    },
    comingSoonTagMobile: {
        position: 'absolute',
        top: -45,
        alignSelf: 'center',
        backgroundColor: '#000000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    comingSoonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
    },
    modalCloseBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
    modalCloseBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    // Added Toast Styles
    addedToast: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 60,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        zIndex: 9999,
    },
    addedToastText: { fontSize: 15, fontWeight: '700' },
    viewCartBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    viewCartBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }
});

export default ProductDetailsScreen;
