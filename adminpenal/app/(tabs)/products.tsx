
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import Animated, { SlideInRight } from 'react-native-reanimated';

const dummyProducts = [
    { id: '1', name: 'Elegant Sofa Set', price: 49999, stock: 15, status: 'Live', image: 'https://via.placeholder.com/100' },
    { id: '2', name: 'King Size Bed', price: 35000, stock: 8, status: 'Pending', image: 'https://via.placeholder.com/100' },
    { id: '3', name: 'Wooden Wardrobe', price: 22500, stock: 0, status: 'OutOfStock', image: 'https://via.placeholder.com/100' },
    { id: '4', name: 'Dining Table', price: 18000, stock: 12, status: 'Live', image: 'https://via.placeholder.com/100' },
];

const statusColors = {
    Live: '#28a745',
    Pending: '#f39c12',
    OutOfStock: '#e74c3c',
};

const ProductsScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('All');
    const [products, setProducts] = useState(dummyProducts);

    const theme = {
        background: isDarkMode ? '#000' : '#f0f0f0',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        primary: '#4A90E2',
        border: isDarkMode ? '#2C2C2C' : '#E2E2E2',
    };

    const handleUpdate = (id, field, value) => {
        const updatedProducts = products.map(p => p.id === id ? { ...p, [field]: value } : p);
        setProducts(updatedProducts);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Product Management</Text>
                 <TouchableOpacity style={styles.addButton}>
                    <Feather name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={[styles.filterContainer, {borderColor: theme.border}]}>
                {['All', 'Live', 'Pending'].map(tab => (
                    <TouchableOpacity 
                        key={tab} 
                        style={[styles.filterButton, activeTab === tab && {backgroundColor: theme.primary}]} 
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.filterText, activeTab === tab && {color: '#fff'}]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.listContainer}>
                {products.filter(p => activeTab === 'All' || p.status === activeTab).map((product, index) => (
                    <Animated.View key={product.id} style={[styles.productCard, { backgroundColor: theme.card }]} entering={SlideInRight.duration(500).delay(index * 100)}>
                        <Image source={{ uri: product.image }} style={styles.productImage} />
                        <View style={styles.productDetails}>
                            <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                            <View style={styles.inlineEditRow}>
                                <Text style={{color: theme.subtext}}>Price: </Text>
                                <TextInput 
                                    style={[styles.inlineInput, {color: theme.text}]} 
                                    value={String(product.price)} 
                                    onChangeText={(text) => handleUpdate(product.id, 'price', text)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.inlineEditRow}>
                                <Text style={{color: theme.subtext}}>Stock: </Text>
                                <TextInput 
                                    style={[styles.inlineInput, {color: theme.text}]} 
                                    value={String(product.stock)} 
                                    onChangeText={(text) => handleUpdate(product.id, 'stock', text)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        <View style={styles.statusBadgeContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: statusColors[product.status] }]}>
                                <Text style={styles.statusText}>{product.status}</Text>
                            </View>
                        </View>
                    </Animated.View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    addButton: { backgroundColor: '#4A90E2', padding: 8, borderRadius: 20 },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 8, borderBottomWidth: 1 },
    filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    filterText: { color: '#888', fontWeight: '600' },
    listContainer: { padding: 16 },
    productCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 16, padding: 12 },
    productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
    productDetails: { flex: 1 },
    productName: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    inlineEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    inlineInput: { flex: 1, padding: 4, marginLeft: 4, fontWeight: 'bold' },
    statusBadgeContainer: { alignItems: 'center', marginLeft: 8 },
    statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});

export default ProductsScreen;
