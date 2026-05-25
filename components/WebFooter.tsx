import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Import at top level
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

const WebFooter = () => {
    const router = useRouter(); // Import at top level of component
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 1024;

    const footerLinks = [
        {
            title: 'Corporate',
            links: [
                { label: 'About Us', route: '/legal/about-us' },
                { label: 'Careers', route: '/legal/careers' }
            ]
        },
        {
            title: 'Useful Links',
            links: [
                { label: 'Find a Store', route: '/(tabs)/stores' },
                { label: 'Track Your Order', route: '/legal/track-order' }
            ]
        },
        {
            title: 'Partner With Us',
            links: [
                { label: 'Sell on badhee', route: 'mailto:support@badheeg.com' },
                { label: 'Seller Policy', route: '/legal/seller-policy' }
            ]
        },
        {
            title: 'Need Help?',
            links: [
                { label: 'FAQs', route: '/legal/faqs' },
                { label: 'Customer Policy', route: '/legal/customer-policy' },
                { label: 'Contact Us', route: '/legal/contact-us' }
            ]
        }
    ];

    const popularSections = [
        {
            title: 'Popular Categories',
            content: 'Sofas, Sectional Sofas, Sofa Sets, Queen Size Beds, King Size Beds, Coffee Tables, Dining Sets, Recliners, Sofa Cum Beds, Queen Size Mattresses, Cabinets & Sideboards, Book Shelves, TV & Media Units, Wardrobes, Foldable Mattresses, Pillows, Wall Shelves, Photo Frames, Bed Sheets, Table Linen, Study Tables, Office Furniture, Dining Tables, Carpets, Wall Decor'
        },
        {
            title: 'Popular cities',
            content: 'Sikar, Jaipur'
        }
    ];

    const paymentIcons = [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png', // Fallback for Maestro
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1200px-American_Express_logo_%282018%29.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Rupay-Logo.png/1200px-Rupay-Logo.png'
    ];

    const isMobile = width < 768;

    return (
        <View style={[styles.container, isMobile && { paddingTop: 15, paddingBottom: 60 }]}>
            <View style={{ width: '100%', alignItems: 'center', marginTop: -20, marginBottom: -10, overflow: 'hidden' }}>
                <Image
                    source={require('../assets/images/1000262409-Photoroom.png')}
                    style={{
                        width: '100%',
                        height: 100,
                        resizeMode: 'contain',
                        opacity: 1,
                        tintColor: 'black'
                    }}
                />
            </View>
            {/* Top Section: Links */}
            <View style={[styles.topSection, isMobile && { paddingHorizontal: 20 }]}>
                <View style={[styles.linksContainer, isMobile && { flexDirection: 'row', flexWrap: 'wrap', gap: 20 }]}>
                    {footerLinks.map((section, index) => (
                        <View key={index} style={[styles.linkColumn, isMobile && { minWidth: '40%', flex: 1, marginBottom: 20 }]}>
                            <Text style={styles.columnTitle}>{section.title}</Text>
                            {section.links.map((link, i) => (
                                <TouchableOpacity 
                                    key={i} 
                                    onPress={() => {
                                        if (link.route.startsWith('mailto:')) {
                                            import('react-native').then(({ Linking }) => Linking.openURL(link.route));
                                        } else {
                                            router.push(link.route as any);
                                        }
                                    }}
                                >
                                    <Text style={styles.linkText}>{link.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                </View>
            </View>

            {/* ... Middle Section (Popular) ... */}
            {!isMobile && (
                <View style={styles.middleSection}>
                    <View style={styles.popularGrid}>
                        {popularSections.map((section, index) => (
                            <View key={index} style={styles.popularColumn}>
                                <Text style={styles.popularTitle}>{section.title}</Text>
                                <Text style={styles.popularContent}>{section.content}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View style={[styles.separator, isMobile && { width: '90%' }]} />

            <View style={[styles.bottomSection, isMobile && { flexDirection: 'column', alignItems: 'center', paddingHorizontal: 20 }, !isMobile && { justifyContent: 'center' }]}>
                <View style={[styles.socialContainer, { alignItems: 'center', width: '100%' }]}>
                    <Text style={styles.bottomTitle}>Like What You See? Follow us Here</Text>
                    <View style={styles.socialIconsRow}>
                        <TouchableOpacity 
                            style={styles.socialIconBtn}
                            onPress={() => import('react-native').then(({ Linking }) => Linking.openURL('https://www.instagram.com/badhee_g_official?igsh=MWVxY3Y3bXBjdWpodQ=='))}
                        >
                            <FontAwesome name="instagram" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.socialIconBtn}
                            onPress={() => import('react-native').then(({ Linking }) => Linking.openURL('https://www.youtube.com/channel/UCsya35VeJbuodjt0OLKYwog'))}
                        >
                            <FontAwesome name="youtube-play" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialIconBtn}><FontAwesome name="facebook" size={24} color="#fff" /></TouchableOpacity>
                        <TouchableOpacity style={styles.socialIconBtn}><FontAwesome name="twitter" size={24} color="#fff" /></TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={[styles.separator, isMobile && { width: '90%' }]} />

            {/* Footer Legal */}
            <View style={[styles.legalSection, isMobile && { paddingHorizontal: 20 }]}>
                <View style={styles.legalLinks}>
                    {[
                        { label: 'Terms Of Use', route: '/legal/terms-of-use' },
                        { label: 'Privacy Policy', route: '/legal/privacy-policy' },
                        { label: 'Customer Policy', route: '/legal/customer-policy' },
                        { label: 'Your Data and Security', route: '/legal/security' }
                    ].map((item, i) => (
                        <TouchableOpacity key={i} onPress={() => router.push(item.route as any)}>
                            <Text style={styles.legalLinkText}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.copyrightText}>© Copyright Badhee G</Text>
            </View>

            {/* Floating Buy on Phone Button Simulation (Visual only as per image) */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F4F5F7',
        paddingTop: 15,
        width: '100%',
        alignSelf: 'center',
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    topSection: {
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 40,
        marginBottom: 15,
    },
    linksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 30,
    },
    linkColumn: {
        flex: 1,
        minWidth: 160,
    },
    columnTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#121212',
        marginBottom: 16,
    },
    linkText: {
        fontSize: 13,
        color: '#555',
        marginBottom: 8,
        lineHeight: 20,
    },
    appStoreRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    storeBadge: {
        width: 120,
        height: 40,
        resizeMode: 'contain',
    },
    middleSection: {
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 40,
        marginBottom: 15,
    },
    popularGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 40,
    },
    popularColumn: {
        flex: 1,
        minWidth: 300,
    },
    popularTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#121212',
        marginBottom: 12,
    },
    popularContent: {
        fontSize: 12,
        color: '#777',
        lineHeight: 18,
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
    },
    bottomSection: {
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 40,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 30,
    },
    paymentContainer: {
        flex: 1,
        minWidth: 300,
    },
    socialContainer: {
        flex: 1,
        minWidth: 300,
        alignItems: 'flex-end',
        // On mobile we might want to align left, but for PC 'space-between' with alignEnd works for the right side
    },
    bottomTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#121212',
        marginBottom: 16,
    },
    paymentIconsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    paymentIcon: {
        width: 50,
        height: 30,
        backgroundColor: '#fff',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    socialIconsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    socialIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333', // Default color, can be specific per text
    },
    legalSection: {
        maxWidth: 1400,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 40,
        alignItems: 'center',
        marginTop: 10,
    },
    legalLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 12,
    },
    legalLinkText: {
        fontSize: 13,
        color: '#555',
    },
    copyrightText: {
        fontSize: 13,
        color: '#888',
    }
});

export default WebFooter;
