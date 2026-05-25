import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// Firebase imports removed
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/*
  Table: public.banners
  - id: uuid
  - image: text (url)
  - created_at: timestamp
*/

const { width } = Dimensions.get('window');

const BannersScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const theme = {
        background: isDarkMode ? '#000' : '#f8f9fa',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        border: isDarkMode ? '#333' : '#e1e4e8',
        primary: '#4A90E2',
        danger: '#FF3B30',
        subtext: isDarkMode ? '#888' : '#666',
    };

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setBanners(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();

        // Optional: Realtime subscription
        const subscription = supabase
            .channel('banners_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, fetchBanners)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [20, 9],
        });

        if (!result.canceled && result.assets[0].uri) {
            handleUploadBanner(result.assets[0].uri);
        }
    };

    const handleUploadBanner = async (uri: string) => {
        setUploading(true);
        try {
            const ext = uri.substring(uri.lastIndexOf('.') + 1);
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                name: fileName,
                type: `image/${ext}`
            } as any);

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('banners') // Ensure 'banners' bucket exists
                .upload(fileName, formData);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('banners')
                .getPublicUrl(fileName);

            // 2. Insert into DB
            const { error: dbError } = await supabase.from('banners').insert({
                image: publicUrl
            });

            if (dbError) throw dbError;

            Alert.alert("Success", "Banner uploaded successfully");
            fetchBanners();
        } catch (error: any) {
            console.error("Banner upload failed:", error);
            Alert.alert("Error", "Failed to upload banner: " + error.message);
        }
        setUploading(false);
    };

    const handleDeleteBanner = (id: string) => {
        Alert.alert("Delete Banner", "Are you sure you want to delete this banner?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const { error } = await supabase.from('banners').delete().eq('id', id);
                        if (error) throw error;
                        fetchBanners(); // or wait for realtime
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete banner");
                    }
                }
            }
        ]);
    };

    const renderBanner = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Image source={{ uri: item.image }} style={styles.bannerImage} />
            <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={() => handleDeleteBanner(item.id)}
            >
                <Feather name="trash-2" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text }]}>Banners</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.primary }]}
                    onPress={pickImage}
                    disabled={uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Feather name="plus" size={20} color="#fff" />
                            <Text style={styles.btnText}>Add Banner</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={theme.primary} size="large" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={banners}
                    keyExtractor={item => item.id}
                    renderItem={renderBanner}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 50 }}>
                            <Feather name="image" size={48} color={theme.subtext} />
                            <Text style={{ color: theme.subtext, marginTop: 12 }}>No banners yet</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    title: { fontSize: 24, fontWeight: 'bold' },
    addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    card: { borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1, position: 'relative' },
    bannerImage: { width: '100%', height: 150, resizeMode: 'cover' },
    deleteBtn: { position: 'absolute', top: 10, right: 10, padding: 8, borderRadius: 20 },
});

export default BannersScreen;
