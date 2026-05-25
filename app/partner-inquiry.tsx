import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../config/supabaseConfig';

const PartnerInquiryScreen = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        showroomName: '',
        mobileNo: '',
        email: user?.email || '',
        gstin: ''
    });

    const theme = {
        background: isDarkMode ? '#000' : '#FFFFFF',
        card: isDarkMode ? '#111' : '#F8F9FA',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        subtext: isDarkMode ? '#A0A0A0' : '#666666',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        inputBg: isDarkMode ? '#1A1A1A' : '#F2F2F7',
        border: isDarkMode ? '#222' : '#E5E5E5',
        accent: '#007AFF'
    };

    const benefits = [
        { icon: 'trending-up', title: 'Expand Reach', desc: 'Connect with thousands of luxury furniture seekers.' },
        { icon: 'shield-check', title: 'Brand Trust', desc: 'Join an ecosystem of verified premium showrooms.' },
        { icon: 'zap', title: 'Quick Onboarding', desc: 'Start selling your inventory in less than 48 hours.' }
    ];

    const handleSubmit = async () => {
        if (!formData.showroomName || !formData.mobileNo || !formData.email || !formData.gstin) {
            const msg = "Please fill in all the details.";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Missing Fields", msg);
            return;
        }

        if (formData.mobileNo.length !== 10) {
            const msg = "Please enter a valid 10-digit mobile number.";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Invalid Mobile", msg);
            return;
        }

        setLoading(true);
        try {
            console.log("Checking for duplicates...");
            // Check for existing inquiry with same Mobile or GSTIN
            const { data: existingInquiry, error: checkError } = await supabase
                .from('partner_inquiries')
                .select('id')
                .or(`mobile_no.eq.${formData.mobileNo},gstin.eq.${formData.gstin.toUpperCase()}`)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingInquiry) {
                const msg = "An inquiry with this Mobile Number or GSTIN already exists. Our team is already reviewing your application.";
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Already Inquired", msg);
                setLoading(false);
                return;
            }

            console.log("Sending inquiry...");
            const { error } = await supabase
                .from('partner_inquiries')
                .insert([{
                    user_id: user?.id || null,
                    showroom_name: formData.showroomName,
                    mobile_no: formData.mobileNo,
                    email: formData.email,
                    gstin: formData.gstin.toUpperCase(),
                    status: 'pending'
                }]);

            if (error) throw error;

            console.log("Inquiry sent successfully!");
            const successMsg = "Thank you for your interest! Our partnership team will review your application and get in touch within 24-48 hours.";
            if (Platform.OS === 'web') {
                window.alert(successMsg);
                router.back();
            } else {
                Alert.alert("Inquiry Received", successMsg, [{ text: "Great", onPress: () => router.back() }]);
            }
        } catch (error: any) {
            console.error("Inquiry Error:", error);
            const errMsg = error.message || "Could not send inquiry. Please try again.";
            Platform.OS === 'web' ? window.alert(`Error: ${errMsg}`) : Alert.alert("Submission Failed", errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {/* Elegant Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
                    <Feather name="chevron-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Partner Program</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                >
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <Text style={[styles.heroSubtitle, { color: theme.accent }]}>BECOME A PARTNER</Text>
                        <Text style={[styles.heroTitle, { color: theme.text }]}>Grow Your Business With Badhee G</Text>
                        <Text style={[styles.heroDesc, { color: theme.subtext }]}>
                            List your showroom products on India's premier luxury furniture platform and reach high-intent customers.
                        </Text>
                    </View>

                    {/* Benefits Grid */}
                    <View style={styles.benefitsGrid}>
                        {benefits.map((item, idx) => (
                            <View key={idx} style={[styles.benefitCard, { backgroundColor: theme.card }]}>
                                <View style={[styles.benefitIcon, { backgroundColor: theme.background }]}>
                                    <Feather name={item.icon as any} size={20} color={theme.text} />
                                </View>
                                <Text style={[styles.benefitTitle, { color: theme.text }]}>{item.title}</Text>
                                <Text style={[styles.benefitDesc, { color: theme.subtext }]}>{item.desc}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Form Section */}
                    <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.formHeading, { color: theme.text }]}>Showroom Details</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.subtext }]}>SHOWROOM NAME</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                                <Feather name="home" size={18} color={theme.subtext} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="e.g. Royal Interiors"
                                    placeholderTextColor={isDarkMode ? '#444' : '#BBB'}
                                    value={formData.showroomName}
                                    onChangeText={(text) => setFormData({ ...formData, showroomName: text })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.subtext }]}>MOBILE NUMBER</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 10, borderRightWidth: 1, borderRightColor: isDarkMode ? '#333' : '#DDD' }}>
                                    <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>+91</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Enter 10-digit number"
                                    placeholderTextColor={isDarkMode ? '#444' : '#BBB'}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={formData.mobileNo}
                                    onChangeText={(text) => {
                                        const cleaned = text.replace(/[^0-9]/g, '');
                                        if (cleaned.length <= 10) {
                                            setFormData({ ...formData, mobileNo: cleaned });
                                        }
                                    }}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.subtext }]}>BUSINESS EMAIL</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                                <Feather name="mail" size={18} color={theme.subtext} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="name@business.com"
                                    placeholderTextColor={isDarkMode ? '#444' : '#BBB'}
                                    keyboardType="email-address"
                                    value={formData.email}
                                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.subtext }]}>GSTIN NUMBER</Text>
                            <View style={[styles.inputContainer, { backgroundColor: theme.inputBg }]}>
                                <MaterialCommunityIcons name="file-document-outline" size={18} color={theme.subtext} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="15-digit GST identification"
                                    placeholderTextColor={isDarkMode ? '#444' : '#BBB'}
                                    autoCapitalize="characters"
                                    value={formData.gstin}
                                    onChangeText={(text) => setFormData({ ...formData, gstin: text })}
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitButton, { backgroundColor: theme.primary }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={isDarkMode ? '#000' : '#fff'} />
                            ) : (
                                <>
                                    <Text style={[styles.submitButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>Submit Application</Text>
                                    <Feather name="arrow-right" size={20} color={isDarkMode ? '#000' : '#fff'} />
                                </>
                            )}
                        </TouchableOpacity>
                        
                        <Text style={[styles.privacyNote, { color: theme.subtext }]}>
                            By submitting, you agree to our Partnership Terms and Privacy Policy.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    scrollContent: { paddingHorizontal: 20 },
    
    heroSection: { marginTop: 24, marginBottom: 40 },
    heroSubtitle: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
    heroTitle: { fontSize: 32, fontWeight: '900', lineHeight: 40, marginBottom: 12 },
    heroDesc: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
    
    benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
    benefitCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 20 },
    benefitIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    benefitTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
    benefitDesc: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
    
    formCard: { padding: 24, borderRadius: 32, marginBottom: 20 },
    formHeading: { fontSize: 20, fontWeight: '900', marginBottom: 24 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    inputContainer: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
    },
    input: { flex: 1, fontSize: 15, fontWeight: '700' },
    
    submitButton: {
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    submitButtonText: { fontSize: 16, fontWeight: '900' },
    privacyNote: { fontSize: 11, textAlign: 'center', marginTop: 20, fontWeight: '500', opacity: 0.8 }
});

export default PartnerInquiryScreen;
