import AdminWebSidebar from '@/components/AdminWebSidebar';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminTabLayout() {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const theme = {
    background: isDarkMode ? '#121212' : '#FFFFFF', // Refined colors
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    primary: isDarkMode ? '#FFFFFF' : '#000000', // Admin Primary
    border: isDarkMode ? '#333333' : '#E5E7EB',
    inactive: isDarkMode ? '#888888' : '#9CA3AF',
  };

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.background }}>
        <AdminWebSidebar />
        <View style={{ flex: 1, maxWidth: '100%' }}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
              sceneStyle: { backgroundColor: theme.background }
            }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="partners" />
            <Tabs.Screen name="add-partner" />
            <Tabs.Screen name="categories" />
            <Tabs.Screen name="banners" />
            <Tabs.Screen name="settings" />
            <Tabs.Screen name="orders" />
            <Tabs.Screen name="warehouses" />
            {/* Hidden Items */}
            <Tabs.Screen name="products" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.inactive,
        tabBarShowLabel: true, // Ensure labels are shown
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0), // Increased base height to 60
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 0,
          marginBottom: insets.bottom > 0 ? 0 : 4, // Adjust margin based on safe area
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="grid" color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: 'Partners',
          tabBarIcon: ({ color }) => <Feather name="users" color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Feather name="settings" color={color} size={20} />,
        }}
      />

      {/* Hidden from Tab Bar */}
      <Tabs.Screen
        name="products"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="orders"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="warehouses"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="categories"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="banners"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="add-partner"
        options={{ href: null }}
      />
    </Tabs >
  );
}
