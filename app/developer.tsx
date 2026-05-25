import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DeveloperScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: '#007AFF',
        border: isDarkMode ? '#333' : '#E5E5EA',
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Developer Features</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Experimental Features</Text>
                    <Text style={[styles.cardText, { color: theme.subtext }]}>
                        This area is for testing new features before they are released.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.featureRow, { borderBottomColor: theme.border }]}
                    onPress={() => router.push('/developer/exotel-call' as any)}
                >
                    <Text style={[styles.featureText, { color: theme.text }]}>Exotel Call</Text>
                    <Feather name="chevron-right" size={20} color={theme.subtext} />
                </TouchableOpacity>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        padding: 20,
    },
    card: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 14,
        lineHeight: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    featureText: {
        fontSize: 16,
    },
});

export default DeveloperScreen;
