import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// Firebase imports removed
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* 
  Data Model (Supabase 'categories' table):
  id: uuid
  name: text
  image: text
  subcategories: jsonb (array of {name, image})
*/

const defaultCategories = {
    Furniture: [
        { name: 'Bar Furniture', image: 'https://via.placeholder.com/150' },
        { name: 'Beside Tables', image: 'https://via.placeholder.com/150' },
        // ... (truncated for brevity, user can add real images)
    ],
    Luxury: [],
    'Sofa & Seating': [],
    'Home Decor': [],
    Furnishings: [],
    'Lamps & Lighting': [],
};

const CategoriesScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const isDesktop = width > 1024;
    const isTablet = width > 768;

    // State
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [isAddingSub, setIsAddingSub] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [newItemName, setNewItemName] = useState('');
    const [newItemImage, setNewItemImage] = useState('');

    const theme = {
        background: isDarkMode ? '#000' : '#f8f9fa',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        input: isDarkMode ? '#2C2C2C' : '#fff',
        border: isDarkMode ? '#333' : '#e1e4e8',
        primary: '#4A90E2',
        danger: '#FF3B30',
        subtext: isDarkMode ? '#888' : '#666',
    };

    // Fetch Categories
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            if (data) setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handlers
    const seedDefaultCategories = async () => {
        Alert.alert("Confirm Import", "This will add default categories to Supabase. Continue?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Import", onPress: async () => {
                    setLoading(true);
                    try {
                        for (const [catName, subCats] of Object.entries(defaultCategories)) {
                            // Check if exists
                            const { data } = await supabase.from('categories').select('id').eq('name', catName).single();

                            if (!data) {
                                await supabase.from('categories').insert({
                                    name: catName,
                                    image: 'https://via.placeholder.com/150',
                                    subcategories: subCats
                                });
                            }
                        }
                        Alert.alert("Success", "Categories imported successfully");
                        fetchCategories();
                    } catch (e) {
                        Alert.alert("Error", "Failed to import");
                        console.error(e);
                    }
                    setLoading(false);
                }
            }
        ]);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.5,
        });

        if (!result.canceled) {
            setNewItemImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string): Promise<string> => {
        if (!uri) return '';
        if (uri.startsWith('http')) return uri; // Already a URL

        try {
            const ext = uri.substring(uri.lastIndexOf('.') + 1);
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                name: fileName,
                type: `image/${ext}`
            } as any);

            const { error: uploadError } = await supabase.storage
                .from('categories') // Bucket 'categories' must exist
                .upload(fileName, formData);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('categories')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error("Upload failed", error);
            // Alert.alert("Upload Failed", "Could not upload image. Using placeholder.");
            return 'https://via.placeholder.com/150';
        }
    };

    const [editingItem, setEditingItem] = useState<any>(null);
    const [editingParent, setEditingParent] = useState<any>(null);

    const handleDeleteCategory = (catId: string, catName: string) => {
        const performDelete = async () => {
            console.log("Deleting Category:", catId);
            setLoading(true);
            try {
                const { error } = await supabase.from('categories').delete().eq('id', catId);
                if (error) throw error;
                fetchCategories();
                if (Platform.OS === 'web') alert("Category deleted");
            } catch (e) {
                console.error("Delete Category Error:", e);
                Alert.alert("Error", "Failed to delete");
            }
            setLoading(false);
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Delete "${catName}"?`)) {
                performDelete();
            }
        } else {
            Alert.alert("Delete Category", `Delete "${catName}"?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: performDelete }
            ]);
        }
    };

    const handleDeleteSubCategory = (parentCat: any, subCatName: string) => {
        const performDelete = async () => {
            console.log("Deleting Subcategory:", subCatName, "from", parentCat.name);
            setLoading(true);
            try {
                const updatedSubcategories = parentCat.subcategories.filter((s: any) => s.name !== subCatName);
                const { error } = await supabase
                    .from('categories')
                    .update({ subcategories: updatedSubcategories })
                    .eq('id', parentCat.id);

                if (error) throw error;
                fetchCategories();
                if (Platform.OS === 'web') alert("Subcategory deleted");
            } catch (e) {
                console.error("Delete Subcategory Error:", e);
                Alert.alert("Error", "Failed to delete");
            }
            setLoading(false);
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Delete "${subCatName}"?`)) {
                performDelete();
            }
        } else {
            Alert.alert("Delete Subcategory", `Delete "${subCatName}"?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: performDelete }
            ]);
        }
    };

    const handleEditCategory = async () => {
        if (!newItemName.trim()) return Alert.alert("Error", "Name is required");
        setLoading(true);
        try {
            let imageUrl = editingItem.image;
            if (newItemImage && newItemImage !== editingItem.image) {
                imageUrl = await uploadImage(newItemImage);
            }

            const { error } = await supabase
                .from('categories')
                .update({ name: newItemName, image: imageUrl })
                .eq('id', editingItem.id);

            if (error) throw error;

            setModalVisible(false);
            resetForm();
            fetchCategories();
        } catch (e) {
            Alert.alert("Error", "Failed to update category");
            console.error(e);
        }
        setLoading(false);
    };

    const handleEditSubCategory = async () => {
        if (!editingParent || !editingItem || !newItemName.trim()) return;
        setLoading(true);
        try {
            let imageUrl = editingItem.image;
            if (newItemImage && newItemImage !== editingItem.image) {
                imageUrl = await uploadImage(newItemImage);
            }

            // Replace in array
            const updatedSubcategories = editingParent.subcategories.map((sub: any) =>
                sub.name === editingItem.name ? { ...sub, name: newItemName, image: imageUrl } : sub
            );

            const { error } = await supabase
                .from('categories')
                .update({ subcategories: updatedSubcategories })
                .eq('id', editingParent.id);

            if (error) throw error;

            setModalVisible(false);
            resetForm();
            fetchCategories();
        } catch (e) {
            Alert.alert("Error", "Failed to update subcategory");
            console.error(e);
        }
        setLoading(false);
    };

    const handleSave = () => {
        if (isAddingSub) {
            if (editingItem) return handleEditSubCategory();
            return handleAddSubCategory();
        } else {
            if (editingItem) return handleEditCategory();
            return handleAddCategory();
        }
    };

    const handleAddCategory = async () => {
        if (!newItemName.trim()) return Alert.alert("Error", "Name is required");
        setLoading(true);
        try {
            let imageUrl = 'https://via.placeholder.com/150';
            if (newItemImage) {
                imageUrl = await uploadImage(newItemImage);
            }

            const { error } = await supabase.from('categories').insert({
                name: newItemName,
                image: imageUrl,
                subcategories: []
            });

            if (error) throw error;

            setModalVisible(false);
            resetForm();
            fetchCategories();
        } catch (e) {
            Alert.alert("Error", "Failed to add category");
            console.error(e);
        }
        setLoading(false);
    };

    const handleAddSubCategory = async () => {
        if (!selectedCategory || !newItemName.trim()) return;
        setLoading(true);
        try {
            let imageUrl = 'https://via.placeholder.com/150';
            if (newItemImage) {
                imageUrl = await uploadImage(newItemImage);
            }

            const newSub = { name: newItemName, image: imageUrl };
            const updatedSubcategories = [...(selectedCategory.subcategories || []), newSub];

            const { error } = await supabase
                .from('categories')
                .update({ subcategories: updatedSubcategories })
                .eq('id', selectedCategory.id);

            if (error) throw error;

            setModalVisible(false);
            resetForm();
            fetchCategories();
        } catch (e) {
            Alert.alert("Error", "Failed to add subcategory");
            console.error(e);
        }
        setLoading(false);
    };

    const resetForm = () => {
        setNewItemName('');
        setNewItemImage('');
        setIsAddingSub(false);
        setSelectedCategory(null);
        setEditingItem(null);
        setEditingParent(null);
    };

    const openAddCategoryModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openAddSubModal = (category: any) => {
        resetForm();
        setSelectedCategory(category);
        setIsAddingSub(true);
        setModalVisible(true);
    };

    const openEditCategoryModal = (category: any) => {
        resetForm();
        setEditingItem(category);
        setNewItemName(category.name);
        setNewItemImage(category.image);
        setIsAddingSub(false);
        setModalVisible(true);
    };

    const openEditSubCategoryModal = (parent: any, sub: any) => {
        resetForm();
        setEditingParent(parent);
        setEditingItem(sub); // sub is {name, image}
        setNewItemName(sub.name);
        setNewItemImage(sub.image);
        setIsAddingSub(true); // Reusing sub modal logic but we will route via editingItem check
        setModalVisible(true);
    };

    const handleSubPress = (parent: any, sub: any) => {
        Alert.alert(sub.name, "Choose an action", [
            { text: "Cancel", style: "cancel" },
            { text: "Edit", onPress: () => openEditSubCategoryModal(parent, sub) },
            { text: "Delete", style: "destructive", onPress: () => handleDeleteSubCategory(parent, sub.name) }
        ]);
    };

    const renderCategory = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={[styles.catName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={{ color: theme.subtext, fontSize: 12 }}>
                        {item.subcategories?.length || 0} Subcategories
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.input }]}
                        onPress={() => openEditCategoryModal(item)}
                    >
                        <Feather name="edit-2" size={16} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
                        onPress={() => handleDeleteCategory(item.id, item.name)}
                    >
                        <Feather name="trash-2" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                        onPress={() => openAddSubModal(item)}
                    >
                        <Feather name="plus" size={18} color="#fff" />
                        <Text style={styles.btnText}>Sub</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Subcategories List (Horizontal) */}
            {item.subcategories && item.subcategories.length > 0 && (
                <View style={[styles.subListContainer, { borderTopColor: theme.border }]}>
                    <FlatList
                        data={item.subcategories}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(sub, idx) => idx.toString()}
                        renderItem={({ item: sub }) => (
                            <View style={[styles.subChip, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0', flexDirection: 'row', alignItems: 'center', paddingRight: 4 }]}>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}
                                    onPress={() => openEditSubCategoryModal(item, sub)}
                                >
                                    <Image source={{ uri: sub.image }} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#ddd' }} />
                                    <Text style={[styles.subName, { color: theme.text }]} numberOfLines={1}>{sub.name}</Text>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', marginLeft: 8, gap: 4 }}>
                                    <TouchableOpacity
                                        style={{ padding: 4 }}
                                        onPress={() => openEditSubCategoryModal(item, sub)}
                                    >
                                        <Feather name="edit-2" size={12} color={theme.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ padding: 4 }}
                                        onPress={() => handleDeleteSubCategory(item, sub.name)}
                                    >
                                        <Feather name="trash-2" size={12} color={theme.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* ... (Header code remains) ... */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text }]}>Categories</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {categories.length === 0 && (
                        <TouchableOpacity style={[styles.mainAddBtn, { backgroundColor: '#34C759' }]} onPress={seedDefaultCategories}>
                            <Feather name="download-cloud" size={20} color="#fff" />
                            <Text style={[styles.btnText, { fontSize: 12, marginLeft: 4 }]}>Import Defaults</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.mainAddBtn, { backgroundColor: theme.primary }]} onPress={openAddCategoryModal}>
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={[styles.btnText, { fontSize: 12, marginLeft: 4 }]}>Add New</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator color={theme.primary} size="large" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={item => item.id}
                    renderItem={renderCategory}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                />
            )}

            {/* Add Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalContent,
                        { backgroundColor: theme.card },
                        (isDesktop || isTablet) && { maxWidth: 600, alignSelf: 'center', width: '100%' }
                    ]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {editingItem
                                ? (isAddingSub ? 'Edit Subcategory' : 'Edit Category')
                                : (isAddingSub ? `Add Subcategory to ${selectedCategory?.name}` : 'New Category')
                            }
                        </Text>

                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                            placeholder="Name"
                            placeholderTextColor={theme.subtext}
                            value={newItemName}
                            onChangeText={setNewItemName}
                        />

                        {/* Only show Image Picker for Subcategories */}
                        {isAddingSub && (
                            <TouchableOpacity
                                style={[styles.imagePickerBtn, { borderColor: theme.border, backgroundColor: theme.input }]}
                                onPress={pickImage}
                            >
                                {newItemImage ? (
                                    <View style={styles.previewContainer}>
                                        <Image source={{ uri: newItemImage }} style={styles.previewImage} resizeMode="contain" />
                                    </View>
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Feather name="image" size={24} color={theme.subtext} />
                                        <Text style={{ color: theme.subtext, marginTop: 4 }}>Select Image</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: theme.subtext }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                                onPress={handleSave}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    title: { fontSize: 24, fontWeight: 'bold' },
    mainAddBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

    card: { borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1 },
    cardHeader: { flexDirection: 'row', padding: 12, alignItems: 'center' },
    catName: { fontSize: 18, fontWeight: 'bold' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },

    subListContainer: { padding: 12, borderTopWidth: 1 },
    subChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
    subName: { fontSize: 12, fontWeight: '500' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 16, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
    cancelBtn: { padding: 12 },
    saveBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    imagePickerBtn: { height: 200, borderWidth: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden', borderStyle: 'dashed' },
    previewContainer: { width: '100%', height: '100%', backgroundColor: '#000' },
    previewImage: { width: '100%', height: '100%' },
});

export default CategoriesScreen;
