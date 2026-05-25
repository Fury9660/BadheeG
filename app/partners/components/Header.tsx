import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Header() {
    const router = useRouter();

    return (
        <View style={styles.headerContainer}>
            <View style={styles.contentContainer}>
                {/* Logo / Brand Name */}
                <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.7} style={styles.logoWrapper}>
                    <Image
                        source={require('../../../assets/images/1000262409-Photoroom.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.push('/login?intent=login')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="person-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        height: 60, // Fixed compact height
        backgroundColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A',
        paddingHorizontal: 24,
        ...Platform.select({
            web: {
                position: 'sticky' as any,
                top: 0,
                zIndex: 1000,
                backdropFilter: 'blur(10px)' as any,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
            default: {
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            }
        }),
    },
    contentContainer: {
        maxWidth: 1200,
        height: '100%',
        width: '100%',
        marginHorizontal: 'auto' as any,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'center',
    },
    logoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 100,
        height: 100,
        tintColor: '#fff',
        // No margin needed if contentContainer is alignItems: center
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        ...Platform.select({
            web: {
                cursor: 'pointer' as any,
                transition: '0.2s' as any,
            }
        })
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});
