import { useAuth } from "@/store/AuthContext";
import { useTheme } from "@/store/ThemeContext";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ImageBackground, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

export default function LandingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors: theme, isDarkMode } = useTheme();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const contentMaxWidth = 1200;

    // If user is already logged in, the layout will handle redirection to dashboard, 
    // but we can add a button to go to dashboard if they are here.

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style="light" />

            {/* Header Overlay */}
            <SafeAreaView style={styles.headerContainer}>
                <BlurView intensity={Platform.OS === 'ios' ? 20 : 40} tint={isDarkMode ? 'dark' : 'light'} style={styles.headerBlur}>
                    <View style={[styles.headerContent, isDesktop && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center', paddingHorizontal: 40 }]}>
                        <Text style={[styles.logoText, { color: isDarkMode ? '#fff' : '#000' }]}>Badhee Partner</Text>
                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                            onPress={() => router.push({ pathname: '/login', params: { intent: 'login' } })}
                        >
                            <Text style={[styles.loginButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <ImageBackground
                    source={require("../assets/images/luxury_furniture_banner.png")}
                    style={styles.heroBackground}
                    imageStyle={{ opacity: 0.6, backgroundColor: '#000' }}
                >
                    <View style={styles.heroOverlay}>
                        <View style={styles.heroContent}>
                            <View style={styles.badgeContainer}>
                                <Text style={styles.heroBadge}>For Furniture Professionals</Text>
                            </View>
                            <Text style={styles.heroTitle}>
                                Grow Your Furniture Business
                            </Text>
                            <Text style={styles.heroSubtitle}>
                                Join the network of trusted furniture partners. Get verified leads and scale your operations.
                            </Text>

                            <TouchableOpacity
                                style={styles.ctaButton}
                                onPress={() => router.push({ pathname: '/login', params: { intent: 'login' } })}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.ctaButtonText}>Partner Login</Text>
                                <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>

                {/* Features Section */}
                <View style={[styles.featuresSection, { backgroundColor: isDarkMode ? '#121212' : '#f9f9fb' }, isDesktop && { alignItems: 'center' }]}>
                    <View style={[isDesktop && { width: '100%', maxWidth: contentMaxWidth }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Why Partner with Badhee?</Text>

                        <View style={[isDesktop && { flexDirection: 'row', gap: 24 }]}>
                            <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }, isDesktop && { flex: 1, marginBottom: 0 }]}>
                                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#222' : '#f0f7ff' }]}>
                                    <Text style={styles.featureIcon}>📈</Text>
                                </View>
                                <View style={styles.featureTextContainer}>
                                    <Text style={[styles.featureTitle, { color: theme.text }]}>Get Verified Leads</Text>
                                    <Text style={[styles.featureDescription, { color: theme.subtext }]}>
                                        Access a stream of customers actively looking for premium furniture in your area.
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }, isDesktop && { flex: 1, marginBottom: 0 }]}>
                                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#222' : '#f0f7ff' }]}>
                                    <Text style={styles.featureIcon}>🛠️</Text>
                                </View>
                                <View style={styles.featureTextContainer}>
                                    <Text style={[styles.featureTitle, { color: theme.text }]}>Project Management</Text>
                                    <Text style={[styles.featureDescription, { color: theme.subtext }]}>
                                        Seamlessly track custom orders, measurements, and delivery statuses.
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border }, isDesktop && { flex: 1, marginBottom: 0 }]}>
                                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#222' : '#f0f7ff' }]}>
                                    <Text style={styles.featureIcon}>💳</Text>
                                </View>
                                <View style={styles.featureTextContainer}>
                                    <Text style={[styles.featureTitle, { color: theme.text }]}>Secure Payments</Text>
                                    <Text style={[styles.featureDescription, { color: theme.subtext }]}>
                                        Get paid directly into your bank account with automated payouts.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Showroom Showcase */}
                <View style={[styles.showroomSection, { backgroundColor: theme.background }, isDesktop && { alignItems: 'center' }]}>
                    <View style={[isDesktop && { width: '100%', maxWidth: contentMaxWidth }]}>
                        <Text style={[styles.showroomTitle, { color: theme.text }]}>Global Craftsmanship</Text>
                        <Text style={[styles.showroomSubtitle, { color: theme.subtext }]}>
                            We connect local artisans and furniture showrooms to a wider digital audience.
                        </Text>

                        <View style={styles.imageContainer}>
                            <ImageBackground
                                source={require("../assets/images/showroom.png")}
                                style={styles.gridImage}
                                imageStyle={{ borderRadius: 16 }}
                            />
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footerCta}>
                    <View style={[isDesktop && { width: '100%', maxWidth: contentMaxWidth, alignItems: 'center' }]}>
                        <Text style={styles.footerCtaTitle}>Ready to Scale?</Text>
                        <TouchableOpacity
                            style={[styles.footerButton, isDesktop && { width: 'auto', paddingHorizontal: 60 }]}
                            onPress={() => router.push({ pathname: '/login', params: { intent: 'login' } })}
                        >
                            <Text style={styles.footerButtonText}>Login to Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerBlur: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    loginButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroBackground: {
        width: '100%',
        height: 600,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    heroContent: {
        alignItems: 'center',
        width: '100%',
    },
    badgeContainer: {
        marginBottom: 24,
    },
    heroBadge: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        color: '#fff',
        fontWeight: '700',
        overflow: 'hidden',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -1,
        lineHeight: 48,
    },
    heroSubtitle: {
        fontSize: 18,
        color: '#e0e0e0',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 26,
    },
    ctaButton: {
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 50,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    ctaButtonText: {
        color: '#1a1a1a',
        fontSize: 18,
        fontWeight: '800',
    },
    featuresSection: {
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: '#f9f9fb',
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 40,
        color: '#1a1a1a',
        textAlign: 'center',
    },
    featureCard: {
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#f0f0f5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureIcon: {
        fontSize: 24,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    featureDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    showroomSection: {
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    showroomTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 16,
        lineHeight: 40,
    },
    showroomSubtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 32,
    },
    imageContainer: {
        width: '100%',
        height: 250,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
    },
    gridImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    footerCta: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 60,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    footerCtaTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 32,
        textAlign: 'center',
    },
    footerButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 50,
        width: '100%',
    },
    footerButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
});
