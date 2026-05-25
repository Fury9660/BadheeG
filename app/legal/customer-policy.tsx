import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomerPolicy = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const theme = {
        background: isDarkMode ? '#000000' : '#F8F9FA',
        text: isDarkMode ? '#FFFFFF' : '#121212',
        subtext: isDarkMode ? '#888888' : '#666666',
        card: isDarkMode ? '#111111' : '#FFFFFF',
        border: isDarkMode ? '#222222' : '#E5E5EA',
        accent: isDarkMode ? '#FFFFFF' : '#000000',
        sectionBg: isDarkMode ? '#111111' : '#FFFFFF',
    };

    const PolicySection = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <View style={[styles.sectionCard, { backgroundColor: theme.sectionBg, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
                <View style={[styles.iconBox, { backgroundColor: theme.text + '10' }]}>
                    <Feather name={icon} size={18} color={theme.text} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
            </View>
            <View style={styles.sectionContent}>
                {children}
            </View>
        </View>
    );

    const BulletPoint = ({ text, subtext }: { text: string, subtext?: string }) => (
        <View style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: theme.text + '40' }]} />
            <View style={{ flex: 1 }}>
                <Text style={[styles.bulletText, { color: theme.text }]}>{text}</Text>
                {subtext && <Text style={[styles.bulletSubtext, { color: theme.subtext }]}>{subtext}</Text>}
            </View>
        </View>
    );

    const HighlightBox = ({ text }: { text: string }) => (
        <View style={[styles.highlightBox, { backgroundColor: theme.text + '05', borderColor: theme.text + '15' }]}>
            <Text style={[styles.highlightText, { color: theme.text }]}>{text}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>BADHEE G</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Customer Policy</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, isDesktop && { paddingHorizontal: (width - 800) / 2 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.introText, { color: theme.subtext }]}>
                    Welcome to the BADHEE G customer care center. We are committed to providing you with a seamless and transparent shopping experience. Please review our detailed policies below.
                </Text>

                {/* 1. Order Cancellations */}
                <PolicySection title="Order Cancellations" icon="x-circle">
                    <BulletPoint 
                        text="Within 24 Hours" 
                        subtext="You can cancel from 'My Orders' before confirmation/shipment. A 2.5% fee applies on the refund." 
                    />
                    <BulletPoint 
                        text="After Shipment/Delivery" 
                        subtext="Subject to assessment by the Resolution Team. A 15% fee will be deducted." 
                    />
                    <HighlightBox text="Guest Users must contact Customer Service Team for any cancellation requests." />
                </PolicySection>

                {/* 2. Returning an Item */}
                <PolicySection title="Returns & Replacements" icon="rotate-ccw">
                    <BulletPoint 
                        text="Time Frame" 
                        subtext="Requests must be initiated within 02 days of delivery." 
                    />
                    <BulletPoint 
                        text="Eligible Items" 
                        subtext="Manufacturing defects (imbalance, open joints) or difference from website photos/specifications." 
                    />
                    <HighlightBox text="Note: Natural wood grain or color variations (up to 10%) are not considered defects." />
                    <BulletPoint 
                        text="Non-Returnable" 
                        subtext="Damaged items reported after assembly, relocation damage, or 'Deal of the Day' non-furniture items." 
                    />
                </PolicySection>

                {/* 3. Return Process */}
                <PolicySection title="How to Start a Return" icon="camera">
                    <BulletPoint text="Take 2-3 clear photos (Entire product + Defect area)." />
                    <HighlightBox text="CRITICAL: An unboxing video recorded from start to finish without cuts is MANDATORY for all return requests." />
                    <BulletPoint text="Register request via 'My Orders' -> 'Return This Product'." />
                    <BulletPoint text="Assessment: Our team will contact you within 24 hours. Once approved, pickup occurs within 72 hours." />
                </PolicySection>

                {/* 4. Refund Policy */}
                <PolicySection title="Refund Policy" icon="credit-card">
                    <BulletPoint text="Initiation: Process starts once the item is cancelled and successfully picked up." />
                    <BulletPoint text="Methods: Original Mode of Payment or BADHEE G Wallet." />
                    <BulletPoint text="Timelines: Wallet (Within 24 Hours) | Bank/Card/UPI (7-10 Business Days)." />
                    <HighlightBox text="Cashback used in other orders will be deducted from your final refund amount." />
                </PolicySection>

                {/* 5. Warranty Policy */}
                <PolicySection title="Warranty Claims" icon="shield">
                    <BulletPoint text="Covers manufacturing defects confirmed by our Resolution Team." />
                    <BulletPoint text="Borer issues are covered for 1 year from the date of purchase." />
                    <BulletPoint text="Not Covered: Normal wear & tear, third-party repairs, fabric fading, or spills." />
                    <HighlightBox text="Standard industry variations (up to 2 inches in size or 5mm unevenness) are acceptable." />
                </PolicySection>

                {/* 6. Delivery Policy */}
                <PolicySection title="Delivery Timelines" icon="truck">
                    <BulletPoint text="Fast Delivery: 80% of orders delivered within 15 working days." />
                    <BulletPoint text="Standard: 15-25 working days for handcrafted perfection." />
                    <HighlightBox text="Meticulous crafting may add up to 5 days delay to ensure quality." />
                </PolicySection>

                {/* 7. COD Terms */}
                <PolicySection title="Cash on Delivery (COD)" icon="dollar-sign">
                    <BulletPoint text="Advance: 20% advance payment required to confirm COD orders." />
                    <BulletPoint text="Balance: Remaining 80% to be paid at the time of delivery." />
                    <HighlightBox text="The 20% advance ensures commitment and initiates the custom manufacturing process." />
                </PolicySection>

                {/* 8. Gift Cards */}
                <PolicySection title="Gift Card Terms" icon="gift">
                    <BulletPoint text="Validity: 1 year from the date of issuance." />
                    <BulletPoint text="Redemption: Can be used on www.BADHEEG.com (Max 5 cards per transaction)." />
                    <BulletPoint text="Non-Refundable: Once purchased, gift cards cannot be cancelled or returned." />
                </PolicySection>

                <View style={{ height: 40 }} />
                <Text style={[styles.disclaimer, { color: theme.subtext }]}>
                    Disclaimer: BADHEE G reserves the right to reject service if the customer has not followed the provided User Manual or instructions.
                </Text>
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    scrollContent: {
        padding: 24,
    },
    introText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 32,
        fontWeight: '500',
    },
    sectionCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    sectionContent: {
        gap: 12,
    },
    bulletRow: {
        flexDirection: 'row',
        gap: 12,
    },
    bulletDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 8,
    },
    bulletText: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
    },
    bulletSubtext: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
        marginTop: 2,
    },
    highlightBox: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 4,
    },
    highlightText: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    disclaimer: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
        fontStyle: 'italic',
    },
});

export default CustomerPolicy;
