import HelpContent from '@/components/profile/HelpContent';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HelpScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {Platform.OS !== 'web' && (
                <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333' : '#ddd', paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
                    <View style={{ width: 24 }} />
                </View>
            )}

            <HelpContent />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ddd', },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
});

export default HelpScreen;
