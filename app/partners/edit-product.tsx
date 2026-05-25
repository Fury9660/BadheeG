import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Moved Input component outside to prevent re-renders losing focus
const Input = ({ placeholder, value, onChangeText, multiline, keyboardType, style, theme }: any) => (
    <View style={{ marginBottom: 16, width: '100%' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 8, opacity: 0.8, marginLeft: 4 }}>{placeholder}</Text>
        <TextInput
            style={[
                styles.input,
                style,
                {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    height: multiline ? 100 : 50,
                    paddingTop: multiline ? 16 : 0
                }
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.subtext}
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            keyboardType={keyboardType}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

const EditProductScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 375;
    const isDesktop = width > 768;

    const { user } = useAuth();

    // --- States for A-Z Product Details ---
    const [images, setImages] = useState<string[]>([]);
    const [imagesBase64, setImagesBase64] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [mrp, setMrp] = useState(''); // Cross price
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    // Detailed Specs
    const [warranty, setWarranty] = useState('');
    const [care, setCare] = useState('');
    const [brand, setBrand] = useState('');

    // Specifications List (Key-Value)
    const [specs, setSpecs] = useState([{ label: '', value: '' }]);

    const [isLoading, setIsLoading] = useState(false);
    const [partnerData, setPartnerData] = useState<any>(null);

    const DRAFT_KEY = `edit_product_draft_${id}`;

    useEffect(() => {
        if (user) {
            const fetchPartnerData = async () => {
                try {
                    const { data, error } = await supabase
                        .from('pre_approved_partners')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    if (data) setPartnerData(data);
                    if (error) console.error("Error fetching partner data:", error);
                } catch (error) {
                    console.error("Error fetching partner data:", error);
                }
            };
            fetchPartnerData();
        }

        // Fetch Product Data for Editing
        if (id) {
            const fetchProductData = async () => {
                setIsLoading(true);
                try {
                    // Check for draft first
                    const draft = await AsyncStorage.getItem(DRAFT_KEY);

                    const { data, error } = await supabase
                        .from('products')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (data) {
                        const dr = draft ? JSON.parse(draft) : null;

                        setName(dr?.name ?? (data.name || ''));
                        setPrice(dr?.price ?? (data.price ? String(data.price) : ''));
                        setMrp(dr?.mrp ?? (data.mrp ? String(data.mrp) : ''));
                        setStock(dr?.stock ?? (data.stock ? String(data.stock) : ''));
                        setCategory(dr?.category ?? (data.category || ''));
                        setDescription(dr?.description ?? (data.description || ''));
                        setWarranty(dr?.warranty ?? (data.warranty || ''));
                        setCare(dr?.care ?? (data.care || ''));
                        setBrand(dr?.brand ?? (data.brand || ''));
                        setSpecs(dr?.specs ?? (data.specifications || [{ label: '', value: '' }]));
                        setImages(dr?.images ?? (data.images || [data.image].filter(Boolean) || []));
                    }
                    if (error) throw error;
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

    // Save draft on change
    useEffect(() => {
        if (id && !isLoading && (name || price || description || images.length > 0)) {
            const saveDraft = async () => {
                const draftData = {
                    name, price, mrp, stock, category, description,
                    warranty, care, brand, specs, images
                };
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
            };
            saveDraft();
        }
    }, [name, price, mrp, stock, category, description, warranty, care, brand, specs, images]);

    // --- Modern Theme ---
    const theme = {
        background: isDarkMode ? '#000000' : '#FFFFFF',
        card: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        subtext: isDarkMode ? '#8E8E93' : '#8E8E93',
        inputBg: isDarkMode ? '#2C2C2E' : '#F2F2F7',
        primary: isDarkMode ? '#FFFFFF' : '#000000',
        border: 'transparent',
        danger: '#FF453A',
        success: '#32D74B',
    };



    const scanLineY = useSharedValue(0);
    const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scanLineY.value }], opacity: isScanning ? 1 : 0 }));

    const handlePickImage = async () => {
        const remaining = 4 - images.length;
        if (remaining <= 0) {
            Alert.alert("Limit Reached", "You can only add up to 4 images.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: remaining,
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

        // Simulate AI filling data
        setTimeout(() => {
            setIsScanning(false);
            setName('Ergonomic Office Chair');
            setPrice('8999');
            setMrp('15000');
            setCategory('Furniture');
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
        setSpecs(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: text } : item
        ));
    };

    const handleSave = async () => {
        if (!user) return Alert.alert("Error", "You must be logged in to edit products.");
        if (!name || !price || images.length === 0) return Alert.alert("Missing Info", "Name, Price and at least 1 image are required.");

        setIsLoading(true);
        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < images.length; i++) {
                const imageUri = images[i];

                // If it's already a URL, don't re-upload
                if (imageUri.startsWith('http')) {
                    uploadedUrls.push(imageUri);
                    continue;
                }

                console.log(`Uploading image ${i + 1}/${images.length}...`);
                const filename = `product_images/${user.id}_${Date.now()}_${i}.jpg`;

                // Fetch blob using fetch() API
                const response = await fetch(imageUri);
                const blob = await response.blob();

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filename, blob, { contentType: 'image/jpeg' });

                if (uploadError) {
                    console.error(`Upload error for image ${i + 1}:`, uploadError);
                    throw new Error(`Image upload failed: ${uploadError.message}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filename);

                uploadedUrls.push(publicUrl);
            }

            // Robust number parsing
            const parsedPrice = parseInt(price.replace(/[^0-9]/g, '')) || 0;
            const parsedMrp = parseInt(mrp.replace(/[^0-9]/g, '')) || 0;
            const parsedStock = parseInt(stock.replace(/[^0-9]/g, '')) || 0;

            if (parsedPrice <= 0) throw new Error("Price must be greater than 0");

            // 2. Save/Update Product Data
            const productData: any = {
                partner_id: user.id,
                name,
                price: parsedPrice,
                mrp: parsedMrp,
                stock: parsedStock,
                category,
                description,
                warranty,
                care,
                brand,
                specifications: specs.filter(s => s.label && s.value),
                image: uploadedUrls[0], // Primary thumbnail
                images: uploadedUrls,   // All images
                in_stock: parsedStock > 0,
                showroom_name: partnerData?.store_name || partnerData?.showroom_name || 'Showroom',
                showroom_address: partnerData?.shop_address || partnerData?.address || 'Address',
                showroom_phone: partnerData?.mobile_number || partnerData?.phone || 'Contact',
                updated_at: new Date().toISOString(),
            };

            console.log("Saving product data:", JSON.stringify(productData, null, 2));

            if (id) {
                // UPDATE EXISTING
                const { error: updateError } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', id);
                if (updateError) throw updateError;
                Alert.alert("Success", "Product updated successfully!");
            } else {
                // CREATE NEW
                const { error: insertError } = await supabase
                    .from('products')
                    .insert({
                        ...productData,
                        created_at: new Date().toISOString(),
                    });
                if (insertError) throw insertError;
                Alert.alert("Success", "Product added successfully!");
            }
            await AsyncStorage.removeItem(DRAFT_KEY);
            router.back();
        } catch (e: any) {
            console.error("Product Save Error:", e);
            Alert.alert("Error", e.message || "Could not save product.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={{ maxWidth: 1000, width: '100%', alignSelf: 'center' }}>
                <View style={[styles.header, { paddingTop: isDesktop ? 20 : insets.top + 10, backgroundColor: theme.background }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Product</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                    <View style={{ maxWidth: 1000, width: '100%', alignSelf: 'center' }}>

                        {/* Image Section - Desktop Optimized */}
                        <View style={{ marginBottom: 24 }}>
                            {images.length > 0 ? (
                                isDesktop ? (
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                        {images.map((item, index) => {
                                            const handlePositionChange = (text: string) => {
                                                const newPos = parseInt(text);
                                                if (isNaN(newPos) || newPos < 1 || newPos > images.length || newPos === index + 1) return;
                                                const newImages = [...images];
                                                const [movedItem] = newImages.splice(index, 1);
                                                newImages.splice(newPos - 1, 0, movedItem);
                                                setImages(newImages);
                                                if (imagesBase64.length === images.length) {
                                                    const newBase64s = [...imagesBase64];
                                                    const [movedB64] = newBase64s.splice(index, 1);
                                                    newBase64s.splice(newPos - 1, 0, movedB64);
                                                    setImagesBase64(newBase64s);
                                                }
                                            };
                                            return (
                                                <View key={`desktop-img-${index}`} style={[styles.imageWrapper, { width: 220, height: 220, borderRadius: 16 }]}>
                                                    <Image source={{ uri: item }} style={styles.productImage} />
                                                    <TouchableOpacity style={styles.removeBtn} onPress={() => { setImages(prev => prev.filter((_, i) => i !== index)); setImagesBase64(prev => prev.filter((_, i) => i !== index)); }}>
                                                        <Ionicons name="close-circle" size={24} color="#FF3B30" />
                                                    </TouchableOpacity>
                                                    <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: theme.text, borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 20, borderWidth: 2, borderColor: theme.background }}>
                                                        <TextInput key={`input-${index}`} style={{ color: theme.background, fontSize: 18, fontWeight: 'bold', textAlign: 'center', width: '100%', height: '100%', padding: 0 }} keyboardType="numeric" defaultValue={(index + 1).toString()} onEndEditing={(e) => handlePositionChange(e.nativeEvent.text)} onSubmitEditing={(e) => handlePositionChange(e.nativeEvent.text)} maxLength={1} />
                                                    </View>
                                                </View>
                                            );
                                        })}
                                        {images.length < 4 && (
                                            <TouchableOpacity onPress={handlePickImage} style={[styles.imageWrapper, { width: 220, height: 220, borderRadius: 16, borderWidth: 2, borderColor: theme.subtext, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.inputBg }]}>
                                                <Feather name="plus" size={40} color={theme.subtext} />
                                                <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 8 }}>Add More</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <DraggableFlatList
                                        data={images}
                                        onDragEnd={({ data }) => setImages(data)}
                                        keyExtractor={(item, index) => `image-${item}-${index}`}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        containerStyle={{ minHeight: isDesktop ? 220 : 180 }}
                                        ListFooterComponent={
                                            images.length < 4 ? (
                                                <TouchableOpacity
                                                    onPress={handlePickImage}
                                                    style={[
                                                        styles.imageWrapper,
                                                        isDesktop && { width: 200, height: 200 },
                                                        {
                                                            marginRight: 10,
                                                            borderWidth: 2,
                                                            borderColor: '#8E8E93',
                                                            borderStyle: 'dashed',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            backgroundColor: theme.inputBg,
                                                            borderRadius: 16
                                                        }
                                                    ]}
                                                >
                                                    <Feather name="plus" size={32} color={theme.subtext} />
                                                    <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 4 }}>Add More</Text>
                                                </TouchableOpacity>
                                            ) : null
                                        }
                                        renderItem={({ item, drag, isActive, getIndex }) => {
                                            const index = getIndex() ?? -1;
                                            if (index === -1) return null;

                                            const handlePositionChange = (text: string) => {
                                                const newPos = parseInt(text);
                                                if (isNaN(newPos) || newPos < 1 || newPos > images.length || newPos === index + 1) return;

                                                const newImages = [...images];
                                                const [movedItem] = newImages.splice(index, 1);
                                                newImages.splice(newPos - 1, 0, movedItem);
                                                setImages(newImages);

                                                if (imagesBase64.length === images.length) {
                                                    const newBase64s = [...imagesBase64];
                                                    const [movedB64] = newBase64s.splice(index, 1);
                                                    newBase64s.splice(newPos - 1, 0, movedB64);
                                                    setImagesBase64(newBase64s);
                                                }
                                            };

                                            return (
                                                <ScaleDecorator>
                                                    <TouchableOpacity
                                                        onLongPress={drag}
                                                        disabled={isActive}
                                                        activeOpacity={1}
                                                        style={[
                                                            styles.imageWrapper,
                                                            isDesktop && { width: 200, height: 200 },
                                                            { marginRight: 10, opacity: isActive ? 0.5 : 1 }
                                                        ]}
                                                    >
                                                        <Image source={{ uri: item }} style={styles.productImage} />

                                                        {isScanning && index === 0 && <Animated.View style={[styles.scanLine, scanStyle]} />}

                                                        <TouchableOpacity
                                                            style={styles.removeBtn}
                                                            onPress={() => {
                                                                setImages(prev => prev.filter((_, i) => i !== index));
                                                                setImagesBase64(prev => prev.filter((_, i) => i !== index));
                                                            }}
                                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                        >
                                                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                                                        </TouchableOpacity>

                                                        {/* Manual Position Input */}
                                                        <View style={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            left: 8,
                                                            backgroundColor: theme.text,
                                                            borderRadius: 14,
                                                            width: 36,
                                                            height: 36,
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            zIndex: 20,
                                                            borderWidth: 2,
                                                            borderColor: theme.background
                                                        }}>
                                                            <TextInput
                                                                style={{
                                                                    color: theme.background,
                                                                    fontSize: 16,
                                                                    fontWeight: 'bold',
                                                                    textAlign: 'center',
                                                                    width: '100%',
                                                                    padding: 0
                                                                }}
                                                                keyboardType="numeric"
                                                                defaultValue={(index + 1).toString()}
                                                                onEndEditing={(e) => handlePositionChange(e.nativeEvent.text)}
                                                                onSubmitEditing={(e) => handlePositionChange(e.nativeEvent.text)}
                                                                maxLength={1}
                                                            />
                                                        </View>

                                                        {/* Drag Handle Indicator */}
                                                        <TouchableOpacity
                                                            onPressIn={drag}
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: 0,
                                                                left: 0,
                                                                right: 0,
                                                                height: 30,
                                                                backgroundColor: 'rgba(0,0,0,0.6)',
                                                                justifyContent: 'center',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <Feather name="menu" size={16} color="#fff" />
                                                        </TouchableOpacity>
                                                    </TouchableOpacity>
                                                </ScaleDecorator>
                                            );
                                        }}
                                    />
                                )
                            ) : (
                                <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
                                    <View style={[styles.placeholder, { backgroundColor: theme.inputBg, height: isDesktop ? 300 : 200 }]}>
                                        <Feather name="camera" size={isDesktop ? 48 : 32} color={theme.subtext} />
                                        <Text style={{ color: theme.subtext, marginTop: 10, fontWeight: '500', fontSize: isDesktop ? 16 : 14 }}>
                                            {isDesktop ? 'Click to Upload Photos (Max 4)' : 'Add Photos'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                        {images.length > 0 && !isScanning && (
                            <TouchableOpacity style={[styles.aiBtn, { backgroundColor: theme.text }]} onPress={handleAIScan}>
                                <Feather name="zap" size={16} color={theme.background} style={{ marginRight: 6 }} />
                                <Text style={{ color: theme.background, fontWeight: '700', fontSize: 13 }}>Auto-Fill Details</Text>
                            </TouchableOpacity>
                        )}

                        {/* Form Fields - Responsive Grid */}
                        <Input placeholder="Product Name" value={name} onChangeText={setName} theme={theme} />

                        {/* Row 1: Price & MRP */}
                        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 20 : 0 }}>
                            <View style={{ flex: 1 }}>
                                <Input placeholder="Price (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" theme={theme} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input placeholder="MRP (₹)" value={mrp} onChangeText={setMrp} keyboardType="numeric" theme={theme} />
                            </View>
                        </View>

                        {/* Row 2: Stock & Category */}
                        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 20 : 0 }}>
                            <View style={{ flex: 1 }}>
                                <Input placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" theme={theme} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input placeholder="Category" value={category} onChangeText={setCategory} theme={theme} />
                            </View>
                        </View>

                        <Input placeholder="Description" value={description} onChangeText={setDescription} multiline theme={theme} />

                        <View style={styles.divider} />

                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Additional Details</Text>

                        {/* Row 3: Brand & Warranty */}
                        <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 20 : 0 }}>
                            <View style={{ flex: 1 }}>
                                <Input placeholder="Brand" value={brand} onChangeText={setBrand} theme={theme} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input placeholder="Warranty" value={warranty} onChangeText={setWarranty} theme={theme} />
                            </View>
                        </View>
                        <Input placeholder="Care Instructions" value={care} onChangeText={setCare} theme={theme} />

                        <View style={styles.divider} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Specifications</Text>
                            <TouchableOpacity onPress={addSpecRow}>
                                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>+ Add Row</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Specifications Grid */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: isDesktop ? 20 : 0 }}>
                            {specs.map((spec, i) => (
                                <View key={i} style={{
                                    width: isDesktop ? '48%' : '100%',
                                    flexDirection: 'row',
                                    gap: 10,
                                    marginBottom: 8
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <TextInput
                                            placeholder="Label"
                                            value={spec.label}
                                            onChangeText={(t) => updateSpec(i, 'label', t)}
                                            placeholderTextColor={theme.subtext}
                                            style={[styles.smallInput, { backgroundColor: theme.inputBg, color: theme.text }]}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <TextInput
                                            placeholder="Value"
                                            value={spec.value}
                                            onChangeText={(t) => updateSpec(i, 'value', t)}
                                            placeholderTextColor={theme.subtext}
                                            style={[styles.smallInput, { backgroundColor: theme.inputBg, color: theme.text }]}
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Floating Save Button */}
            <View style={[styles.footer, { backgroundColor: theme.background, borderColor: theme.inputBg }]}>
                <View style={{ maxWidth: 1000, width: '100%', alignSelf: 'center' }}>
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: theme.text, opacity: isLoading ? 0.7 : 1, width: isDesktop ? 300 : '100%', alignSelf: isDesktop ? 'flex-end' : 'stretch' }]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color={theme.background} /> : (
                            <Text style={{ color: theme.background, fontWeight: '700', fontSize: 16 }}>Save Product</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    placeholder: {
        height: 200,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        borderStyle: 'dashed',
    },
    imageWrapper: {
        width: 160,
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 2,
        backgroundColor: '#32D74B',
        shadowColor: '#32D74B',
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    aiBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 24,
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    smallInput: {
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(150,150,150,0.1)',
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        marginTop: 8,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    saveBtn: {
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default EditProductScreen;
