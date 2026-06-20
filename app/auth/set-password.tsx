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
            // We force a hard reload on Web to wipe the hash from the browser URL completely.
            if (Platform.OS === 'web') {
                window.location.href = targetPath;
            } else {
                router.replace(targetPath as any);
            }

        } catch (e: any) {
            setError(e.message || 'Failed to update password. Please try again.');
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
                <Text style={styles.formTitle}>
                    {userName ? `Welcome, ${userName}!` : 'Welcome to KithCare!'}
                </Text>
                <Text style={styles.formSubtitle}>
                    {userEmail ? (
                        <>Setting up account for <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{userEmail}</Text>{'\n'}</>
                    ) : null}
                    Please set your password to complete your account setup.
                </Text>

                <TextInput
                    id="set-password"
                    label="New Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    mode="outlined"
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#4A90E2"
                    style={styles.input}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    blurOnSubmit={false}
                    left={<TextInput.Icon icon="lock-outline" color="#94A3B8" />}
                    theme={{ roundness: 12 }}
                />

                <TextInput
                    id="confirm-password"
                    ref={confirmPasswordRef}
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    mode="outlined"
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#4A90E2"
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={handleUpdatePassword}
                    left={<TextInput.Icon icon="lock-check-outline" color="#94A3B8" />}
                    theme={{ roundness: 12 }}
                />

                {!!error && (
                    <View style={styles.errorBox}>
                        <HelperText type="error" visible style={styles.errorText}>
                            {error}
                        </HelperText>
                    </View>
                )}

                <Button
                    mode="contained"
                    onPress={handleUpdatePassword}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={styles.buttonContent}
                    buttonColor="#4A90E2"
                    labelStyle={styles.buttonLabel}
                >
                    {loading ? 'Activating…' : 'Set Password & Activate'}
                </Button>
            </View>
        </View>
    );

    return (
        <ImageBackground source={heroBg} style={styles.container} resizeMode="cover">
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.keyboardView}
            >
                {isWide ? (
                    <View style={styles.containerWide}>
                        <View style={styles.glassOverlayWide}>
                            {brandingPanel}
                            {formPanel}
                        </View>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {formPanel}
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    containerWide: {
        flex: 1,
    },
    glassOverlayWide: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
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
        marginBottom: 24,
    },
    brandingTitle: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    brandingTagline: {
        fontSize: 20,
        color: '#E2E8F0',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 32,
    },
    brandingDivider: {
        width: 60,
        height: 2,
        backgroundColor: '#4A90E2',
        marginBottom: 32,
    },
    brandingSubtext: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
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
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    mobileHeaderTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingVertical: 32,
        width: '100%',
        maxWidth: 440,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
        elevation: 10,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    formSubtitle: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    input: {
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        fontSize: 18,
        height: 60,
    },
    errorBox: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorText: {
        fontSize: 14,
        color: '#B91C1C',
        fontWeight: '500',
    },
    button: {
        marginTop: 12,
        borderRadius: 12,
    },
    buttonContent: {
        paddingVertical: 10,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
