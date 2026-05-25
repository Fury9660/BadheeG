import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider } from '../store/AuthContext';
import { ThemeProvider } from '../store/ThemeContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="partners/login" options={{ headerShown: false }} />
            <Stack.Screen name="partners/register" options={{ headerShown: false }} />
            <Stack.Screen name="partners/verify-otp" options={{ headerShown: false }} />
            <Stack.Screen name="partners/approval-pending" options={{ headerShown: false }} />
            <Stack.Screen name="partners/(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-product" options={{ headerShown: false }} />

            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

