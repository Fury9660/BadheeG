
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProductCard = ({ product }) => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [isWishlisted, setWishlisted] = useState(false);

  const theme = {
    card: isDarkMode ? '#1A1A1A' : '#fff',
    text: isDarkMode ? '#fff' : '#171717',
    subtext: isDarkMode ? '#888' : '#666',
    price: isDarkMode ? '#fff' : '#000',
    crossPrice: isDarkMode ? '#A9A9A9' : '#888',
    discount: '#34C759',
    wishlist: isWishlisted ? '#FF3B30' : (isDarkMode ? '#fff' : '#000'),
  };

  const discount = Math.round(((product.crossPrice - product.price) / product.crossPrice) * 100);

  const imageSource = typeof product.image === 'string' ? { uri: product.image } : product.image;

  const handleWishlistToggle = () => {
    setWishlisted(!isWishlisted);
    // Here you would add the logic to add/remove from wishlist in your backend
  }

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => router.push('/product-details')}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} />
        <TouchableOpacity style={styles.wishlistButton} onPress={handleWishlistToggle}>
          <Feather name="heart" size={20} color={theme.wishlist} fill={isWishlisted ? theme.wishlist : 'none'} />
        </TouchableOpacity>
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{product.title}</Text>
        <Text style={[styles.showroomName, { color: theme.subtext }]}>{product.showroom}</Text>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme.price }]}>₹{product.price.toLocaleString('en-IN')}</Text>
          <Text style={[styles.crossPrice, { color: theme.crossPrice }]}>₹{product.crossPrice.toLocaleString('en-IN')}</Text>
          <Text style={[styles.discount, { color: theme.discount }]}>{discount}% OFF</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 6,
    borderRadius: 15,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  showroomName: {
    fontSize: 12,
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  crossPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProductCard;
