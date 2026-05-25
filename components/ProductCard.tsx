import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const ProductCard = React.memo(({ product, index = 0 }: { product: any, index?: number }) => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [isWishlisted, setWishlisted] = useState(false);
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const hoverScale = useSharedValue(1);
  const hoverShadow = useSharedValue(0.1);

  const theme = {
    card: isDarkMode ? '#1C1C1E' : '#FFFFFF',
    border: isDarkMode ? '#2C2C2E' : 'transparent',
    text: isDarkMode ? '#fff' : '#171717',
    subtext: isDarkMode ? '#888' : '#666',
    price: isDarkMode ? '#fff' : '#000',
    crossPrice: isDarkMode ? '#A9A9A9' : '#888',
    discount: '#34C759',
  };

  const discount = (product.crossPrice && product.price && product.crossPrice > 0)
    ? Math.round(((product.crossPrice - product.price) / product.crossPrice) * 100)
    : 0;

  const imageSource = typeof product.image === 'string' ? { uri: product.image } : product.image;
  const storeName = product.showroomName || product.showroom_name || 'Showroom';
  const displayRating = product.avgRating !== undefined ? product.avgRating : null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hoverScale.value }],
    shadowOpacity: hoverShadow.value,
  }));

  const handleHoverIn = () => {
    if (!isWeb) return;
    hoverScale.value = withSpring(1.05, { damping: 15, stiffness: 100 });
    hoverShadow.value = withSpring(0.2, { damping: 15, stiffness: 100 });
  };

  const handleHoverOut = () => {
    if (!isWeb) return;
    hoverScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    hoverShadow.value = withSpring(0.1, { damping: 15, stiffness: 100 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(600).springify()}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderWidth: isDarkMode ? 1 : 0,
            borderColor: theme.border
          },
          animatedStyle
        ]}
      >
        <Pressable
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          onPress={() => {
            let imageUri = '';
            if (typeof product.image === 'string') imageUri = product.image;
            else if (product.image && typeof product.image.uri === 'string') imageUri = product.image.uri;

            router.push({
              pathname: '/product-details',
              params: {
                ...product,
                image: imageUri,
                showroomName: storeName,
                specifications: JSON.stringify(product.specifications || []),
                images: JSON.stringify(product.images || [])
              }
            });
          }}
        >
          <View style={styles.imageContainer}>
            <Image source={imageSource} style={[styles.image, { height: isWeb ? 240 : 180 }]} contentFit="cover" />
            {displayRating !== null && displayRating > 0 && (
              <View style={[styles.ratingSticker, { backgroundColor: theme.text }]}>
                <Text style={[styles.ratingText, { color: '#fff' }]}>{displayRating.toFixed(1)}</Text>
                <Feather name="star" size={8} color={'#fff'} fill={'#fff'} />
              </View>
            )}
          </View>
          <View style={styles.infoContainer}>
            <Text style={[styles.title, { color: theme.text, fontSize: isWeb ? 15 : 13 }]} numberOfLines={1}>{product.title}</Text>
            <Text style={[styles.showroomName, { color: theme.subtext }]}>Sold by: {storeName}</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: theme.price, fontSize: isWeb ? 16 : 14 }]}>₹{(product.price || 0).toLocaleString('en-IN')}</Text>
              {product.crossPrice > 0 && (
                <>
                  <Text style={[styles.crossPrice, { color: theme.crossPrice }]}>₹{(product.crossPrice || 0).toLocaleString('en-IN')}</Text>
                  <Text style={[styles.discount, { color: theme.discount }]}>{discount}% OFF</Text>
                </>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  ratingSticker: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '900',
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontWeight: '700',
  },
  showroomName: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontWeight: '900',
    marginRight: 8,
  },
  crossPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discount: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default ProductCard;
