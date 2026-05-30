import CartIcon from '@/components/CartIcon';
import HiringBanner from '@/components/HiringBanner';
import ProductCard from '@/components/ProductCard';
import { GlowingEffect } from '@/components/ui/GlowingEffect';
import WebFooter from '@/components/WebFooter';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { useUI } from '@/store/UIContext';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  withRepeat
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../config/supabaseConfig';


// Firebase storage references removed as Supabase provides full URLs

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Reusable Hoverable Card Component for Web
// Reusable Hoverable Card Component for Web
const WebSubCategoryCard = React.memo(({ item, index = 0, onPress, style, imageStyle, textStyle, theme }: any) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    zIndex: scale.value > 1 ? 10 : 1 // Bring to front when hovering
  }));

  const handleHoverIn = () => {
    scale.value = withSpring(1.05, {
      damping: 15,
      stiffness: 100
    });
  };

  const handleHoverOut = () => {
    scale.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.quad)
    });
  };

  // Theme-based Card Colors
  const cardBackgroundColor = theme.card;
  const textColor = theme.text;

  const outerBorderRadius = 24;
  const innerBorderRadius = 20;

  return (
    <AnimatedPressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={[
        style,
        animatedStyle,
        {
          position: 'relative',
          borderRadius: outerBorderRadius,
          padding: 2,
          backgroundColor: 'transparent',
        }
      ]}
    >
      <Animated.View 
        entering={FadeInDown.delay(index * 40).springify().damping(12)}
        style={{ flex: 1, width: '100%', height: '100%' }}
      >


        <View style={{
          flex: 1,
          backgroundColor: cardBackgroundColor,
          borderRadius: innerBorderRadius,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: 10,
          zIndex: 2,
          overflow: 'visible'
        }}>
          <Image source={{ uri: item.image }} style={[imageStyle, { marginBottom: 10 }]} />
          <Text style={[textStyle, { color: textColor }]} numberOfLines={2}>{item.name}</Text>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
});


