import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    Image,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withSpring, 
    withTiming, 
    FadeInDown,
    FadeInRight,
    Layout
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlowingEffect } from '@/components/ui/GlowingEffect';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CategoryItem = ({ cat, isSelected, onPress, theme, isDesktop, index }: any) => {
    const scale = useSharedValue(1);
    const bgOpacity = useSharedValue(0);

    useEffect(() => {
        bgOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 300 });
    }, [isSelected]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: isSelected ? theme.activeBackground : 'transparent',
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const getIcon = (name: string) => {
        const map: any = {
            'Furniture': 'archive',
            'Luxury': 'award',
            'Home Decor': 'home',
            'Lamps & Lighting': 'sun',
            'Sofa & Seating': 'layers',
            'Beds': 'underline',
            'Dining': 'coffee',
            'Office': 'briefcase'
        };
        return map[name] || 'box';
    };

    return (
        <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={[
                styles.mainCategoryItem,
                isDesktop && styles.desktopCategoryItem,
                { 
                    backgroundColor: isSelected ? theme.activeBackground : 'transparent',
                    borderLeftWidth: isSelected ? 4 : 0,
                    borderLeftColor: theme.active
                },
                animatedStyle
            ]}
        >
            <View style={[styles.iconWrapper, { 
                backgroundColor: isSelected ? theme.active : (theme.isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                borderRadius: 10
            }]}>
                <Feather
                    name={getIcon(cat.name)}
                    size={isDesktop ? 20 : 18}
                    color={isSelected ? '#fff' : (theme.isDarkMode ? '#555' : '#888')}
                />
            </View>
            <Text
                style={[
                    styles.mainCategoryText,
                    { 
                        color: isSelected ? theme.text : (theme.isDarkMode ? '#666' : '#999'),
                        fontSize: isDesktop ? 15 : 9,
                        fontWeight: isSelected ? '800' : '500',
                        letterSpacing: isDesktop ? -0.2 : 0.2
                    },
                    isDesktop && { marginLeft: 15, textTransform: 'none' }
                ]}
                numberOfLines={1}
            >
                {cat.name}
            </Text>
        </AnimatedPressable>
    );
};

