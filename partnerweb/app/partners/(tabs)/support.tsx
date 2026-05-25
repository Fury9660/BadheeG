import React from 'react';
import {
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../store/ThemeContext';

export default function SupportScreen() {
    const { colors, isDarkMode } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const handleCall = () => {
        Linking.openURL('tel:+919660856542'); // Placeholder support line
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@badheeg.com?subject=Partner Support Query');
    };

    const themeTextColor = colors.text;
    const themeBorderColor = colors.border;
    const themeCardBg = colors.card;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={[styles.header, { borderBottomColor: themeBorderColor, flexDirection: 'row', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {!isDesktop && (
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color={themeTextColor} />
                        </TouchableOpacity>
                    )}
                    <Text style={[styles.headerTitle, { color: themeTextColor }]}>Help & Support</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Intro Card */}
                <View style={[styles.introCard, { backgroundColor: '#10B981', borderColor: 'transparent' }]}>
                    <Feather name="headphones" size={48} color="#FFFFFF" style={styles.introIcon} />
                    <Text style={styles.introTitle}>How can we help you today?</Text>
                    <Text style={styles.introText}>Our support team is here to help you resolve catalog, delivery, payment, or account related queries.</Text>
                </View>

                {/* Contact Options */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>GET IN TOUCH</Text>
                </View>

                <View style={[styles.card, { backgroundColor: themeCardBg, borderColor: themeBorderColor }]}>
                    <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Feather name="phone" size={20} color="#10B981" />
                        </View>
                        <View style={styles.contactTextContainer}>
                            <Text style={[styles.contactLabel, { color: themeTextColor }]}>Call Support</Text>
                            <Text style={[styles.contactValue, { color: colors.subtext }]}>+91 96608 56542</Text>
                        </View>
                        <Feather name="chevron-right" size={18} color={colors.subtext} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />

                    <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Feather name="mail" size={20} color="#10B981" />
                        </View>
                        <View style={styles.contactTextContainer}>
                            <Text style={[styles.contactLabel, { color: themeTextColor }]}>Email Support</Text>
                            <Text style={[styles.contactValue, { color: colors.subtext }]}>support@badheeg.com</Text>
                        </View>
                        <Feather name="chevron-right" size={18} color={colors.subtext} />
                    </TouchableOpacity>
                </View>

                {/* Support Hours */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>SUPPORT HOURS</Text>
                </View>

                <View style={[styles.card, { backgroundColor: themeCardBg, borderColor: themeBorderColor }]}>
                    <View style={styles.infoRow}>
                        <Feather name="clock" size={18} color="#10B981" style={{ marginRight: 12 }} />
                        <View>
                            <Text style={[styles.infoTitle, { color: themeTextColor }]}>Working Hours</Text>
                            <Text style={[styles.infoValue, { color: colors.subtext }]}>Monday - Saturday: 09:00 AM - 07:00 PM</Text>
                            <Text style={[styles.infoValue, { color: colors.subtext }]}>Sunday: Closed</Text>
                        </View>
                    </View>
                </View>

                {/* FAQ / Info */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>COMMON TROUBLESHOOTING</Text>
                </View>

                <View style={[styles.card, { backgroundColor: themeCardBg, borderColor: themeBorderColor }]}>
                    <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, { color: themeTextColor }]}>How long does order status sync take?</Text>
                        <Text style={[styles.faqAnswer, { color: colors.subtext }]}>Order details and delivery status are updated in real-time. If you face any delay, try refreshing the dashboard using the pull-to-refresh action.</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />

                    <View style={styles.faqItem}>
                        <Text style={[styles.faqQuestion, { color: themeTextColor }]}>How do I request withdrawal updates?</Text>
                        <Text style={[styles.faqAnswer, { color: colors.subtext }]}>All withdrawals are processed within 24-48 business hours. You can check the transaction history status inside the Finance page.</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    introCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: 20,
    },
    introIcon: {
        marginBottom: 12,
    },
    introTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    introText: {
        color: '#E0F2FE',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contactTextContainer: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    contactValue: {
        fontSize: 14,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 13,
        lineHeight: 18,
    },
    faqItem: {
        paddingVertical: 4,
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 6,
    },
    faqAnswer: {
        fontSize: 13,
        lineHeight: 18,
    },
});
