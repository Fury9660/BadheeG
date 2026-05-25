import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../config/supabaseConfig';
import { useAuth } from '../store/AuthContext';

interface CartIconProps {
    color?: string;
    size?: number;
    style?: any;
}

const CartIcon: React.FC<CartIconProps> = ({ color = '#000', size = 24, style }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [cartCount, setCartCount] = useState(0);

    const fetchCartCount = async () => {
        if (!user) return;
        const { count, error } = await supabase
            .from('cart')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (count !== null) setCartCount(count);
    };

    useEffect(() => {
        if (!user) {
            setCartCount(0);
            return;
        }
        
        fetchCartCount();

        const channel = supabase
            .channel(`cart_badge_${user.id}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'cart', 
                filter: `user_id=eq.${user.id}` 
            }, () => {
                console.log("Cart change detected, refreshing badge...");
                fetchCartCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={[styles.container, style]}>
            <Feather name="shopping-bag" size={size} color={color} />
            {cartCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        padding: 4,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF3B30', // System red for notice
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#FFFFFF', // White border to separate from icon
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    }
});

export default CartIcon;
