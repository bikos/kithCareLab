import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key);
    },
};

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const dummyAdapter = {
    getItem: (key: string) => Promise.resolve(null),
    setItem: (key: string, value: string) => Promise.resolve(),
    removeItem: (key: string) => Promise.resolve(),
};

const storageAdapter = Platform.OS === 'web'
    ? (isBrowser
        ? {
            getItem: (key: string) => {
                return Promise.resolve(localStorage.getItem(key));
            },
            setItem: (key: string, value: string) => {
                return Promise.resolve(localStorage.setItem(key, value));
            },
            removeItem: (key: string) => {
                return Promise.resolve(localStorage.removeItem(key));
            },
        }
        : dummyAdapter)
    : ExpoSecureStoreAdapter;


// Capture intent before Supabase client potentially strips the URL hash
export const isInviteFlow = Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hash.includes('type=invite') || window.location.hash.includes('type=recovery'));

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});
