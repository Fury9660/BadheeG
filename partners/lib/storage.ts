import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const storage = {
    setItem: async (key: string, value: string) => {
        try {
            if (Platform.OS === 'web') {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(key, value);
                }
            } else {
                await AsyncStorage.setItem(key, value);
            }
        } catch (error) {
            console.error('Error setting item:', error);
        }
    },
    getItem: async (key: string) => {
        try {
            if (Platform.OS === 'web') {
                if (typeof localStorage !== 'undefined') {
                    return localStorage.getItem(key);
                }
                return null;
            } else {
                return await AsyncStorage.getItem(key);
            }
        } catch (error) {
            console.error('Error getting item:', error);
            return null;
        }
    },
    removeItem: async (key: string) => {
        try {
            if (Platform.OS === 'web') {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem(key);
                }
            } else {
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.error('Error removing item:', error);
        }
    },
    clear: async () => {
        try {
            if (Platform.OS === 'web') {
                localStorage.clear();
            } else {
                await AsyncStorage.clear();
            }
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
};
