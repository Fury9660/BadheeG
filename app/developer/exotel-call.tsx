import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { encode as btoa } from 'base-64';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ExotelCallScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Configuration State
    const [apiKey, setApiKey] = useState('b2106487ffbf2484974f6019cbeeb3e0afba8d0db8b7d614');
    const [apiToken, setApiToken] = useState('8983e1fe5cff3865e4278eafe77a6c10483b1b2d10e7e7a4');
    const [accountSid, setAccountSid] = useState('');
    const [subdomain, setSubdomain] = useState('api.exotel.com');
    const [showConfig, setShowConfig] = useState(false);

    // Call Details State
    const [fromNumber, setFromNumber] = useState('');
    const [toNumber, setToNumber] = useState('');
    const [callerId, setCallerId] = useState(''); // Your ExoPhone

    const [isLoading, setIsLoading] = useState(false);
    const [callStatus, setCallStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const theme = {
        background: isDarkMode ? '#000' : '#f0f2f5',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: '#007AFF',
        border: isDarkMode ? '#333' : '#E5E5EA',
        success: '#34C759',
        error: '#FF3B30',
        inputBg: isDarkMode ? '#2C2C2E' : '#fff',
    };

    const handleCall = async () => {
        if (!accountSid || !apiKey || !apiToken) {
            Alert.alert('Configuration Missing', 'Please provide Account SID, API Key, and Token.');
            setShowConfig(true);
            return;
        }
        if (!fromNumber || !toNumber || !callerId) {
            Alert.alert('Input Missing', 'Please provide From, To, and Caller ID numbers.');
            return;
        }

        setIsLoading(true);
        setCallStatus('idle');
        setStatusMessage('');

        // Handle CORS for Web Environment
        const baseUrl = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect`;

        // Use ThingProxy as it's generally more stable for quick demos without activation
        const url = Platform.OS === 'web'
            ? `https://thingproxy.freeboard.io/fetch/${baseUrl}`
            : baseUrl;

        // Form Data for Exotel
        const formData = new FormData();
        formData.append('From', fromNumber);
        formData.append('To', toNumber);
        formData.append('CallerId', callerId);

        try {
            console.log(`Attempting to call: ${url}`);
            const credentials = btoa(`${apiKey}:${apiToken}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    // ThingProxy sometimes prefers X-Requested-With
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });

            // Parse response safely
            const textData = await response.text();
            let data: any = {};
            try {
                data = JSON.parse(textData);
            } catch (e) {
                console.warn('Response is not JSON:', textData);
                data = { message: textData }; // Fallback
            }

            if (!response.ok) {
                // Check specifically for CORS proxy errors
                if (response.status === 403 && Platform.OS === 'web') {
                    // It could be CORS or Exotel 403 (KYC)
                    if (textData.includes('KYC compliant')) {
                        throw new Error('Exotel Error: Your account is not KYC compliant. Please complete KYC on Exotel Dashboard to make calls.');
                    }
                    if (textData.includes('CORS')) {
                        throw new Error('CORS Proxy Error. Web browsers block these calls. Please test on a Real Device or Simulator.');
                    }
                }

                // General check for KYC or other XML errors
                if (textData.includes('KYC compliant')) {
                    throw new Error('Exotel Error: Your account is not KYC compliant. Please complete KYC on Exotel Dashboard.');
                }

                throw new Error(data?.message || `Error ${response.status}: ${textData.substring(0, 100)}`);
            }

            setCallStatus('success');
            setStatusMessage(`Call Initiated! SID: ${data?.Call?.Sid || 'Unknown'}`);

        } catch (error: any) {
            console.error('Exotel Call Error:', error);
            setCallStatus('error');

            let msg = error.message || 'Failed to initiate call';
            if (msg.includes('Failed to fetch') && Platform.OS === 'web') {
                msg += ' (Likely CORS issue. Try checking console or use a mobile device)';
            }
            setStatusMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Exotel Call</Text>
                <TouchableOpacity onPress={() => setShowConfig(!showConfig)} style={{ padding: 8 }}>
                    <Feather name="settings" size={20} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Configuration Section (Collapsible) */}
                {showConfig && (
                    <View style={[styles.card, { backgroundColor: theme.card, marginBottom: 20 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>API Configuration</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.subtext }]}>Account SID *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                placeholder="Your Exotel Account SID"
                                placeholderTextColor={theme.subtext}
                                value={accountSid}
                                onChangeText={setAccountSid}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.subtext }]}>API Key</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                value={apiKey}
                                onChangeText={setApiKey}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.subtext }]}>API Token</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                value={apiToken}
                                onChangeText={setApiToken}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.subtext }]}>Subdomain</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                                value={subdomain}
                                onChangeText={setSubdomain}
                            />
                        </View>
                    </View>
                )}

                {/* Call Interface */}
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>Make a Call</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>From (Agent)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g. 09876543210"
                            placeholderTextColor={theme.subtext}
                            value={fromNumber}
                            onChangeText={setFromNumber}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>To (Customer)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g. 09876543210"
                            placeholderTextColor={theme.subtext}
                            value={toNumber}
                            onChangeText={setToNumber}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Caller ID (ExoPhone)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                            placeholder="Your Exotel Virtual Number"
                            placeholderTextColor={theme.subtext}
                            value={callerId}
                            onChangeText={setCallerId}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.callButton, { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handleCall}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="phone-call" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.callButtonText}>Connect Call</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Status Message */}
                    {callStatus !== 'idle' && (
                        <View style={[
                            styles.resultContainer,
                            { backgroundColor: callStatus === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)' }
                        ]}>
                            <Feather
                                name={callStatus === 'success' ? "check-circle" : "alert-circle"}
                                size={24}
                                color={callStatus === 'success' ? theme.success : theme.error}
                            />
                            <Text style={[
                                styles.resultText,
                                { color: callStatus === 'success' ? theme.success : theme.error }
                            ]}>
                                {statusMessage}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={{ marginTop: 20, textAlign: 'center', color: theme.subtext, fontSize: 12 }}>
                    Uses Exotel Connect API. Ensure From/To numbers are valid.
                </Text>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    content: {
        padding: 20,
    },
    card: {
        padding: 20,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    input: {
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 12,
        fontSize: 16,
    },
    callButton: {
        height: 52,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    callButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        padding: 16,
        borderRadius: 8,
    },
    resultText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    }
});

export default ExotelCallScreen;
