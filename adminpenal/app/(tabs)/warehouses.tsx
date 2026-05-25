import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUPABASE_URL = 'https://esykxyhbawwdifubbdng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/delhivery-proxy`;

const WarehousesScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const theme = {
        background: isDarkMode ? '#121212' : '#F4F6F8',
        text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
        card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        subtext: isDarkMode ? '#A0A0A0' : '#6B7280',
        primary: '#FF6B2B',
        border: isDarkMode ? '#333333' : '#E5E7EB',
        surface: isDarkMode ? '#252525' : '#F9FAFB',
    };

    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [stateName, setStateName] = useState('');
    const [pincode, setPincode] = useState('');
    const [gstin, setGstin] = useState('UR');
    const [isDefault, setIsDefault] = useState(false);

    const fetchWarehouses = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('delhivery_warehouses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWarehouses(data || []);
        } catch (err: any) {
            console.error('Failed to fetch warehouses:', err);
            Alert.alert('Error', err.message || 'Could not load warehouses');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    const handleSetDefault = async (id: string) => {
        try {
            setLoading(true);
            // Transaction-like update: Set all to false, then this one to true
            await supabase
                .from('delhivery_warehouses')
                .update({ is_default: false })
                .neq('id', id);

            const { error } = await supabase
                .from('delhivery_warehouses')
                .update({ is_default: true })
                .eq('id', id);

            if (error) throw error;

            fetchWarehouses();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update default warehouse');
            setLoading(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('delhivery_warehouses')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setWarehouses(prev =>
                prev.map(w => w.id === id ? { ...w, is_active: !currentStatus } : w)
            );
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update status');
        }
    };

    const handleAddWarehouse = async () => {
        if (!name || !phone || !address || !city || !stateName || !pincode) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const warehousePayload = {
                name,
                email,
                phone,
                address,
                city,
                state: stateName,
                pincode,
                gstin,
            };

            // Step 1: Register with Delhivery API via Deno proxy function
            const res = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                },
                body: JSON.stringify({
                    action: 'add-warehouse',
                    details: { warehouse: warehousePayload }
                }),
            });

            const data = await res.json();
            if (!res.ok || data.success === false) {
                throw new Error(data.error || 'Failed to register warehouse with Delhivery');
            }

            // Step 2: If default, clear other default flags first
            if (isDefault) {
                await supabase
                    .from('delhivery_warehouses')
                    .update({ is_default: false })
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // dummy
            }

            // Step 3: Insert into Supabase table
            const { error: dbError } = await supabase
                .from('delhivery_warehouses')
                .insert({
                    name,
                    email,
                    phone,
                    address,
                    city,
                    state: stateName,
                    pincode,
                    gstin,
                    is_default: isDefault,
                    is_active: true,
                    delhivery_id: name, // Delhivery uses the name as identifier
                });

            if (dbError) throw dbError;

            Alert.alert('Success', 'Warehouse registered and saved successfully!');
            setAddModalVisible(false);
            resetForm();
            fetchWarehouses();
        } catch (err: any) {
            console.error('Add Warehouse error:', err);
            Alert.alert('Error', err.message || 'Failed to register warehouse');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setCity('');
        setStateName('');
        setPincode('');
        setGstin('UR');
        setIsDefault(false);
    };

    if (loading && warehouses.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ marginTop: 12, color: theme.subtext }}>Loading pickup locations...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Warehouses</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.subtext }]}>Delhivery Pickup Points</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setAddModalVisible(true)}
                    style={[styles.addBtn, { backgroundColor: theme.primary }]}
                >
                    <Feather name="plus" size={18} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>Add Warehouse</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWarehouses(); }} />}
            >
                {warehouses.length === 0 ? (
                    <View style={[styles.emptyContainer, { borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="store-remove-outline" size={48} color={theme.subtext} />
                        <Text style={[styles.emptyText, { color: theme.text }]}>No registered warehouses found</Text>
                        <Text style={[styles.emptySubtext, { color: theme.subtext }]}>Click "Add Warehouse" to register your first pickup location.</Text>
                    </View>
                ) : (
                    warehouses.map((wh) => (
                        <View key={wh.id} style={[styles.warehouseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {/* Card Top */}
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialCommunityIcons name="warehouse" size={20} color={theme.primary} />
                                    <Text style={[styles.whName, { color: theme.text }]} numberOfLines={1}>{wh.name}</Text>
                                </View>
                                {wh.is_default && (
                                    <View style={styles.defaultBadge}>
                                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                                    </View>
                                )}
                            </View>

                            {/* Details */}
                            <Text style={[styles.whAddress, { color: theme.subtext }]}>
                                {wh.address}{'\n'}
                                {wh.city}, {wh.state} — {wh.pincode}
                            </Text>

                            <View style={styles.metaRow}>
                                <Text style={[styles.metaText, { color: theme.subtext }]}>
                                    📞 {wh.phone} {wh.email ? `| ✉️ ${wh.email}` : ''}
                                </Text>
                                <Text style={[styles.gstText, { color: theme.subtext }]}>
                                    GSTIN: <Text style={{ fontWeight: '700' }}>{wh.gstin}</Text>
                                </Text>
                            </View>

                            <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

                            {/* Card Footer Actions */}
                            <View style={styles.cardActions}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Switch
                                        value={wh.is_active}
                                        onValueChange={() => handleToggleActive(wh.id, wh.is_active)}
                                        trackColor={{ false: "#E5E7EB", true: theme.primary }}
                                        thumbColor={"#FFFFFF"}
                                        ios_backgroundColor="#E5E7EB"
                                    />
                                    <Text style={[styles.activeLabel, { color: wh.is_active ? theme.text : theme.subtext }]}>
                                        {wh.is_active ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>

                                {!wh.is_default && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { borderColor: theme.border }]}
                                        onPress={() => handleSetDefault(wh.id)}
                                    >
                                        <Feather name="check-circle" size={14} color={theme.subtext} />
                                        <Text style={[styles.actionBtnText, { color: theme.text }]}>Make Default</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add Warehouse Modal */}
            <Modal animationType="slide" transparent visible={addModalVisible} onRequestClose={() => setAddModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => !submitting && setAddModalVisible(false)} />
                    <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Register Warehouse</Text>
                            <TouchableOpacity
                                disabled={submitting}
                                onPress={() => setAddModalVisible(false)}
                                style={[styles.closeBtn, { backgroundColor: theme.surface }]}
                            >
                                <Feather name="x" size={18} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <Text style={[styles.inputLabel, { color: theme.subtext }]}>WAREHOUSE NAME *</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                placeholder="e.g. MODERN FURNITURE CRAFT"
                                placeholderTextColor={theme.subtext}
                                value={name}
                                onChangeText={setName}
                                editable={!submitting}
                            />

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: theme.subtext }]}>PHONE *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                        placeholder="10 digit number"
                                        placeholderTextColor={theme.subtext}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        editable={!submitting}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.inputLabel, { color: theme.subtext }]}>EMAIL</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                        placeholder="email@example.com"
                                        placeholderTextColor={theme.subtext}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        editable={!submitting}
                                    />
                                </View>
                            </View>

                            <Text style={[styles.inputLabel, { color: theme.subtext }]}>ADDRESS *</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                placeholder="Street address, colony, building"
                                placeholderTextColor={theme.subtext}
                                value={address}
                                onChangeText={setAddress}
                                editable={!submitting}
                            />

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: theme.subtext }]}>CITY *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                        placeholder="City"
                                        placeholderTextColor={theme.subtext}
                                        value={city}
                                        onChangeText={setCity}
                                        editable={!submitting}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.inputLabel, { color: theme.subtext }]}>STATE *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                        placeholder="State"
                                        placeholderTextColor={theme.subtext}
                                        value={stateName}
                                        onChangeText={setStateName}
                                        editable={!submitting}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: theme.subtext }]}>PINCODE *</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                        placeholder="6 digit PIN"
                                        placeholderTextColor={theme.subtext}
                                        value={pincode}
                                        onChangeText={setPincode}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        editable={!submitting}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.inputLabel, { color: theme.subtext }]}>GSTIN</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                                        placeholder="e.g. 08AAAAA0000A1Z1 or UR"
                                        placeholderTextColor={theme.subtext}
                                        value={gstin}
                                        onChangeText={setGstin}
                                        autoCapitalize="characters"
                                        editable={!submitting}
                                    />
                                </View>
                            </View>

                            <View style={styles.switchRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.switchTitle, { color: theme.text }]}>Set as Default Location</Text>
                                    <Text style={[styles.switchSub, { color: theme.subtext }]}>Make this your primary shipping source</Text>
                                </View>
                                <Switch
                                    value={isDefault}
                                    onValueChange={setIsDefault}
                                    trackColor={{ false: "#E5E7EB", true: theme.primary }}
                                    thumbColor={"#FFFFFF"}
                                    ios_backgroundColor="#E5E7EB"
                                    disabled={submitting}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]}
                                onPress={handleAddWarehouse}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Feather name="check" size={18} color="#FFFFFF" />
                                        <Text style={styles.submitBtnText}>Register with Delhivery</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    headerSubtitle: { fontSize: 13, marginTop: 2, fontWeight: '500' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

    scrollContainer: { padding: 20, gap: 16 },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 16,
        marginTop: 20,
        gap: 12,
    },
    emptyText: { fontSize: 16, fontWeight: '700' },
    emptySubtext: { fontSize: 13, textAlign: 'center' },

    warehouseCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        ...Platform.select({
            web: { boxShadow: '0 4px 16px rgba(0,0,0,0.04)' } as any,
            default: { elevation: 2 },
        }),
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    whName: { fontSize: 16, fontWeight: '800', flex: 1 },
    defaultBadge: {
        backgroundColor: '#FF6B2B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    defaultBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    whAddress: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    metaText: { fontSize: 12, fontWeight: '500' },
    gstText: { fontSize: 12, fontWeight: '500' },
    cardDivider: { height: 1, marginVertical: 14 },
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activeLabel: { fontSize: 13, fontWeight: '600' },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    actionBtnText: { fontSize: 12, fontWeight: '700' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: {
        width: '90%',
        maxWidth: 500,
        borderRadius: 24,
        padding: 20,
        maxHeight: '90%',
        ...Platform.select({
            web: { boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } as any,
        }),
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    inputLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
    input: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        fontSize: 14,
    },
    inputRow: { flexDirection: 'row' },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    switchTitle: { fontSize: 14, fontWeight: '700' },
    switchSub: { fontSize: 12, marginTop: 2 },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 52,
        borderRadius: 14,
        marginTop: 20,
    },
    submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

export default WarehousesScreen;