const AnimatedSubCategoryCard = ({ subCat, theme, isDesktop, router, index }: any) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0.05);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        shadowOpacity: shadowOpacity.value,
        zIndex: scale.value > 1 ? 10 : 1
    }));

    const handleHoverIn = () => {
        if (!isDesktop) return;
        scale.value = withSpring(1.05, { damping: 15, stiffness: 100 });
        shadowOpacity.value = withSpring(0.15, { damping: 15, stiffness: 100 });
    };

    const handleHoverOut = () => {
        if (!isDesktop) return;
        scale.value = withSpring(1, { damping: 15, stiffness: 100 });
        shadowOpacity.value = withSpring(0.05, { damping: 15, stiffness: 100 });
    };

    return (
        <Animated.View 
            entering={FadeInDown.delay(index * 50).springify().damping(12)}
            style={[
                styles.subCategoryCard,
                isDesktop ? { width: '18.5%', height: 220 } : { width: '48%' },
                { 
                    backgroundColor: theme.card, 
                    borderColor: theme.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.05,
                    shadowRadius: 20,
                    elevation: 5,
                },
                animatedStyle
            ]}
        >
            <Pressable
                onHoverIn={handleHoverIn}
                onHoverOut={handleHoverOut}
                onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/search?q=${subCat.name}`);
                }}
                style={{ flex: 1, zIndex: 2 }}
            >
                <View style={[styles.imageWrapper, { 
                    backgroundColor: isDesktop ? (theme.isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)') : (theme.isDarkMode ? '#111' : '#fff'),
                    height: isDesktop ? 150 : 120 
                }]}>
                    <Image
                        source={{ uri: subCat.image }}
                        style={styles.subCategoryImage}
                        resizeMode="contain"
                    />
                </View>
                <View style={[styles.subCategoryInfo, isDesktop && { padding: 10, minHeight: 45 }]}>
                    <Text style={[styles.subCategoryName, { color: theme.text }, isDesktop && { fontSize: 13, fontWeight: '700' }]} numberOfLines={1}>
                        {subCat.name}
                    </Text>
                    {!isDesktop && <Text style={[styles.itemCount, { color: theme.subtext }]}>Explore Collection</Text>}
                </View>
            </Pressable>
        </Animated.View>
    );
};

const CategoriesScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            if (data) {
                setCategories(data);
                if (data.length > 0 && !selectedCategory) {
                    setSelectedCategory(data[0].name);
                }
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    useEffect(() => {
        fetchCategories();
        const subscription = supabase
            .channel(`public:categories_all_${Math.random().toString(36).substring(7)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const theme = {
        background: isDarkMode ? '#000' : '#f8f9fa',
        text: isDarkMode ? '#fff' : '#121212',
        subtext: isDarkMode ? '#888' : '#666',
        card: isDarkMode ? '#141414' : '#fff',
        border: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        active: isDarkMode ? '#fff' : '#000',
        activeBackground: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        isDarkMode
    };

    const currentSubCategories = useMemo(() => {
        if (selectedCategory === 'All') {
            return categories.flatMap(c => c.subcategories || []);
        }
        const cat = categories.find(c => c.name === selectedCategory);
        return cat?.subcategories || [];
    }, [categories, selectedCategory]);

    const isDesktop = Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth > 768 : width > 768;
    const isWebPlatform = Platform.OS === 'web';

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: isDesktop ? 70 : (isWebPlatform ? 0 : insets.top) }]}>
            <StatusBar barStyle={'light-content'} backgroundColor={'#000000'} />

            {!isWebPlatform && (
                <View style={[styles.header, { backgroundColor: '#000000' }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color={'#ffffff'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Categories</Text>
                    <TouchableOpacity onPress={() => router.push('/search')} style={styles.backBtn}>
                        <Feather name="search" size={22} color={'#ffffff'} />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.mainContainer}>
                {/* Left Navigation Panel (Luxury Glass Sidebar) */}
                <View style={[styles.leftPanel, { 
                    backgroundColor: isDarkMode ? '#050505' : '#fff', 
                    width: isDesktop ? 240 : '26%',
                    paddingTop: 20
                }]}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>
                        <CategoryItem
                            key="all-categories"
                            cat={{ name: 'All' }}
                            isSelected={selectedCategory === 'All'}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedCategory('All');
                            }}
                            theme={theme}
                            isDesktop={isDesktop}
                            index={0}
                        />
                        {categories.map((cat, index) => (
                            <CategoryItem
                                key={cat.id || index}
                                cat={cat}
                                isSelected={selectedCategory === cat.name}
                                onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedCategory(cat.name);
                                }}
                                theme={theme}
                                isDesktop={isDesktop}
                                index={index}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Right Content Panel */}
                <View style={[styles.rightPanel, { backgroundColor: theme.background }]}>
                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={[styles.scrollContent, isDesktop && { paddingHorizontal: 32, paddingVertical: 24 }]}
                    >
                        {isDesktop ? (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={[styles.headlineLabel, { color: theme.active }]}>COLLECTION</Text>
                                <Text style={[styles.headlineTitle, { color: theme.text }]}>{selectedCategory}</Text>
                            </View>
                        ) : (
                            <Text style={[styles.mobileHeadline, { color: theme.text }]}>{selectedCategory}</Text>
                        )}
                        
                        <View style={[styles.subCategoryGrid, isDesktop && { gap: 15, justifyContent: 'flex-start' }]}>
                            {currentSubCategories.length > 0 ? (
                                currentSubCategories.map((subCat: any, index: number) => (
                                    <AnimatedSubCategoryCard
                                        key={`${selectedCategory}-${index}`}
                                        subCat={subCat}
                                        theme={theme}
                                        isDesktop={isDesktop}
                                        router={router}
                                        index={index}
                                    />
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Feather name="package" size={48} color={theme.border} />
                                    <Text style={[styles.emptyText, { color: theme.subtext }]}>Coming Soon</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, height: 60 },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    mainContainer: { flex: 1, flexDirection: 'row' },
    leftPanel: { borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.03)' },
    rightPanel: { flex: 1 },
    mainCategoryItem: { 
        paddingVertical: 14, 
        paddingHorizontal: 16, 
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        position: 'relative',
        marginHorizontal: 12,
        marginVertical: 4,
        borderRadius: 12,
        transition: 'all 0.3s ease'
    },
    desktopCategoryItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainCategoryText: { 
        fontSize: 14, 
        fontWeight: '600', 
        textAlign: 'left', 
    },
    desktopHeadline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        paddingTop: 30,
        paddingBottom: 10
    },
    headlineLabel: { 
        fontSize: 11, 
        fontWeight: '800', 
        letterSpacing: 2.5, 
        marginBottom: 6,
        opacity: 0.5
    },
    headlineTitle: { 
        fontSize: 42, 
        fontWeight: '900', 
        letterSpacing: -1.5,
        fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined
    },
    searchTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
        width: 350,
        backgroundColor: 'rgba(0,0,0,0.02)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5
    },
    mobileHeadline: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 20,
        paddingHorizontal: 4
    },
    scrollContent: { paddingBottom: 100 },
    subCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    subCategoryCard: {
        marginBottom: 16,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    desktopSubCategoryCard: {
        // Handled inline for better override reliability
    },
    imageWrapper: { 
        width: '100%', 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative'
    },
    subCategoryImage: { width: '85%', height: '85%' },
    subCategoryInfo: { padding: 12, alignItems: 'flex-start', justifyContent: 'center' },
    subCategoryName: { fontSize: 13, fontWeight: '700' },
    itemCount: { fontSize: 10, fontWeight: '600', opacity: 0.6 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 300, width: '100%' },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' }
});

export default CategoriesScreen;
