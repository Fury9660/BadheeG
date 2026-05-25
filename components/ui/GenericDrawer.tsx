
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

interface GenericDrawerProps {
    isVisible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    heightPercentage?: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GenericDrawer = ({ isVisible, onClose, title, children, heightPercentage = 0.5 }: GenericDrawerProps) => {
    const { isDarkMode } = useTheme();

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isDesktop = windowWidth > 768;

    // Animation
    const drawerHeight = isDesktop ? 600 : SCREEN_HEIGHT * heightPercentage;
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withTiming(0, {
                duration: 500,
                easing: Easing.out(Easing.cubic)
            });
        } else {
            opacity.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(isDesktop ? -20 : SCREEN_HEIGHT, { duration: 300 });
        }
    }, [isVisible, isDesktop]);

    const animatedDrawerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    if (!isVisible && opacity.value === 0) return null;

    const theme = {
        background: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        border: isDarkMode ? '#38383A' : '#E5E5EA',
    };

    return (
        <Modal transparent visible={isVisible} animationType="none" onRequestClose={onClose}>
            <View style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                    <Pressable style={styles.backdropPressable} onPress={onClose} />
                </Animated.View>

                {/* Drawer / Modal */}
                <Animated.View style={[
                    styles.drawer,
                    isDesktop ? styles.drawerDesktop : { height: drawerHeight },
                    { backgroundColor: theme.background },
                    animatedDrawerStyle
                ]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {title}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Feather name="x" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {children}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayDesktop: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdropPressable: {
        flex: 1,
    },
    drawer: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    drawerDesktop: {
        width: 600,
        borderRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
});

export default GenericDrawer;
