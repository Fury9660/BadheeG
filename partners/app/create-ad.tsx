import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOCATIONS = ['All India', 'Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];

const CreateAdScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { user } = useAuth();

    const [name, setName] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [targetType, setTargetType] = useState('Category');
    const [targetValue, setTargetValue] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [priority, setPriority] = useState('1');
    const [isActive, setIsActive] = useState(true);
    const [location, setLocation] = useState('All India');
    const [dailyBudget, setDailyBudget] = useState('500');
    const [isLoading, setIsLoading] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [dateModal, setDateModal] = useState<{ show: boolean, target: 'start' | 'end' }>({ show: false, target: 'start' });

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        text: isDarkMode ? '#fff' : '#121212',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#000000',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [2, 1],
            quality: 0.5,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const handleCreateAd = async () => {
        if (!name || !image || !targetValue) return Alert.alert("Wait", "Sabhi fields fill kijiye.");
        if (!user) return Alert.alert("Error", "Logged in user not found");

        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // 1. Upload Image to Supabase Storage
            const filename = `ads / ${user.id}_${Date.now()}.jpg`;
            const response = await fetch(image);
            const blob = await response.blob();

            const { error: uploadError } = await supabase.storage
                .from('ad-banners') // Ensure bucket exists
                .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('ad-banners')
                .getPublicUrl(filename);

            // 2. Insert into campaigns table
            const { error: dbError } = await supabase
                .from('campaigns')
                .insert({
                    partnerId: user.id,
                    name,
                    bannerUrl: publicUrl,
                    targetType,
                    targetValue,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    priority: parseInt(priority) || 1,
                    isActive,
                    location,
                    dailyBudget: parseFloat(dailyBudget) || 0,
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    metrics: { impressions: 0, clicks: 0 }
                });

            if (dbError) throw dbError;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success! 🎉", "Campaign created successfully.", [{ text: "Done", onPress: () => router.back() }]);
        } catch (error: any) {
            console.error("Upload/Create Error:", error.message);
            Alert.alert("Failed", error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Configure Ad</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Campaign Name" placeholderTextColor={theme.subtext} value={name} onChangeText={setName} />

                <TouchableOpacity style={[styles.imagePicker, { backgroundColor: theme.card, borderColor: image ? theme.primary : theme.border }]} onPress={handlePickImage}>
                    {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} /> : <View style={{ alignItems: 'center' }}><MaterialCommunityIcons name="image-plus" size={32} color={theme.subtext} /><Text style={{ color: theme.subtext, marginTop: 8 }}>Add Banner</Text></View>}
                </TouchableOpacity>

                <View style={styles.targetRow}>
                    {['Category', 'Product', 'Link'].map(t => (
                        <TouchableOpacity key={t} style={[styles.targetBtn, { backgroundColor: theme.card, borderColor: targetType === (t === 'Link' ? 'External' : t) ? theme.primary : theme.border }]} onPress={() => setTargetType(t === 'Link' ? 'External' : t)}>
                            <Text style={{ color: targetType === (t === 'Link' ? 'External' : t) ? theme.primary : theme.subtext, fontWeight: '700' }}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginTop: 12 }]} placeholder={`Enter ${targetType} details...`} placeholderTextColor={theme.subtext} value={targetValue} onChangeText={setTargetValue} />

                <View style={styles.row}>
                    <TouchableOpacity style={[styles.dateBtn, { flex: 1, marginRight: 8, borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => setDateModal({ show: true, target: 'start' })}><Text style={{ color: theme.text }}>{startDate}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.dateBtn, { flex: 1, borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => setDateModal({ show: true, target: 'end' })}><Text style={{ color: theme.text }}>{endDate}</Text></TouchableOpacity>
                </View>

                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Priority (1-5)" keyboardType="numeric" value={priority} onChangeText={setPriority} />

                <TouchableOpacity style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} onPress={() => setShowLocationModal(true)}>
                    <Text style={{ color: theme.text }}>{location}</Text>
                </TouchableOpacity>

                <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Daily Budget" keyboardType="numeric" value={dailyBudget} onChangeText={setDailyBudget} />

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={handleCreateAd} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Launch Campaign</Text>}
                </TouchableOpacity>
                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal visible={showLocationModal} transparent animationType="slide">
                <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}><FlatList data={LOCATIONS} renderItem={({ item }) => (<TouchableOpacity style={styles.locItem} onPress={() => { setLocation(item); setShowLocationModal(false); }}><Text style={{ color: theme.text }}>{item}</Text></TouchableOpacity>)} /></View></View>
            </Modal>

            <Modal visible={dateModal.show} transparent animationType="fade">
                <View style={styles.modalOverlay}><View style={[styles.modalContent, { backgroundColor: theme.card }]}><Text style={{ color: theme.text, marginBottom: 10 }}>YYYY-MM-DD</Text><TextInput style={[styles.input, { color: theme.text }]} autoFocus onChangeText={v => dateModal.target === 'start' ? setStartDate(v) : setEndDate(v)} onSubmitEditing={() => setDateModal({ ...dateModal, show: false })} /></View></View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '900' },
    scrollContent: { padding: 20 },
    input: { padding: 16, borderRadius: 12, borderWidth: 1.5, fontSize: 16, fontWeight: '700', marginBottom: 12 },
    imagePicker: { width: '100%', height: 180, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 12 },
    targetRow: { flexDirection: 'row', gap: 8 },
    targetBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
    dateBtn: { padding: 16, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
    row: { flexDirection: 'row', marginBottom: 12 },
    submitBtn: { padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
    modalContent: { borderRadius: 20, padding: 20 },
    locItem: { padding: 15, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' }
});

export default CreateAdScreen;
