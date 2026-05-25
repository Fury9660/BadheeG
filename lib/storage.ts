import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const storage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') {
                return window.localStorage.getItem(key);
            }
            return null;
        }
        return AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, value);
            }
            return;
        }
        return AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
            }
            return;
        }
        return AsyncStorage.removeItem(key);
    }
};
