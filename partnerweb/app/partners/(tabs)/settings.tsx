import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../config/supabaseConfig';
import { useAuth } from '../../../store/AuthContext';
import { useTheme } from '../../../store/ThemeContext';

export default function SettingsScreen() {
    const { colors, isDarkMode, setThemeMode } = useTheme();
    const { user, partnerId } = useAuth();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Form states
    const [ownerName, setOwnerName] = useState('');
    const [storeName, setStoreName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [category, setCategory] = useState('');
    const [shopAddress, setShopAddress] = useState('');
    const [landmark, setLandmark] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [panNumber, setPanNumber] = useState('');

    // Bank details states
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [upiId, setUpiId] = useState('');

    // Operations states
    const [openingTime, setOpeningTime] = useState('');
    const [closingTime, setClosingTime] = useState('');
    const [weeklyOff, setWeeklyOff] = useState('');

    useEffect(() => {
        if (user) {
            fetchPartnerDetails();
        }
    }, [user, partnerId]);

    const fetchPartnerDetails = async () => {
        try {
            setLoading(true);
            const targetId = partnerId || user?.id;
            if (!targetId) return;

            const { data, error } = await supabase
                .from('pre_approved_partners')
                .select('*')
                .eq('id', targetId)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setOwnerName(data.owner_name || '');
                setStoreName(data.store_name || '');
                setEmail(data.email || '');
                setMobileNumber(data.mobile_number || '');
                setCategory(data.category || '');
                setShopAddress(data.shop_address || '');
                setLandmark(data.landmark || '');
                setZipCode(data.zip_code || '');
                setGstNumber(data.gst_number || '');
                setPanNumber(data.pan_number || '');
                setBankName(data.bank_name || '');
                setAccountNumber(data.account_number || '');
                setIfscCode(data.ifsc_code || '');
                setUpiId(data.upi_id || '');
                setOpeningTime(data.opening_time || '');
                setClosingTime(data.closing_time || '');
                setWeeklyOff(data.weekly_off || 'None');
            }
        } catch (error: any) {
            console.error('Error fetching partner details:', error.message);
            Alert.alert('Error', 'Failed to fetch settings details.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!storeName.trim()) {
            Alert.alert('Validation Error', 'Store Name is required.');
            return;
        }
        if (!ownerName.trim()) {
            Alert.alert('Validation Error', 'Owner Name is required.');
            return;
        }

        setSaving(true);
        try {
            const targetId = partnerId || user?.id;
            if (!targetId) throw new Error('Partner not authenticated');

            const { error } = await supabase
                .from('pre_approved_partners')
                .update({
                    owner_name: ownerName,
                    store_name: storeName,
                    email: email,
                    shop_address: shopAddress,
                    landmark: landmark,
                    zip_code: zipCode,
                    bank_name: bankName,
                    account_number: accountNumber,
                    ifsc_code: ifscCode,
                    upi_id: upiId,
                    opening_time: openingTime,
                    closing_time: closingTime,
                    weekly_off: weeklyOff,
                })
                .eq('id', targetId);

            if (error) throw error;

            Alert.alert('Success', 'Profile settings updated successfully.');
        } catch (error: any) {
            console.error('Error updating settings:', error.message);
            Alert.alert('Error', error.message || 'Failed to update settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        console.log("handleLogout called, Platform.OS:", Platform.OS);
        setShowLogoutConfirm(true);
    };

    const executeSignOut = async () => {
        setShowLogoutConfirm(false);
        try {
            console.log("Performing signOut...");
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("SignOut error from supabase:", error);
                Alert.alert('Error', 'Failed to log out: ' + error.message);
            } else {
                console.log("SignOut successful, redirecting...");
                router.replace('/partners/login');
            }
        } catch (err: any) {
            console.error("SignOut unexpected error:", err);
            Alert.alert('Error', 'An unexpected error occurred: ' + err.message);
        }
    };

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    const themeInputBg = colors.card;
    const themeBorderColor = colors.border;
    const themeTextColor = colors.text;

    return (
        <React.Fragment>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <View style={[styles.header, { borderBottomColor: themeBorderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {!isDesktop && (
                        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                            <Feather name="arrow-left" size={24} color={themeTextColor} />
                        </TouchableOpacity>
                    )}
                    <Text style={[styles.headerTitle, { color: themeTextColor }]}>Settings</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Feather name="log-out" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Section 1: Business Profile */}
                    <View style={styles.sectionHeader}>
                        <Feather name="briefcase" size={16} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>BUSINESS PROFILE</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: themeInputBg, borderColor: themeBorderColor }]}>
                        <Text style={[styles.label, { color: themeTextColor }]}>Store Name</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={storeName}
                            onChangeText={setStoreName}
                            placeholder="Store Name"
                            placeholderTextColor={colors.subtext}
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Owner Name</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={ownerName}
                            onChangeText={setOwnerName}
                            placeholder="Owner Name"
                            placeholderTextColor={colors.subtext}
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Category</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor, backgroundColor: isDarkMode ? '#000000' : '#F3F4F6' }]}
                            value={category}
                            editable={false}
                            placeholder="Category"
                            placeholderTextColor={colors.subtext}
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email Address"
                            placeholderTextColor={colors.subtext}
                            keyboardType="email-address"
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Mobile Number</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor, backgroundColor: isDarkMode ? '#000000' : '#F3F4F6' }]}
                            value={mobileNumber}
                            editable={false}
                            placeholder="Mobile Number"
                            placeholderTextColor={colors.subtext}
                        />
                    </View>

                    {/* Section 2: Location & Address */}
                    <View style={styles.sectionHeader}>
                        <Feather name="map-pin" size={16} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>LOCATION & ADDRESS</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: themeInputBg, borderColor: themeBorderColor }]}>
                        <Text style={[styles.label, { color: themeTextColor }]}>Shop Address</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={shopAddress}
                            onChangeText={setShopAddress}
                            placeholder="Full Shop Address"
                            placeholderTextColor={colors.subtext}
                            multiline
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Landmark</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={landmark}
                            onChangeText={setLandmark}
                            placeholder="Landmark"
                            placeholderTextColor={colors.subtext}
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Zip Code</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={zipCode}
                            onChangeText={setZipCode}
                            placeholder="Zip Code"
                            placeholderTextColor={colors.subtext}
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Section 3: Legal Details (Read Only) */}
                    <View style={styles.sectionHeader}>
                        <Feather name="file-text" size={16} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>LEGAL DOCUMENTS (READ ONLY)</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: themeInputBg, borderColor: themeBorderColor }]}>
                        <Text style={[styles.label, { color: themeTextColor }]}>GST Number</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor, backgroundColor: isDarkMode ? '#000000' : '#F3F4F6' }]}
                            value={gstNumber}
                            editable={false}
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>PAN Number</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor, backgroundColor: isDarkMode ? '#000000' : '#F3F4F6' }]}
                            value={panNumber}
                            editable={false}
                        />
                    </View>

                    {/* Section 4: Bank Details */}
                    <View style={styles.sectionHeader}>
                        <Feather name="credit-card" size={16} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>BANK DETAILS</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: themeInputBg, borderColor: themeBorderColor }]}>
                        <Text style={[styles.label, { color: themeTextColor }]}>Bank Name</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={bankName}
                            onChangeText={setBankName}
                            placeholder="Bank Name"
                            placeholderTextColor={colors.subtext}
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Account Number</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            placeholder="Account Number"
                            placeholderTextColor={colors.subtext}
                            keyboardType="numeric"
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>IFSC Code</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={ifscCode}
                            onChangeText={setIfscCode}
                            placeholder="IFSC Code"
                            placeholderTextColor={colors.subtext}
                            autoCapitalize="characters"
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>UPI ID</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={upiId}
                            onChangeText={setUpiId}
                            placeholder="UPI ID (e.g. storename@okaxis)"
                            placeholderTextColor={colors.subtext}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Section 5: Operations */}
                    <View style={styles.sectionHeader}>
                        <Feather name="clock" size={16} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>OPERATIONS</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: themeInputBg, borderColor: themeBorderColor }]}>
                        <Text style={[styles.label, { color: themeTextColor }]}>Opening Time</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={openingTime}
                            onChangeText={setOpeningTime}
                            placeholder="e.g. 09:00 AM"
                            placeholderTextColor={colors.subtext}
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Closing Time</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={closingTime}
                            onChangeText={setClosingTime}
                            placeholder="e.g. 09:00 PM"
                            placeholderTextColor={colors.subtext}
                        />

                        <Text style={[styles.label, { color: themeTextColor }]}>Weekly Off</Text>
                        <TextInput
                            style={[styles.input, { color: themeTextColor, borderColor: themeBorderColor }]}
                            value={weeklyOff}
                            onChangeText={setWeeklyOff}
                            placeholder="e.g. Sunday or None"
                            placeholderTextColor={colors.subtext}
                        />
                    </View>

                    {/* Section 6: App Preferences */}
                    <View style={styles.sectionHeader}>
                        <Feather name="sliders" size={16} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>APP PREFERENCES</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: themeInputBg, borderColor: themeBorderColor, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 }]}>
                        <View>
                            <Text style={[styles.prefTitle, { color: themeTextColor }]}>Dark Mode</Text>
                            <Text style={[styles.prefSubtitle, { color: colors.subtext }]}>Use dark background interface</Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.toggleContainer,
                                { backgroundColor: isDarkMode ? '#10B981' : '#E5E5EA' }
                            ]}
                            onPress={() => setThemeMode(isDarkMode ? 'light' : 'black')}
                        >
                            <View style={[styles.toggleCircle, isDarkMode ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
                        </TouchableOpacity>
                    </View>

                    {/* Save Changes button */}
                    <TouchableOpacity
                        style={[styles.saveButton, { opacity: saving ? 0.7 : 1 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>

        {/* In-app logout confirmation overlay */}
        {showLogoutConfirm && (
            <View style={styles.logoutOverlay}>
                <View style={[styles.logoutBox, { backgroundColor: colors.card }]}>
                    <View style={styles.logoutIconRow}>
                        <View style={styles.logoutIconCircle}>
                            <Feather name="log-out" size={28} color="#FF3B30" />
                        </View>
                    </View>
                    <Text style={[styles.logoutTitle, { color: colors.text }]}>Logout</Text>
                    <Text style={[styles.logoutSubtitle, { color: colors.subtext }]}>
                        Are you sure you want to log out of your account?
                    </Text>
                    <View style={styles.logoutBtnRow}>
                        <TouchableOpacity
                            style={[styles.logoutBtn, { backgroundColor: colors.border }]}
                            onPress={() => setShowLogoutConfirm(false)}
                        >
                            <Text style={[styles.logoutBtnText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.logoutBtn, { backgroundColor: '#FF3B30' }]}
                            onPress={executeSignOut}
                        >
                            <Text style={[styles.logoutBtnText, { color: '#FFFFFF' }]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )}
        </React.Fragment>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    logoutButton: {
        padding: 8,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 8,
        letterSpacing: 1,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 15,
        backgroundColor: 'transparent',
    },
    prefTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    prefSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    toggleContainer: {
        width: 50,
        height: 30,
        borderRadius: 15,
        padding: 2,
        justifyContent: 'center',
    },
    toggleCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    saveButton: {
        backgroundColor: '#10B981', // Matches dashboard style theme primary green
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Logout confirmation overlay
    logoutOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    logoutBox: {
        width: 300,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    logoutIconRow: {
        alignItems: 'center',
        marginBottom: 16,
    },
    logoutIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF3B3020',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutTitle: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    logoutSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    logoutBtnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    logoutBtn: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
