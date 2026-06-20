import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Switch, HelperText, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCaregiverStore } from '../store/caregiverStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pickDocument, uploadDocumentToSupabase } from '../lib/imageUtils';

export default function EditLegalScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const theme = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { managedProfiles, updateProfile, fetchManagedProfiles } = useCaregiverStore();

    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Form State
    const [dnrStatus, setDnrStatus] = useState(false);
    const [dnrDocumentUri, setDnrDocumentUri] = useState<string | null>(null);
    const [livingWillStatus, setLivingWillStatus] = useState(false);
    const [livingWillDocumentUri, setLivingWillDocumentUri] = useState<string | null>(null);
    const [poaName, setPoaName] = useState('');
    const [poaPhone, setPoaPhone] = useState('');
    const [poaEmail, setPoaEmail] = useState('');
    const [endOfLifeWishes, setEndOfLifeWishes] = useState('');

    useEffect(() => {
        if (!id) {
            // Fallback: try to find the first individual profile if no ID provided (or handle error)
            const individual = managedProfiles.find(p => p.role === 'individual');
            if (individual) {
                setProfile(individual);
                initializeForm(individual);
            } else {
                fetchManagedProfiles();
            }
        } else {
            const found = managedProfiles.find(p => p.id === id);
            if (found) {
                setProfile(found);
                initializeForm(found);
            } else {
                fetchManagedProfiles(); // Refetch if not found in current store
            }
        }
    }, [id, managedProfiles]);

    const initializeForm = (data: any) => {
        setDnrStatus(data.dnr_status || false);
        setDnrDocumentUri(data.dnr_document_url || null);
        setLivingWillStatus(data.living_will_status || false);
        setLivingWillDocumentUri(data.living_will_document_url || null);
        setPoaName(data.poa_name || '');
        setPoaPhone(data.poa_phone || '');
        setPoaEmail(data.poa_email || '');
        setEndOfLifeWishes(data.end_of_life_wishes || '');
    };

    const handlePickDnrDocument = async () => {
        const result = await pickDocument();
        if (result) {
            setDnrDocumentUri(result.uri);
        }
    };

    const handlePickLivingWillDocument = async () => {
        const result = await pickDocument();
        if (result) {
            setLivingWillDocumentUri(result.uri);
        }
    };

    const handleSave = async () => {
        if (!profile) return;
        setLoading(true);

        try {

            // Upload DNR document if new file selected
            let dnrDocumentUrl = dnrDocumentUri;
            if (dnrDocumentUri && !dnrDocumentUri.startsWith('http')) {
                const uploadedUrl = await uploadDocumentToSupabase(
                    dnrDocumentUri,
                    'documents',
                    `individuals/${profile.id}/dnr_${Date.now()}.pdf`,
                    'application/pdf'
                );
                if (uploadedUrl) {
                    dnrDocumentUrl = uploadedUrl;
                } else {
                    throw new Error('Failed to upload DNR document');
                }
            }

            // Upload Living Will document if new file selected
            let livingWillDocumentUrl = livingWillDocumentUri;
            if (livingWillDocumentUri && !livingWillDocumentUri.startsWith('http')) {
                const uploadedUrl = await uploadDocumentToSupabase(
                    livingWillDocumentUri,
                    'documents',
                    `individuals/${profile.id}/living_will_${Date.now()}.pdf`,
                    'application/pdf'
                );
                if (uploadedUrl) {
                    livingWillDocumentUrl = uploadedUrl;
                } else {
                    throw new Error('Failed to upload Living Will document');
                }
            }

            await updateProfile(profile.id, {
                dnr_status: dnrStatus,
                dnr_document_url: dnrDocumentUrl,
                living_will_status: livingWillStatus,
                living_will_document_url: livingWillDocumentUrl,
                poa_name: poaName,
                poa_phone: poaPhone,
                poa_email: poaEmail,
                end_of_life_wishes: endOfLifeWishes,
            });
            Alert.alert('Success', 'Legal directives updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error updating legal directives:', error);
            Alert.alert('Error', 'Failed to update legal directives');
        } finally {
            setLoading(false);
        }
    };

    if (!profile && !id) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Button icon="arrow-left" mode="text" onPress={() => router.back()}>
                    Back
                </Button>
                <Text variant="titleLarge" style={styles.headerTitle}>Legal & Directives</Text>
                <View style={{ width: 64 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Living Will & DNR */}
                    <View style={styles.section}>
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleMedium">DNR Status</Text>
                                <Text variant="bodySmall" style={styles.helperText}>Do Not Resuscitate order</Text>
                            </View>
                            <Switch value={dnrStatus} onValueChange={setDnrStatus} color={theme.colors.primary} />
                        </View>

                        {dnrStatus && (
                            <View style={styles.documentUploadSection}>
                                <Button
                                    mode="outlined"
                                    icon="file-pdf-box"
                                    onPress={handlePickDnrDocument}
                                    style={styles.documentButton}
                                    compact
                                >
                                    {dnrDocumentUri ? 'Change DNR Document' : 'Upload DNR Document'}
                                </Button>
                                {dnrDocumentUri && (
                                    <Text variant="bodySmall" style={styles.documentSelected}>
                                        ✓ Document selected
                                    </Text>
                                )}
                            </View>
                        )}
                        <View style={styles.divider} />
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text variant="titleMedium">Living Will</Text>
                                <Text variant="bodySmall" style={styles.helperText}>Living Will document on file</Text>
                            </View>
                            <Switch value={livingWillStatus} onValueChange={setLivingWillStatus} color={theme.colors.primary} />
                        </View>

                        {livingWillStatus && (
                            <View style={styles.documentUploadSection}>
                                <Button
                                    mode="outlined"
                                    icon="file-pdf-box"
                                    onPress={handlePickLivingWillDocument}
                                    style={styles.documentButton}
                                    compact
                                >
                                    {livingWillDocumentUri ? 'Change Living Will' : 'Upload Living Will'}
                                </Button>
                                {livingWillDocumentUri && (
                                    <Text variant="bodySmall" style={styles.documentSelected}>
                                        ✓ Document selected
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Power of Attorney */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>Power of Attorney</Text>
                    <View style={styles.card}>
                        <TextInput
                            label="Name"
                            value={poaName}
                            onChangeText={setPoaName}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="account" />}
                        />
                        <TextInput
                            label="Phone"
                            value={poaPhone}
                            onChangeText={setPoaPhone}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={styles.input}
                            left={<TextInput.Icon icon="phone" />}
                        />
                        <TextInput
                            label="Email"
                            value={poaEmail}
                            onChangeText={setPoaEmail}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            left={<TextInput.Icon icon="email" />}
                        />
                    </View>

                    {/* End of Life Wishes */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>End of Life Wishes</Text>
                    <View style={styles.card}>
                        <TextInput
                            mode="outlined"
                            multiline
                            numberOfLines={8}
                            placeholder="Describe specific wishes for end of life care, rituals, or other instructions..."
                            value={endOfLifeWishes}
                            onChangeText={setEndOfLifeWishes}
                            style={[styles.input, styles.textArea]}
                        />
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        loading={loading}
                        style={styles.saveButton}
                        contentStyle={{ paddingVertical: 8 }}
                    >
                        Save Changes
                    </Button>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 16,
        backgroundColor: '#F5F5F5',
    },
    headerTitle: {
        fontWeight: '600',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        elevation: 1,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    helperText: {
        color: '#666',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 8,
    },
    sectionTitle: {
        marginBottom: 8,
        marginLeft: 4,
        fontWeight: '600',
        color: '#444',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        elevation: 1,
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    textArea: {
        minHeight: 120,
    },
    saveButton: {
        marginTop: 8,
        marginBottom: 32,
    },
    documentUploadSection: {
        marginTop: 8,
        marginBottom: 8,
        marginLeft: 4,
    },
    documentButton: {
        alignSelf: 'flex-start',
    },
    documentSelected: {
        color: 'green',
        marginTop: 4,
        marginLeft: 4,
    }
});
