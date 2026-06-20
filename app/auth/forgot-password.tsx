import React, { useState } from 'react';
import { View, StyleSheet, Image, useWindowDimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

const appIcon = require('../../assets/images/icon.png');

export default function ForgotPassword() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleReset = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/set-password`,
            });

            if (error) throw error;
            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

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
                <Text style={styles.formTitle}>Reset Password</Text>
                <Text style={styles.formSubtitle}>Enter your email to receive a reset link</Text>

                {success ? (
                    <View style={styles.successContainer}>
                        <Text style={styles.successIcon}>✉️</Text>
                        <Text style={styles.successTitle}>Check your email</Text>
                        <Text style={styles.successText}>
                            We've sent password reset instructions to {email}
                        </Text>
                        <Button
                            mode="contained"
                            onPress={() => router.push('/auth/login')}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            buttonColor="#0F172A"
                            labelStyle={styles.buttonLabel}
                        >
                            Return to Login
                        </Button>
                    </View>
                ) : (
                    <>
                        <TextInput
                            id="reset-email"
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                            mode="outlined"
                            outlineColor="#E2E8F0"
                            activeOutlineColor="#0F172A"
                            returnKeyType="done"
                            onSubmitEditing={handleReset}
                            left={<TextInput.Icon icon="email-outline" color="#94A3B8" />}
                            theme={{ roundness: 12 }}
                        />

                        {error ? (
                            <HelperText type="error" visible={!!error} style={styles.errorText}>
                                {error}
                            </HelperText>
                        ) : null}

                        <Button
                            mode="contained"
                            onPress={handleReset}
                            loading={loading}
                            disabled={loading}
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            buttonColor="#0F172A"
                            labelStyle={styles.buttonLabel}
                        >
                            {loading ? 'Sending…' : 'Send Reset Link'}
                        </Button>

                        <View style={styles.footer}>
                            <Link href="/auth/login" asChild>
                                <Button mode="text" compact textColor="#64748B" labelStyle={styles.forgotPassword}>
                                    Back to Login
                                </Button>
                            </Link>
                        </View>
                    </>
                )}
            </View>
        </View>
    );

    const webDottedBackground = Platform.OS === 'web' ? {
        backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
        backgroundSize: '32px 32px',
    } as any : {};

    if (isWide) {
        return (
            <View style={[styles.containerWide, webDottedBackground]}>
                <View style={styles.overlayWashWide}>
                    {brandingPanel}
                    {formPanel}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.containerNarrow, webDottedBackground]}>
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
        backgroundColor: '#FAFAFA',
    },
    overlayWashWide: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(250, 250, 250, 0.6)',
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
        backgroundColor: '#FAFAFA',
    },
    overlayWashNarrow: {
        flex: 1,
        backgroundColor: 'rgba(250, 250, 250, 0.6)',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 24,
        paddingVertical: 32,
        width: '100%',
        maxWidth: 440,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 32,
        elevation: 4,
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
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorText: {
        fontSize: 14,
        color: '#B91C1C',
        fontWeight: '500',
    },
    successBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    successText: {
        fontSize: 14,
        color: '#047857',
        fontWeight: '500',
        lineHeight: 20,
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
    footer: {
        alignItems: 'center',
        marginTop: 24,
    },
    forgotPassword: {
        fontSize: 14,
        fontWeight: '600',
    },
});
