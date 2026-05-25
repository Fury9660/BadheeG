import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const faqs = [
    { 
        question: 'How do I return a product?', 
        answer: 'You can return a product within 7 days of delivery. Go to My Orders > Select Order > Click Return. Our team will verify and process your request within 24-48 hours.',
        icon: 'package-variant-closed'
    },
    { 
        question: 'How can I track my order?', 
        answer: 'Once your order is shipped, you will receive an email with the tracking ID and a link to the courier\'s website. You can also track directly from the "Orders" section in your dashboard.',
        icon: 'truck-delivery-outline'
    },
    { 
        question: 'Is Cash on Delivery (COD) available?', 
        answer: 'Yes, COD is available for most pincodes. You can check the availability during checkout by entering your delivery pincode.',
        icon: 'cash-marker'
    },
];

const HelpScreen = () => {
    const { colors: theme, isDarkMode } = useTheme();
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveIndex(activeIndex === index ? null : index);
    };

    const contactMethods = [
        {
            id: 'email',
            label: 'Email Support',
            value: 'support@badheeg.com',
            icon: 'mail',
            color: '#10B981',
            action: () => Linking.openURL('mailto:support@badheeg.com')
        },
        {
            id: 'phone',
            label: 'Call Us',
            value: '+91 9521633688',
            icon: 'phone',
            color: '#3B82F6',
            action: () => Linking.openURL('tel:+919521633688')
        },
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            value: 'Live Chat',
            icon: 'message-circle',
            color: '#25D366',
            action: () => Linking.openURL('https://wa.me/919521633688')
        }
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F8FAFC' }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Header Section */}
                <View style={styles.titleSection}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFF', borderColor: theme.border }]}>
                        <Feather name="arrow-left" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.mainTitle, { color: theme.text }]}>Help & Support</Text>
                        <View style={styles.dot} />
                        <Text style={styles.subTitle}>We're here to help you</Text>
                    </View>
                </View>

                {/* Contact Cards Row */}
                <View style={styles.contactGrid}>
                    {contactMethods.map((method) => (
                        <TouchableOpacity 
                            key={method.id}
                            style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={method.action}
                        >
                            <View style={[styles.iconBox, { backgroundColor: method.color + '15' }]}>
                                <Feather name={method.icon as any} size={22} color={method.color} />
                            </View>
                            <Text style={[styles.methodLabel, { color: theme.subtext }]}>{method.label}</Text>
                            <Text style={[styles.methodValue, { color: theme.text }]}>{method.value}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAQ Section */}
                <View style={[styles.sectionContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
                            <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Quick answers to common questions</Text>
                        </View>
                        <View style={styles.iconCircle}><Feather name="help-circle" size={20} color="#10B981" /></View>
                    </View>

                    <View style={styles.faqList}>
                        {faqs.map((faq, index) => (
                            <View key={index} style={[styles.faqWrapper, index !== faqs.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                                <TouchableOpacity 
                                    onPress={() => toggleFAQ(index)} 
                                    style={styles.faqHeader}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.faqQuestionRow}>
                                        <MaterialCommunityIcons name={faq.icon as any} size={20} color="#94A3B8" style={{ marginRight: 12 }} />
                                        <Text style={[styles.questionText, { color: theme.text, fontWeight: activeIndex === index ? '800' : '600' }]}>{faq.question}</Text>
                                    </View>
                                    <Feather 
                                        name={activeIndex === index ? 'minus' : 'plus'} 
                                        size={20} 
                                        color={activeIndex === index ? '#10B981' : theme.subtext} 
                                    />
                                </TouchableOpacity>
                                {activeIndex === index && (
                                    <View style={styles.answerContainer}>
                                        <Text style={[styles.answerText, { color: '#64748B' }]}>{faq.answer}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Support Banner */}
                <LinearGradient 
                    colors={['#10B981', '#059669']} 
                    start={{x:0, y:0}} 
                    end={{x:1, y:1}} 
                    style={styles.banner}
                >
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Still need help?</Text>
                        <Text style={styles.bannerSub}>Our support team is available 24/7 to assist you with any queries.</Text>
                        <TouchableOpacity style={styles.bannerBtn} onPress={() => Linking.openURL('tel:+919521633688')}>
                            <Text style={styles.bannerBtnText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                    <MaterialCommunityIcons name="headset" size={100} color="rgba(255,255,255,0.15)" style={styles.bannerIcon} />
                </LinearGradient>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 80, maxWidth: 1000, width: '100%', alignSelf: 'center' },
    titleSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    headerTextContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mainTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#CBD5E1', marginTop: 5 },
    subTitle: { fontSize: 18, fontWeight: '500', color: '#64748B' },
    
    contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 28 },
    contactCard: { flex: 1, minWidth: 180, padding: 20, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
    iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    methodLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    methodValue: { fontSize: 15, fontWeight: '800' },

    sectionContainer: { borderRadius: 32, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.06, shadowRadius: 20, elevation: 6, marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },

    faqList: { gap: 0 },
    faqWrapper: { paddingVertical: 16 },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQuestionRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    questionText: { fontSize: 15, flex: 1, marginRight: 16 },
    answerContainer: { marginTop: 10, paddingLeft: 32 },
    answerText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },

    banner: { borderRadius: 32, padding: 32, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
    bannerContent: { flex: 1, zIndex: 1 },
    bannerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 6 },
    bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600', marginBottom: 20, lineHeight: 20 },
    bannerBtn: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, alignSelf: 'flex-start' },
    bannerBtnText: { color: '#059669', fontWeight: '800', fontSize: 14 },
    bannerIcon: { position: 'absolute', right: -15, bottom: -15, transform: [{ rotate: '-15deg' }] },
});

export default HelpScreen;
