import WishlistContent from '@/components/profile/WishlistContent';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WishlistScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Wishlist</Text>
                <View style={{ width: 24 }} />
            </View>
            <WishlistContent />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ddd', },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
});

export default WishlistScreen;
