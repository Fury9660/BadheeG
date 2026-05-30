import ProductCard from '@/components/ProductCard';
import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SearchScreen = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { q } = useLocalSearchParams();

  const paramQuery = Array.isArray(q) ? q[0] : q;

  const [searchText, setSearchText] = useState(paramQuery || '');
  const [searchQuery, setSearchQuery] = useState(paramQuery || '');

  const [products, setProducts] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);

  const theme = {
    background: isDarkMode ? '#000' : '#F8F9FA',
    text: isDarkMode ? '#fff' : '#121212',
    card: isDarkMode ? '#111' : '#fff',
    placeholder: isDarkMode ? '#555' : '#A0A0A0',
    border: isDarkMode ? '#222' : '#E5E5EA',
    primary: isDarkMode ? '#fff' : '#000',
  };

  const fetchShowrooms = async () => {
    try {
      const { data: partners } = await supabase.from('pre_approved_partners').select('id, user_id, store_name, owner_name, status');
      const { data: users } = await supabase.from('profiles').select('id, name');

      setShowrooms((prev: any) => {
        const newMap = { ...prev };
        partners?.forEach((p: any) => {
          const name = p.store_name || p.owner_name;
          if (p.user_id) newMap[p.user_id] = { name, status: p.status };
          if (p.id) newMap[p.id] = { name, status: p.status };
        });
        users?.forEach((u: any) => {
          if (!newMap[u.id] && u.name) {
            newMap[u.id] = { name: u.name, status: 'Active' };
          }
        });
        return newMap;
      });
    } catch (error) {
      console.error("Error fetching showrooms:", error);
    }
  };

  const fetchSearchResults = async (query: string) => {
    setLoading(true);
    try {
      let dbQuery = supabase.from('products').select('*');

      if (query.trim()) {
        const rawKeywords = query.split(/\s+/).filter(word => word.length > 0);
        const expandedKeywords = new Set<string>();

        rawKeywords.forEach(word => {
          expandedKeywords.add(word);
          // Simple stemming: if word ends in 's', add singular form. If singular, add 's'.
          if (word.length > 3) {
            if (word.toLowerCase().endsWith('s')) {
              expandedKeywords.add(word.slice(0, -1));
            } else {
              expandedKeywords.add(word + 's');
            }
          }
        });

        const keywords = Array.from(expandedKeywords);
        const orConditions = keywords.map(word => `name.ilike.%${word}%`).join(',');
        dbQuery = dbQuery.or(orConditions);

        const { data, error } = await dbQuery;

        if (data) {
          const scoredResults = data.map(item => {
            let score = 0;
            const nameLower = item.name.toLowerCase();
            keywords.forEach(word => {
              if (nameLower.includes(word.toLowerCase())) score += 1;
            });
            // Massive boost for exact matches or title containing full query
            if (nameLower.includes(query.toLowerCase())) score += 10;
            return { item, score };
          });

          scoredResults.sort((a, b) => b.score - a.score);
          setProducts(scoredResults.map(r => r.item));
        }
        if (error) throw error;
      } else {
        // Fetch all products if query is empty
        const { data, error } = await dbQuery.order('created_at', { ascending: false });
        if (data) setProducts(data);
        if (error) throw error;
      }
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchText);
  };

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;

  React.useEffect(() => {
    fetchShowrooms();
    fetchSearchResults(searchQuery);
  }, [searchQuery]);

  const displayData = React.useMemo(() => {
    return products
      .filter(data => {
        const pId = data.partner_id || data.partnerId || data.userId || data.uid || data.sellerId;
        const showroom = pId ? showrooms[pId] : null;
        if (showroom && showroom.status && showroom.status !== 'Active') return false;
        return true;
      })
      .map((data: any) => {
        const pId = data.partner_id || data.partnerId || data.userId || data.uid || data.sellerId;
        const showroomEntry = (pId && showrooms[pId]) || {};
        const resolvedName = showroomEntry.name || data.showroom_name || data.store_name || 'Partner Showroom';

        return {
          ...data,
          id: data.id,
          title: data.name,
          price: data.price,
          crossPrice: data.mrp || data.price,
          rating: 4.8,
          showroomName: resolvedName,
          partnerId: pId,
          image: data.image || (data.images && data.images[0])
        };
      });
  }, [products, showrooms]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Search Header */}
      <View style={[
        styles.searchHeader, 
        { 
          paddingTop: isDesktop ? 40 : insets.top + 10,
          backgroundColor: theme.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.border 
        }
      ]}>
        <View style={[styles.headerContent, isDesktop && { maxWidth: 1000, alignSelf: 'center', width: '100%' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Feather name="search" size={18} color={theme.placeholder} style={styles.searchIcon} />
            <TextInput
              placeholder="Search Luxury Items"
              placeholderTextColor={theme.placeholder}
              style={[styles.searchInput, { color: theme.text }]}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus={!paramQuery}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchText(''); setSearchQuery(''); }}>
                <Feather name="x" size={18} color={theme.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={{ flex: 1, width: '100%', maxWidth: 1400, alignSelf: 'center' }}>
        {!loading && (
          <View style={styles.resultsInfo}>
            <Text style={[styles.resultsTitle, { color: theme.text }]}>
              {searchQuery.trim() 
                ? `${displayData.length} Results for "${searchQuery}"`
                : `All Products (${displayData.length})`}
            </Text>
            <View style={[styles.titleUnderline, { backgroundColor: theme.primary }]} />
          </View>
        )}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={displayData}
            renderItem={({ item, index }) => (
              <View style={{ flex: 1 / numColumns }}>
                <ProductCard product={item} index={index} />
              </View>
            )}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            columnWrapperStyle={isDesktop ? { paddingHorizontal: 24 } : undefined}
            contentContainerStyle={[styles.listContainer, isDesktop && { paddingHorizontal: 24 }]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { borderColor: theme.border }]}>
                  <Feather name="search" size={40} color={theme.placeholder} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Matches Found</Text>
                <Text style={[styles.emptySubtitle, { color: theme.placeholder }]}>
                  We couldn't find any products matching "{searchQuery}".
                </Text>
                <TouchableOpacity 
                  style={[styles.resetBtn, { backgroundColor: theme.primary }]}
                  onPress={() => { setSearchText(''); setSearchQuery(''); }}
                >
                  <Text style={[styles.resetBtnText, { color: isDarkMode ? '#000' : '#fff' }]}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: {
    paddingBottom: 20,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
    // @ts-ignore
    outlineStyle: 'none',
  },
  resultsInfo: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    height: 4,
    width: 40,
    marginTop: 8,
    borderRadius: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  resetBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  resetBtnText: {
    fontWeight: '800',
    fontSize: 15,
  },
});

export default SearchScreen;

