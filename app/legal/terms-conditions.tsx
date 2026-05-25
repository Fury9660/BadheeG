import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TermsConditions = () => {
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
                <Text style={[styles.title, { color: theme.text }]}>Terms & Conditions</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Introduction</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    Welcome to Badhee G. By accessing or using our website and services, you agree to be bound by these Terms and Conditions.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Use of Our Services</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    You agree to use our services only for lawful purposes. You are prohibited from violating any applicable laws, transmitting prohibited content, or interfering with the operation of our services.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>3. User Accounts</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    To access certain features, you may need to creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Orders and Payments</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    All orders are subject to availability and acceptance. Prices and fees are subject to change without notice. Payments are processed securely via our payment partners.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Limitation of Liability</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    Badhee G shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our services.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Contact Information</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    For any questions regarding these Terms, please contact us at support@badheeg.com.
                </Text>

                <Text style={[styles.text, { color: theme.subtext, marginTop: 20 }]}>
                    Last Updated: {new Date().toLocaleDateString()}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    backBtn: { marginRight: 16 },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10 },
    text: { fontSize: 16, lineHeight: 24 },
});

export default TermsConditions;
