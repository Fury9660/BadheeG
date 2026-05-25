import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const categories = [
    { name: 'Fashion', icon: 'tshirt-crew-outline', library: 'MaterialCommunityIcons' },
    { name: 'Electronics', icon: 'cpu', library: 'Feather' },
    { name: 'Grocery', icon: 'cart-outline', library: 'MaterialCommunityIcons' },
    { name: 'Furniture', icon: 'sofa-outline', library: 'MaterialCommunityIcons' },
    { name: 'Beauty', icon: 'face-woman-outline', library: 'MaterialCommunityIcons' },
    { name: 'Restaurants', icon: 'silverware-fork-knife', library: 'MaterialCommunityIcons' },
    { name: 'Pharmacy', icon: 'pill', library: 'MaterialCommunityIcons' },
    { name: 'Other', icon: 'dots-horizontal', library: 'MaterialCommunityIcons' },
];

const OnboardingScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [form, setForm] = useState({ ownerName: '', storeName: '', category: '' });

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#3466F6',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
    };

    const handleContinue = async () => {
        if (!form.ownerName || !form.storeName || !form.category) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return Alert.alert("Incomplete Details", "Please fill in all details.");
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { error } = await supabase
                .from('partners')
                .update({
                    owner_name: form.ownerName,
                    store_name: form.storeName,
                    category: form.category,
                    onboarding_step: 1
                })
                .eq('id', user.id);

            if (error) throw error;

            router.push('/onboarding-location');
        } catch (error) {
            Alert.alert("Error", "Could not save details.");
        }
    }

    const renderIcon = (cat, color) => {
        if (cat.library === 'MaterialCommunityIcons') {
            return <MaterialCommunityIcons name={cat.icon as any} size={24} color={color} />;
        }
        return <Feather name={cat.icon as any} size={24} color={color} />;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={[styles.stepIndicator, { color: theme.primary }]}>STEP 1/3</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Business Basics</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Owner Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="Full Name" placeholderTextColor={theme.subtext}
                            value={form.ownerName} onChangeText={ownerName => setForm(p => ({ ...p, ownerName }))}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>Store Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                            placeholder="Store Name" placeholderTextColor={theme.subtext}
                            value={form.storeName} onChangeText={storeName => setForm(p => ({ ...p, storeName }))}
                        />
                    </View>
                    <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                    <View style={styles.categoryContainer}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.name}
                                style={[styles.categoryChip, { backgroundColor: theme.card, borderColor: theme.border }, form.category === cat.name && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
                                onPress={() => { Haptics.selectionAsync(); setForm(p => ({ ...p, category: cat.name })); }}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: form.category === cat.name ? theme.primary : theme.background }]}>
                                    {renderIcon(cat, form.category === cat.name ? '#fff' : theme.text)}
                                </View>
                                <Text style={[styles.categoryText, { color: form.category === cat.name ? theme.primary : theme.text }]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
                <View style={[styles.footer, { paddingBottom: 16, borderTopColor: theme.border }]}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleContinue}>
                        <Text style={styles.buttonText}>Save & Next</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 24, paddingTop: 10 },
    stepIndicator: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    headerTitle: { fontSize: 28, fontWeight: '800' },
    content: { padding: 24, paddingTop: 8 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
    input: { padding: 18, borderRadius: 16, fontSize: 16, borderWidth: 1.5 },
    categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    categoryChip: { width: '48%', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1.5, marginBottom: 4 },
    iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    categoryText: { fontWeight: '700', fontSize: 14 },
    footer: { padding: 24, borderTopWidth: 1 },
    button: { height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default OnboardingScreen;
