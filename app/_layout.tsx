import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { supabase, isInviteFlow } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#00695C',
        secondary: '#004D40',
        tertiary: '#4DB6AC',
    },
};

import { useAppUpdate } from '../hooks/useAppUpdate';

export default function RootLayout() {
    useAppUpdate();

    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState(false);
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    // Use hook selector to avoid direct store access issues
    const initializeAuth = useAuthStore((state) => state.initialize);

    useEffect(() => {
        // Request permissions on app launch
        (async () => {
            await ImagePicker.requestCameraPermissionsAsync();
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        })();
    }, []);

    // Listen for Password Recovery / Invite links
    useEffect(() => {
        // Handle immediate invite detection from static flag
        if (isInviteFlow) {
            console.log('[Layout] Detected Invite/Recovery flow via static flag');
            // Redirect to dedicated set-password screen
            // We use a small timeout to let the router mount? 
            // Actually router is available.
            // But we might need to wait for session to be set? 
            // The screen itself checks session, so we can redirect immediately or once session is confirmed.
        }

        // Check current session immediately
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setInitialized(true);

            // Sync with global store (CRITICAL for Mobile App state)
            initializeAuth();

            if (isInviteFlow && session) {
                router.replace('/auth/set-password');
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            setSession(currentSession);
            setInitialized(true);

            // Sync with global store on change
            initializeAuth();

            if (event === 'PASSWORD_RECOVERY') {
                router.replace('/auth/set-password');
            }

            if (isInviteFlow && currentSession && event === 'SIGNED_IN') {
                router.replace('/auth/set-password');
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    // Check for user role to determine routing
    useEffect(() => {
        const checkRoleAndRedirect = async () => {
            if (!initialized || !navigationState?.key) return;

            const inAuthGroup = segments[0] === 'auth';
            const inTabsGroup = segments[0] === '(tabs)';
            const isLanding = segments[0] === undefined;
            const inDashboardGroup = segments[0] === 'dashboard';
            // More robust check for set-password
            const isSetPassword = (segments.length > 1 && segments[1] === 'set-password') || (segments[0] === 'auth' && segments.length > 1 && segments[1] === 'set-password');

            // 1. Handle Unauthenticated State
            if (!session?.user) {
                if (inTabsGroup || inDashboardGroup || segments.includes('care-team')) {
                    router.replace('/auth/login');
                }
                return;
            }

            // 2. Handle Authenticated State (Role Check)
            // Split queries for better debugging and stability
            let userRole = null;

            try {
                // A. Get Profile ID
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('auth_id', session.user.id)
                    .single();

                if (profileError) {
                    console.log('[Guard] Profile Fetch Error:', profileError);
                }

                if (profileData?.id) {
                    // B. Get Membership Role (Resilient to multiple memberships)
                    const { data: memberData, error: memberError } = await supabase
                        .from('organization_members')
                        .select('role')
                        .eq('profile_id', profileData.id);

                    if (memberError) {
                        console.log('[Guard] Member Fetch Error:', memberError);
                    }

                    // Check if ANY membership is admin
                    if (memberData && memberData.length > 0) {
                        const isAdmin = memberData.some(m => m.role === 'admin');
                        userRole = isAdmin ? 'admin' : memberData[0].role;
                    }
                }
            } catch (err) {
                // Silent catch
            }

            const isOrgAdmin = userRole === 'admin';
            // FORCE MOBILE VIEW ON NATIVE: Only go to dashboard if Admin AND Web
            const targetPath = (isOrgAdmin && Platform.OS === 'web') ? '/dashboard/' : '/(tabs)/';

            // console.log('[Guard] Role:', userRole, 'Path:', segments.join('/'), 'isSetPassword:', isSetPassword);

            // SPECIAL CASE: During Invite Flow, disable the strict guard.
            if (isInviteFlow) return;

            if (!segments.includes('care-team')) {
                // EXPLICITLY ALLOW DEBUG SCREEN
                if (segments[0] === 'debug-access') return;

                // EXPLICITLY ALLOW SET PASSWORD SCREEN
                if (isSetPassword) return;

                // Prevent access to wrong area
                if (isOrgAdmin && inTabsGroup && Platform.OS === 'web') {
                    // console.log('[Guard] Admin in tabs -> Dashboard');
                    router.replace('/dashboard/');
                } else if (!isOrgAdmin && inDashboardGroup) {
                    // console.log('[Guard] Staff in dashboard -> Tabs');
                    router.replace('/(tabs)/');
                } else if (inAuthGroup || isLanding) {
                    // Initial login redirect (only if not already handled by isSetPassword check above)
                    // console.log('[Guard] Auth/Landing -> Target');
                    router.replace(targetPath);
                }
            }
        };

        checkRoleAndRedirect();
    }, [session, initialized, segments, navigationState]);

    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="dashboard" options={{ headerShown: false }} />

                    <Stack.Screen name="add-client" options={{ headerShown: false }} />
                    <Stack.Screen name="client-detail" options={{ headerShown: false }} />
                    <Stack.Screen name="add/meal" options={{ headerShown: false }} />
                    <Stack.Screen name="add/document" options={{ headerShown: false }} />
                    <Stack.Screen name="add/daily-log" options={{ headerShown: false }} />
                    <Stack.Screen name="add/journal" options={{ headerShown: false }} />
                    <Stack.Screen name="add/medication" options={{ headerShown: false }} />
                    <Stack.Screen name="add/clinician" options={{ headerShown: false }} />
                    <Stack.Screen name="add/clinical-visit" options={{ headerShown: false }} />
                    <Stack.Screen name="clinician-detail" options={{ headerShown: true, title: 'Specialist Details' }} />
                    <Stack.Screen name="edit-legal" options={{ headerShown: false }} />
                </Stack>
            </PaperProvider>
        </SafeAreaProvider>
    );
}
