import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const AddProductScreen = () => {
    const { colors: theme, isDarkMode } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024;
    const isTablet = width > 768;

    const { user } = useAuth();

    // States
    const [images, setImages] = useState<string[]>([]);
    const [imagesBase64, setImagesBase64] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [mrp, setMrp] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [warranty, setWarranty] = useState('');
    const [care, setCare] = useState('');
    const [brand, setBrand] = useState('');
    const [specs, setSpecs] = useState([{ label: '', value: '' }]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (id) {
            const fetchProductData = async () => {
                setIsLoading(true);
                try {
                    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
                    if (data) {
                        setName(data.name || '');
                        setPrice(String(data.price || ''));
                        setMrp(String(data.mrp || ''));
                        setStock(String(data.stock || ''));
                        setCategory(data.category || '');
                        setDescription(data.description || '');
                        setWarranty(data.warranty || '');
                        setCare(data.care || '');
                        setBrand(data.brand || '');
                        setSpecs(data.specifications || [{ label: '', value: '' }]);
                        setImages(data.images || [data.image].filter(Boolean) || []);
                    }
                } catch (error) {
                    console.error("Error fetching product:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProductData();
        }
    }, [id]);

    const scanLineY = useSharedValue(0);
    const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scanLineY.value }], opacity: isScanning ? 1 : 0 }));

    const handlePickImage = async () => {
        const remainingLimit = 4 - images.length;
        if (remainingLimit <= 0) return Alert.alert("Limit Reached", "Max 4 images allowed.");
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: remainingLimit,
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled) {
            const newUris = result.assets.map(a => a.uri);
            const newBase64s = result.assets.map(a => a.base64 || '');
            setImages(prev => [...prev, ...newUris].slice(0, 4));
            setImagesBase64(prev => [...prev, ...newBase64s].slice(0, 4));
        }
    };

    const handleAIScan = () => {
        if (images.length === 0) return Alert.alert("Upload photo first");
        setIsScanning(true);
        scanLineY.value = withRepeat(withTiming(200, { duration: 1000 }), 3, true);
        setTimeout(() => {
            setIsScanning(false);
            setName('Premium Designer Table');
            setPrice('12999');
            setMrp('25000');
            setCategory('Furniture');
            setDescription('Exquisite handcrafted table with premium wood finish and modern aesthetics.');
            setWarranty('2 Year Warranty');
            setCare('Wipe with dry microfiber cloth');
            setBrand('Badhee G Signature');
            setSpecs([{ label: 'Material', value: 'Solid Sheesham' }, { label: 'Finish', value: 'Walnut' }]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 2000);
    };

    const handleSave = async () => {
        if (!user) return;
        if (!name || !price || images.length === 0) return Alert.alert("Missing Info", "Name, Price and at least 1 image are required.");
        setIsLoading(true);
        try {
            const uploadedUrls: string[] = [];
            const existingUrls = images.filter(img => img.startsWith('http'));
            uploadedUrls.push(...existingUrls);

            for (let i = 0; i < imagesBase64.length; i++) {
                const base64 = imagesBase64[i];
                const fileName = `${user.id}/${Date.now()}-${i}.jpg`;
                const filePath = `products/${fileName}`;
                const imageBuffer = Buffer.from(base64, 'base64');
                const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageBuffer, { contentType: 'image/jpeg' });
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
                uploadedUrls.push(publicUrl);
            }

            const productData = {
                partner_id: user.id,
                name,
                price: parseInt(price),
                mrp: parseInt(mrp) || 0,
                stock: parseInt(stock) || 0,
                category,
                description,
                warranty,
                care,
                brand,
                specifications: specs.filter(s => s.label && s.value),
                image: uploadedUrls[0],
                images: uploadedUrls,
                in_stock: true,
                updated_at: new Date().toISOString(),
            };

            if (id) {
                await supabase.from('products').update(productData).eq('id', id);
            } else {
                await supabase.from('products').insert({ ...productData, created_at: new Date().toISOString() });
            }
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderInput = (label: string, value: string, setter: (t: string) => void, placeholder: string, icon: string, multiline = false, keyboard: any = 'default') => (
        <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
                <Feather name={icon as any} size={14} color={theme.primary} />
                <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#111' : '#F8FAFC', borderColor: isDarkMode ? '#222' : '#E2E8F0' }]}>
                <TextInput
                    style={[styles.input, { color: theme.text, height: multiline ? 120 : 54, textAlignVertical: multiline ? 'top' : 'center' }]}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={setter}
                    multiline={multiline}
                    keyboardType={keyboard}
                />
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#0A0A0A' : '#F8FAFC' }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            
            {/* Top Bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 5, paddingBottom: 10 }]}>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/partners/inventory' as any)} style={[styles.backBtn, { width: 38, height: 38 }]}>
                    <Ionicons name="chevron-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleGroup}>
                    <Text style={[styles.headerTitle, { color: theme.text, fontSize: 18 }]}>{id ? 'Edit Product' : 'New Product'}</Text>
                    <View style={styles.dot} />
                    <Text style={[styles.headerSubTitle, { fontSize: 15 }]}>{id ? 'Update' : 'Add'}</Text>
                </View>
                <View style={{ width: 38 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.mainLayout, isTablet && styles.tabletLayout]}>
                        
                        {/* Left Column: Images */}
                        <View style={[styles.leftCol, isTablet && { flex: 1 }]}>
                            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Product Visuals</Text>
                                <Text style={styles.sectionSub}>Upload up to 4 high-quality photos</Text>
                                
                                <TouchableOpacity style={styles.mainImagePlaceholder} onPress={handlePickImage} activeOpacity={0.8}>
                                    {images.length > 0 ? (
                                        <View style={styles.imageGrid}>
                                            {images.map((img, idx) => (
                                                <View key={idx} style={styles.imageItem}>
                                                    <Image source={{ uri: img }} style={styles.image} />
                                                    {isScanning && idx === 0 && <Animated.View style={[styles.scanLine, scanStyle]} />}
                                                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => {
                                                        setImages(prev => prev.filter((_, i) => i !== idx));
                                                        setImagesBase64(prev => prev.filter((_, i) => i !== idx));
                                                    }}>
                                                        <Ionicons name="close" size={16} color="#FFF" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                            {images.length < 4 && (
                                                <TouchableOpacity style={styles.addMoreBtn} onPress={handlePickImage}>
                                                    <Feather name="plus" size={24} color={theme.subtext} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={styles.emptyImageState}>
                                            <View style={styles.cameraCircle}>
                                                <Feather name="camera" size={32} color={theme.primary} />
                                            </View>
                                            <Text style={[styles.addText, { color: theme.text }]}>Tap to Upload</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {images.length > 0 && (
                                    <TouchableOpacity onPress={handleAIScan} disabled={isScanning}>
                                        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.aiButton}>
                                            {isScanning ? <ActivityIndicator size="small" color="#FFF" /> : (
                                                <>
                                                    <Text style={styles.aiButtonText}>✨ Auto-fill with AI</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Right Column: Details */}
                        <View style={[styles.rightCol, isTablet && { flex: 1.5 }]}>
                            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>
                                {renderInput('Product Name', name, setName, 'e.g. Luxury Velvet Sofa', 'tag')}
                                
                                <View style={styles.inputRow}>
                                    <View style={{ flex: 1 }}>{renderInput('Price (₹)', price, setPrice, '0.00', 'dollar-sign', false, 'numeric')}</View>
                                    <View style={{ flex: 1 }}>{renderInput('MRP (₹)', mrp, setMrp, '0.00', 'trending-up', false, 'numeric')}</View>
                                </View>

                                <View style={styles.inputRow}>
                                    <View style={{ flex: 1 }}>{renderInput('Stock', stock, setStock, 'Available units', 'box', false, 'numeric')}</View>
                                    <View style={{ flex: 1 }}>{renderInput('Category', category, setCategory, 'e.g. Sofa, Bed', 'grid')}</View>
                                </View>

                                {renderInput('Description', description, setDescription, 'Tell customers more about the product...', 'align-left', true)}
                            </View>

                            <View style={[styles.sectionCard, { backgroundColor: theme.card, marginTop: 24 }]}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Specifications</Text>
                                {renderInput('Brand', brand, setBrand, 'e.g. Badhee G Home', 'award')}
                                {renderInput('Warranty', warranty, setWarranty, 'e.g. 1 Year Limited', 'shield')}
                                {renderInput('Care Instructions', care, setCare, 'e.g. Dry Clean Only', 'info')}
                            </View>

                            <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                                <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.saveBtn}>
                                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{id ? 'Save Changes' : 'Publish Product'}</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
    backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.02)', alignItems: 'center', justifyContent: 'center' },
    headerTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', marginTop: 2 },
    headerSubTitle: { fontSize: 15, fontWeight: '500', color: '#64748B' },
    scrollContent: { paddingHorizontal: 20, paddingVertical: 20, maxWidth: 1400, alignSelf: 'center', width: '100%' },
    mainLayout: { gap: 24 },
    tabletLayout: { flexDirection: 'row', alignItems: 'flex-start' },
    leftCol: { width: '100%' },
    rightCol: { width: '100%' },
    sectionCard: { padding: 24, borderRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
    sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
    sectionSub: { fontSize: 13, color: '#94A3B8', marginBottom: 20, fontWeight: '500' },
    mainImagePlaceholder: { width: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.02)', borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0', marginBottom: 20 },
    emptyImageState: { height: 260, alignItems: 'center', justifyContent: 'center', gap: 12 },
    cameraCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    addText: { fontSize: 16, fontWeight: '800' },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 12 },
    imageItem: { width: '47%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#F1F5F9' },
    image: { width: '100%', height: '100%' },
    addMoreBtn: { width: '47%', aspectRatio: 1, borderRadius: 18, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
    removeImageBtn: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    scanLine: { position: 'absolute', width: '100%', height: 4, backgroundColor: '#4F46E5' },
    aiButton: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    aiButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
    inputGroup: { marginBottom: 20, gap: 8 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4 },
    label: { fontSize: 13, fontWeight: '800' },
    inputWrapper: { borderRadius: 18, borderWidth: 1 },
    input: { paddingHorizontal: 20, fontSize: 16, fontWeight: '600' },
    inputRow: { flexDirection: 'row', gap: 16 },
    saveBtn: { height: 64, borderRadius: 24, marginTop: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
    saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
});

export default AddProductScreen;
