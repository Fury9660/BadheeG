import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Category {
    id: string;
    name: string;
}

interface WebCategoryBarProps {
    categories: Category[];
    activeCategory: string;
    setActiveCategory: (name: string) => void;
    animatedHeaderStyle?: any;
    theme?: any;
}

const WebCategoryBar = React.memo(({
    categories,
    activeCategory,
    setActiveCategory,
    theme
}: WebCategoryBarProps) => {
    return (
        <View style={[styles.webCategoryBar, { backgroundColor: theme?.background, borderBottomColor: theme?.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.webCategoryBarContent}>
                {categories.map((item: any, index: number) => {
                    const active = activeCategory === item.name;
                    return (
                        <TouchableOpacity
                            key={item.id || index}
                            style={styles.webCategoryItem}
                            onPress={() => setActiveCategory(item.name)}
                        >
                            <Text style={[
                                styles.webCategoryItemText, 
                                { 
                                    color: active ? (theme?.isDarkMode ? '#FFFFFF' : '#000000') : (theme?.isDarkMode ? '#888' : '#666'),
                                    fontWeight: active ? '700' : '500'
                                }
                            ]}>
                                {item.name}
                            </Text>
                            {active && <View style={[styles.activeLine, { backgroundColor: theme?.primary }]} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    webCategoryBar: {
        width: '100%',
        paddingVertical: 12,
        zIndex: 1000,
        borderBottomWidth: 1,
        // @ts-ignore
        backdropFilter: 'blur(20px)',
    },
    webCategoryBarContent: {
        paddingHorizontal: 40,
        gap: 32,
        flexGrow: 1,
        justifyContent: 'center',
    },
    webCategoryItem: {
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    webCategoryItemText: {
        fontSize: 14,
        letterSpacing: 0.5,
    },
    activeLine: {
        position: 'absolute',
        bottom: -2,
        height: 2,
        width: '100%',
        borderRadius: 2,
    }
});

export default WebCategoryBar;
