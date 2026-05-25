import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config/supabaseConfig';
import { useAuth } from '../store/AuthContext';

export default function Header() {
    const router = useRouter();
    const { user, partnerStatus, isLoading } = useAuth();

    const renderRightSection = () => {
        if (isLoading) {
            return <ActivityIndicator size="small" color="#007AFF" />;
        }

        if (user) {
            const status = partnerStatus?.toLowerCase();
            let targetPath = '/partners/dashboard';
            let label = 'Dashboard';

            if (status === 'pending') {
                targetPath = '/partners/approval-pending';
                label = 'Status';
            } else if (status === 'unregistered') {
                targetPath = '/partners/register';
                label = 'Register';
            }

            return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: '#007AFF' }]}
                        onPress={() => router.push(targetPath as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="apps-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.loginButtonText}>{label}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: '#e74c3c' }]}
                        onPress={async () => {
                            await supabase.auth.signOut();
                            router.replace('/');
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.loginButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push({ pathname: '/partners/login', params: { intent: 'login' } })}
                activeOpacity={0.8}
            >
                <Ionicons name="person-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.headerContainer}>
            <View style={styles.contentContainer}>
                {/* Logo / Brand Name */}
                <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.7}>
                    <Text style={styles.logoText}>Badhee<Text style={styles.logoHighlight}>Partner</Text></Text>
                </TouchableOpacity>

                {/* Right Section */}
                {renderRightSection()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 16,
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
        width: '100%',
        marginHorizontal: 'auto' as any,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'center',
    },
    logoText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    logoHighlight: {
        color: '#007AFF', // Modern Tech Blue
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
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
