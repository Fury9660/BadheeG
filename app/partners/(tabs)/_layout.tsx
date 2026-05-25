import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Slot, Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import PartnerWebSidebar from '../../../components/PartnerWebSidebar';

export default function TabLayout() {
  const theme = {
    active: '#000000', // Solid black for active
    inactive: '#9CA3AF', // Gray for inactive
    background: '#FFFFFF',
    border: '#E5E7EB',
    primary: '#4F46E5', // Indigo accent
  };

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F9FAFB' }}>
        <PartnerWebSidebar />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.active,
        tabBarInactiveTintColor: theme.inactive,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 8,
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginBottom: 10,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home-variant" : "home-variant-outline"}
              size={24}
              color={focused ? theme.primary : color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "clipboard-list" : "clipboard-list-outline"}
              size={24}
              color={focused ? theme.primary : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "package-variant-closed" : "package-variant"}
              size={24}
              color={focused ? theme.primary : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "wallet" : "wallet-outline"}
              size={24}
              color={focused ? theme.primary : color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
