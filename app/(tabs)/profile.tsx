import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, Button, Avatar, List, Card, Divider, ActivityIndicator, Portal, Modal, TextInput, IconButton, HelperText } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { useCaregiverStore } from '../../store/caregiverStore';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImage, uploadImageToSupabase } from '../../lib/imageUtils';

interface CaregiverProfile {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    role: string;
    avatar_url?: string;
}

export default function ProfileScreen() {
    const { user, signOut } = useAuthStore();
    const { updateProfile } = useCaregiverStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [caregiverProfile, setCaregiverProfile] = useState<CaregiverProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        fullName: '',
        phone: '',
        avatarUrl: '',
    });
    const [saving, setSaving] = useState(false);

    // Password Reset State
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Animation for status bar
    const scrollY = useRef(new Animated.Value(0)).current;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        fetchCaregiverProfile();
    }, []);

    const fetchCaregiverProfile = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_id', authUser.id)
                .eq('role', 'caregiver')
                .single();

            if (error) throw error;
            setCaregiverProfile(data);
        } catch (error) {
            console.error('Error fetching caregiver profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const openEditModal = () => {
        if (caregiverProfile) {
            setEditForm({
                fullName: caregiverProfile.full_name || '',
                phone: caregiverProfile.phone || '',
                avatarUrl: caregiverProfile.avatar_url || '',
            });
            setEditModalVisible(true);
        }
    };

    const handleUpdateAvatar = async () => {
        try {
            const image = await pickImage();
            if (!image) return;

            setUploading(true);
            const publicUrl = await uploadImageToSupabase(
                image.uri,
                'avatars',
                `caregivers/${user?.id}/${Date.now()}.webp`
            );

            if (publicUrl) {
                // If modal is open, update form state
                if (editModalVisible) {
                    setEditForm(prev => ({ ...prev, avatarUrl: publicUrl }));
                } else {
                    // Direct update if modal closed (legacy behavior, but we'll keep it or disable it)
                    // Actually, let's just update the profile directly if modal is closed
                    const { error } = await supabase
                        .from('profiles')
                        .update({ avatar_url: publicUrl })
                        .eq('id', caregiverProfile?.id);

                    if (error) throw error;
                    setCaregiverProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
                    Alert.alert('Success', 'Profile picture updated!');
                }
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            Alert.alert('Error', 'Failed to update profile picture');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!caregiverProfile) return;
        setSaving(true);
        try {
            await updateProfile(caregiverProfile.id, {
                full_name: editForm.fullName,
                phone: editForm.phone,
                avatar_url: editForm.avatarUrl,
            });

            // Update local state
            setCaregiverProfile(prev => prev ? {
                ...prev,
                full_name: editForm.fullName,
                phone: editForm.phone,
                avatar_url: editForm.avatarUrl,
            } : null);

            setEditModalVisible(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setPasswordLoading(true);
        setPasswordError('');
        setPasswordSuccess('');

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPasswordSuccess('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordModalVisible(false), 1500);
        } catch (e: any) {
            setPasswordError(e.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const displayName = caregiverProfile?.full_name || user?.email?.split('@')[0] || 'Caregiver';

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.statusBarOverlay,
                    {
                        height: insets.top,
                        opacity: headerOpacity,
                        backgroundColor: '#00695C',
                    },
                ]}
            />
            <ScrollView
                style={styles.scrollView}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Compact Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={handleUpdateAvatar} disabled={uploading}>
                            {caregiverProfile?.avatar_url ? (
                                <Avatar.Image
                                    size={60}
                                    source={{ uri: caregiverProfile.avatar_url }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <Avatar.Text
                                    size={60}
                                    label={displayName.substring(0, 2).toUpperCase()}
                                    style={styles.avatar}
                                />
                            )}
                            {uploading && (
                                <ActivityIndicator
                                    animating={true}
                                    color="white"
                                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 30 }]}
                                />
                            )}
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <Text variant="titleLarge" style={styles.name}>{displayName}</Text>
                            <Text variant="bodySmall" style={styles.email}>{user?.email}</Text>
                            <Text variant="labelSmall" style={styles.role} numberOfLines={1}>CAREGIVER</Text>
                        </View>
                        <IconButton
                            icon="cog"
                            iconColor="#00695C"
                            size={24}
                            onPress={openEditModal}
                            style={styles.settingsIcon}
                        />
                    </View>
                </View>

                {/* Account Information Section */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Account Information</Text>
                    <Divider style={styles.divider} />

                    <List.Item
                        title="Email"
                        description={user?.email}
                        left={props => <List.Icon {...props} icon="email" />}
                    />
                    {caregiverProfile?.phone && (
                        <List.Item
                            title="Phone"
                            description={caregiverProfile.phone}
                            left={props => <List.Icon {...props} icon="phone" />}
                        />
                    )}
                    <List.Item
                        title="Role"
                        description="Primary Caregiver"
                        left={props => <List.Icon {...props} icon="shield-account" />}
                    />
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Settings</Text>
                    <Divider style={styles.divider} />

                    <List.Item
                        title="Change Password"
                        description="Update your security credentials"
                        left={props => <List.Icon {...props} icon="lock-reset" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => setPasswordModalVisible(true)}
                    />

                    <List.Item
                        title="Notifications"
                        description="Manage notification preferences"
                        left={props => <List.Icon {...props} icon="bell" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => {/* TODO: Navigate to notifications settings */ }}
                    />
                    <List.Item
                        title="Privacy & Security"
                        description="Manage your privacy settings"
                        left={props => <List.Icon {...props} icon="shield-lock" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => {/* TODO: Navigate to privacy settings */ }}
                    />
                </View>

                <View style={styles.footer}>
                    <Button mode="outlined" onPress={handleSignOut} style={styles.signOutButton} textColor="#D32F2F">
                        Sign Out
                    </Button>

                    <View style={styles.brandingContainer}>
                    <Text variant="bodySmall" style={styles.brandingText}>
                        KithCare
                    </Text>
                    <Text variant="bodySmall" style={styles.brandingSubtext}>
                        by Kith Care Lab
                    </Text>
                    </View>

                    <Text variant="bodySmall" style={styles.version}>Version 1.0.0</Text>
                </View>
            </ScrollView>

            <Portal>
                {/* Edit Profile Modal */}
                <Modal visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <ScrollView>
                            <Text variant="headlineSmall" style={styles.modalTitle}>Edit Profile</Text>

                            <View style={styles.modalAvatarContainer}>
                                <TouchableOpacity onPress={handleUpdateAvatar}>
                                    {editForm.avatarUrl ? (
                                        <Avatar.Image size={100} source={{ uri: editForm.avatarUrl }} />
                                    ) : (
                                        <Avatar.Text size={100} label={editForm.fullName.substring(0, 2).toUpperCase() || '??'} />
                                    )}
                                    <View style={styles.editIconBadge}>
                                        <List.Icon icon="camera" color="white" style={{ margin: 0, height: 20, width: 20 }} />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                label="Full Name"
                                value={editForm.fullName}
                                onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="Phone Number"
                                value={editForm.phone}
                                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                                mode="outlined"
                                keyboardType="phone-pad"
                                style={styles.input}
                            />

                            <View style={styles.modalButtons}>
                                <Button onPress={() => setEditModalVisible(false)} style={styles.modalButton}>Cancel</Button>
                                <Button mode="contained" onPress={handleSaveProfile} loading={saving} disabled={saving} style={styles.modalButton}>Save</Button>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Modal>

                {/* Change Password Modal */}
                <Modal visible={passwordModalVisible} onDismiss={() => setPasswordModalVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <ScrollView>
                            <Text variant="headlineSmall" style={styles.modalTitle}>Change Password</Text>

                            <TextInput
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
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
                            {passwordError ? <HelperText type="error">{passwordError}</HelperText> : null}
                            {passwordSuccess ? <HelperText type="info" style={{ color: 'green' }}>{passwordSuccess}</HelperText> : null}

                            <View style={styles.modalButtons}>
                                <Button onPress={() => setPasswordModalVisible(false)} style={styles.modalButton}>Close</Button>
                                <Button mode="contained" onPress={handlePasswordReset} loading={passwordLoading} disabled={passwordLoading} style={styles.modalButton}>Update</Button>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollView: {
        flex: 1,
    },
    statusBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    header: {
        backgroundColor: 'white',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    settingsIcon: {
        margin: 0,
    },
    avatar: {
        backgroundColor: '#00695C',
    },
    name: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    email: {
        color: '#666',
        marginBottom: 4,
    },
    role: {
        color: '#00695C',
        fontWeight: 'bold',
        letterSpacing: 0.5,
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    section: {
        backgroundColor: 'white',
        paddingTop: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        color: '#00695C',
        fontWeight: 'bold',
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    divider: {
        marginBottom: 8,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    signOutButton: {
        borderColor: '#D32F2F',
        width: '100%',
        marginBottom: 16,
    },
    version: {
        color: '#999',
    },
    brandingContainer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    brandingLogo: {
        width: 120,
        height: 40,
        marginBottom: 8,
    },
    brandingText: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 2,
    },
    brandingSubtext: {
        color: '#999',
        textAlign: 'center',
        fontSize: 11,
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#00695C',
    },
    modalAvatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#00695C',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    modalButton: {
        marginLeft: 8,
    },
});
