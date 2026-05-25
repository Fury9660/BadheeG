import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AboutUsScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const theme = {
        background: isDarkMode ? '#000000' : '#F8F9FA',
        text: isDarkMode ? '#FFFFFF' : '#121212',
        subtext: isDarkMode ? '#888888' : '#666666',
        card: isDarkMode ? '#111111' : '#FFFFFF',
        border: isDarkMode ? '#222222' : '#E5E5EA',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
    };

    const team = [
        {
            name: 'Ravi Prakash Jangid',
            role: 'Chief Executive Officer',
            bio: 'Visionary leader driving the strategic growth and digital transformation of BADHEE G.',
            icon: 'award'
        },
        {
            name: 'Rajesh Kumar Mahala',
            role: 'Director',
            bio: 'Expert in operational excellence and building sustainable global partnerships.',
            icon: 'shield'
        },
        {
            name: 'Tarbini Devi',
            role: 'Director',
            bio: 'Dedicated to organizational values and overseeing the foundational integrity of the ecosystem.',
            icon: 'anchor'
        },
        {
            name: 'Capt Yuvraj',
            role: 'Developer',
            bio: 'Architecting the future of furniture retail through cutting-edge digital experiences.',
            icon: 'cpu'
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>EST. 1993</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>ABOUT US</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, isDesktop && { paddingHorizontal: (width - 1200) / 2 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={[styles.heroHeading, { color: theme.text }]}>
                        Crafting Luxury, {"\n"}Defining Legacy.
                    </Text>
                    <Text style={[styles.heroSubheading, { color: theme.subtext }]}>
                        Since 1993, BADHEE G has been at the forefront of handcrafted furniture, blending heritage with modern minimalist design.
                    </Text>
                </View>

                {/* Team Section */}
                <View style={styles.teamHeader}>
                    <Text style={[styles.teamPreTitle, { color: theme.subtext }]}>OUR LEADERSHIP</Text>
                    <Text style={[styles.teamMainTitle, { color: theme.text }]}>The Minds Behind the Vision</Text>
                </View>

                <View style={styles.teamGrid}>
                    {team.map((member, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.memberCard, 
                                { 
                                    backgroundColor: theme.card, 
                                    borderColor: theme.border,
                                    width: width > 600 ? '48.5%' : '48.5%' // Forced 2-column for most devices
                                }
                            ]}
                        >
                            <View style={[styles.imageContainer, { backgroundColor: theme.text + '08' }]}>
                                {/* Placeholder for large image */}
                                <Feather name={member.icon as any} size={48} color={theme.text + '20'} />
                                <Text style={[styles.imagePlaceholderText, { color: theme.text + '30' }]}>PHOTO</Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                                <Text style={[styles.memberRole, { color: theme.subtext }]}>{member.role.toUpperCase()}</Text>
                                <Text style={[styles.memberBio, { color: theme.subtext }]} numberOfLines={3}>{member.bio}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Mission Section */}
                <View style={[styles.missionRow, { borderTopColor: theme.border }]}>
                    <View style={styles.missionCol}>
                        <Text style={[styles.missionLabel, { color: theme.subtext }]}>MISSION</Text>
                        <Text style={[styles.missionDesc, { color: theme.text }]}>Empowering global artisans through digital luxury.</Text>
                    </View>
                    <View style={styles.missionCol}>
                        <Text style={[styles.missionLabel, { color: theme.subtext }]}>VISION</Text>
                        <Text style={[styles.missionDesc, { color: theme.text }]}>Setting the world standard for handcrafted heritage.</Text>
                    </View>
                </View>

                <View style={styles.footerInfo}>
                    <Text style={[styles.footerText, { color: theme.subtext }]}>Registered Office: Khuri Bari, Sikar, Rajasthan</Text>
                    <Text style={[styles.footerText, { color: theme.subtext }]}>© 2024 Badhee G Pvt. Ltd.</Text>
                </View>
                
                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -1,
    },
    scrollContent: {
        padding: 20,
    },
    heroSection: {
        marginTop: 32,
        marginBottom: 48,
    },
    heroHeading: {
        fontSize: 40,
        fontWeight: '900',
        lineHeight: 48,
        letterSpacing: -2,
        marginBottom: 16,
    },
    heroSubheading: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
        opacity: 0.7,
    },
    teamHeader: {
        marginBottom: 24,
    },
    teamPreTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
        marginBottom: 8,
    },
    teamMainTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    teamGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 60,
    },
    memberCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 10,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1, // Large square image
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: 12,
    },
    memberInfo: {
        padding: 16,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    memberRole: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 8,
        opacity: 0.6,
    },
    memberBio: {
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
        opacity: 0.7,
    },
    missionRow: {
        flexDirection: 'row',
        paddingVertical: 40,
        borderTopWidth: 1,
        gap: 24,
    },
    missionCol: {
        flex: 1,
    },
    missionLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    missionDesc: {
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
    },
    footerInfo: {
        marginTop: 40,
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 10,
        fontWeight: '600',
        opacity: 0.4,
    },
});

export default AboutUsScreen;
