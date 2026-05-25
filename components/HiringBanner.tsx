import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const HiringBanner = React.memo(() => {
    const { width } = useWindowDimensions();
    const router = useRouter();
    const isMobile = width < 768;

    // Further reduced height
    const bannerHeight = isMobile ? 60 : 90;

    return (
        <View style={styles.container}>
            <Animated.View
                entering={FadeInDown.duration(800).springify()}
                style={[styles.bannerWrapper, { height: bannerHeight }]}
            >
                {/* Background (White) */}
                <View style={styles.background} />

                {/* Overlay with Text and Button */}
                <View style={styles.overlay}>
                    <Animated.View entering={FadeInRight.delay(400).duration(800)} style={styles.content}>
                        <View style={styles.textContainer}>
                            <Text style={[styles.title, { fontSize: isMobile ? 11 : 16 }]}>
                                We Are Hiring
                            </Text>
                            <Text style={[styles.highlight, { fontSize: isMobile ? 13 : 20 }]}>
                                Showroom Partners
                            </Text>
                        </View>
                        <TouchableOpacity 
                            style={[styles.button, { paddingVertical: isMobile ? 6 : 10, paddingHorizontal: isMobile ? 12 : 16 }]}
                            activeOpacity={0.8}
                            onPress={() => router.push('/partner-inquiry')}
                        >
                            <Text style={[styles.buttonText, { fontSize: isMobile ? 11 : 13 }]}>Apply Now</Text>
                            <Feather name="arrow-right" size={isMobile ? 12 : 18} color="#fff" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 0,
        marginVertical: 0,
    },
    bannerWrapper: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff', 
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        paddingHorizontal: '6%',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#000',
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    highlight: {
        color: '#007AFF', // Standard Blue for emphasis on white
        fontWeight: '900',
    },
    button: {
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    }
});

export default HiringBanner;
