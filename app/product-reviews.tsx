import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProductReviewsScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    // params: productId, productName, productImage (optional)
    const params = useLocalSearchParams();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const theme = {
        background: isDarkMode ? '#000' : '#fff',
        text: isDarkMode ? '#fff' : '#000',
        subtext: isDarkMode ? '#aaa' : '#666',
        border: isDarkMode ? '#333' : '#eee',
        card: isDarkMode ? '#1A1A1A' : '#f9f9f9',
    };

    useEffect(() => {
        const fetchAllReviews = async () => {
            if (!params.productId) return;
            try {
                // Fetch All Reviews
                const { data: reviewData, error } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('product_id', params.productId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (reviewData && reviewData.length > 0) {
                    // Fetch Profiles
                    const userIds = [...new Set(reviewData.map(r => r.user_id))];
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, name')
                        .in('id', userIds);

                    const finalReviews = reviewData.map(r => {
                        const profile = profiles?.find(p => p.id === r.user_id);
                        return { ...r, user_name: profile?.name || 'Anonymous User' };
                    });

                    setReviews(finalReviews);
                }
            } catch (err) {
                console.error("Error fetching reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllReviews();
    }, [params.productId]);


    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Reviews</Text>
            </View>

            {/* Product Summary */}
            <View style={[styles.productHeader, { borderBottomColor: theme.border }]}>
                <Image source={{ uri: params.productImage as string }} style={styles.productImg} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>{params.productName}</Text>
                    <Text style={{ color: theme.subtext, marginTop: 4 }}>{reviews.length} Reviews</Text>
                </View>
            </View>

            {loading ? (
                <View style={[styles.center, { flex: 1 }]}>
                    <ActivityIndicator size="large" color={theme.text} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {reviews.length === 0 ? (
                        <View style={styles.center}>
                            <Text style={{ color: theme.subtext }}>No reviews found.</Text>
                        </View>
                    ) : (
                        reviews.map((review) => (
                            <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <View style={styles.reviewHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={[styles.avatar, { backgroundColor: theme.border }]}>
                                            <Text style={{ fontWeight: 'bold', color: theme.text }}>
                                                {review.user_name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.userName, { color: theme.text }]}>{review.user_name}</Text>
                                            <Text style={{ fontSize: 10, color: theme.subtext }}>{new Date(review.created_at).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.ratingBadge}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>{review.rating}</Text>
                                        <Feather name="star" size={10} color="#fff" />
                                    </View>
                                </View>
                                <Text style={[styles.comment, { color: theme.text }]}>{review.comment}</Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, paddingTop: 60 },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    productHeader: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center', borderBottomWidth: 1 },
    productImg: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
    productName: { fontSize: 16, fontWeight: '600' },
    center: { alignItems: 'center', justifyContent: 'center', padding: 40 },
    listContent: { padding: 16, paddingBottom: 40 },
    reviewCard: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    userName: { fontWeight: '600', fontSize: 14 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    comment: { fontSize: 14, lineHeight: 22 },
});

export default ProductReviewsScreen;
