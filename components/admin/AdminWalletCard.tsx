import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

interface AdminWalletCardProps {
    totalCommission: string;
    isDarkMode: boolean;
}

const AdminWalletCard: React.FC<AdminWalletCardProps> = ({ totalCommission, isDarkMode }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    return (
        <LinearGradient
            colors={['#1a2a6c', '#b21f1f', '#fdbb2d']} // Premium Admin Gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { width: isDesktop ? 350 : '100%' }]}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardLabel}>Admin Commission</Text>
                    <Text style={styles.cardSubLabel}>Total Earnings</Text>
                </View>
                <Feather name="shield" size={24} color="rgba(255,255,255,0.8)" />
            </View>

            <View style={styles.chipRow}>
                <View style={styles.chip} />
                <Feather name="wifi" size={20} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
            </View>

            <View style={styles.balanceContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.balance}>{totalCommission}</Text>
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.holderLabel}>Card Holder</Text>
                    <Text style={styles.holderName}>ADMINISTRATOR</Text>
                </View>
                <View>
                    <Text style={styles.holderLabel}>Valid Thru</Text>
                    <Text style={styles.holderName}>LIFETIME</Text>
                </View>
                <View>
                    <Text style={styles.brandParams}>PLATINUM</Text>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        height: 200,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardSubLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 2,
    },
    chipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 10
    },
    chip: {
        width: 45,
        height: 30,
        borderRadius: 6,
        backgroundColor: '#e0cca6',
        borderWidth: 1,
        borderColor: '#cba',
        overflow: 'hidden',
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 10,
    },
    currencySymbol: {
        fontSize: 24,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        marginRight: 4,
    },
    balance: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    holderLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    holderName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    brandParams: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: 'bold',
        fontStyle: 'italic',
        letterSpacing: 2
    }
});

export default AdminWalletCard;
