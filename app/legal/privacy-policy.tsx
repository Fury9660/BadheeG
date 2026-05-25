import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PrivacyPolicy = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();

    const theme = {
        background: isDarkMode ? '#121212' : '#fff',
        text: isDarkMode ? '#fff' : '#000',
        subtext: isDarkMode ? '#aaa' : '#555',
        border: isDarkMode ? '#333' : '#eee',
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Introduction</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    Welcome to Badhee G. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share your personal information.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Information We Collect</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This may include your name, email address, phone number, and delivery address.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>3. How We Use Your Information</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    We use your information to provide and improve our services, process transactions, send you notifications, and communicate with you about our services.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Data Security</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Contact Us</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    If you have any questions about this Privacy Policy, please contact us at support@badheeg.com.
                </Text>

                <Text style={[styles.text, { color: theme.subtext, marginTop: 20 }]}>
                    Last Updated: {new Date().toLocaleDateString()}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 20,
        marginBottom: 10,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
    },
});

export default PrivacyPolicy;
