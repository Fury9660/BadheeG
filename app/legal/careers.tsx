import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CareersScreen = () => {
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

    const openPositions = [
        {
            title: 'Furniture Designer',
            type: 'Full-time',
            location: 'Sikar, Rajasthan',
            category: 'Design'
        },
        {
            title: 'Quality Control Specialist',
            type: 'Full-time',
            location: 'Sikar, Rajasthan',
            category: 'Operations'
        },
        {
            title: 'Retail Store Manager',
            type: 'Full-time',
            location: 'Multiple Locations',
            category: 'Sales'
        },
        {
            title: 'Operations Manager',
            type: 'Full-time',
            location: 'Sikar, Rajasthan',
            category: 'Management'
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
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>JOIN THE JOURNEY</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Careers</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, isDesktop && { paddingHorizontal: (width - 1000) / 2 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={[styles.heroHeading, { color: theme.text }]}>
                        Shape the Future of {"\n"}Handcrafted Luxury.
                    </Text>
                    <Text style={[styles.heroSubheading, { color: theme.subtext }]}>
                        At BADHEE G, we are always looking for passionate individuals who value quality, craftsmanship, and innovation. Join us in building Indias most trusted furniture ecosystem.
                    </Text>
                </View>

                {/* Culture Section */}
                <View style={styles.cultureGrid}>
                    <View style={[styles.cultureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Feather name="heart" size={24} color={theme.text} />
                        <Text style={[styles.cultureTitle, { color: theme.text }]}>Craft-First Culture</Text>
                        <Text style={[styles.cultureDesc, { color: theme.subtext }]}>We respect tradition while embracing the digital future.</Text>
                    </View>
                    <View style={[styles.cultureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Feather name="trending-up" size={24} color={theme.text} />
                        <Text style={[styles.cultureTitle, { color: theme.text }]}>Growth & Ownership</Text>
                        <Text style={[styles.cultureDesc, { color: theme.subtext }]}>Every team member is a stakeholder in our collective success.</Text>
                    </View>
                </View>

                {/* Open Positions */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Openings</Text>
                <View style={styles.positionsList}>
                    {openPositions.map((job, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={[styles.jobCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                        >
                            <View style={styles.jobInfo}>
                                <Text style={[styles.jobTitle, { color: theme.text }]}>{job.title}</Text>
                                <View style={styles.jobMeta}>
                                    <Text style={[styles.jobMetaText, { color: theme.subtext }]}>{job.category}</Text>
                                    <View style={[styles.metaDot, { backgroundColor: theme.subtext + '40' }]} />
                                    <Text style={[styles.jobMetaText, { color: theme.subtext }]}>{job.location}</Text>
                                </View>
                            </View>
                            <View style={[styles.jobType, { backgroundColor: theme.text + '08' }]}>
                                <Text style={[styles.jobTypeText, { color: theme.text }]}>{job.type}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Call to Action */}
                <View style={[styles.ctaSection, { backgroundColor: theme.text }]}>
                    <Text style={[styles.ctaTitle, { color: theme.card }]}>Don't see a role for you?</Text>
                    <Text style={[styles.ctaDesc, { color: theme.card + '90' }]}>
                        We are always looking for exceptional talent. Send your resume to our support team and we'll keep you in mind for future openings.
                    </Text>
                    <TouchableOpacity 
                        style={[styles.emailBtn, { backgroundColor: theme.card }]}
                        onPress={() => {}}
                    >
                        <Feather name="mail" size={18} color={theme.text} />
                        <Text style={[styles.emailBtnText, { color: theme.text }]}>support@badheeg.com</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
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
        paddingBottom: 24,
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
        padding: 24,
    },
    heroSection: {
        marginTop: 40,
        marginBottom: 60,
    },
    heroHeading: {
        fontSize: 38,
        fontWeight: '900',
        lineHeight: 46,
        letterSpacing: -1.5,
        marginBottom: 24,
    },
    heroSubheading: {
        fontSize: 17,
        lineHeight: 26,
        fontWeight: '500',
        opacity: 0.7,
    },
    cultureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 80,
    },
    cultureCard: {
        flex: 1,
        minWidth: 280,
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        gap: 16,
    },
    cultureTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    cultureDesc: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 24,
        opacity: 0.5,
    },
    positionsList: {
        gap: 12,
        marginBottom: 80,
    },
    jobCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
    },
    jobInfo: {
        flex: 1,
        marginRight: 16,
    },
    jobTitle: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 6,
    },
    jobMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    jobMetaText: {
        fontSize: 13,
        fontWeight: '600',
    },
    metaDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    jobType: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    jobTypeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    ctaSection: {
        padding: 40,
        borderRadius: 32,
        alignItems: 'center',
        textAlign: 'center',
    },
    ctaTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 16,
        textAlign: 'center',
    },
    ctaDesc: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 32,
        opacity: 0.9,
    },
    emailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
    },
    emailBtnText: {
        fontSize: 15,
        fontWeight: '800',
    },
});

export default CareersScreen;
