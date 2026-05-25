import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ApprovalPendingScreen() {
    const { isDarkMode } = useTheme();
    const router = useRouter();

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#000000',
        secondary: isDarkMode ? '#1A1A1A' : '#ffffff',
        border: isDarkMode ? '#333' : '#e0e0e0',
        accent: isDarkMode ? '#1e293b' : '#e0e7ff',
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDarkMode ? ['#0f172a', '#000000'] : ['#eff6ff', '#ffffff']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.content}>
                    <View style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.accent }]}>
                            <Feather name="clock" size={64} color={theme.primary} />
                        </View>

                        <Text style={[styles.title, { color: theme.text }]}>Approval Pending</Text>

                        <Text style={[styles.message, { color: theme.subtext }]}>
                            Your partner account has been submitted and is currently under review by our team.
                        </Text>

                        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#222' : '#f8f9fa' }]}>
                            <View style={styles.infoRow}>
                                <Feather name="check-circle" size={18} color="#22c55e" />
                                <Text style={[styles.infoText, { color: theme.text }]}>Registration Submitted</Text>
                            </View>
                            <View style={styles.connector} />
                            <View style={styles.infoRow}>
                                <Feather name="loader" size={18} color={theme.primary} />
                                <Text style={[styles.infoText, { color: theme.text }]}>Under Review (24-48 hrs)</Text>
                            </View>
                            <View style={styles.connector} />
                            <View style={styles.infoRow}>
                                <Feather name="circle" size={18} color={theme.subtext} />
                                <Text style={[styles.infoText, { color: theme.subtext }]}>Account Activation</Text>
                            </View>
                        </View>

                        <Text style={[styles.note, { color: theme.subtext }]}>
                            You will be notified via SMS/Email once an admin approves your request.
                        </Text>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                            onPress={() => router.replace('/')}
                        >
                            <Text style={styles.buttonText}>Back to Home</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, { borderColor: theme.border }]}
                        // onPress={() => Linking.openURL('mailto:support@badhee.com')}
                        >
                            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: { fontSize: 26, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
    message: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24, paddingHorizontal: 10 },
    infoBox: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoText: {
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '500',
    },
    connector: {
        width: 2,
        height: 16,
        backgroundColor: '#e0e0e0',
        marginLeft: 9, // Center with icon (18/2 = 9)
    },
    note: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
        opacity: 0.7,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondaryButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
