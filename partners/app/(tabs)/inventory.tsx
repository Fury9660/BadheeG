import ProductCard from '@/components/ProductCard';
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function InventoryScreen() {
    const { colors: theme, isDarkMode } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;
    
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProducts = async () => {
        try {
            if (!user) return;
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('partner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [user])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const numColumns = width > 1400 ? 5 : width > 1100 ? 4 : width > 800 ? 3 : 2;

    const stats = [
        { label: 'Total Products', value: products.length, icon: 'package', color: '#4F46E5' },
        { label: 'In Stock', value: products.filter(p => p.in_stock).length, icon: 'check-circle', color: '#10B981' },
        { label: 'Low Stock', value: products.filter(p => !p.in_stock).length, icon: 'alert-triangle', color: '#F59E0B' },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F8FAFC' }]} edges={['top']}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleGroup}>
                        <Text style={[styles.title, { color: theme.text }]}>Catalog</Text>
                        <View style={styles.dot} />
                        <Text style={styles.subTitle}>Inventory</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/add-product')}>
                        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.addButton}>
                            <Feather name="plus" size={20} color="#FFF" />
                            <Text style={styles.addButtonText}>Add Product</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={[styles.statsRow, { flexDirection: width > 768 ? 'row' : 'column' }]}>
                    {stats.map((stat, i) => (
                        <View key={i} style={[styles.statCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.statIconBox, { backgroundColor: `${stat.color}15` }]}>
                                <Feather name={stat.icon as any} size={20} color={stat.color} />
                            </View>
                            <View>
                                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Search Bar */}
                <View style={[styles.searchWrapper, { backgroundColor: theme.card, borderColor: isDarkMode ? '#333' : '#E2E8F0' }]}>
                    <Feather name="search" size={20} color={theme.subtext} />
                    <TextInput
                        placeholder="Search by name or category..."
                        placeholderTextColor={theme.subtext}
                        style={[styles.searchInput, { color: theme.text } as any]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x-circle" size={18} color={theme.subtext} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Grid */}
                {loading && !refreshing ? (
                    <View style={styles.loader}><ActivityIndicator size="large" color="#5856D6" /></View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        key={numColumns}
                        numColumns={numColumns}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={{ width: `${100 / numColumns}%`, padding: 10 }}>
                                <ProductCard product={{
                                    id: item.id,
                                    title: item.name,
                                    price: item.price,
                                    category: item.category,
                                    image: item.image,
                                    isActive: item.in_stock
                                }} />
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5856D6" />}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBox}><Feather name="package" size={48} color="#CBD5E1" /></View>
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Products Found</Text>
                                <Text style={styles.emptySub}>{searchQuery ? 'Try searching for something else' : 'Start growing your catalog today'}</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, maxWidth: 1400, alignSelf: 'center', width: '100%', paddingHorizontal: 24 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
    dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#CBD5E1', marginTop: 6 },
    subTitle: { fontSize: 20, fontWeight: '500', color: '#64748B', marginTop: 2 },
    addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    addButtonText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
    statsRow: { gap: 12, marginBottom: 16 },
    statCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 18, fontWeight: '900' },
    statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 50, borderRadius: 16, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 1 },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '600', ...Platform.select({ web: { outlineStyle: 'none' } }) },
    listContent: { paddingBottom: 100 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyIconBox: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 22, fontWeight: '900' },
    emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});
