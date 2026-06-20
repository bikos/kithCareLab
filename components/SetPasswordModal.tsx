import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, Title, HelperText, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface SetPasswordModalProps {
    visible: boolean;
    onDismiss: () => void;
    onSuccess: () => void;
    user: User | null | undefined;
}

export function SetPasswordModal({ visible, onDismiss, onSuccess, user }: SetPasswordModalProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isSessionReady = !!user;
    const userName = user?.user_metadata?.full_name || '';
    const userEmail = user?.email || '';

    const handleUpdatePassword = async () => {
        // Validation
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
            // Check session one last time before submitting
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Verification failed. Please click the invite link again.');
            }

            const { data, error } = await supabase.auth.updateUser({ password: password });

            if (error) throw error;
            onSuccess();
        } catch (e: any) {
            console.error('[SetPasswordModal] Error:', e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Optimistic rendering: Show form even if user/session isn't fully ready yet
    // This prevents the "Infinite Spinner" issue.

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container} dismissable={false}>
                <Title style={styles.title}>
                    {userName ? `Welcome ${userName}!` : 'Welcome!'}
                </Title>
                <Text style={styles.subtitle}>
                    {userEmail ? (
                        <>Setting up account for <Text style={{ fontWeight: 'bold' }}>{userEmail}</Text>{'\n'}</>
                    ) : null}
                    Please set your password to activate.
                </Text>

                <TextInput
                    label="New Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                />

                <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    mode="outlined"
                    style={styles.input}
                />

                {error ? <HelperText type="error">{error}</HelperText> : null}

                <Button
                    mode="contained"
                    onPress={handleUpdatePassword}
                    loading={loading}
                    style={styles.button}
                >
                    Set Password & Continue
                </Button>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 8,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 24,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
    }
});
