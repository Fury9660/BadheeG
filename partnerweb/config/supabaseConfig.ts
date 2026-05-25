import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://esykxyhbawwdifubbdng.supabase.co';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWt4eWhiYXd3ZGlmdWJiZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODIzNzcsImV4cCI6MjA4NTM1ODM3N30.n5Xg-KpTh3SFf5I0njY4uDhMq50_JtwuZtB8nwMtFJY';

const isWeb = Platform.OS === 'web';
const isBrowser = typeof window !== 'undefined';

// SSR-safe storage adapter
const ssrSafeStorage = {
    getItem: (key: string) => {
        if (isWeb && isBrowser) {
            return window.localStorage.getItem(key);
        }
        return null;
    },
    setItem: (key: string, value: string) => {
        if (isWeb && isBrowser) {
            window.localStorage.setItem(key, value);
        }
    },
    removeItem: (key: string) => {
        if (isWeb && isBrowser) {
            window.localStorage.removeItem(key);
        }
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ssrSafeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'implicit',
        // Bypass navigator.locks to prevent "Lock broken" errors on web
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
    },
});
