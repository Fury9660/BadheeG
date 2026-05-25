import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { useUI } from '@/store/UIContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';


// Animated Navigation Item
const WebHeaderNavItem = ({ item, isActive, onPress, theme, hideText }: any) => {
    const widthProgress = useSharedValue(0);

    const animatedLineStyle = useAnimatedStyle(() => ({
        width: `${widthProgress.value * 100}%`,
        opacity: widthProgress.value,
    }));

    const handleHoverIn = () => {
        widthProgress.value = withTiming(1, { duration: 300 });
    };

    const handleHoverOut = () => {
        widthProgress.value = withTiming(0, { duration: 300 });
    };

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={handleHoverIn}
            onHoverOut={handleHoverOut}
            style={styles.navItem}
        >
            <Ionicons
                name={isActive ? item.activeIcon : item.icon}
                size={20}
                color={isActive ? theme.primary : theme.inactive}
                style={{ marginRight: hideText ? 0 : 8 }}
            />
            {!hideText && (
                <Text style={[styles.navText, { color: isActive ? theme.primary : theme.text, fontWeight: isActive ? '700' : '500' }]}>
                    {item.label}
                </Text>
            )}


            {/* Animated Underline */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        bottom: 0,
                        height: 2,
                        backgroundColor: theme.primary,
                        borderRadius: 2,
                        zIndex: 10
                    },
                    animatedLineStyle
                ]}
            />
        </Pressable>
    );
};