const ProfessionalThemeToggle = React.memo(() => {
  const { isDarkMode, toggleTheme } = useTheme();
  const translateX = useSharedValue(isDarkMode ? 24 : 0);

  useEffect(() => {
    translateX.value = withSpring(isDarkMode ? 24 : 0, {
      damping: 15,
      stiffness: 120
    });
  }, [isDarkMode]);

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={toggleTheme}
      style={[
        styles.toggleContainer,
        {
          backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDarkMode ? '#333' : '#E5E5EA'
        }
      ]}
    >
      <View style={styles.toggleIconsRow}>
        <Feather name="sun" size={14} color={isDarkMode ? '#555' : '#FFD700'} />
        <Feather name="moon" size={14} color={isDarkMode ? '#FFFFFF' : '#BBB'} />
      </View>
      <Animated.View
        style={[
          styles.toggleKnob,
          animatedKnobStyle,
          { backgroundColor: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}
      />
    </TouchableOpacity>
  );
});


const HomeScreen = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { height, width } = useWindowDimensions();


  // Responsive logic
  const isDesktop = width > 768; // Desktop/Tablet breakpoint
  const isWebPlatform = Platform.OS === 'web';
  const numColumns = width > 900 ? 4 : width > 600 ? 3 : 2;
  const contentWidth = Math.min(width, 1200);

  // Scroll Animation Logic
  const lastContentOffset = useSharedValue(0);
  const isScrolling = useSharedValue(false);
  const translateY = useSharedValue(0);

  // Gradient Animation for Search Bar
  const gradientRotation = useSharedValue(0);
  useEffect(() => {
    gradientRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gradientRotation.value}deg` }],
  }));


  const { setTabBarVisible, setCategoryBarVisible } = useUI();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const currentOffset = event.contentOffset.y;
      const diff = currentOffset - lastContentOffset.value;

      if (Math.abs(diff) > 5) { // Lower threshold for more responsiveness
        if (currentOffset <= 10) {
          setCategoryBarVisible(true);
          setTabBarVisible(true);
        } else if (diff > 10) {
          // Scrolling down - hide
          setCategoryBarVisible(false);
          setTabBarVisible(false);
        } else if (diff < -10) {
          // Scrolling up - show
          setCategoryBarVisible(true);
          setTabBarVisible(true);
        }
      }
      lastContentOffset.value = currentOffset;
    },
  });

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // State for dynamic categories
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('');

  const [products, setProducts] = useState<any[]>([]);
  const [showrooms, setShowrooms] = useState<{ [key: string]: string }>({});
  const [userAddress, setUserAddress] = useState<any>(null);
  const { user } = useAuth();

  // Fetch all partners/users to map showroom names correctly
  const fetchShowrooms = async () => {
    try {
      const { data: partners } = await supabase.from('pre_approved_partners').select('id, user_id, store_name, owner_name, status');
      const { data: users } = await supabase.from('profiles').select('id, name');

      setShowrooms((prev: any) => {
        const newMap = { ...prev };
        partners?.forEach((p: any) => {
          const name = p.store_name || p.owner_name;
          // Store both name and status
          if (p.user_id) newMap[p.user_id] = { name, status: p.status };
          if (p.id) newMap[p.id] = { name, status: p.status };
        });
        users?.forEach((u: any) => {
          if (!newMap[u.id] && (u.name || u.full_name)) {
            newMap[u.id] = { name: u.name || u.full_name, status: 'Active' }; // Default profiles to active
          }
        });
        return newMap;
      });
    } catch (error) {
      console.error("Error fetching showrooms:", error);
    }
  };

  const fetchDefaultAddress = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (data) {
        setUserAddress(data);
      } else {
        // Fallback to first address
        const { data: firstAddr } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', userId)
          .limit(1)
          .single();
        if (firstAddr) setUserAddress(firstAddr);
      }
    } catch (err) {
      console.log("No address found or fetch error");
    }
  };

  // Fetch Categories from Supabase
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      if (data) {
        setCategories(data);
        if (data.length > 0 && !activeCategory) {
          setActiveCategory(data[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch Banners from Supabase
  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setBanners(data);
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  // Optimized Fetch Products (Parallel Products + Reviews)
  const fetchProducts = async () => {
    try {
      const [productsResult, reviewsResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('product_id, rating')
      ]);

      const productsData = productsResult.data;
      const reviewsData = reviewsResult.data;

      if (productsData) {
        const productsWithRatings = productsData.map((product: any) => {
          const productReviews = reviewsData?.filter((r: any) => r.product_id === product.id) || [];
          const totalRating = productReviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
          const avgRating = productReviews.length > 0 ? totalRating / productReviews.length : 0;
          return { ...product, avgRating };
        });

        const filteredAndSorted = productsWithRatings
          .filter((p: any) => p.in_stock !== false)
          .sort((a: any, b: any) => b.avgRating - a.avgRating);

        setProducts(filteredAndSorted);
      }
      if (productsResult.error) console.error("Error fetching products:", productsResult.error);
    } catch (e) {
      console.error("Error in fetchProducts:", e);
    }
  };

  // Optimize: Fetch everything in parallel
  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchShowrooms(),
        fetchCategories(),
        fetchBanners(),
        fetchProducts()
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Use a unique ID for this mount to avoid channel name collisions
    const mountId = Math.random().toString(36).substring(7);

    // subscriptions
    const showroomSub = supabase.channel(`home-partners-realtime-${mountId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pre_approved_partners' }, fetchShowrooms)
      .subscribe();

    const categorySub = supabase.channel(`home-categories-realtime-${mountId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .subscribe();

    const bannerSub = supabase.channel(`home-banners-realtime-${mountId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, fetchBanners)
      .subscribe();

    const productSub = supabase.channel(`home-products-realtime-${mountId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    return () => {
      supabase.removeChannel(showroomSub);
      supabase.removeChannel(categorySub);
      supabase.removeChannel(bannerSub);
      supabase.removeChannel(productSub);
    };
  }, []);

  useEffect(() => {
    const checkUserAndAddress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchDefaultAddress(user.id);

        const mountId = Math.random().toString(36).substring(7);
        const addrChannel = supabase.channel(`home_addr_changes-${mountId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'addresses',
            filter: `user_id=eq.${user.id}`
          }, () => fetchDefaultAddress(user.id))
          .subscribe();

        return () => supabase.removeChannel(addrChannel);
      }
    };
    const unsubscribe = checkUserAndAddress();
    return () => {
      unsubscribe.then(cleanup => cleanup && cleanup());
    };
  }, []);

  const displayProducts = React.useMemo(() => {
    return products
      .filter(data => {
        const pId = data.partner_id || data.partnerId || data.userId || data.uid || data.sellerId;
        const showroom: any = pId ? showrooms[pId] : null;
        // If we found a showroom entry, filter by status. 
        // Default to 'Active' for legacy/missing data if we want to show them, 
        // but for strict blocking we check if it is explicitly NOT Active.
        if (showroom && showroom.status && showroom.status !== 'Active') {
          return false;
        }
        return true;
      })
      .map(data => {
        const pId = data.partner_id || data.partnerId || data.userId || data.uid || data.sellerId;
        const showroomEntry: any = (pId && showrooms[pId]) || {};
        const resolvedName = showroomEntry.name ||
          data.showroom_name ||
          data.store_name ||
          data.showroomName ||
          data.storeName ||
          data.businessName ||
          data.ownerName ||
          'Partner Showroom';

        return {
          ...data,
          id: data.id,
          title: data.name,
          price: data.price,
          crossPrice: data.mrp || data.price,
          rating: 4.8,
          showroomName: resolvedName,
          partnerId: pId,
          image: data.image
        };
      });
  }, [products, showrooms]);

  // Banner Text Animations
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subTitleOpacity = useSharedValue(0);
  const subTitleTranslateY = useSharedValue(20);

  useEffect(() => {
    const animateBanner = () => {
      titleOpacity.value = 0;
      titleTranslateY.value = 20;
      subTitleOpacity.value = 0;
      subTitleTranslateY.value = 20;

      titleOpacity.value = withTiming(1, { duration: 800 });
      titleTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) });

      subTitleOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
      subTitleTranslateY.value = withDelay(400, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));
    };

    animateBanner();
    const interval = setInterval(animateBanner, 5000);
    return () => clearInterval(interval);
  }, []);

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }]
  }));

  const animatedSubTitleStyle = useAnimatedStyle(() => ({
    opacity: subTitleOpacity.value,
    transform: [{ translateY: subTitleTranslateY.value }]
  }));



  const subCatScrollRef = React.useRef<ScrollView>(null);

  const scrollSubCat = (direction: 'left' | 'right') => {
    if (subCatScrollRef.current) {
      const scrollAmount = 600;
      subCatScrollRef.current.scrollTo({
        x: direction === 'left' ? 0 : scrollAmount,
        animated: true
      });
    }
  };

  const theme = {
    background: isDarkMode ? '#000' : '#f0f2f5', // Grey
    text: isDarkMode ? '#fff' : '#171717',
    card: isDarkMode ? '#1A1A1A' : '#e4e6eb', // Dark Grey
    placeholder: '#888',
    primary: isDarkMode ? '#FFFFFF' : '#000000',
    border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
  };

  const headerTheme = {
    background: '#000',
    text: '#fff',
    border: '#1A1A1A'
  };



  // Helper to get subcategories for active category
  const activeSubcategories = React.useMemo(() => {
    const cat = categories.find(c => c.name === activeCategory);
    if (cat?.subcategories) {
      console.log("Active Category:", activeCategory);
      console.log("Subcategories:", JSON.stringify(cat.subcategories, null, 2));
    }
    return cat?.subcategories || [];
  }, [categories, activeCategory]);

  const renderItem = React.useCallback(({ item, index }: { item: any, index: number }) => (
    <View style={{ flex: 1 / numColumns }}>
      <ProductCard product={item} index={index} />
    </View>
  ), [numColumns]);

  const keyExtractor = React.useCallback((item: any) => item.id, []);

  const getItemLayout = React.useCallback((data: any, index: number) => ({
    length: isDesktop ? 340 : 280, // More precise estimated height
    offset: (isDesktop ? 340 : 280) * index,
    index,
  }), [isDesktop]);







  // Cart Count Logic - MOVED TO CartIcon Component



  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: isWebPlatform ? 0 : insets.top }]}>
      <StatusBar barStyle={'light-content'} backgroundColor={'#000000'} />

      {/* Mobile Header Elements */}
      {(!isWebPlatform || (isWebPlatform && !isDesktop)) && (
        <>
          {/* BADHEEG Header (Shopify Style) */}
          <View style={[styles.header, {
            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
            borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderBottomWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 65,
            paddingHorizontal: 16,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            // @ts-ignore
            backdropFilter: 'blur(15px)',
          }]}>
            {/* Logo / Brand Name */}
            <Image
              source={require('../../assets/images/1000262409-Photoroom.png')}
              style={{
                width: 130,
                height: 140,
                resizeMode: 'contain',
                tintColor: isDarkMode ? 'white' : 'black'
              }}
            />

            {/* Right Icons: Cart ONLY (others moved to search row) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <CartIcon color={isDarkMode ? "#ffffff" : "#000000"} size={24} />
            </View>
          </View>

          {/* Search Bar - Visible on Native Only (Web has it in Navbar) - OPTIONAL: Commenting out if user wants ONLY header icons, but standard Shopify implementation often keeps a search bar or moves it. I will keep it for now but style it cleaner if needed. 
             Actually, usually "Shopify style" implies a clean header and maybe the search bar is separate. I'll keep the search bar but maybe remove the border to make it cleaner? 
             Let's keep it as is for functionality, the user focused on "Header".
          */}
          {/* {!isWebPlatform && (
            <View style={{ paddingHorizontal: 16, marginBottom: 16, marginTop: 0 }}>
              ...
            </View>
          )} 
            Decided to KEEP the search bar below as it's useful, unless user explicitly complained about it.
            Wait, looking at the image provided (I can't see it but the user said "same header... same icons").
            If they want the search ICON in the header, they might not want the bar.
            I will COMMENT OUT the search bar below to match the "Icon in Header" approach which usually replaces the persistent bar.
          */}
        </>
      )}

      {/* Main Content Edge-to-Edge for Desktop */}
      <View style={{ flex: 1 }}>
        <View style={{ width: '100%', flex: 1 }}>


          {/* MAIN CONTENT */}
          <View style={{ flex: 1 }}>
            <Animated.FlatList
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              data={displayProducts.slice(0, 10)}
              key={numColumns}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              numColumns={numColumns}
              columnWrapperStyle={isDesktop ? { paddingHorizontal: 24 } : undefined}
              contentContainerStyle={[
                styles.flatListContent,
                { paddingTop: isDesktop ? 90 : 65, paddingBottom: 0 },
                isDesktop && { flexGrow: 1, paddingBottom: 0, paddingTop: 90 }
              ]}
              initialNumToRender={8}
              windowSize={5}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={Platform.OS === 'android'}
              showsVerticalScrollIndicator={false}
              getItemLayout={getItemLayout}
              ListHeaderComponent={
                <View style={isDesktop ? { alignItems: 'center', width: '100%' } : undefined}>
                  {isDesktop ? (
                    <View style={[styles.webMainContent, { maxWidth: 1400, width: '100%', paddingHorizontal: 40 }]}>

                      {/* Hero Section below Hiring Banner - Desktop Layout */}
                      <View style={{ 
                        width: '100%', 
                        height: 800, // Increased height to accommodate banner inside
                        marginBottom: 40, 
                        backgroundColor: '#000',
                        flexDirection: 'row', // Side-by-side layout restored
                        overflow: 'hidden',
                        borderRadius: 24,
                        position: 'relative', // For absolute banner positioning
                      }}>
                        {/* Hiring Banner Floating Inside Hero */}
                        <View style={{ 
                          position: 'absolute', 
                          top: 40, 
                          left: 20, 
                          right: 20, 
                          zIndex: 10 
                        }}>
                          <HiringBanner />
                        </View>
                        {/* Left Side: Content */}
                        <View style={{ flex: 1, padding: 60, paddingTop: 180, justifyContent: 'center' }}>
                          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                            <Text style={{ color: '#fff', fontSize: 56, fontWeight: '900', lineHeight: 64, marginBottom: 20 }}>
                              Modern Luxury For Your Home
                            </Text>
                            <Text style={{ color: '#aaa', fontSize: 18, lineHeight: 28, marginBottom: 40, maxWidth: 500 }}>
                              Explore our curated collection of premium furniture and interior solutions designed to transform your living space into a masterpiece.
                            </Text>
                            <TouchableOpacity 
                              style={{ 
                                backgroundColor: '#fff', 
                                paddingHorizontal: 32, 
                                paddingVertical: 16, 
                                borderRadius: 30,
                                alignSelf: 'flex-start'
                              }}
                              onPress={() => router.push('/(tabs)/categories')}
                            >
                              <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>Explore Collection</Text>
                            </TouchableOpacity>
                          </Animated.View>
                        </View>

                        {/* Right Side: Large Image */}
                        <View style={{ flex: 1.2 }}>
                          <Image 
                            source={require('../../assets/images/luxury_furniture_banner.png')}
                            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                          />
                        </View>
                      </View>





                      {/* 3. CATEGORIES SECTION - GRADIENT CARD WRAPPER */}
                      <LinearGradient
                        colors={isDarkMode ? ['#4C1D95', '#B91C1C'] : ['#E9D5FF', '#FECACA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          marginHorizontal: -40,
                          paddingVertical: 40,
                          paddingHorizontal: 40,
                          borderRadius: 32,
                          marginBottom: 60,
                          marginTop: 20,
                          borderWidth: 1,
                          borderColor: theme.border,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 10 },
                          shadowOpacity: 0.05,
                          shadowRadius: 20,
                          elevation: 5
                        }}
                      >
                        {/* Main Categories Toggle Style */}
                        <View style={{ marginBottom: 30 }}>
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 12 }}
                          >
                            {categories.map((cat: any, index: number) => {
                              const active = activeCategory === cat.name;
                              return (
                                <TouchableOpacity 
                                  key={index}
                                  onPress={() => setActiveCategory(cat.name)}
                                  style={{
                                    paddingHorizontal: 24,
                                    paddingVertical: 12,
                                    borderRadius: 30,
                                    backgroundColor: active ? theme.primary : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                                    borderWidth: 1,
                                    borderColor: active ? theme.primary : theme.border
                                  }}
                                >
                                  <Text style={{ 
                                    color: active ? (isDarkMode ? '#000' : '#FFF') : theme.text, 
                                    fontWeight: '700',
                                    fontSize: 15 
                                  }}>
                                    {cat.name}
                                  </Text>
                                </TouchableOpacity>
                              )
                            })}
                          </ScrollView>
                        </View>

                        {/* Sub Categories Header & Navigation */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                           <Text style={{ color: theme.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>
                             Sub Categories
                           </Text>
                        </View>

                        {/* Fixed 11-Item Row (No Scroll) */}
                        <View style={{ 
                          flexDirection: 'row', 
                          justifyContent: 'space-between',
                          gap: 8,
                          width: '100%'
                        }}>
                          {activeSubcategories.slice(0, 8).map((cat: any, index: number) => (
                            <WebSubCategoryCard
                              key={index}
                              item={cat}
                              index={index}
                              onPress={() => router.push(`/search?q=${cat.name}`)}
                              theme={theme}
                              style={[
                                styles.webSubCategoryItem, 
                                { 
                                  backgroundColor: isDarkMode ? '#252525' : '#FFF', 
                                  borderColor: theme.border, 
                                  flex: 1,
                                  aspectRatio: 0.85,
                                  padding: 8,
                                  borderRadius: 16,
                                }
                              ]}
                              imageStyle={[styles.webSubCategoryImage, { width: '80%', height: '60%', marginBottom: 8 }]}
                              textStyle={[styles.webSubCategoryText, { color: theme.text, fontSize: 11, fontWeight: '700' }]}
                            />
                          ))}
                          
                          {/* Explore All Card at the end */}
                          <TouchableOpacity
                            style={[
                              styles.webSubCategoryItem, 
                              { 
                                backgroundColor: isDarkMode ? '#252525' : '#FFF', 
                                borderColor: theme.border, 
                                flex: 1,
                                aspectRatio: 0.85,
                                padding: 8,
                                borderRadius: 16,
                                justifyContent: 'center'
                              }
                            ]}
                            onPress={() => router.push('/(tabs)/categories')}>
                            <View style={[
                              styles.exploreAllButton, 
                              { 
                                borderColor: theme.primary, 
                                width: 40, 
                                height: 40, 
                                borderRadius: 20, 
                                marginBottom: 8,
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                              }
                            ]}>
                              <Feather name="arrow-right" size={20} color={theme.primary} />
                            </View>
                            <Text style={[styles.webSubCategoryText, { color: theme.primary, fontSize: 11, fontWeight: '700' }]}>Explore All</Text>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>


                      {activeSubcategories.length === 0 && (
                        // Fallback or "All"
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5, minHeight: 100 }}>
                          <Feather name="grid" size={48} color={theme.placeholder} />
                          <Text style={{ marginTop: 16, color: theme.placeholder, fontSize: 18 }}>Select a category to view items</Text>
                        </View>
                      )}
                    </View>
                  ) : (

                    // Mobile Header Logic
                    <>
                      {/* Hero Banner with Hiring Banner inside - Mobile Layout */}
                      <View style={{ width: '100%', marginBottom: 25, backgroundColor: theme.card, position: 'relative' }}>
                        <View style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
                          <HiringBanner />
                        </View>
                        <Image 
                          source={require('../../assets/images/luxury_furniture_banner.png')}
                          style={{ width: '100%', height: 300, resizeMode: 'cover' }}
                        />
                      </View>

                      {/* Mobile Combined Search & Theme Row */}
                      <View style={[styles.searchRowContainer, { marginHorizontal: 20 }]}>
                        
                        {/* Animated Gradient Border Wrapper for Dark Mode */}
                        <View style={{ flex: 1, position: 'relative', borderRadius: 24, overflow: 'hidden', padding: isDarkMode ? 1.5 : 0, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 }}>
                          {isDarkMode && (
                            <Animated.View style={[{ position: 'absolute', top: '-100%', left: '-100%', right: '-100%', bottom: '-100%' }, animatedGradientStyle]}>
                              <LinearGradient
                                colors={['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ flex: 1 }}
                              />
                            </Animated.View>
                          )}
                          
                          <TouchableOpacity
                            style={[{ 
                              flexDirection: 'row', 
                              alignItems: 'center', 
                              paddingHorizontal: 16, 
                              paddingVertical: 12, 
                              borderRadius: 22, 
                              backgroundColor: isDarkMode ? '#1A1A1A' : '#fff',
                              borderWidth: isDarkMode ? 0 : 1,
                              borderColor: theme.border
                            }]}
                            onPress={() => router.push('/search')}
                          >
                            <Feather name="search" size={18} color={theme.placeholder} style={{ marginRight: 10 }} />
                            <Text style={{ color: theme.placeholder, fontSize: 14 }}>Search products...</Text>
                          </TouchableOpacity>
                        </View>

                        <ProfessionalThemeToggle />
                      </View>

                      <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Category</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
                          <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>

                      </View>

                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={{ marginHorizontal: 0 }}
                        contentContainerStyle={[styles.categoryScroll, { paddingHorizontal: 20 }]}
                      >
                        {categories.map((item, index) => (
                          <Animated.View key={item.id || index} entering={FadeInRight.delay(index * 50).springify()}>
                            <TouchableOpacity
                              style={[styles.categoryChip, activeCategory === item.name && [styles.activeCategory, { borderBottomColor: theme.primary }]]}
                              onPress={() => setActiveCategory(item.name)}
                            >
                              <Text style={[styles.categoryChipText, { color: activeCategory === item.name ? theme.primary : theme.placeholder }, activeCategory === item.name && styles.activeCategoryText]}>{item.name}</Text>
                            </TouchableOpacity>
                          </Animated.View>
                        ))}
                      </ScrollView>

                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={{ marginHorizontal: 0 }}
                        contentContainerStyle={[styles.subCategoryScroll, { paddingHorizontal: 20, paddingTop: 15 }]}
                      >
                        {activeSubcategories.map((cat: any, index: number) => (
                          <WebSubCategoryCard
                            key={index}
                            item={cat}
                            onPress={() => router.push(`/search?q=${cat.name}`)}
                            theme={theme}
                            style={{ width: 90, height: 80, marginRight: 8, marginTop: 5 }} // Reduced height and margins
                            imageStyle={{
                              width: 60,
                              height: 60,
                              marginBottom: 4,
                              marginTop: -25, // Adjusted negative margin
                              resizeMode: 'contain',
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4.65,
                            }}
                            textStyle={{ fontSize: 10, textAlign: 'center', fontWeight: '600', marginTop: 2 }}
                          />
                        ))}
                        <TouchableOpacity
                          style={[styles.subCategoryItem, { borderColor: theme.border, backgroundColor: theme.card, marginTop: 5, marginRight: 0 }]}
                          onPress={() => router.push('/(tabs)/categories')}
                        >
                          <View style={[styles.exploreAllButton, { borderColor: theme.border, backgroundColor: isDarkMode ? '#2c2c2e' : '#f2f2f7' }]}>
                            <Feather name="arrow-right" size={20} color={theme.primary} />
                          </View>
                          <Text style={[styles.subCategoryText, { color: theme.primary }]}>Explore All</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </>
                  )}

                    <View style={[styles.sectionHeader, { paddingHorizontal: 20, maxWidth: 1400, width: '100%', marginTop: isDesktop ? 60 : 0 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text, fontSize: isDesktop ? 28 : 18 }]}>Top Selling Products</Text>
                    </View>
                </View>
              }
              ListFooterComponent={
                <View>
                  {displayProducts.length > 10 && (
                    <TouchableOpacity
                      style={[styles.seeMoreButton, { borderColor: theme.primary, backgroundColor: isDarkMode ? 'transparent' : '#fff' }]}
                      onPress={() => router.push('/search')}
                    >
                      <Text style={[styles.seeMoreText, { color: theme.primary }]}>See More Products</Text>
                      <Feather name="arrow-right" size={18} color={theme.primary} />
                    </TouchableOpacity>
                  )}
                  {isWebPlatform ? <View style={{ marginTop: 'auto' }}><WebFooter /></View> : <MobileFooter />}
                </View>
              }
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const MobileFooter = React.memo(() => {
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  return (
    <View style={{
      paddingTop: 0,
      paddingBottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      width: '100%',
      overflow: 'hidden'
    }}>
      <Image
        source={require('../../assets/images/1000262409-Photoroom.png')}
        style={{
          width: width + 40, // Slightly wider than screen for true edge-to-edge look if there's any bleed
          height: 200, // Reduced from 250
          resizeMode: 'contain',
          tintColor: 'black',
          opacity: 1
        }}
      />
      <View style={{ marginTop: -70, alignItems: 'center', paddingBottom: 20 }}>
        <Text style={{
          fontSize: 24,
          fontWeight: '900',
          color: 'black',
          letterSpacing: 8,
          marginBottom: 10
        }}>BADHEE G</Text>
        <View style={{ height: 2, width: 40, backgroundColor: 'black', opacity: 0.5, marginBottom: 20 }} />
        
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://www.instagram.com/badhee_g_official?igsh=MWVxY3Y3bXBjdWpodQ==')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}
          >
            <FontAwesome name="instagram" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://www.youtube.com/channel/UCsya35VeJbuodjt0OLKYwog')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}
          >
            <FontAwesome name="youtube-play" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 0 },
  logo: { width: 120, height: 40, resizeMode: 'contain' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 6 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, elevation: 2 },
  searchIcon: { marginRight: 8 },
  themeButton: { marginLeft: 12, padding: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  flatListContent: { paddingBottom: 0 },
  promoBanner: { backgroundColor: '#8A2BE2', borderRadius: 16, padding: 16, marginHorizontal: 16, marginVertical: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', height: 130 },
  promoTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4, lineHeight: 24, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  promoSubtitle: { color: '#FFD700', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  promoImage: { position: 'absolute', right: -10, bottom: -10, width: 130, height: 110, resizeMode: 'contain', opacity: 0.9 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  seeAll: { color: '#888', fontSize: 13 },
  categoryScroll: { paddingLeft: 16, paddingRight: 8, marginBottom: 12 },
  categoryChip: { paddingHorizontal: 8, paddingVertical: 6, marginHorizontal: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeCategory: { borderBottomColor: '#000000' }, // Gets overridden by theme.primary in render
  activeCategoryText: { fontWeight: '700' },
  subCategoryScroll: { paddingLeft: 16, paddingRight: 16, marginBottom: 16 },
  subCategoryItem: { alignItems: 'center', marginRight: 12, width: 80, padding: 6, borderRadius: 12, borderWidth: 1 },
  searchRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    gap: 12,
  },
  mobileSearchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  themeToggleButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  webSearchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  toggleContainer: {
    width: 60,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    padding: 4,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    left: 4,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  subCategoryImage: { width: 50, height: 50, marginBottom: 6, resizeMode: 'contain' },
  exploreAllButton: { width: 50, height: 50, borderRadius: 25, marginBottom: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  subCategoryText: { fontSize: 10, textAlign: 'center', fontWeight: '600' },
  listContainer: { paddingHorizontal: 8 },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 32,
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // New Styles for Horizontal Web Category Bar
  webCategoryBar: {
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 4,
  },
  webCategoryBarContent: {
    paddingHorizontal: 16,
    gap: 12,
    flexGrow: 1,
    justifyContent: 'center',
  },
  webCategoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCategoryItemText: {
    fontSize: 15,
    fontWeight: '600',
  },

  webMainContent: {
    flex: 1,
  },
  webSubCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 24,
  },
  webSubCategoryItem: {
    width: 140,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  webSubCategoryImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  webSubCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Web Banner Styles
  webBannerCard: {
    width: 600,
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  webBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  webBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },


  webHeroBanner: {
    width: '100%',
    maxWidth: 1200,
    height: 350,
    borderRadius: 32,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  webHeroTitle: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  webHeroSubtitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
    opacity: 0.9,
  },
  webHeroButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  webHeroButtonText: {
    color: '#8A2BE2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  webHeroImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '50%',
    height: '100%',
    resizeMode: 'cover',
  },
  webHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'linear-gradient(90deg, rgba(138,43,226,1) 0%, rgba(138,43,226,0.8) 50%, rgba(138,43,226,0) 100%)', // Note: linear-gradient syntax is valid in React Native Web but may need a different approach or view overlay for native if this was cross-platform, but here it's specifically for Web. For better compatibility, I'll use a simple background color overlay with transparency or assume web environment.
    // Re-doing overlay with a simpler valid RN approach for now to be safe, or just relying on positioning.
    // Actually, for web only, standard RN doesn't support linear-gradient string. 
    // I'll skip the overlay property for now and rely on layout.
  },
});

export default HomeScreen;
