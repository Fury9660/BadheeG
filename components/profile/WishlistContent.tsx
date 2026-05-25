
import { useTheme } from '@/store/ThemeContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const WishlistContent = () => {
    const { isDarkMode } = useTheme();
    const { width } = useWindowDimensions();
    const isWeb = width > 768;

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
    };

    return (
        <ScrollView contentContainerStyle={[styles.content, isWeb && { alignItems: 'center' }]}>
            <View style={{ width: '100%', maxWidth: 800 }}>
                {/* Placeholder content as per original file */}
                <Text style={{ color: theme.text, textAlign: 'center', marginTop: 20 }}>
                    Wishlist Content Pending
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: { padding: 20, alignItems: 'center' },
});

export default WishlistContent;
