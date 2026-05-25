import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Dimensions, ImageBackground, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../../store/AuthContext";
import Header from "./components/Header";

const { width } = Dimensions.get('window');

// Responsive Hooks or Constants
const isMobile = width < 768;

export default function Index() {
    const router = useRouter();
    const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width);

    const { user, isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        if (!isAuthLoading && user) {
            router.replace('/partners/(tabs)/dashboard');
        }
    }, [user, isAuthLoading]);

    useEffect(() => {
        const onChange = ({ window }: { window: any }) => {
            setWindowWidth(window.width);
        };

        const subscription = Dimensions.addEventListener("change", onChange);
        return () => subscription?.remove();
    }, []);

    const isSmallScreen = windowWidth < 768;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Header />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <ImageBackground
                    source={require("../../assets/images/hero_bg.png")}
                    style={[
                        styles.heroBackground,
                        { height: isSmallScreen ? 500 : 700 }
                    ]}
                    imageStyle={{ opacity: 0.8 }}
                >
                    <View style={styles.heroOverlay}>
                        <View style={styles.heroContent}>
                            <Text style={[styles.heroBadge, isSmallScreen && styles.heroBadgeMobile]}>
                                For Furniture Professionals
                            </Text>
                            <Text style={[styles.heroTitle, isSmallScreen && styles.heroTitleMobile]}>
                                Grow Your Furniture Business with Badhee
                            </Text>
                            <Text style={[styles.heroSubtitle, isSmallScreen && styles.heroSubtitleMobile]}>
                                Join the network of trusted furniture partners. Get verified leads, manage orders seamlessly, and scale your operations.
                            </Text>

                            <TouchableOpacity
                                style={[styles.ctaButton, isSmallScreen && styles.ctaButtonMobile]}
                                onPress={() => router.push('/login?intent=register')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.ctaButtonText}>Join As a Badhee Partner</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>Why Partner with Badhee?</Text>

                    <View style={styles.featuresGrid}>
                        <View style={[styles.featureCard, isSmallScreen && styles.featureCardMobile]}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.featureIcon}>📈</Text>
                            </View>
                            <Text style={styles.featureTitle}>Get Verified Leads</Text>
                            <Text style={styles.featureDescription}>
                                Access a stream of customers actively looking for premium furniture in your area.
                            </Text>
                        </View>

                        <View style={[styles.featureCard, isSmallScreen && styles.featureCardMobile]}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.featureIcon}>🛠️</Text>
                            </View>
                            <Text style={styles.featureTitle}>Project Management</Text>
                            <Text style={styles.featureDescription}>
                                Seamlessly track custom orders, measurements, and delivery statuses in one dashboard.
                            </Text>
                        </View>

                        <View style={[styles.featureCard, isSmallScreen && styles.featureCardMobile]}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.featureIcon}>💳</Text>
                            </View>
                            <Text style={styles.featureTitle}>Secure Payments</Text>
                            <Text style={styles.featureDescription}>
                                Get paid directly into your bank account with automated payouts and transparent billing.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Showroom Showcase */}
                <View style={[styles.showroomSection, isSmallScreen && styles.showroomSectionMobile]}>
                    <View style={styles.showroomTextContainer}>
                        <Text style={styles.showroomTitle}>Global Standards of Craftsmanship</Text>
                        <Text style={styles.showroomSubtitle}>
                            We connect local artisans and furniture showrooms to a wider digital audience, ensuring your craft gets the spotlight it deserves.
                        </Text>
                    </View>
                    <View style={[styles.imageGrid, isSmallScreen && styles.imageGridMobile]}>
                        <ImageBackground
                            source={require("../../assets/images/showroom.png")}
                            style={styles.gridImage}
                            imageStyle={{ borderRadius: 16 }}
                        />
                        <ImageBackground
                            source={require("../../assets/images/craftsmanship.png")}
                            style={styles.gridImage}
                            imageStyle={{ borderRadius: 16 }}
                        />
                    </View>
                </View>

                {/* Registration CTA Footer */}
                <View style={styles.footerCta}>
                    <Text style={styles.footerCtaTitle}>Ready to Scale Your Business?</Text>
                    <TouchableOpacity
                        style={styles.footerButton}
                        onPress={() => router.push('/login?intent=register')}
                    >
                        <Text style={styles.footerButtonText}>Register as a Partner Now</Text>
                    </TouchableOpacity>
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
    scrollContent: {
        flexGrow: 1,
    },
    heroBackground: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    heroContent: {
        alignItems: 'center',
        maxWidth: 1000,
    },
    heroBadge: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        color: '#fff',
        fontWeight: '700',
        marginBottom: 24,
        overflow: 'hidden',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    heroBadgeMobile: {
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 64,
        fontWeight: '900',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 74,
        letterSpacing: -2,
    },
    heroTitleMobile: {
        fontSize: 38,
        lineHeight: 46,
    },
    heroSubtitle: {
        fontSize: 22,
        color: '#f0f0f0',
        textAlign: 'center',
        maxWidth: 700,
        marginBottom: 48,
        lineHeight: 34,
        fontWeight: '400',
    },
    heroSubtitleMobile: {
        fontSize: 18,
        lineHeight: 28,
        marginBottom: 32,
    },
    ctaButton: {
        backgroundColor: '#ffffff',
        paddingVertical: 20,
        paddingHorizontal: 48,
        borderRadius: 50,
        ...Platform.select({
            web: {
                boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            },
            default: {
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            }
        })
    },
    ctaButtonMobile: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        width: '100%',
    },
    ctaButtonText: {
        color: '#1a1a1a',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    featuresSection: {
        paddingVertical: 100,
        paddingHorizontal: 24,
        backgroundColor: '#f9f9fb',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 42,
        fontWeight: '800',
        marginBottom: 60,
        color: '#1a1a1a',
        textAlign: 'center',
        letterSpacing: -1,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 1200,
        gap: 32,
    },
    featureCard: {
        width: 350,
        backgroundColor: '#ffffff',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f0f0f5',
        ...Platform.select({
            web: {
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 15,
            }
        })
    },
    featureCardMobile: {
        width: '100%',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    featureIcon: {
        fontSize: 32,
    },
    featureTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    featureDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 26,
    },
    showroomSection: {
        flexDirection: 'row',
        paddingVertical: 100,
        paddingHorizontal: 24,
        maxWidth: 1200,
        alignSelf: 'center',
        alignItems: 'center',
        gap: 60,
    },
    showroomSectionMobile: {
        flexDirection: 'column',
    },
    showroomTextContainer: {
        flex: 1,
    },
    showroomTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 24,
        lineHeight: 44,
    },
    showroomSubtitle: {
        fontSize: 18,
        color: '#666',
        lineHeight: 30,
    },
    imageGrid: {
        flex: 1.2,
        flexDirection: 'row',
        gap: 20,
    },
    imageGridMobile: {
        flexDirection: 'column',
        width: '100%',
    },
    gridImage: {
        flex: 1,
        height: 400,
        borderRadius: 16,
        overflow: 'hidden',
    },
    footerCta: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 100,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    footerCtaTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 40,
        textAlign: 'center',
    },
    footerButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 20,
        paddingHorizontal: 60,
        borderRadius: 50,
    },
    footerButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
});
