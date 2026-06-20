import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ImageBackground, useWindowDimensions } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { User } from '@supabase/supabase-js';

const appIcon = require('../../assets/images/icon.png');
const heroBg = require('../../assets/images/hero_bg.png');

export default function SetPasswordScreen() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    const confirmPasswordRef = useRef<any>(null);

    useEffect(() => {
        // Fetch current user details
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
            }
        });
    }, []);

    const handleUpdatePassword = async () => {
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            // Determine where to send the user based on role
            let targetPath = '/(tabs)/';
            
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('id').eq('auth_id', user.id).single();
                if (profile?.id) {
                    const { data: memberData } = await supabase
                        .from('organization_members')
                        .select('role')
                        .eq('profile_id', profile.id)
                        .maybeSingle();

                    if (memberData?.role === 'admin') {
                        targetPath = '/dashboard/';
                    }
                }
            }

            // CRITICAL FIX: The invite hash (#access_token=...&type=invite) paralyzes Expo Router
            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Failed to update password. Your link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    const userName = user?.user_metadata?.full_name || '';
    const userEmail = user?.email || '';

    const brandingPanel = (
        <View style={styles.brandingPanel}>
            <Image source={appIcon} style={styles.brandingLogo} resizeMode="contain" />
            <Text style={styles.brandingTitle}>KithCare</Text>
            <Text style={styles.brandingTagline}>
                Compassionate care,{'\n'}beautifully organized.
            </Text>
            <View style={styles.brandingDivider} />
            <Text style={styles.brandingSubtext}>
                Secure admin portal for managing residents, staff, and care operations.
            </Text>
        </View>
    );

    const formPanel = (
        <View style={[styles.formPanel, !isWide && styles.formPanelNarrow]}>
            {!isWide && (
                <View style={styles.mobileHeader}>
                    <Image source={appIcon} style={styles.mobileHeaderLogo} resizeMode="contain" />
                    <Text style={styles.mobileHeaderTitle}>KithCare</Text>
                </View>
            )}

            <View style={styles.formCard}>
                <Text style={styles.formTitle}>Set New Password</Text>
                <Text style={styles.formSubtitle}>
                    {userName ? `Welcome, ${userName}. ` : ''}
                    {userEmail ? `Setting password for ${userEmail}` : 'Create a secure password for your account.'}
                </Text>

                {success ? (
                    <View style={styles.successContainer}>
                        <Text style={styles.successIcon}>✅</Text>
                        <Text style={styles.successTitle}>Password Updated!</Text>
                        <Text style={styles.successText}>
                            Your password has been successfully set. You can now access your dashboard.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => router.replace('/(tabs)')}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            buttonColor="#0F172A"
                            labelStyle={styles.buttonLabel}
                        >
                            Go to Dashboard
                        </Button>
                    </View>
                ) : (
                    <>
                        <TextInput
                            label="New Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            mode="outlined"
                            outlineColor="#E2E8F0"
                            activeOutlineColor="#0F172A"
                            returnKeyType="next"
                            left={<TextInput.Icon icon="lock-outline" color="#94A3B8" />}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? "eye-off" : "eye"}
                                    color="#94A3B8"
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                            theme={{ roundness: 12 }}
                        />

                        <TextInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            mode="outlined"
                            outlineColor="#E2E8F0"
                            activeOutlineColor="#0F172A"
                            returnKeyType="done"
                            onSubmitEditing={handleSetPassword}
                            left={<TextInput.Icon icon="lock-check-outline" color="#94A3B8" />}
                            theme={{ roundness: 12 }}
                        />

                        {error ? (
                            <HelperText type="error" visible={!!error} style={styles.errorText}>
                                {error}
                            </HelperText>
                        ) : null}

                        <Button
                            mode="contained"
                            onPress={handleSetPassword}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            buttonColor="#0F172A"
                            labelStyle={styles.buttonLabel}
                        >
                            {loading ? 'Saving…' : 'Save Password'}
                        </Button>
                    </>
                )}
            </View>
        </View>
    );

    // Premium Light Glassmorphism Mesh Gradient
    const meshBackground = Platform.OS === 'web' ? {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
            radial-gradient(at 20% 0%, rgba(74, 144, 226, 0.25) 0px, transparent 60%),
            radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.2) 0px, transparent 60%),
            radial-gradient(at 50% 100%, rgba(20, 184, 166, 0.25) 0px, transparent 70%)
        `,
        backgroundColor: '#F1F5F9',
    } as any : {};

    if (isWide) {
        return (
            <View style={styles.containerWide}>
                {Platform.OS === 'web' && <View style={meshBackground} />}
                <View style={styles.overlayWashWide}>
                    {brandingPanel}
                    {formPanel}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.containerNarrow}>
            {Platform.OS === 'web' && <View style={meshBackground} />}
            <View style={styles.overlayWashNarrow}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {formPanel}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    containerWide: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    overlayWashWide: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
    },
    brandingPanel: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 48,
    },
    brandingLogo: {
        width: 120,
        height: 120,
        borderRadius: 28,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    brandingTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 16,
        letterSpacing: -1,
    },
    brandingTagline: {
        fontSize: 24,
        fontWeight: '500',
        color: '#475569',
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 32,
    },
    brandingDivider: {
        width: 60,
        height: 4,
        backgroundColor: '#0F172A',
        marginBottom: 32,
        borderRadius: 2,
    },
    brandingSubtext: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
    },
    formPanel: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16, 
    },
    formPanelNarrow: {
        paddingTop: 40,
        paddingBottom: 40,
        width: '100%',
        paddingHorizontal: 16, 
    },
    containerNarrow: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    overlayWashNarrow: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    mobileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    mobileHeaderLogo: {
        width: 80,
        height: 80,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
    },
    mobileHeaderTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        borderRadius: 24,
        paddingHorizontal: 24, 
        paddingVertical: 32,
        width: '100%',
        maxWidth: 440,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 32,
        elevation: 4,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {} as any),
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    formSubtitle: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 32,
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        minHeight: 60,
        fontSize: 18,
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 14,
    },
    button: {
        marginTop: 8,
        borderRadius: 30,
        elevation: 0,
    },
    buttonContent: {
        height: 56,
    },
    buttonLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    successIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 8,
    },
    successText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
});
