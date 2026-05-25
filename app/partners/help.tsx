
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const faqs = [
    { question: 'How do I return a product?', answer: 'You can return a product within 7 days of delivery. Go to My Orders > Select Order > Click Return.' },
    { question: 'How can I track my order?', answer: 'Once your order is shipped, you will receive an email with the tracking ID and a link to the courier\'s website.' },
    { question: 'Is Cash on Delivery (COD) available?', answer: 'Yes, COD is available for most pincodes. You can check the availability during checkout.' },
];

const HelpScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: '#007AFF',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const toggleFAQ = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveIndex(activeIndex === index ? null : index);
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Contact Us</Text>
                    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@badheeg.com')}>
                        <Feather name="mail" size={22} color={theme.primary} />
                        <Text style={[styles.contactText, { color: theme.text }]}>support@badheeg.com</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('tel:+919521633688')}>
                        <Feather name="phone" size={22} color={theme.primary} />
                        <Text style={[styles.contactText, { color: theme.text }]}>+91 9521633688</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('https://wa.me/919521633688')}>
                        <Feather name="message-circle" size={22} color={theme.primary} />
                        <Text style={[styles.contactText, { color: theme.text }]}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, marginTop: 24 }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
                    {faqs.map((faq, index) => (
                        <View key={index} style={[styles.faqItem, { borderBottomColor: theme.border }]}>
                            <TouchableOpacity onPress={() => toggleFAQ(index)} style={styles.questionRow}>
                                <Text style={[styles.questionText, { color: theme.text }]}>{faq.question}</Text>
                                <Feather name={activeIndex === index ? 'chevron-up' : 'chevron-down'} size={22} color={theme.subtext} />
                            </TouchableOpacity>
                            {activeIndex === index && (
                                <Text style={[styles.answerText, { color: theme.subtext }]}>{faq.answer}</Text>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ddd', },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    card: { borderRadius: 12, padding: 16 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    contactText: { fontSize: 16, marginLeft: 16 },
    faqItem: { paddingVertical: 12, borderBottomWidth: 1, },
    questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    questionText: { fontSize: 16, flex: 1, marginRight: 8 },
    answerText: { marginTop: 8, fontSize: 14, lineHeight: 20 },
});

export default HelpScreen;
