import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsScreen = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const theme = {
        background: isDarkMode ? '#121212' : '#F4F6F8', // Slightly grey background for professional look
        text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
        card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        subtext: isDarkMode ? '#A0A0A0' : '#6B7280',
        primary: '#3466F6', // Admin Blue
        border: isDarkMode ? '#333333' : '#E5E7EB',
        danger: '#EF4444',
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Preferences Section */}
                <Text style={[styles.sectionHeader, { color: theme.subtext }]}>PREFERENCES</Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.settingRow}>
                        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#333' : '#EFF6FF' }]}>
                            <Feather name={isDarkMode ? "moon" : "sun"} size={20} color={isDarkMode ? '#FFF' : theme.primary} />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                            <Text style={[styles.settingSubLabel, { color: theme.subtext }]}>
                                {isDarkMode ? 'Easy on the eyes' : 'Bright and clear'}
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: "#E5E7EB", true: theme.primary }}
                            thumbColor={"#FFFFFF"}
                            ios_backgroundColor="#E5E7EB"
                        />
                    </View>
                </View>

                {/* General Section */}
                <Text style={[styles.sectionHeader, { color: theme.subtext, marginTop: 24 }]}>GENERAL</Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/global-settings')}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 102, 246, 0.1)' }]}>
                            <Feather name="globe" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>Global Settings</Text>
                            <Text style={[styles.settingSubLabel, { color: theme.subtext }]}>Manage commission and system variables</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.subtext} />
                    </TouchableOpacity>

                    <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 68 }} />

                    <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/warehouses')}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 107, 43, 0.1)' }]}>
                            <Feather name="home" size={20} color="#FF6B2B" />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>Delhivery Warehouses</Text>
                            <Text style={[styles.settingSubLabel, { color: theme.subtext }]}>Manage pickup points and default locations</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                </View>

                {/* Account Section */}
                <Text style={[styles.sectionHeader, { color: theme.subtext, marginTop: 24 }]}>ACCOUNT</Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Feather name="log-out" size={20} color={theme.danger} />
                        </View>
                        <View style={styles.settingTextContainer}>
                            <Text style={[styles.settingLabel, { color: theme.text }]}>Log Out</Text>
                            <Text style={[styles.settingSubLabel, { color: theme.subtext }]}>Sign out of your account</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollContainer: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 1,
    },
    card: {
        borderRadius: 16,
        padding: 4, // Inner padding for rows
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    settingTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    settingSubLabel: {
        fontSize: 13,
    },
});

export default SettingsScreen;
