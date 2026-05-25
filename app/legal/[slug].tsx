import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const legalContent: { [key: string]: { title: string; content: string } } = {
    'privacy-policy': {
        title: 'Privacy Policy',
        content: `1. Introduction\nWelcome to Badhee G. We respect your privacy and are committed to protecting your personal data.\n\n2. Data Collection\nWe collect personal data as explained in the Privacy Policy.\n\n3. Use of Data\nWe use your data to provide and improve our services.\n\n4. Data Sharing\nWe do not share your personal data with third parties except as necessary to provide our services.`
    },
    'terms-of-use': {
        title: 'Terms of Use',
        content: `1. Acceptance of Terms\nBy accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. Use of License\nPermission is granted to temporarily download one copy of the materials (information or software) on Badhee G's website for personal, non-commercial transitory viewing only.\n\n3. Disclaimer\nThe materials on Badhee G's website are provided on an 'as is' basis.`
    },
    'about-us': {
        title: 'About Us',
        content: `Badhee G is a leading furniture marketplace.\n\nOur mission is to provide high-quality furniture at affordable prices.`
    },
    'contact-us': {
        title: 'Contact Us',
        content: `Badhee G Pvt. Ltd.\nEmail: support@badheeg.com\nPhone: +91 9521633688\nAddress: Khudi Badi, Sikar, Rajasthan, 332315`
    },
    'careers': {
        title: 'Careers',
        content: `Join our team! Send your resume to support@badheeg.com`
    },
    'policies': {
        title: 'Policies',
        content: `Read our various policies here...`
    }
};

const LegalPage = () => {
    const { slug } = useLocalSearchParams();
    const router = useRouter();
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const slugKey = typeof slug === 'string' ? slug : (slug?.[0] || '');
    const data = legalContent[slugKey] || {
        title: slugKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        content: 'Content coming soon...'
    };

    const theme = {
        background: isDarkMode ? '#000' : '#fff',
        text: isDarkMode ? '#fff' : '#000',
        card: isDarkMode ? '#1A1A1A' : '#f9f9f9',
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: isDarkMode ? '#333' : '#eee' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>{data.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.text, { color: theme.text }]}>{data.content}</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        padding: 20,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    card: {
        padding: 24,
        borderRadius: 12,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
    }
});

export default LegalPage;
