
import MyAddressesContent from '@/components/profile/MyAddressesContent';
import PersonalInfoContent from '@/components/profile/PersonalInfoContent';
import GenericDrawer from '@/components/ui/GenericDrawer';
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons'; // Added Ionicons
import { useUI } from '@/store/UIContext';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MenuOption {
    title: string;
    icon?: any;
    route?: string;
    color?: string;
    subtitle?: string;
    type?: 'link' | 'toggle' | 'custom'; // Added type for flexibility
}

interface MenuSection {
    title?: string;
    layout?: 'row' | 'column';
    options: MenuOption[];
}

const ProfileScreen = () => {
    const { isDarkMode, colors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { user } = useAuth();

    const { setLoginDrawerOpen } = useUI();

    const [profileName, setProfileName] = React.useState('Guest User');
    const [loadingProfile, setLoadingProfile] = React.useState(true);

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const fetchProfile = async () => {
                if (!user) {
                    setProfileName('Guest User');
                    return;
                }

                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('name')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (isActive && data && data.name) {
                        setProfileName(data.name);
                    } else if (isActive) {
                        const metaName = user.user_metadata?.name || user.user_metadata?.full_name;
                        if (metaName) setProfileName(metaName);
                    }
                } catch (err) {
                    console.error("Profile: Unexpected Error fetching profile:", err);
                } finally {
                    if (isActive) setLoadingProfile(false);
                }
            };

            fetchProfile();

            return () => { isActive = false; };
        }, [user])
    );

    const isDesktop = width > 768;
    const isWebPlatform = Platform.OS === 'web';

    const performLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Couldn't log out.");
        }
    };

    const handleLogout = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to log out?")) {
                await performLogout();
            }
        } else {
            Alert.alert(
                "Logout",
                "Are you sure you want to log out?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Logout", style: "destructive", onPress: performLogout }
                ]
            );
        }
    };

    // Drawer State
    const [activeDrawer, setActiveDrawer] = React.useState<string | null>(null);

    const handleMenuItemPress = (item: MenuOption) => {
        if (item.title === 'Logout') {
            handleLogout();
        } else if (item.route) {
            if (item.route === '/personal-info') {
                setActiveDrawer('Personal Information');
            } else if (item.route === '/my-addresses') {
                router.push('/my-addresses');
            } else {
                router.push(item.route as any);
            }
        }
    }

    const menuOptions: MenuSection[] = [
        {
            title: 'My Activity',
            layout: 'row',
            options: [
                { title: 'My Orders', icon: 'package', route: '/my-orders', subtitle: 'Track orders' },
                { title: 'Wishlist', icon: 'heart', route: '/wishlist', subtitle: 'Favorites' },
            ]
        },
        {
            title: 'Account Settings',
            options: [
                { title: 'Personal Information', icon: 'user', route: '/personal-info', subtitle: 'Edit name, email & mobile' },
                { title: 'My Addresses', icon: 'map-pin', route: '/my-addresses', subtitle: 'Manage delivery locations' },
            ]
        },
        {
            title: 'Support & Info',
            options: [
                { title: 'Help & Support', icon: 'help-circle', route: '/help' },
                { title: 'Customer Policy', icon: 'file-text', route: '/legal/customer-policy' },
            ]
        },
        {
            title: 'Session',
            options: [
                { title: 'Logout', icon: 'log-out', color: '#FF3B30' },
            ]
        }
    ];

    const userInitial = user ? profileName.charAt(0).toUpperCase() : 'B';
    const userEmail = user?.email || user?.phone || 'Join to unlock exclusive furniture access';

    const renderDrawerContent = () => {
        switch (activeDrawer) {
            case 'Personal Information':
                return <PersonalInfoContent />;
            case 'My Addresses':
                return <MyAddressesContent />;
            default:
                return null;
        }
    };


    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }]}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
                
                <View style={[styles.loggedOutIconBox, { backgroundColor: colors.text + '08' }]}>
                    <Feather name="user" size={60} color={colors.text} />
                </View>
                
                <Text style={[styles.loggedOutTitle, { color: colors.text }]}>Exclusive Access</Text>
                <Text style={[styles.loggedOutSubtitle, { color: colors.subtext }]}>
                    Sign in to track your orders, manage addresses, and access member-only furniture collections.
                </Text>
                
                <TouchableOpacity 
                    style={[styles.loginBtn, { backgroundColor: colors.text }]}
                    onPress={() => setLoginDrawerOpen(true)}
                >
                    <Text style={[styles.loginBtnText, { color: colors.card }]}>Sign In / Join Now</Text>
                    <Feather name="arrow-right" size={20} color={colors.card} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.browseBtn}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Text style={[styles.browseBtnText, { color: colors.subtext }]}>Continue as Guest</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#000000" : "#ffffff"} />

            {!isWebPlatform && (
                <View style={{ 
                    paddingTop: insets.top + 20, 
                    paddingHorizontal: 24, 
                    paddingBottom: 20,
                    backgroundColor: colors.background
                }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8, opacity: 0.8 }}>EXCLUSIVITY</Text>
                    <Text style={{ fontSize: 32, fontWeight: '900', color: colors.text, letterSpacing: -1 }}>Account</Text>
                </View>
            )}

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContainer,
                    isDesktop && { alignItems: 'center', paddingVertical: 40 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[
                    styles.contentWrapper,
                    { width: '100%', maxWidth: isDesktop ? 1100 : 700, alignSelf: 'center' },
                    isDesktop && styles.desktopLayout
                ]}>

                    {/* Left Column (Sidebar-style on Desktop) */}
                    <View style={isDesktop ? styles.leftColumn : null}>
                        {/* Modern Profile Header */}
                        <View style={[styles.header, isDesktop && styles.headerDesktop, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.profileSection, isDesktop && styles.profileSectionDesktop]}>
                                <View style={[
                                    styles.avatarContainer,
                                    { backgroundColor: colors.text, shadowColor: '#000' },
                                    isDesktop && styles.avatarContainerDesktop
                                ]}>
                                    <Text style={[styles.avatarText, { color: colors.card }, isDesktop && styles.avatarTextDesktop]}>{userInitial}</Text>
                                </View>
                                <View style={[styles.userInfo, isDesktop && styles.userInfoDesktop]}>
                                    <Text style={[styles.userName, { color: colors.text }]}>
                                        {user ? profileName : "Join the Circle"}
                                    </Text>
                                    <Text style={[styles.userHandle, { color: colors.subtext }]}>{userEmail}</Text>
                                    
                                    {user ? (
                                        <TouchableOpacity
                                            style={[styles.editProfileBtn, { backgroundColor: colors.text }]}
                                            onPress={() => setActiveDrawer('Personal Information')}
                                        >
                                            <Text style={[styles.editProfileText, { color: colors.card }]}>Edit Profile</Text>
                                            <Feather name="chevron-right" size={14} color={colors.card} />
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.editProfileBtn, { backgroundColor: colors.text }]}
                                            onPress={() => router.push('/(auth)')}
                                        >
                                            <Text style={[styles.editProfileText, { color: colors.card }]} numberOfLines={1}>Sign In / Join</Text>
                                            <Feather name="arrow-right" size={14} color={colors.card} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Right Column (Actual Settings) */}
                    <View style={isDesktop ? styles.rightColumn : null}>
                        {/* Menu Sections */}
                        {menuOptions.map((section, sectionIndex) => (
                            <View key={sectionIndex} style={styles.sectionContainer}>
                                {section.title && (
                                    <Text style={[styles.sectionHeader, { color: colors.subtext }]}>
                                        {section.title.toUpperCase()}
                                    </Text>
                                )}

                                <View style={[
                                    styles.cardGroup,
                                    {
                                        backgroundColor: colors.card,
                                        flexDirection: section.layout === 'row' ? 'row' : 'column',
                                        borderColor: colors.border,
                                        borderWidth: 1
                                    }
                                ]}>
                                    {section.options.map((item, index) => {
                                        const isLast = index === section.options.length - 1;

                                        if (section.layout === 'row') {
                                            return (
                                                <React.Fragment key={index}>
                                                    <TouchableOpacity
                                                        style={[styles.menuItem, {
                                                            flex: 1,
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            paddingVertical: 12,
                                                            justifyContent: 'center'
                                                        }]}
                                                        onPress={() => handleMenuItemPress(item)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <View style={[
                                                            styles.iconBox,
                                                            {
                                                                backgroundColor: item.color ? item.color + '15' : colors.primary + '15',
                                                                marginBottom: 6,
                                                                marginRight: 0,
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: 18
                                                            }
                                                        ]}>
                                                            <Feather
                                                                name={item.icon}
                                                                size={20}
                                                                color={item.color || colors.primary}
                                                            />
                                                        </View>
                                                        <Text style={[styles.menuTitle, {
                                                            color: item.color || colors.text,
                                                            fontSize: 14,
                                                            fontWeight: '600',
                                                            marginBottom: 2
                                                        }]}>
                                                            {item.title}
                                                        </Text>
                                                        {item.subtitle && (
                                                            <Text style={{ fontSize: 11, color: colors.subtext }}>{item.subtitle}</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                    {!isLast && (
                                                        <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 8 }} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        }

                                        return (
                                            <React.Fragment key={index}>
                                                <TouchableOpacity
                                                    style={[styles.menuItem]}
                                                    onPress={() => handleMenuItemPress(item)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[
                                                        styles.iconBox,
                                                        { backgroundColor: item.color ? item.color + '15' : colors.primary + '15' }
                                                    ]}>
                                                        <Feather
                                                            name={item.icon}
                                                            size={20}
                                                            color={item.color || colors.primary}
                                                        />
                                                    </View>

                                                    <View style={styles.menuContent}>
                                                        <Text style={[styles.menuTitle, { color: item.color || colors.text }]}>
                                                            {item.title}
                                                        </Text>
                                                        {item.subtitle && (
                                                            <Text style={[styles.menuSubtitle, { color: colors.subtext }]} numberOfLines={1}>
                                                                {item.subtitle}
                                                            </Text>
                                                        )}
                                                    </View>

                                                    <Feather name="chevron-right" size={20} color={colors.subtext} style={{ opacity: 0.5 }} />
                                                </TouchableOpacity>

                                                {!isLast && (
                                                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}

                        <Text style={{ textAlign: 'center', color: colors.subtext, fontSize: 13, marginBottom: 40, marginTop: 10 }}>
                            Version 1.0.0 • Badhee G Partner App
                        </Text>
                    </View>

                </View>
            </ScrollView>

            <GenericDrawer
                isVisible={!!activeDrawer}
                onClose={() => setActiveDrawer(null)}
                title={activeDrawer || ''}
            >
                {renderDrawerContent()}
            </GenericDrawer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { paddingVertical: 20 },
    contentWrapper: { paddingHorizontal: 16 },
    desktopLayout: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 40,
    },
    leftColumn: {
        width: 320,
    },
    rightColumn: {
        flex: 1,
    },

    header: {
        marginVertical: 8,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
    },
    headerDesktop: {
        padding: 40,
        marginHorizontal: 0,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileSectionDesktop: {
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarContainerDesktop: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginRight: 0,
        marginBottom: 32,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '900',
    },
    avatarTextDesktop: {
        fontSize: 48,
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    userInfoDesktop: {
        alignItems: 'center',
        textAlign: 'center',
        flex: 0,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: -1,
    },
    userHandle: {
        fontSize: 13,
        marginBottom: 16,
        fontWeight: '500',
        opacity: 0.8,
    },
    editProfileBtn: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 130, // Slightly reduced
    },
    editProfileText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    sectionContainer: {
        marginBottom: 16, // Reduced from 24
    },
    sectionHeader: {
        fontSize: 10,
        fontWeight: '800',
        marginLeft: 20,
        marginBottom: 8,
        letterSpacing: 2,
        opacity: 0.6,
    },
    cardGroup: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Reduced from 16
        paddingHorizontal: 16,
    },
    iconBox: {
        width: 32, // Reduced from 40
        height: 32,
        borderRadius: 10, // Reduced from 12
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12, // Reduced from 16
    },
    menuContent: {
        flex: 1,
        justifyContent: 'center',
    },
    menuTitle: {
        fontSize: 15, // Reduced from 16
        fontWeight: '600',
        marginBottom: 0, // Reduced from 2
    },
    menuSubtitle: {
        fontSize: 12, // Reduced from 13
    },
    separator: {
        height: 1,
        marginLeft: 60,
        opacity: 0.05,
    },
    // Logged Out Styles
    loggedOutIconBox: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    loggedOutTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -1,
    },
    loggedOutSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
        opacity: 0.8,
    },
    loginBtn: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loginBtnText: {
        fontSize: 16,
        fontWeight: '800',
    },
    browseBtn: {
        marginTop: 20,
        padding: 10,
    },
    browseBtnText: {
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default ProfileScreen;
