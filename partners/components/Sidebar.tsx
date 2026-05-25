import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

export default function Sidebar() {
    const { colors: theme, isDarkMode } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { signOut } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const [isExpanded, setIsExpanded] = useState(isDesktop);

    const menuItems = [
        { label: 'Dashboard', icon: 'view-dashboard', route: '/(tabs)/dashboard' },
        { label: 'Orders', icon: 'shopping', route: '/(tabs)/orders' },
        { label: 'Catalog', icon: 'package-variant', route: '/(tabs)/inventory' },
        { label: 'Finance', icon: 'finance', route: '/(tabs)/finance' },
    ];

    const otherItems = [
        { label: 'Help & Support', icon: 'help-circle-outline', route: '/help' },
    ];

    const renderItem = (item: any) => {
        const isActive = pathname.includes(item.route.split('/').pop() || '');
        
        return (
            <TouchableOpacity
                key={item.label}
                style={[
                    styles.menuItem,
                    { justifyContent: isExpanded ? 'flex-start' : 'center' },
                    isActive && { 
                        backgroundColor: theme.primary, 
                        borderRadius: 12, 
                        marginHorizontal: isExpanded ? 12 : 10,
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5,
                    }
                ]}
                activeOpacity={0.7}
                onPress={() => router.push(item.route)}
            >
                <View style={[styles.iconWrapper, !isExpanded && { width: '100%' }]}>
                    <MaterialCommunityIcons
                        name={item.icon as any}
                        size={22}
                        color={isActive ? '#FFFFFF' : '#94A3B8'}
                    />
                </View>
                {isExpanded && (
                    <Text style={[
                        styles.menuLabel,
                        { color: isActive ? '#FFFFFF' : '#94A3B8', fontWeight: isActive ? '800' : '600' }
                    ]} numberOfLines={1}>
                        {item.label}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    const containerStyle = {
        width: isExpanded ? 250 : 72,
        backgroundColor: '#000000',
        borderRightColor: '#1A1A1A',
    };

    return (
        <View style={[styles.container, containerStyle]}>
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

            <View style={[styles.logoContainer, { 
                alignItems: isExpanded ? 'flex-start' : 'center',
                height: isExpanded ? 120 : 80,
                marginBottom: 0,
                marginTop: 5
            }]}>
                <Image
                    source={require('../assets/images/1000262409-Photoroom.png')}
                    style={[styles.logo, { tintColor: '#FFFFFF' }, !isExpanded && { width: 50, height: 50 }, isExpanded && { height: 110 }]}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.section}>
                {isExpanded && <Text style={[styles.sectionTitle, { color: '#64748B' }]}>MENU</Text>}
                {menuItems.map(renderItem)}
            </View>

            <View style={styles.section}>
                {isExpanded && <Text style={[styles.sectionTitle, { color: '#64748B' }]}>OTHER</Text>}
                {otherItems.map(renderItem)}
            </View>

            <View style={[styles.footer, { borderTopColor: '#1A1A1A' }]}>
                <TouchableOpacity 
                    style={[styles.logoutButton, { justifyContent: isExpanded ? 'flex-start' : 'center' }]} 
                    onPress={signOut}
                >
                    <View style={[styles.iconWrapper, !isExpanded && { width: '100%' }]}>
                        <MaterialCommunityIcons name="logout" size={22} color="#94A3B8" />
                    </View>
                    {isExpanded && (
                        <Text style={[styles.menuLabel, { color: '#94A3B8', fontWeight: '500' }]} numberOfLines={1}>
                            Logout
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        borderRightWidth: 1,
        paddingTop: 10,
        ...Platform.select({
            web: {
                zIndex: 100,
            }
        })
    },
    toggleButton: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 5,
        width: '100%',
    },
    logoContainer: {
        paddingHorizontal: 10,
        marginBottom: 0,
        height: 120,
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: 140,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 24,
        marginBottom: 8,
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 4,
        height: 50,
    },
    iconWrapper: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        fontSize: 15,
        letterSpacing: -0.2,
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        marginTop: 'auto',
        paddingVertical: 24,
        borderTopWidth: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 50,
    },
});
