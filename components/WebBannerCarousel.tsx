import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

const GAP = 24;

interface WebBannerCarouselProps {
    banners: any[];
}

const WebBannerCarousel: React.FC<WebBannerCarouselProps> = ({ banners }) => {
    const scrollRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { width } = useWindowDimensions();

    // Calculate width: subtract padding (e.g., 48px global padding) 
    // or use a max-width container logic. 
    // User wants "Full Size", so let's aim for filling the container.
    // Assuming the index.tsx container has some padding or max-width.
    // Let's use a dynamic calculation based on screen width but capped for very large screens.

    const isMobile = width < 768;
    const containerWidth = Math.min(width, 1200);
    const cardWidth = containerWidth - (isMobile ? 24 : 48); // Reduce padding on mobile
    const cardHeight = isMobile ? 180 : 400; // Reduce height for mobile

    useEffect(() => {
        if (banners.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => {
                const nextIndex = prevIndex + 1 >= banners.length ? 0 : prevIndex + 1;

                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        x: nextIndex * (cardWidth + GAP),
                        y: 0,
                        animated: true,
                    });
                }

                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [banners, cardWidth]); // Re-run if width changes

    if (banners.length === 0) {
        return (
            <View style={[styles.webHeroBanner, { width: cardWidth, height: cardHeight }]}>
                <Image source={{ uri: 'https://via.placeholder.com/1200x400' }} style={styles.webHeroImagePlaceholder} />
                <View style={styles.webHeroOverlay} />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, isMobile && { paddingHorizontal: 12 }]}
                style={{ flexGrow: 0 }}
            >
                {banners.map((item, index) => (
                    <View key={item.id || index} style={[styles.card, { width: cardWidth, height: cardHeight }]}>
                        <Image source={{ uri: item.image }} style={styles.image} />
                        <View style={styles.overlay} />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    scrollContent: {
        gap: GAP,
        paddingHorizontal: 24,
    },
    card: {
        // Width and Height are now dynamic inline
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'stretch', // Changed from 'cover' to 'stretch' to prevent cropping
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    // Fallback styles
    webHeroBanner: {
        // Height dynamic inline
        borderRadius: 32,
        backgroundColor: '#8A2BE2',
        overflow: 'hidden',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center'
    },
    webHeroImagePlaceholder: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    webHeroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    }
});

export default WebBannerCarousel;

