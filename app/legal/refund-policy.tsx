import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RefundPolicy = () => {
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
                <Text style={[styles.title, { color: theme.text }]}>Refund & Cancellation Policy</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Order Cancellations</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    - Cancellation within 24 Hours: A 2.5% fee is applicable.
                    {"\n"}- Cancellation after Shipment: A 15% fee will be deducted based on the Resolution Team's assessment.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Refund Options</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    You can choose to receive your refund through:
                    {"\n"}- Original Mode of Payment (7-10 Business Days)
                    {"\n"}- BADHEE G Wallet (Within 24 Hours)
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Important Notice</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    - Unboxing Video: Recording a video while unboxing is MANDATORY. Without a continuous, uncut video, we cannot accept return requests.
                    {"\n"}- Time Frame: Return requests must be made within 02 days of delivery.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Contact Us</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    For any policy-related queries, please contact our support team at badhee1993@gmail.com or +91 9521633688.
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

export default RefundPolicy;
