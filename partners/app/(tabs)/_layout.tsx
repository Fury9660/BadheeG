import { useTheme } from '@/store/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';

export default function TabLayout() {
    const { colors: theme } = useTheme();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.card,
                    borderTopColor: 'transparent',
                    height: Platform.OS === 'ios' ? 94 : 80,
                    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
                    paddingTop: 10,
                    display: isLargeScreen ? 'none' : 'flex',
                    elevation: 0,
                },
                tabBarBackground: () => (
                    <BlurView
                        intensity={Platform.OS === 'ios' ? 40 : 60}
                        tint={theme.background === '#FFFFFF' ? 'light' : 'dark'}
                        style={[StyleSheet.absoluteFill]}
                    />
                ),
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: -4,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.subtext,
            }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="shopping" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="inventory"
                options={{
                    title: 'Catalog',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="package-variant" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="finance"
                options={{
                    title: 'Finance',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="finance" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
