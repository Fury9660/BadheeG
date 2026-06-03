
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View, useWindowDimensions } from 'react-native';
import PartnerWebSidebar from '../../../components/PartnerWebSidebar';
import { useAuth } from '../../../store/AuthContext';

export default function TabLayout() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const { user, partnerStatus, isLoading, refreshPartnerStatus } = useAuth(); // Destructure refreshPartnerStatus
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            const status = partnerStatus?.toLowerCase();
            console.log("TabLayout: current status:", status, "user:", user?.id);

            if (!user) {
                router.replace('/partners/login');
            } else if (!status) {
                // Status is missing but user is logged in. Try refreshing.
                console.warn("TabLayout: Status missing, refreshing...");
                refreshPartnerStatus();
            } else if (status === 'approved' || status === 'active') {
                // Allowed to stay
            } else if (status === 'pending') {
                router.replace('/partners/approval-pending');
            } else if (status === 'unregistered') {
                router.replace({
                    pathname: '/partners/register',
                    params: { phoneNumber: user?.phone, uid: user?.id }
                });
            } else {
                // For any other status (rejected, suspended, error, etc.)
                console.warn("TabLayout: Non-approved status, redirecting to login:", status);
                router.replace('/partners/login');
            }
        }
    }, [user?.id, partnerStatus, isLoading]);

    const currentStatus = partnerStatus?.toLowerCase();
    if (isLoading || (user && currentStatus !== 'approved' && currentStatus !== 'active')) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    const theme = {
        active: '#000000', // Solid black for active
        inactive: '#9CA3AF', // Gray for inactive
        background: '#FFFFFF',
        border: '#E5E7EB',
        primary: '#10B981', // Green accent
    };

    return (
        <View style={{ flex: 1, flexDirection: isDesktop ? 'row' : 'column', backgroundColor: '#F9FAFB' }}>
            {isDesktop && <PartnerWebSidebar />}
            <View style={{ flex: 1 }}>
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
                            borderTopWidth: isDesktop ? 0 : 1,
                            borderTopColor: theme.border,
                            elevation: isDesktop ? 0 : 8,
                            height: isDesktop ? 0 : 72,
                            paddingBottom: isDesktop ? 0 : 8,
                            display: isDesktop ? 'none' : 'flex',
                        },
                        tabBarLabelStyle: {
                            fontSize: 10,
                            fontWeight: '700',
                            marginBottom: 2,
                        },
                        tabBarIconStyle: {
                            marginTop: 4,
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

                    <Tabs.Screen
                        name="settings"
                        options={{
                            title: 'Settings',
                            tabBarIcon: ({ color, focused }) => (
                                <MaterialCommunityIcons
                                    name={focused ? "cog" : "cog-outline"}
                                    size={24}
                                    color={focused ? theme.primary : color}
                                />
                            ),
                            href: isDesktop ? null : '/partners/settings',
                        }}
                    />

                    <Tabs.Screen
                        name="support"
                        options={{
                            href: null,
                        }}
                    />

                    <Tabs.Screen
                        name="ads-campaign"
                        options={{
                            href: null,
                        }}
                    />
                </Tabs>
            </View>
        </View>
    );
}
