import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
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
    View,
    useWindowDimensions
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Move Input Components Outside to avoid focus loss on re-render
const InputField = ({ label, icon, prefixText, placeholder, value, onChangeText, multiline, keyboardType, style, theme }: any) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <View style={[styles.inputContainer, style]}>
            <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: theme.inputBg,
                        borderColor: isFocused ? theme.primary : theme.border,
                        borderWidth: isFocused ? 2 : 1,
                        // Add subtle shadow on focus for premium feel
                        ...(isFocused && {
                            ...Platform.select({
                                web: {
                                    boxShadow: `0px 2px 4px ${theme.primary}1A`
                                },
                                default: {
                                    shadowColor: theme.primary,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }
                            })
                        })
                    }
                ]}
            >
                {icon && <Feather name={icon} size={20} color={isFocused ? theme.primary : theme.subtext} style={{ marginRight: 10 }} />}
                {prefixText && <Text style={{ color: theme.text, fontSize: 16, marginRight: 4, fontWeight: '600' }}>{prefixText}</Text>}
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: theme.text,
                            height: multiline ? 100 : 50,
                            // Suppress browser outline on web
                            ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any)
                        }
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.subtext}
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                    keyboardType={keyboardType}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </View>
        </View>
    );
};

const PickerTrigger = ({ label, icon, placeholder, value, onPress, style, theme }: any) => (
    <View style={[styles.inputContainer, style]}>
        <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
        <TouchableOpacity
            onPress={onPress}
            style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border, height: 50 }]}
        >
            {icon && <Feather name={icon} size={20} color={theme.subtext} style={{ marginRight: 10 }} />}
            <Text style={[styles.input, { color: value ? theme.text : theme.subtext, lineHeight: 50 }]}>
                {value || placeholder}
            </Text>
            <Feather name="chevron-down" size={20} color={theme.subtext} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
    </View>
);

const AddProductScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isDesktop = width > 1024;

    const { user, partnerId } = useAuth();

    // --- States ---
    const [images, setImages] = useState<string[]>([]);
    const [imagesBase64, setImagesBase64] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [mrp, setMrp] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [warranty, setWarranty] = useState('');
    const [care, setCare] = useState('');
    const [brand, setBrand] = useState('');
    const [specs, setSpecs] = useState([{ label: '', value: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [partnerData, setPartnerData] = useState<any>(null);

    const theme = {
        background: isDarkMode ? '#121212' : '#F9FAFB',
        card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#111827',
        subtext: isDarkMode ? '#9CA3AF' : '#6B7280',
        primary: '#6366F1',
        border: isDarkMode ? '#374151' : '#E5E7EB',
        inputBg: isDarkMode ? '#2D2D2D' : '#F3F4F6',
    };

    useEffect(() => {
        const fetchPartnerData = async () => {
            const targetId = partnerId || user?.id;
            if (!targetId) return;
            try {
                const { data: pData } = await supabase.from('partners').select('*').eq('id', targetId).single();
                if (pData) {
                    setPartnerData(pData);
                } else {
                    const { data: preData } = await supabase.from('pre_approved_partners').select('*').eq('id', targetId).single();
                    if (preData) setPartnerData(preData);
                }
            } catch (error) {
                console.error("Error fetching partner data:", error);
            }
        };
        fetchPartnerData();

        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
                if (data) setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();

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
                    Alert.alert("Error", "Could not load product details.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProductData();
        }
    }, [user, id]);

    const scanLineY = useSharedValue(0);
    const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scanLineY.value }], opacity: isScanning ? 1 : 0 }));

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: 4,
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled) {
                const uris = result.assets.map(a => a.uri);
                const base64s = result.assets.map(a => a.base64 || '');
                setImages(uris.slice(0, 4));
                setImagesBase64(base64s.slice(0, 4));
            }
        } catch (error) {
            console.error("Pick image error:", error);
        }
    };

    const handleAIScan = () => {
        if (images.length === 0) return Alert.alert("Upload photo first");
        setIsScanning(true);
        scanLineY.value = withRepeat(withTiming(200, { duration: 1000 }), 3, true);

        setTimeout(() => {
            setIsScanning(false);
            setName('Ergonomic Office Chair');
            setPrice('8999');
            setMrp('15000');
            if (categories.length > 0) setCategory(categories[0].name);
            else setCategory('Furniture');
            setDescription('Premium high-back chair with adjustable lumbar support.');
            setWarranty('1 Year Warranty');
            setCare('Wipe with dry cloth');
            setBrand('ComfortSeats');
            setSpecs([
                { label: 'Material', value: 'Mesh & Fabric' },
                { label: 'Weight Limit', value: '120 kg' }
            ]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 2000);
    };

    const addSpecRow = () => setSpecs([...specs, { label: '', value: '' }]);

    const updateSpec = (index: number, field: 'label' | 'value', text: string) => {
        setSpecs(prev => prev.map((item, i) => i === index ? { ...item, [field]: text } : item));
    };

    const handleSave = async () => {
        if (!user) return Alert.alert("Error", "You must be logged in to add products.");
        if (!name || !price || images.length === 0) return Alert.alert("Missing Info", "Name, Price and images are required.");

        setIsLoading(true);
        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < images.length; i++) {
                const imageUri = images[i];

                if (imageUri.startsWith('http')) {
                    uploadedUrls.push(imageUri);
                    continue;
                }

                const filename = `product_${user.id}_${Date.now()}_${i}.jpg`;
                const filePath = `${user.id}/${filename}`;
                const base64Data = imagesBase64[i];
                if (!base64Data) throw new Error("Image data missing");

                const fileData = decode(base64Data);
                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, fileData, { contentType: 'image/jpeg', upsert: false });

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
                showroom_name: partnerData?.store_name || partnerData?.storeName || 'Store Showroom',
                showroom_address: partnerData?.shop_address || partnerData?.shopAddress || 'Address',
                showroom_phone: partnerData?.mobile_number || partnerData?.mobileNumber || 'Phone',
                updated_at: new Date().toISOString(),
            };

            if (id) {
                const { error } = await supabase.from('products').update(productData).eq('id', id);
                if (error) throw error;
                Alert.alert("Success", "Product updated!");
            } else {
                const { error } = await supabase.from('products').insert({ ...productData, created_at: new Date().toISOString() });
                if (error) throw error;
                Alert.alert("Success", "Product added!");
            }
            router.back();
        } catch (e: any) {
            console.error("Save Error:", e);
            Alert.alert("Error", e.message || "Save failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Fixed Header */}
            <View style={[styles.header, {
                paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 10),
                backgroundColor: theme.card,
                borderBottomColor: theme.border,
                zIndex: 100
            }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>{id ? 'Edit Product' : 'Add New Product'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingHorizontal: isDesktop ? 0 : 20,
                            maxWidth: isDesktop ? 800 : '100%',
                            alignSelf: 'center',
                            width: '100%'
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View entering={FadeInDown.springify()} style={{ gap: 24 }}>
                        {/* 1. Images */}
                        <View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Product Images</Text>
                            <TouchableOpacity
                                onPress={handlePickImage}
                                style={[styles.imageUploadArea, { backgroundColor: theme.card, borderColor: theme.border, height: images.length > 0 ? 'auto' : 200 }]}
                            >
                                {images.length > 0 ? (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 12 }}>
                                        {images.map((img, idx) => (
                                            <View key={idx} style={styles.imagePreview}>
                                                <Image source={{ uri: img }} style={styles.image} />
                                                <TouchableOpacity
                                                    style={styles.removeBtn}
                                                    onPress={() => {
                                                        setImages(prev => prev.filter((_, i) => i !== idx));
                                                        setImagesBase64(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                >
                                                    <Ionicons name="close" size={16} color="#FFF" />
                                                </TouchableOpacity>
                                                {idx === 0 && <View style={styles.coverBadge}><Text style={styles.coverText}>Cover</Text></View>}
                                                {isScanning && idx === 0 && <Animated.View style={[styles.scanLine, scanStyle]} />}
                                            </View>
                                        ))}
                                        {images.length < 4 && (
                                            <View style={[styles.addMoreBtn, { borderColor: theme.border }]}><Feather name="plus" size={24} color={theme.subtext} /></View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={styles.emptyState}>
                                        <View style={[styles.iconCircle, { backgroundColor: theme.inputBg }]}><Feather name="image" size={32} color={theme.primary} /></View>
                                        <Text style={[styles.uploadText, { color: theme.text }]}>Tap to upload images</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {images.length > 0 && !isScanning && (
                                <TouchableOpacity style={[styles.aiButton, { backgroundColor: theme.primary + '15' }]} onPress={handleAIScan}>
                                    <Ionicons name="sparkles" size={18} color={theme.primary} />
                                    <Text style={[styles.aiText, { color: theme.primary }]}>Auto-fill details with AI</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 2. Basic Details */}
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <InputField label="Product Name" placeholder="e.g. Headphones" value={name} onChangeText={setName} icon="tag" theme={theme} />
                            <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                                <InputField label="Price" placeholder="0" value={price} onChangeText={setPrice} keyboardType="numeric" prefixText="₹" style={{ flex: 1 }} theme={theme} />
                                <InputField label="MRP" placeholder="0" value={mrp} onChangeText={setMrp} keyboardType="numeric" prefixText="₹" style={{ flex: 1 }} theme={theme} />
                            </View>
                            <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                                <PickerTrigger label="Category" placeholder="Select" value={category} onPress={() => setModalVisible(true)} icon="grid" style={{ flex: 1 }} theme={theme} />
                                <InputField label="Stock" placeholder="0" value={stock} onChangeText={setStock} keyboardType="numeric" style={{ flex: 1 }} theme={theme} />
                            </View>
                            <InputField label="Description" placeholder="Description..." value={description} onChangeText={setDescription} multiline icon="align-left" theme={theme} />
                        </View>

                        {/* 3. Additional */}
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <InputField label="Brand" placeholder="e.g. Sony" value={brand} onChangeText={setBrand} icon="award" theme={theme} />
                            <View style={[styles.row, isMobile && { flexDirection: 'column' }]}>
                                <InputField label="Warranty" placeholder="e.g. 1 Year" value={warranty} onChangeText={setWarranty} style={{ flex: 1 }} theme={theme} />
                                <InputField label="Care" placeholder="Keep dry" value={care} onChangeText={setCare} style={{ flex: 1 }} theme={theme} />
                            </View>
                        </View>

                        {/* 4. Specs */}
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                <Text style={[styles.cardTitle, { color: theme.text }]}>Specifications</Text>
                                <TouchableOpacity onPress={addSpecRow} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Feather name="plus-circle" size={16} color={theme.primary} />
                                    <Text style={{ color: theme.primary, fontWeight: '600' }}>Add Row</Text>
                                </TouchableOpacity>
                            </View>
                            {specs.map((spec, idx) => (
                                <View key={idx} style={styles.specRow}>
                                    <View style={[styles.specInput, { backgroundColor: theme.inputBg, borderColor: theme.border, flex: 1 }]}><TextInput style={{ color: theme.text, padding: 12 }} placeholder="Label" value={spec.label} onChangeText={t => updateSpec(idx, 'label', t)} /></View>
                                    <View style={[styles.specInput, { backgroundColor: theme.inputBg, borderColor: theme.border, flex: 1 }]}><TextInput style={{ color: theme.text, padding: 12 }} placeholder="Value" value={spec.value} onChangeText={t => updateSpec(idx, 'value', t)} /></View>
                                </View>
                            ))}
                        </View>

                        <View style={{ height: 120 }} />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fixed Footer */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: insets.bottom + 10, zIndex: 100 }]}>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 }]} onPress={handleSave} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{id ? 'Update Product' : 'Publish Product'}</Text>}
                </TouchableOpacity>
            </View>

            {/* Category Modal */}
            {modalVisible && (
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, width: isDesktop ? 500 : '90%' }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Category</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {categories.map((cat: any) => (
                                <TouchableOpacity key={cat.id} style={[styles.catItem, { borderBottomColor: theme.border }]} onPress={() => { setCategory(cat.name); setModalVisible(false); }}>
                                    <Image source={{ uri: cat.image || 'https://via.placeholder.com/40' }} style={styles.catImage} />
                                    <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                                    {category === cat.name && <Feather name="check" size={20} color={theme.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.inputBg }]} onPress={() => setModalVisible(false)}><Text style={{ color: theme.text }}>Close</Text></TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
    title: { fontSize: 18, fontWeight: '700' },
    iconBtn: { padding: 4 },
    scrollContent: { paddingTop: 24, paddingBottom: 100 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    imageUploadArea: { width: '100%', borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    uploadText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    imagePreview: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    image: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 4 },
    coverBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 2, alignItems: 'center' },
    coverText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
    addMoreBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#6366F1' },
    aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, marginTop: 12, gap: 8 },
    aiText: { fontSize: 14, fontWeight: '600' },
    card: { borderRadius: 16, padding: 20, borderWidth: 1, gap: 16, marginBottom: 20 },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    row: { flexDirection: 'row', gap: 12 },
    inputContainer: { gap: 6 },
    label: { fontSize: 13, fontWeight: '500' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
    input: { flex: 1, fontSize: 15 },
    specRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    specInput: { borderWidth: 1, borderRadius: 10 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
    saveBtn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    modalOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { borderRadius: 16, padding: 20, borderWidth: 1, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    catItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
    catImage: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee' },
    catName: { fontSize: 16, flex: 1 },
    closeBtn: { marginTop: 16, padding: 12, borderRadius: 12, alignItems: 'center' },
});

export default AddProductScreen;
