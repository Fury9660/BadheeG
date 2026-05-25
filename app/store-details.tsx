import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProductCard from '@/components/ProductCard';

const StoreDetailsScreen = () => {
    const { id } = useLocalSearchParams();
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();

    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [reviews, setReviews] = useState<any[]>([]);
    const [averageRating, setAverageRating] = useState(0);

    const isWeb = width > 768;

    const theme = {
        background: isDarkMode ? '#000' : '#F8F9FA', // Soft grey for contrast
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#111' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#666',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        border: isDarkMode ? '#222' : '#E5E5EA',
    };

    useEffect(() => {
        if (id) {
            fetchStoreDetails();
        }
    }, [id]);

    const fetchStoreDetails = async () => {
        setIsLoading(true);
        try {
            const { data: storeData, error: storeError } = await supabase
                .from('pre_approved_partners')
                .select('*')
                .eq('id', id)
                .single();

            if (storeError) throw storeError;
            setStore(storeData);

            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('*')
                .eq('partner_id', id);

            if (!productError) {
                setProducts(productData || []);
            }

            const { data: reviewData } = await supabase
                .from('reviews')
                .select('*')
                .eq('partner_id', id);

            if (reviewData) {
                setReviews(reviewData);
                if (reviewData.length > 0) {
                    const total = reviewData.reduce((acc: any, r: any) => acc + (r.rating || 0), 0);
                    setAverageRating(Number((total / reviewData.length).toFixed(1)));
                }
            }

        } catch (error) {
            console.error("Error fetching store details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!store) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>Store not found.</Text>
            </View>
        );
    }

    const storeImage = store.exterior_photo || store.store_image_url || null;

    const isWebPlatform = Platform.OS === 'web';

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: isWeb ? 70 : (isWebPlatform ? 0 : insets.top) }]}>
            <StatusBar barStyle={'light-content'} backgroundColor={'#000000'} />
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                <View style={{ width: '100%', maxWidth: isWeb ? 1400 : 500 }}>

                    {/* Elegant Header - Only visible on Mobile */}
                    {!isWeb && (
                        <View style={[styles.header, { backgroundColor: theme.background }]}>
                            <TouchableOpacity 
                                onPress={() => router.canGoBack() ? router.back() : router.replace('/')} 
                                style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
                            >
                                <Feather name="chevron-left" size={24} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>Showroom</Text>
                            <TouchableOpacity 
                                style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
                                onPress={() => {/* Handle Share or Info */}}
                            >
                                <Feather name="share-2" size={20} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                        {/* Luxury Store Hero */}
                        <View style={[
                            styles.storeHero,
                            { backgroundColor: theme.card, borderColor: theme.border },
                            isWeb && { padding: 48, borderRadius: 40, marginBottom: 40 }
                        ]}>
                            <View style={[isWeb ? { flexDirection: 'row', gap: 48 } : { flexDirection: 'column' }]}>
                                {storeImage && isWeb && (
                                    <View style={styles.heroImageWrapper}>
                                        <Image source={{ uri: storeImage }} style={styles.heroImage} contentFit="cover" />
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.heroTag, { color: theme.subtext }]}>EXCELLENCE PARTNER</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                        <Text style={[styles.storeName, { color: theme.text }, isWeb && { fontSize: 48 }]}>
                                            {store.store_name || store.business_name}
                                        </Text>
                                        <View style={[styles.verifiedBadge, { backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f0f0' }]}>
                                            <MaterialCommunityIcons name="check-decagram" size={16} color="#4BB543" />
                                            <Text style={[styles.verifiedText, { color: theme.subtext }]}>Verified Showroom</Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                                        <View style={[styles.ratingContainer]}>
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Feather 
                                                    key={s} 
                                                    name="star" 
                                                    size={14} 
                                                    color={s <= Math.floor(averageRating || 5) ? '#000' : '#ccc'} 
                                                    fill={s <= Math.floor(averageRating || 5) ? '#000' : 'transparent'} 
                                                />
                                            ))}
                                            <Text style={[styles.ratingValue, { color: theme.text }]}>
                                                {averageRating > 0 ? averageRating : '5.0'}
                                            </Text>
                                            <Text style={[styles.reviewCount, { color: theme.subtext }]}>
                                                ({reviews.length || 0} reviews)
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.infoDivider} />

                                    <View style={styles.infoGrid}>
                                        <View style={styles.infoItem}>
                                            <Feather name="user" size={16} color={theme.subtext} />
                                            <Text style={[styles.infoLabel, { color: theme.subtext }]}>Managed by</Text>
                                            <Text style={[styles.infoValue, { color: theme.text }]}>
                                                {store.full_name || store.owner_name}
                                            </Text>
                                        </View>
                                        <View style={styles.infoItem}>
                                            <Feather name="map-pin" size={16} color={theme.subtext} />
                                            <Text style={[styles.infoLabel, { color: theme.subtext }]}>Location</Text>
                                            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
                                                {store.city || 'Available In-Store'}
                                            </Text>
                                        </View>
                                    </View>


                                </View>
                            </View>
                        </View>

                        {/* Modern Luxury Search Bar */}
                        <View style={{ paddingHorizontal: 16, marginBottom: 32, alignItems: isWeb ? 'center' : 'stretch' }}>
                            <View style={[
                                styles.premiumSearch,
                                { backgroundColor: theme.card, borderColor: theme.border },
                                isWeb && { maxWidth: 640, width: '100%', height: 60, paddingHorizontal: 20, borderRadius: 20 }
                            ]}>
                                <Feather name="search" size={20} color={theme.subtext} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Search showroom inventory..."
                                    placeholderTextColor={theme.subtext}
                                    style={{ flex: 1, color: theme.text, fontSize: 16, height: '100%', fontWeight: '600' }}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Feather name="x" size={20} color={theme.subtext} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Products Section */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 24 }}>
                            <Text style={[styles.gridTitle, { color: theme.text }, isWeb && { fontSize: 32 }]}>
                                Showroom Inventory
                            </Text>
                            <View style={[styles.countBadge, { backgroundColor: theme.primary }]}>
                                <Text style={{ color: theme.card, fontWeight: '900' }}>{filteredProducts.length} Products</Text>
                            </View>
                        </View>

                        <View style={[styles.productGrid, isWeb && { gap: 24, paddingHorizontal: 0 }]}>
                            {filteredProducts.map((product, index) => {
                                const cardData = {
                                    ...product,
                                    title: product.name,
                                    image: product.image_url || product.image,
                                    price: product.price,
                                    crossPrice: product.mrp,
                                    showroomName: store.store_name || store.business_name
                                };

                                return (
                                    <View key={product.id} style={{ width: isWeb ? '18.5%' : '50%' }}>
                                        <ProductCard product={cardData} index={index} />
                                    </View>
                                );
                            })}

                            {filteredProducts.length === 0 && (
                                <View style={{ width: '100%', alignItems: 'center', marginTop: 60 }}>
                                    <View style={[styles.emptyIconContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                        <MaterialCommunityIcons name="package-variant-closed" size={64} color={theme.subtext} />
                                    </View>
                                    <Text style={{ color: theme.text, fontSize: 20, marginTop: 24, fontWeight: '900' }}>Inventory Empty</Text>
                                    <Text style={{ color: theme.subtext, fontSize: 16, marginTop: 8, fontWeight: '500' }}>This showroom hasn't added any products yet.</Text>
                                </View>
                            )}
                        </View>

                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    headerTitle: { fontSize: 20, fontWeight: '900' },

    storeHero: { margin: 10, padding: 20, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
    heroImageWrapper: { width: '100%', height: 250, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
    heroImage: { width: '100%', height: '100%' },
    heroTag: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6, opacity: 0.8 },
    storeName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    verifiedText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 },
    
    ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingValue: { fontSize: 14, fontWeight: '900', marginLeft: 4 },
    reviewCount: { fontSize: 13, fontWeight: '600', marginLeft: 4 },

    infoDivider: { height: 1.5, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 24 },
    infoGrid: { flexDirection: 'row', gap: 32 },
    infoItem: { gap: 4 },
    infoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    infoValue: { fontSize: 15, fontWeight: '800' },



    premiumSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },

    gridTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    countBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },

    emptyIconContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderStyle: 'solid', opacity: 0.2 },
});

export default StoreDetailsScreen;
