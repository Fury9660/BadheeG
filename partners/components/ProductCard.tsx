import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProductCard = ({ product }: { product: any }) => {
  const { colors: theme, isDarkMode } = useTheme();
  const router = useRouter();
  const [isActive, setIsActive] = useState(product.isActive ?? true);
  const [isToggling, setIsToggling] = useState(false);

  const toggleStatus = async () => {
    if (isToggling) return;
    setIsToggling(true);
    const newStatus = !isActive;
    try {
      const { error } = await supabase.from('products').update({ in_stock: newStatus }).eq('id', product.id);
      if (error) throw error;
      setIsActive(newStatus);
    } catch (error) {
      console.error('Error toggling product status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  const imageSource = typeof product.image === 'string' && product.image.startsWith('http')
    ? { uri: product.image }
    : (require('../assets/images/hero_bg.png'));

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} />
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }]}>
            <View style={[styles.badgeDot, { backgroundColor: isActive ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: isActive ? '#10B981' : '#EF4444' }]}>{isActive ? 'ACTIVE' : 'OFF'}</Text>
        </View>

        {/* Quick Toggle Switch */}
        <TouchableOpacity style={[styles.toggleContainer, { backgroundColor: isActive ? '#5856D6' : '#94A3B8' }]} onPress={toggleStatus} disabled={isToggling}>
            {isToggling ? <ActivityIndicator size="small" color="#FFF" /> : <View style={[styles.toggleThumb, { alignSelf: isActive ? 'flex-end' : 'flex-start' }]} />}
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.categoryText, { color: '#64748B' }]}>{product.category || 'FURNITURE'}</Text>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{product.title}</Text>
        
        <View style={styles.priceFooter}>
            <View>
                <Text style={styles.priceLabel}>PRICE</Text>
                <Text style={[styles.price, { color: theme.text }]}>₹{product.price?.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F8FAFC' }]} onPress={() => router.push({ pathname: '/add-product', params: { id: product.id } })}>
                <Feather name="edit-2" size={16} color="#5856D6" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  imageContainer: { width: '100%', aspectRatio: 1, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  statusBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  toggleContainer: { position: 'absolute', top: 12, right: 12, width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  infoContainer: { padding: 18, gap: 4 },
  categoryText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 22, height: 44 },
  priceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  priceLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  price: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  editBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

export default ProductCard;
