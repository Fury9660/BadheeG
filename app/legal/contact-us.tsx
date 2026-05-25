import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ContactUs = () => {
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
                <Text style={[styles.title, { color: theme.text }]}>Contact Us</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.text, { color: theme.subtext, marginBottom: 20 }]}>
                    We are here to help you. If you have any questions or concerns, please reach out to us.
                </Text>

                <View style={[styles.infoBox, { borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Company Name</Text>
                    <Text style={[styles.value, { color: theme.subtext }]}>Badhee G Pvt. Ltd.</Text>
                </View>

                <View style={[styles.infoBox, { borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Registered Address</Text>
                    <Text style={[styles.value, { color: theme.subtext }]}>
                        Khudi Badi,
                        {"\n"}Sikar, Rajasthan,
                        {"\n"}332315
                    </Text>
                </View>

                <View style={[styles.infoBox, { borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Email Us</Text>
                    <Text style={[styles.value, { color: theme.subtext }]}>support@badheeg.com</Text>
                </View>

                <View style={[styles.infoBox, { borderColor: theme.border }]}>
                    <Text style={[styles.label, { color: theme.text }]}>Call Us</Text>
                    <Text style={[styles.value, { color: theme.subtext }]}>+91 9521633688</Text>
                </View>
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
    infoBox: { marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    value: { fontSize: 16, lineHeight: 22 },
    text: { fontSize: 16, lineHeight: 24 },
});

export default ContactUs;
