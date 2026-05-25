import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ShippingPolicy = () => {
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
                <Text style={[styles.title, { color: theme.text }]}>Shipping & Delivery Policy</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Delivery Timelines</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    - Fast Delivery: 80% of cases are delivered within 15 working days.
                    {"\n"}- Standard Timeline: Remaining 20% may take 20-25 working days depending on the manufacturing complexity.
                    {"\n"}- Quality Delay: Meticulous handcrafted process may add up to 5 days to ensure perfection.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Cash on Delivery (COD)</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    - Advance Payment: 20% advance is required to confirm COD orders and initiate manufacturing.
                    {"\n"}- Balance: Remaining 80% is payable at the time of delivery.
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Tracking & Inspection</Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    - You can track your furniture's journey via the 'My Orders' section.
                    {"\n"}- Damage Check: Please inspect for broken or missing parts at the time of delivery/assembly. Post-assembly complaints cannot be accepted.
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

export default ShippingPolicy;
