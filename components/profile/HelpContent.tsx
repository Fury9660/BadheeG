
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, useWindowDimensions, View } from 'react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const faqs = [
    { question: 'How do I return a product?', answer: 'You can return a product within 7 days of delivery. Go to My Orders > Select Order > Click Return.' },
    { question: 'How can I track my order?', answer: 'Once your order is shipped, you will receive an email with the tracking ID and a link to the courier\'s website.' },
    { question: 'Is Cash on Delivery (COD) available?', answer: 'Yes, COD is available for most pincodes. You can check the availability during checkout.' },
    { question: 'What if I receive a damaged product?', answer: 'Please report it within 24 hours of delivery. Go to My Orders > Need Help > Report Issue.' },
    { question: 'How do I cancel my order?', answer: 'You can cancel your order before it is shipped from the My Orders section.' },
];

const quickActions = [
    { icon: 'package', title: 'My Orders' },
    { icon: 'refresh-ccw', title: 'Returns' },
    { icon: 'credit-card', title: 'Payment' },
    { icon: 'user', title: 'Account' },
];

const HelpContent = () => {
    const { isDarkMode } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = windowWidth > 768;
    const [activeIndex, setActiveIndex] = useState<null | number>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        subtext: isDarkMode ? '#8E8E93' : '#666',
        primary: '#007AFF',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        inputBg: isDarkMode ? '#2C2C2C' : '#F2F2F7',
    };

    const toggleFAQ = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveIndex(activeIndex === index ? null : index);
    }

    const filteredFaqs = faqs.filter(f =>
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ScrollView contentContainerStyle={[styles.content, isDesktop && { alignItems: 'center', paddingVertical: 40 }]} showsVerticalScrollIndicator={false}>
            <View style={{ width: '100%', maxWidth: isDesktop ? 1000 : 800 }}>

                {/* Search Header */}
                <View style={styles.headerSection}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>How can we help you?</Text>
                    <View style={[styles.searchContainer, { backgroundColor: theme.inputBg }]}>
                        <Feather name="search" size={20} color={theme.subtext} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search for questions..."
                            placeholderTextColor={theme.subtext}
                            style={[styles.searchInput, { color: theme.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={[styles.gridContainer, isDesktop && styles.gridContainerDesktop]}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity key={index} style={[styles.gridItem, isDesktop && styles.gridItemDesktop, { backgroundColor: theme.card }]}>
                            <Feather name={action.icon as any} size={isDesktop ? 32 : 24} color={theme.primary} />
                            <Text style={[styles.gridText, isDesktop && styles.gridTextDesktop, { color: theme.text }]}>{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAQ Section */}
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
                    {filteredFaqs.map((faq, index) => (
                        <View key={index} style={[styles.faqItem, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => toggleFAQ(index)} style={styles.questionRow}>
                                <Text style={[styles.questionText, { color: theme.text }]}>{faq.question}</Text>
                                <Feather name={activeIndex === index ? 'chevron-up' : 'chevron-down'} size={20} color={theme.subtext} />
                            </TouchableOpacity>
                            {activeIndex === index && (
                                <Text style={[styles.answerText, { color: theme.subtext }]}>{faq.answer}</Text>
                            )}
                        </View>
                    ))}
                    {filteredFaqs.length === 0 && (
                        <Text style={{ color: theme.subtext, textAlign: 'center', marginTop: 10 }}>No results found.</Text>
                    )}
                </View>

                {/* Contact Us */}
                <Text style={[styles.sectionHeader, { color: theme.subtext, marginTop: 20 }]}>STILL NEED HELP?</Text>
                <View style={[styles.contactGrid, isDesktop && styles.contactGridDesktop]}>
                    <TouchableOpacity style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('https://wa.me/919521633688')}>
                        <View style={[styles.iconBox, { backgroundColor: '#25D36620' }]}>
                            <Feather name="message-circle" size={24} color="#25D366" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactTitle, { color: theme.text }]}>Chat with us</Text>
                            <Text style={[styles.contactSubtitle, { color: theme.subtext }]}>Get instant support via WhatsApp</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('mailto:support@badheeg.com')}>
                        <View style={[styles.iconBox, { backgroundColor: theme.primary + '20' }]}>
                            <Feather name="mail" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactTitle, { color: theme.text }]}>Send an Email</Text>
                            <Text style={[styles.contactSubtitle, { color: theme.subtext }]}>We'll reply within 24 hours</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.subtext} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Linking.openURL('tel:+919521633688')}>
                        <View style={[styles.iconBox, { backgroundColor: '#FF950020' }]}>
                            <Feather name="phone" size={24} color="#FF9500" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={[styles.contactTitle, { color: theme.text }]}>Call Support</Text>
                            <Text style={[styles.contactSubtitle, { color: theme.subtext }]}>Available 9 AM - 6 PM</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: { padding: 16 },
    headerSection: { marginBottom: 24, paddingHorizontal: 4 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 10,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16 },

    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
    gridContainerDesktop: { gap: 20 },
    gridItem: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    gridItemDesktop: {
        paddingVertical: 32,
    },
    gridText: { marginTop: 8, fontSize: 12, fontWeight: '500' },
    gridTextDesktop: { fontSize: 14, fontWeight: '600' },

    section: { borderRadius: 16, padding: 16, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    sectionHeader: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },

    faqItem: { paddingVertical: 14, borderBottomWidth: 1 },
    questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    questionText: { fontSize: 15, fontWeight: '500', flex: 1, marginRight: 8 },
    answerText: { marginTop: 10, fontSize: 14, lineHeight: 22 },

    contactGrid: { gap: 12 },
    contactGridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        flex: 1,
        minWidth: 300,
        borderWidth: 1,
    },
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    contactInfo: { flex: 1 },
    contactTitle: { fontSize: 16, fontWeight: '600' },
    contactSubtitle: { fontSize: 13, marginTop: 2 },
});

export default HelpContent;
