import { useTheme } from '@/store/ThemeContext';
import { useUI } from '@/store/UIContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// const { width } = Dimensions.get('window'); // Moved to hook inside component

const TabButton = ({ label, icon, isFocused, onPress, color, activeColor }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, { damping: 10, stiffness: 100 });
    opacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 200 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Feather name={icon} size={24} color={isFocused ? activeColor : color} />
        {isFocused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, { color: isFocused ? activeColor : color }, animatedLabelStyle]}>
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();

  const { tabBarTranslateY } = useUI();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarTranslateY.value }],
  }));

  const theme = {
    background: isDarkMode ? 'rgba(16, 16, 16, 0.7)' : 'rgba(245, 245, 245, 0.7)',
    active: isDarkMode ? '#FFFFFF' : '#000000',
    inactive: isDarkMode ? '#888888' : '#666666',
    shadow: '#000000',
  };

  const { options: currentOptions } = descriptors[state.routes[state.index].key];
  if ((currentOptions.tabBarStyle as any)?.display === 'none') {
    return null;
  }
  return (
    <Animated.View style={[styles.floatingContainer, animatedStyle, { backgroundColor: theme.background }]}>
      <View style={[styles.contentContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];

          // Skip cart or hidden routes
          if (route.name === 'cart' || options.href === null) return null;

          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const getIconName = (label) => {
            switch (label) {
              case 'Home': return 'home';
              case 'Profile': return 'user';
              case 'Categories': return 'grid';
              case 'Stores': return 'map-pin'; // Changed to map-pin for Stores
              default: return 'circle';
            }
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={index}
              label={label}
              icon={getIconName(label)}
              isFocused={isFocused}
              onPress={onPress}
              color={theme.inactive}
              activeColor={theme.active}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = width > 768;
  const shouldHideTabBar = isWeb && isDesktop;

  return (
    <Tabs
      tabBar={props => shouldHideTabBar ? null : <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
      <Tabs.Screen name="stores" options={{ title: 'Stores' }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderTopWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
    elevation: 0,
    overflow: 'hidden', // Ensure content respects the curve
    // @ts-ignore
    backdropFilter: 'blur(15px)',
  },
  blurContainer: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6, // Make space for the dot
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: -4, // Position it in the margin space
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 0,
  },
});
