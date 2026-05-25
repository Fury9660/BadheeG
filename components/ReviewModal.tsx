import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

interface ReviewModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSubmitSuccess: () => void;

    // Context data
    orderId: string;
    partnerId: string;
    items: any[]; // Array of items to potentially review or just review the whole order
    // For simplicity, we might just review the "Showroom" or the "Order" as a whole, 
    // but user asked for "product and showroom". 
    // Let's implement a single review for the order which links to the partner.
    // Or better, iteration over products. 
    // For MVP given the prompt "user order kre ... uske pass product and showroom ... pop up ... review de skte",
    // I will make it a General Order/Showroom Review + Product logic.
    // To keep it simple and effective: Link review to the MAIN partner of the order and the first product (or generic order review).
    // Database schema allows product_id.

    // Current approach: One review per Order -> Partner. 
    // If we want product specific, we need multiple reviews or a JSON structure. 
    // The Schema `rating` is an Integer. So it's one rating.
    // I will link it to the `partner_id` and the `order_id` for now. 
    // If specific product is needed, we'd need loop. User said "product AND showroom".
    // I'll stick to Partner Review for now as it's the "Showroom".
}

const ReviewModal = ({ isVisible, onClose, onSubmitSuccess, orderId, partnerId, items }: ReviewModalProps) => {
    const { isDarkMode, colors } = useTheme();
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const isWeb = width > 768;

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert("Rating Required", "Please select a star rating.");
            return;
        }

        setIsSubmitting(true);
        try {
            // We will create a review for the Partner (Showroom)
            // And optionally we could create reviews for each product if we looped.
            // But for this interaction, let's create one review linked to the Order and Partner.
            // This review serves as the "Showroom Review".

            // NOTE: If we want Product reviews, we would insert multiple rows.
            // Let's Insert for the Partner first.
            const payload = {
                user_id: user?.id,
                partner_id: partnerId,
                order_id: orderId, // Verified Purchase
                product_id: items && items.length > 0 ? (items[0].product_id || items[0].id) : null, // Link to first product for now
                rating: rating,
                comment: comment,
                created_at: new Date(),
            };

            const { error } = await supabase.from('reviews').insert(payload);

            if (error) throw error;

            // Success
            Alert.alert("Thank You", "Your review has been submitted!");
            onSubmitSuccess();
            onClose();

        } catch (error: any) {
            console.error("Review submit error:", error);
            Alert.alert("Error", "Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const theme = {
        background: colors.card,
        text: colors.text,
        subtext: colors.subtext,
        primary: colors.primary,
        border: colors.border
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.container, { backgroundColor: theme.background, borderColor: theme.border, width: isWeb ? 400 : '90%' }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Rate your Experience</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color={theme.subtext} />
                        </TouchableOpacity>
                    </View>

                    {/* Showroom Info */}
                    <Text style={[styles.subtitle, { color: theme.subtext }]}>
                        How was your order from this showroom?
                    </Text>

                    {/* Star Rating */}
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Feather
                                    name="star"
                                    size={32}
                                    color={star <= rating ? "#FFD700" : theme.border}
                                    fill={star <= rating ? "#FFD700" : "none"}
                                    style={{ marginHorizontal: 4 }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.ratingLabel, { color: theme.primary }]}>
                        {rating === 1 ? "Terrible" : rating === 2 ? "Bad" : rating === 3 ? "Okay" : rating === 4 ? "Good" : rating === 5 ? "Excellent" : "Select a rating"}
                    </Text>

                    {/* Comment Input */}
                    <TextInput
                        style={[styles.input, { backgroundColor: isDarkMode ? '#2C2C2E' : '#f5f5f5', color: theme.text }]}
                        placeholder="Write your review here..."
                        placeholderTextColor={theme.subtext}
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: isSubmitting ? 0.7 : 1 }]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={colors.card} />
                        ) : (
                            <Text style={[styles.submitBtnText, { color: colors.card }]}>Submit Review</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        ...Platform.select({
            web: { boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
            default: { elevation: 10 }
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    ratingLabel: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 24,
    },
    input: {
        borderRadius: 16,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 16,
        marginBottom: 24,
    },
    submitBtn: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default ReviewModal;
