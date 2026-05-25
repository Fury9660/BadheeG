import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SecurityScreen = () => {
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

    const securityFeatures = [
        {
            title: 'End-to-End Encryption',
            desc: 'Your personal and financial data is protected by industry-standard AES-256 encryption and SSL/TLS secure channels.',
            icon: 'lock'
        },
        {
            title: 'PCI DSS Compliance',
            desc: 'All payments are processed through bank-grade secure gateways. We never store your full credit/debit card details.',
            icon: 'credit-card'
        },
        {
            title: 'Privacy by Design',
            desc: 'We follow strict data minimization principles. We only collect what is absolutely necessary to deliver your furniture.',
            icon: 'shield'
        },
        {
            title: 'Regular Audits',
            desc: 'Our platform undergoes frequent security assessments and vulnerability scans to ensure your data stays safe.',
            icon: 'search'
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
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>TRUSTED BY THOUSANDS</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Data & Security</Text>
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
                        Your Security is {"\n"}Our Priority.
                    </Text>
                    <Text style={[styles.heroSubheading, { color: theme.subtext }]}>
                        At BADHEE G, we understand the trust you place in us when sharing your personal information. We employ state-of-the-art security measures to ensure your data remains confidential and protected.
                    </Text>
                </View>

                {/* Features Grid */}
                <View style={styles.featuresGrid}>
                    {securityFeatures.map((feature, index) => (
                        <View key={index} style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: theme.text + '08' }]}>
                                <Feather name={feature.icon as any} size={22} color={theme.text} />
                            </View>
                            <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                            <Text style={[styles.featureDesc, { color: theme.subtext }]}>{feature.desc}</Text>
                        </View>
                    ))}
                </View>

                {/* Best Practices */}
                <View style={[styles.bestPractices, { borderTopColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>HOW YOU CAN STAY SAFE</Text>
                    
                    <View style={styles.tipRow}>
                        <View style={[styles.tipDot, { backgroundColor: theme.text }]} />
                        <Text style={[styles.tipText, { color: theme.text }]}>
                            Use a strong, unique password for your BADHEE G account.
                        </Text>
                    </View>
                    
                    <View style={styles.tipRow}>
                        <View style={[styles.tipDot, { backgroundColor: theme.text }]} />
                        <Text style={[styles.tipText, { color: theme.text }]}>
                            Never share your OTP or account credentials with anyone.
                        </Text>
                    </View>
                    
                    <View style={styles.tipRow}>
                        <View style={[styles.tipDot, { backgroundColor: theme.text }]} />
                        <Text style={[styles.tipText, { color: theme.text }]}>
                            Ensure you are always shopping on the official www.badheeg.com platform.
                        </Text>
                    </View>
                </View>

                {/* Reporting */}
                <View style={[styles.reportSection, { backgroundColor: theme.text }]}>
                    <Feather name="alert-triangle" size={32} color={theme.card} />
                    <Text style={[styles.reportTitle, { color: theme.card }]}>Found a Vulnerability?</Text>
                    <Text style={[styles.reportDesc, { color: theme.card + '90' }]}>
                        We take security reports very seriously. If you believe you have found a security vulnerability on our platform, please report it immediately to our technical team.
                    </Text>
                    <TouchableOpacity style={[styles.reportBtn, { backgroundColor: theme.card }]}>
                        <Text style={[styles.reportBtnText, { color: theme.text }]}>Contact Security Team</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerInfo}>
                    <Text style={[styles.footerText, { color: theme.subtext }]}>Badhee G Pvt. Ltd.</Text>
                    <Text style={[styles.footerText, { color: theme.subtext }]}>Last Updated: April 2024</Text>
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
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 60,
    },
    featureCard: {
        flex: 1,
        minWidth: 280,
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        gap: 16,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    featureDesc: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    bestPractices: {
        borderTopWidth: 1,
        paddingVertical: 60,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 3,
        marginBottom: 32,
        opacity: 0.6,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    tipText: {
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 22,
    },
    reportSection: {
        padding: 48,
        borderRadius: 32,
        alignItems: 'center',
    },
    reportTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 16,
        marginBottom: 16,
    },
    reportDesc: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 32,
    },
    reportBtn: {
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 16,
    },
    reportBtnText: {
        fontSize: 15,
        fontWeight: '800',
    },
    footerInfo: {
        marginTop: 60,
        alignItems: 'center',
        gap: 8,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.5,
    },
});

export default SecurityScreen;
