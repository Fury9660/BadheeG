
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../config/supabaseConfig';
import { useAuth } from '../../../store/AuthContext';
import { useTheme } from '../../../store/ThemeContext';

const InventoryScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // Grid Layout Logic
    // Responsive breakpoints
    let numColumns = 2;
    if (width >= 1200) numColumns = 5;
    else if (width >= 900) numColumns = 4;
    else if (width >= 600) numColumns = 3;

    const gap = 16;
    const padding = 20;
    // On web, layout width often includes scrollbar, but viewport doesn't, leading to overflow.
    // Subtract explicit buffer for scrollbar to be safe.
    const scrollbarBuffer = Platform.OS === 'web' ? 17 : 0;
    const availableWidth = width - (padding * 2) - (gap * (numColumns - 1)) - scrollbarBuffer;
    const itemWidth = availableWidth / numColumns;

    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    const theme = {
        background: '#FFFFFF', // White background from screenshot
        text: '#000000',
        subtext: '#666666',
        card: '#FFFFFF',
        border: '#E5E7EB',
        primary: '#000000',
        secondary: '#10B981',
        danger: '#EF4444',
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setProducts(data);
                setLoading(false);
            }
            if (error) throw error;
        } catch (error) {
            console.error("Error fetching products", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        fetchData();

        const channel = supabase.channel(`inventory-realtime-${user.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'products', filter: `partner_id=eq.${user.id}` },
                () => {
                    console.log("Real-time update: Refreshing inventory...");
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchData]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    useEffect(() => {
        if (!searchQuery) {
            setFilteredProducts(products);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredProducts(products.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query)
            ));
        }
    }, [searchQuery, products]);

    const toggleStock = async (id: string, currentStatus: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Optimistic update
        setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock: !currentStatus } : p));

        try {
            const { error } = await supabase.from('products').update({ in_stock: !currentStatus }).eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error("Stock update failed", error);
            Alert.alert("Error", "Failed to update status");
            // Revert on error would go here
        }
    };

    const renderProductItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={[styles.productCard, { width: itemWidth, marginBottom: gap }]}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/300' }}
                    style={styles.productImage}
                    resizeMode="cover"
                />
                <View style={styles.stockToggle}>
                    <Switch
                        value={item.in_stock !== false}
                        onValueChange={() => toggleStock(item.id, item.in_stock !== false)}
                        trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                        thumbColor={'#FFFFFF'}
                        ios_backgroundColor="#D1D5DB"
                        style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                    />
                </View>
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productBrand} numberOfLines={1}>{item.brand || 'Generic'}</Text>

                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>₹{item.price?.toLocaleString() || '0'}</Text>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/add-product', params: { id: item.id } })}>
                        <Feather name="edit-2" size={16} color="#666666" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Catalog</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/add-product')}
                >
                    <Feather name="plus" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Feather name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Grid Content */}
            {loading ? (
                <View style={styles.center}><ActivityIndicator color="#000" /></View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={item => item.id}
                    renderItem={renderProductItem}
                    numColumns={numColumns}
                    key={numColumns} // Force re-render on column change
                    columnWrapperStyle={{ gap }}
                    contentContainerStyle={{ paddingHorizontal: padding, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    title: { fontSize: 28, fontWeight: '800', color: '#000' },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
            },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            }
        })
    },
    searchContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        height: 48,
        paddingHorizontal: 16,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: '#000' },

    // Product Card
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        // No shadow/elevation as per screenshot aesthetic (clean look)
    },
    imageContainer: {
        height: 140,
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    productImage: { width: '100%', height: '100%' },
    stockToggle: {
        position: 'absolute',
        top: 8,
        right: 8,
        transform: [{ scale: 0.8 }], // Make switch smaller
    },
    productInfo: {
        marginTop: 8,
    },
    productName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#000',
        lineHeight: 18,
        marginBottom: 2,
    },
    productBrand: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000',
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
});

export default InventoryScreen;
