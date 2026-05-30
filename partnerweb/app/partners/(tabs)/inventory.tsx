
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
    ScrollView,
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

const isPlaceholder = (name: string) => name?.startsWith('Modern Furniture Craft —');

const InventoryScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    let numColumns = 2;
    if (width >= 1200) numColumns = 5;
    else if (width >= 900) numColumns = 4;
    else if (width >= 600) numColumns = 3;

    const gap = 16;
    const padding = 20;
    const scrollbarBuffer = Platform.OS === 'web' ? 17 : 0;
    const availableWidth = width - (padding * 2) - (gap * (numColumns - 1)) - scrollbarBuffer;
    const itemWidth = availableWidth / numColumns;

    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [editValues, setEditValues] = useState<Record<string, { name: string; price: string; category: string; mrp: string }>>({});
    const [saving, setSaving] = useState(false);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const { user } = useAuth();

    const theme = {
        background: '#FFFFFF',
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
                .order('in_stock', { ascending: true }) // Show out-of-stock (placeholders) first
                .order('created_at', { ascending: false });

            if (data) {
                setProducts(data);
                // Initialize edit values for all products
                const initVals: typeof editValues = {};
                data.forEach(p => {
                    initVals[p.id] = {
                        name: isPlaceholder(p.name) ? '' : (p.name || ''),
                        price: p.price === 1 || p.price === 0 ? '' : String(p.price || ''),
                        category: p.category || 'Furniture',
                        mrp: p.mrp === 1 || p.mrp === 0 ? '' : String(p.mrp || ''),
                    };
                });
                setEditValues(initVals);
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
                () => fetchData()
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, fetchData]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

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
        setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock: !currentStatus } : p));
        try {
            const { error } = await supabase.from('products').update({ in_stock: !currentStatus }).eq('id', id);
            if (error) throw error;
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
        }
    };

    // Save a single product inline
    const saveSingle = async (item: any) => {
        const vals = editValues[item.id];
        if (!vals?.name?.trim()) {
            Alert.alert('Product ka naam daalo pehle!');
            return;
        }
        const price = parseFloat(vals.price) || 0;
        const mrp = parseFloat(vals.mrp) || price;
        try {
            const { error } = await supabase.from('products').update({
                name: vals.name.trim(),
                price,
                mrp,
                category: vals.category || 'Furniture',
                in_stock: price > 0,
                updated_at: new Date().toISOString(),
            }).eq('id', item.id);
            if (!error) {
                setSavedIds(prev => new Set([...prev, item.id]));
                setProducts(prev => prev.map(p => p.id === item.id ? {
                    ...p,
                    name: vals.name.trim(),
                    price,
                    mrp,
                    category: vals.category || 'Furniture',
                    in_stock: price > 0,
                } : p));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (e) {
            Alert.alert('Error saving product');
        }
    };

    // Save ALL placeholder products at once
    const saveAll = async () => {
        setSaving(true);
        let successCount = 0;
        let skipped = 0;
        const placeholderProducts = products.filter(p => isPlaceholder(p.name));

        for (const item of placeholderProducts) {
            const vals = editValues[item.id];
            if (!vals?.name?.trim() || !vals?.price) {
                skipped++;
                continue;
            }
            const price = parseFloat(vals.price) || 0;
            const mrp = parseFloat(vals.mrp) || price;
            const { error } = await supabase.from('products').update({
                name: vals.name.trim(),
                price,
                mrp,
                category: vals.category || 'Furniture',
                in_stock: price > 0,
                updated_at: new Date().toISOString(),
            }).eq('id', item.id);
            if (!error) {
                successCount++;
                setSavedIds(prev => new Set([...prev, item.id]));
            }
        }

        setSaving(false);
        Alert.alert('Done!', `${successCount} products save ho gaye!\n${skipped} products mein naam/price missing tha.`);
        fetchData();
        if (skipped === 0) setBulkEditMode(false);
    };

    const updateField = (id: string, field: string, value: string) => {
        setEditValues(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    };

    const pendingCount = products.filter(p => isPlaceholder(p.name)).length;

    const renderProductItem = ({ item, index }: { item: any, index: number }) => {
        const isPholder = isPlaceholder(item.name);
        const vals = editValues[item.id] || { name: '', price: '', category: 'Furniture', mrp: '' };
        const isSaved = savedIds.has(item.id);

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 30).springify()}
                style={[
                    styles.productCard,
                    { width: itemWidth, marginBottom: gap },
                    isPholder && bulkEditMode && { borderWidth: 2, borderColor: '#F59E0B', borderRadius: 12 },
                    isSaved && { borderWidth: 2, borderColor: '#10B981', borderRadius: 12 },
                ]}
            >
                {/* Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.image || 'https://via.placeholder.com/300' }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    {/* Saved badge */}
                    {isSaved && (
                        <View style={styles.savedBadge}>
                            <Feather name="check" size={12} color="#fff" />
                            <Text style={styles.savedBadgeText}>Saved!</Text>
                        </View>
                    )}
                    {/* Placeholder badge */}
                    {isPholder && !isSaved && (
                        <View style={styles.pendingBadge}>
                            <Feather name="edit-3" size={10} color="#fff" />
                            <Text style={styles.pendingBadgeText}>Fill Details</Text>
                        </View>
                    )}
                    {/* Stock toggle */}
                    {!bulkEditMode && (
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
                    )}
                </View>

                <View style={styles.productInfo}>
                    {/* BULK EDIT MODE: Show input fields */}
                    {bulkEditMode && isPholder && !isSaved ? (
                        <View style={styles.editFields}>
                            <TextInput
                                style={styles.editInput}
                                placeholder="Product ka naam *"
                                placeholderTextColor="#9CA3AF"
                                value={vals.name}
                                onChangeText={v => updateField(item.id, 'name', v)}
                            />
                            <View style={styles.priceRowEdit}>
                                <TextInput
                                    style={[styles.editInput, { flex: 1 }]}
                                    placeholder="Price ₹ *"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={vals.price}
                                    onChangeText={v => updateField(item.id, 'price', v)}
                                />
                                <TextInput
                                    style={[styles.editInput, { flex: 1 }]}
                                    placeholder="MRP ₹"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={vals.mrp}
                                    onChangeText={v => updateField(item.id, 'mrp', v)}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.saveSingleBtn}
                                onPress={() => saveSingle(item)}
                            >
                                <Feather name="check" size={14} color="#fff" />
                                <Text style={styles.saveSingleText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // NORMAL VIEW
                        <>
                            <Text style={[styles.productName, isPholder && { color: '#F59E0B' }]} numberOfLines={2}>
                                {isPholder ? '⚠️ Naam missing — Edit karo' : item.name}
                            </Text>
                            <Text style={styles.productBrand} numberOfLines={1}>{item.brand || item.category || 'Furniture'}</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.productPrice}>
                                    {item.price > 1 ? `₹${item.price?.toLocaleString()}` : 'Price set karo'}
                                </Text>
                                <TouchableOpacity onPress={() => router.push({ pathname: '/add-product', params: { id: item.id } })}>
                                    <Feather name="edit-2" size={16} color="#666666" />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Catalog</Text>
                    {pendingCount > 0 && (
                        <Text style={styles.pendingWarning}>
                            ⚠️ {pendingCount} products ko details chahiye
                        </Text>
                    )}
                </View>
                <View style={styles.headerActions}>
                    {pendingCount > 0 && (
                        <TouchableOpacity
                            style={[styles.bulkEditBtn, bulkEditMode && { backgroundColor: '#10B981' }]}
                            onPress={() => setBulkEditMode(!bulkEditMode)}
                        >
                            <Feather name={bulkEditMode ? "x" : "edit-3"} size={16} color="#fff" />
                            <Text style={styles.bulkEditText}>{bulkEditMode ? 'Close' : 'Bulk Edit'}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/add-product')}
                    >
                        <Feather name="plus" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* BULK EDIT BANNER */}
            {bulkEditMode && pendingCount > 0 && (
                <View style={styles.bulkBanner}>
                    <View>
                        <Text style={styles.bulkBannerTitle}>🚀 Bulk Edit Mode — {pendingCount} products pending</Text>
                        <Text style={styles.bulkBannerSub}>Har product ke neeche naam aur price dalo, phir "Save All" karo</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveAllBtn, saving && { opacity: 0.6 }]}
                        onPress={saveAll}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                            <>
                                <Feather name="save" size={14} color="#fff" />
                                <Text style={styles.saveAllText}>Save All</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

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
                    key={numColumns}
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
    pendingWarning: { fontSize: 12, color: '#F59E0B', fontWeight: '600', marginTop: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bulkEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    bulkEditText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        ...Platform.select({ web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.2)' } })
    },
    bulkBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        borderColor: '#F59E0B',
        borderWidth: 1,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 14,
        borderRadius: 14,
        gap: 12,
    },
    bulkBannerTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
    bulkBannerSub: { fontSize: 11, color: '#B45309', marginTop: 2 },
    saveAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    saveAllText: { color: '#fff', fontWeight: '800', fontSize: 13 },
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
    searchInput: { flex: 1, fontSize: 16, color: '#000', ...Platform.select({ web: { outlineStyle: 'none' } as any }) },

    // Product Card
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'visible',
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
        transform: [{ scale: 0.8 }],
    },
    savedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    savedBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    pendingBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    pendingBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    productInfo: { marginTop: 8, paddingBottom: 4 },
    productName: { fontSize: 13, fontWeight: '700', color: '#000', lineHeight: 18, marginBottom: 2 },
    productBrand: { fontSize: 11, color: '#6B7280', marginBottom: 8 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productPrice: { fontSize: 14, fontWeight: '800', color: '#000' },

    // Edit fields
    editFields: { gap: 6 },
    editInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 7,
        fontSize: 12,
        color: '#000',
        ...Platform.select({ web: { outlineStyle: 'none' } as any })
    },
    priceRowEdit: { flexDirection: 'row', gap: 6 },
    saveSingleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: '#4F46E5',
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveSingleText: { color: '#fff', fontWeight: '800', fontSize: 12 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
});

export default InventoryScreen;
