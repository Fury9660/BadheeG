import { useTheme } from '@/store/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AdminWebSidebar = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const isExpanded = useSharedValue(0); // 0 = collapsed, 1 = expanded

    const theme = {
        background: '#1A1A1A', // Force Dark
        text: '#FFFFFF',       // Force Light
        activeBg: '#333333',
        activeText: '#FFFFFF', // Admin Primary
        inactiveText: '#A0A0A0',
        border: '#2C2C2C',
    };

    const menuItems = [
        { label: 'Dashboard', route: '/admin/(tabs)', icon: 'view-dashboard', library: MaterialCommunityIcons },
        { label: 'Partners', route: '/admin/(tabs)/partners', icon: 'account-group', library: MaterialCommunityIcons },
        { label: 'Register Partner', route: '/admin/(tabs)/add-partner', icon: 'account-plus', library: MaterialCommunityIcons },
        { label: 'Categories', route: '/admin/(tabs)/categories', icon: 'shape', library: MaterialCommunityIcons },
        { label: 'Banners', route: '/admin/(tabs)/banners', icon: 'image-multiple', library: MaterialCommunityIcons },
        { label: 'Settings', route: '/admin/(tabs)/settings', icon: 'cog', library: MaterialCommunityIcons },
    ];

    const isActive = (route: string) => {
        // Handle root dashboard case
        if (route === '/admin/(tabs)' && (pathname === '/admin' || pathname === '/admin/')) return true;
        const cleanRoute = route.replace('/(tabs)', '');
        return pathname.includes(cleanRoute);
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
            // @ts-ignore - Web hover events
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
                    <Animated.Text style={[styles.sectionLabel, { color: theme.inactiveText }, animatedTextStyle]}>MENU</Animated.Text>
                    {menuItems.map((item, index) => {
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
        overflow: 'hidden'
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
    brand: {
        fontSize: 20,
        fontWeight: 'bold',
        display: 'none',
    },
    menuContainer: {
        flexGrow: 1,
        paddingVertical: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        paddingHorizontal: 12,
        opacity: 0.7,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 0,
        marginBottom: 4,
        height: 48,
    },
    menuText: {
        marginLeft: 12,
        fontSize: 15,
        width: 150,
    }
});

export default AdminWebSidebar;