const WebNavbar = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const router = useRouter();
    const segments = useSegments();
    const { width } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState('');
    const { user, isLoading } = useAuth();
    const { categoryBarTranslateY, setLoginDrawerOpen } = useUI();
    const [defaultAddress, setDefaultAddress] = useState<any>(null);

    const fetchDefaultAddress = async () => {
        if (!user) {
            setDefaultAddress(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_default', true)
                .single();

            if (data) setDefaultAddress(data);
            else setDefaultAddress(null);
        } catch (error) {
            console.error("Error fetching default address:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDefaultAddress();

            const channel = supabase
                .channel('header_address_changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'addresses',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    fetchDefaultAddress();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setDefaultAddress(null);
        }
    }, [user]);


    const animatedCategoryBarStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: categoryBarTranslateY.value }],
        opacity: interpolate(categoryBarTranslateY.value, [-50, 0], [0, 1]),
    }));



    // Header follows user's preference or set to Light by default
    const headerTheme = {
        background: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        inactive: '#888888',
        hover: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
    };

    // For other parts of the navbar if needed
    const theme = headerTheme;

    const navItems = [
        { label: 'Home', route: '/(tabs)/', icon: 'home-outline', activeIcon: 'home' },
        { label: 'Categories', route: '/(tabs)/categories', icon: 'grid-outline', activeIcon: 'grid' },
        { label: 'Stores', route: '/(tabs)/stores', icon: 'business-outline', activeIcon: 'business' },
    ];




    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const isActive = (route: string) => {
        // Simple check, can be refined based on exact segments
        if (route === '/(tabs)/' && segments.length === 2 && segments[1] === '(tabs)') return true; // Actually segments on index are just ['(tabs)'] usually? 
        // Let's rely on simple string matching for now or robust segment check
        const currentPath = '/' + segments.join('/');
        // Normalize for index
        if (route === '/(tabs)/' && (currentPath === '/(tabs)' || currentPath === '/(tabs)/index')) return true;

        return currentPath.startsWith(route.replace('/index', ''));
    };

    const isMobile = width < 768;

    return (
        <View style={styles.mainWrapper}>
            <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border, shadowColor: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                <View style={[styles.content, { maxWidth: 1400 }, isMobile && { paddingHorizontal: 0 }]}>
                    {/* Logo */}
                    {/* Mobile Header Structure */}
                    {isMobile ? (
                        <View style={{
                            width: '100%',
                            height: 50,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 12,
                            gap: 12
                        }}>
                            {/* Left: Logo - Auto width */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Image
                                    source={require('../assets/images/1000262409-Photoroom.png')}
                                    style={{ width: 130, height: 120, resizeMode: 'contain', tintColor: '#000' }}
                                />
                            </View>

                            {/* Center: Search Bar - Flex 1 to fill available space */}
                            <View style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#f0f0f0', // Light search bar
                                borderRadius: 18,
                                paddingHorizontal: 8,
                                height: 34
                            }}>
                                <Feather name="search" size={14} color='#666' style={{ marginRight: 4 }} />
                                <TextInput
                                    placeholder="Search"
                                    placeholderTextColor='#666'
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        color: '#000',
                                        height: '100%',
                                        paddingVertical: 0,
                                        outlineStyle: 'none'
                                    } as any}
                                    numberOfLines={1}
                                    onSubmitEditing={(e) => router.push(`/search?q=${encodeURIComponent(e.nativeEvent.text)}`)}
                                />
                            </View>

                            {/* Right: Cart - Auto width */}
                            <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={{ padding: 4 }}>
                                <Feather name="shopping-cart" size={22} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Desktop Header Structure - Modern UI */
                        <>
                            {/* Left: Logo */}
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)')}
                                style={[styles.logoContainer, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}
                            >
                                <Image
                                    source={require('../assets/images/1000262409-Photoroom.png')}
                                    style={[styles.logo, {
                                        width: 260,
                                        height: 120, 
                                        tintColor: theme.text,
                                        resizeMode: 'contain',
                                        transform: [{ scale: 1.4 }],
                                        marginLeft: 20
                                    }]}
                                />
                            </TouchableOpacity>

                            {/* Center: Nav Links - Modern Centered Layout */}
                            <View style={[styles.navLinks, { flex: 2, gap: 32 }]}>
                                {navItems.map((item, index) => {
                                    const active = isActive(item.route);
                                    return (
                                        <WebHeaderNavItem
                                            key={index}
                                            item={item}
                                            isActive={active}
                                            onPress={() => router.push(item.route as any)}
                                            theme={theme}
                                        />
                                    )
                                })}
                            </View>

                            {/* Right: Actions & Search */}
                            <View style={[styles.rightActions, { flex: 1, justifyContent: 'flex-end', gap: 20 }]}>
                                {/* Minimalist Search Toggle/Input */}
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme.hover,
                                    borderRadius: 12,
                                    paddingHorizontal: 12,
                                    height: 40,
                                    width: 180
                                }}>
                                    <Feather name="search" size={16} color={theme.inactive} />
                                    <TextInput
                                        placeholder="Search..."
                                        placeholderTextColor={theme.inactive}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        style={{
                                            flex: 1,
                                            fontSize: 14,
                                            color: theme.text,
                                            marginLeft: 8,
                                            outlineStyle: 'none'
                                        } as any}
                                        onSubmitEditing={handleSearch}
                                    />
                                </View>

                                {/* Dark Mode Toggle */}
                                <TouchableOpacity onPress={toggleTheme} style={styles.actionIcon}>
                                    <Feather name={isDarkMode ? "sun" : "moon"} size={20} color={theme.text} />
                                </TouchableOpacity>

                                {/* Cart & Profile */}
                                <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.actionIcon}>
                                    <Feather name="shopping-cart" size={20} color={theme.text} />
                                </TouchableOpacity>

                                {!user ? (
                                    <TouchableOpacity
                                        style={[styles.loginBtn, { backgroundColor: theme.primary }]}
                                        onPress={() => setLoginDrawerOpen(true)}
                                    >
                                        <Text style={[styles.loginBtnText, { color: isDarkMode ? '#000' : '#FFF' }]}>Login</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.actionIcon}
                                        onPress={() => router.push('/(tabs)/profile' as any)}
                                    >
                                        <Feather name="user" size={20} color={theme.text} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </View>


        </View>
    );
};

const styles = StyleSheet.create({
    mainWrapper: {
        width: '100%',
        zIndex: 1000,
        ...Platform.select({
            web: {
                position: 'fixed' as any,
                top: 0,
                left: 0,
                right: 0,
            }
        })
    },
    container: {
        width: '100%',
        height: Platform.OS === 'web' ? 70 : 60, 
        borderBottomWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 101,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        // @ts-ignore
        backdropFilter: 'blur(15px)',
    },
    content: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        height: '100%',
    },
    logoContainer: {
        marginRight: 8,
    },
    logo: {
        // Properties handled in component inline style
    },
    navLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
    },

    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        position: 'relative',
        justifyContent: 'center',
        // @ts-ignore
        transition: 'all 0.3s ease',
    },
    navText: {
        fontSize: 14,
    },

    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },

    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 18,
        width: 200,
        borderWidth: 1,
        marginRight: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        paddingVertical: 0,
        height: '100%',
        marginRight: 8,
        // @ts-ignore
        outlineStyle: 'none',
    } as any,
    searchButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginBtn: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    loginBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        // @ts-ignore
        transition: 'all 0.2s ease',
    }
});

export default WebNavbar;
