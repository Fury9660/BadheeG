import { useTheme } from '@/store/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const PartnerWebSidebar = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const isExpanded = useSharedValue(0); // 0 = collapsed, 1 = expanded

    const theme = {
        background: '#1A1A1A', // Force Dark
        text: '#FFFFFF',       // Force Light
        activeBg: '#333333',
        activeText: '#4F46E5', // Indigo-600
        inactiveText: '#A0A0A0',
        border: '#2C2C2C',
    };

    const menuItems = [
        { label: 'Dashboard', route: '/partners/dashboard', icon: 'view-dashboard', library: MaterialCommunityIcons },
        { label: 'Orders', route: '/partners/orders', icon: 'clipboard-list', library: MaterialCommunityIcons },
        { label: 'Catalog', route: '/partners/inventory', icon: 'cube', library: MaterialCommunityIcons },
        { label: 'Finance', route: '/partners/finance', icon: 'wallet', library: MaterialCommunityIcons },
        { label: 'Ad Campaigns', route: '/partners/ads-campaign', icon: 'bullhorn', library: MaterialCommunityIcons },
    ];

    const bottomItems = [
        { label: 'Help & Support', route: '/partners/support', icon: 'help-circle-outline', library: MaterialCommunityIcons },
        { label: 'Settings', route: '/partners/settings', icon: 'cog-outline', library: MaterialCommunityIcons },
    ];

    const isActive = (route: string) => {
        if (route === '/partners/dashboard' && (pathname === '/' || pathname === '/partners' || pathname === '/partners/' || pathname === '/partners/index')) return true;

        // Exact match for tabs to avoid overlapping active states
        if (route === pathname) return true;

        // Sub-route matching (e.g. /partners/orders/details/1 should keep /partners/orders active)
        // But be careful not to match /partners/orders-archive if route is /partners/orders
        if (pathname.startsWith(route) && pathname[route.length] === '/') return true;

        return false;
    };

    const handleMouseEnter = () => {
        isExpanded.value = withTiming(1, { duration: 300 });
    };

    const handleMouseLeave = () => {
        isExpanded.value = withTiming(0, { duration: 300 });
    };

    const animatedSidebarStyle = useAnimatedStyle(() => ({
        width: withTiming(isExpanded.value ? 260 : 80, { duration: 300 }),
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: isExpanded.value,
        display: isExpanded.value === 0 ? 'none' : 'flex',
    }));

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: isExpanded.value,
        height: withTiming(isExpanded.value ? 120 : 0, { duration: 300 }),
        marginBottom: withTiming(isExpanded.value ? 0 : 20, { duration: 300 }),
        transform: [{ scale: isExpanded.value }],
    }));

    return (
        <Animated.View
            style={[
                styles.sidebar,
                { backgroundColor: theme.background, borderRightColor: theme.border },
                animatedSidebarStyle
            ]}
            // @ts-ignore - Handle web hover functionality
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Logo Area */}
            <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                <Image
                    source={require('../assets/images/1000262409-Photoroom.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            <ScrollView contentContainerStyle={styles.menuContainer} showsVerticalScrollIndicator={false}>
                <View>
                    <Animated.Text style={[styles.sectionLabel, { color: theme.inactiveText }, animatedTextStyle]}>
                        MENU
                    </Animated.Text>
                    {menuItems.map((item, index) => {
                        const active = isActive(item.route);
                        const IconLib = item.library;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    active && { backgroundColor: theme.activeBg },
                                    { justifyContent: 'flex-start' } // Start align to keep icon on left
                                ]}
                                onPress={() => router.push(item.route as any)}
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <IconLib name={item.icon as any} size={24} color={active ? theme.activeText : theme.inactiveText} />
                                </View>
                                <Animated.Text
                                    numberOfLines={1}
                                    style={[
                                        styles.menuText,
                                        { color: active ? theme.activeText : theme.text, fontWeight: active ? '600' : '500' },
                                        animatedTextStyle
                                    ]}
                                >
                                    {item.label}
                                </Animated.Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ marginTop: 24 }}>
                    <Animated.Text style={[styles.sectionLabel, { color: theme.inactiveText }, animatedTextStyle]}>
                        OTHER
                    </Animated.Text>
                    {bottomItems.map((item, index) => {
                        const active = isActive(item.route);
                        const IconLib = item.library;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    active && { backgroundColor: theme.activeBg },
                                    { justifyContent: 'flex-start' }
                                ]}
                                onPress={() => router.push(item.route as any)}
                            >
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <IconLib name={item.icon as any} size={24} color={active ? theme.activeText : theme.inactiveText} />
                                </View>
                                <Animated.Text
                                    numberOfLines={1}
                                    style={[
                                        styles.menuText,
                                        { color: active ? theme.activeText : theme.text, fontWeight: active ? '600' : '500' },
                                        animatedTextStyle
                                    ]}
                                >
                                    {item.label}
                                </Animated.Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sidebar: {
        height: '100%',
        borderRightWidth: 1,
        paddingVertical: 0,
        paddingHorizontal: 0,
        zIndex: 1000,
        overflow: 'hidden', // Hide content when collapsed
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 0,
        paddingHorizontal: 0,
        backgroundColor: '#1A1A1A',
        paddingTop: 0,
        paddingBottom: 0,
    },
    logo: {
        width: 260,
        height: 120,
    },
    menuContainer: {
        flexGrow: 1,
        paddingVertical: 20, // Add padding here since we removed it from container
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        paddingHorizontal: 12,
        opacity: 0.7,
        marginLeft: 4, // Align with text
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10, // Reduced padding
        marginBottom: 4,
        height: 48, // Fixed height for consistency
    },
    menuText: {
        marginLeft: 12,
        fontSize: 15,
        // Ensure text doesn't wrap weirdly during animation
        width: 150,
    }
});

export default PartnerWebSidebar;
