import { useTheme } from '@/store/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

const AdminWebSidebar = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [isExpanded, setIsExpanded] = useState(isLargeScreen);

    const theme = {
        background: '#000000', // Forced Black Sidebar
        text: '#FFFFFF',
        activeBg: '#333333',
        activeText: '#FFFFFF',
        inactiveText: '#A0A0A0',
        border: '#1A1A1A',
    };

    const menuItems = [
        { label: 'Dashboard', route: '/', icon: 'view-dashboard', library: MaterialCommunityIcons },
        { label: 'Partners', route: '/partners', icon: 'account-group', library: MaterialCommunityIcons },
        { label: 'Orders', route: '/orders', icon: 'package-variant-closed', library: MaterialCommunityIcons },
        { label: 'Warehouses', route: '/warehouses', icon: 'warehouse', library: MaterialCommunityIcons },
        { label: 'Register Partner', route: '/add-partner', icon: 'account-plus', library: MaterialCommunityIcons },
        { label: 'Categories', route: '/categories', icon: 'shape', library: MaterialCommunityIcons },
        { label: 'Banners', route: '/banners', icon: 'image-multiple', library: MaterialCommunityIcons },
        { label: 'Settings', route: '/settings', icon: 'cog', library: MaterialCommunityIcons },
    ];

    const isActive = (route: string) => {
        if (route === '/' && (pathname === '/' || pathname === '')) return true;
        return pathname.includes(route);
    };

    const animatedSidebarStyle = useAnimatedStyle(() => ({
        width: isExpanded ? 260 : 80,
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: isExpanded ? 1 : 0,
        display: isExpanded ? 'flex' : 'none',
    }));

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: isExpanded ? 1 : 0,
        height: isExpanded ? 120 : 0,
        marginBottom: isExpanded ? 0 : 20,
        transform: [{ scale: isExpanded ? 1 : 0 }],
    }));

    return (
        <Animated.View
            style={[
                styles.sidebar,
                { backgroundColor: theme.background, borderRightColor: theme.border },
                animatedSidebarStyle
            ]}
        >
            {/* Toggle Button */}
            <TouchableOpacity 
                style={[styles.toggleButton, { alignItems: isExpanded ? 'flex-end' : 'center' }]} 
                onPress={() => setIsExpanded(!isExpanded)}
            >
                <MaterialCommunityIcons 
                    name={isExpanded ? "menu-open" : "menu"} 
                    size={28} 
                    color="#FFFFFF" 
                />
            </TouchableOpacity>

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
    toggleButton: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 0,
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
        paddingTop: 0,
        paddingBottom: 0,
    },
    logo: {
        width: 260,
        height: 120,
        tintColor: '#FFFFFF',
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
