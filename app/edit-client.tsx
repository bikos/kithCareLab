import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Image } from 'react-native';
import { Text, TextInput, Button, Card, SegmentedButtons, Avatar, Switch, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCaregiverStore, EmergencyContact } from '../store/caregiverStore';
import { pickImage, takePhoto, uploadImageToSupabase, pickDocument, uploadDocumentToSupabase } from '../lib/imageUtils';

const STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function EditIndividualScreen() {
    const router = useRouter();
    const { currentProfile, managedProfiles, updateProfile, fetchEmergencyContacts, emergencyContacts, addEmergencyContact, updateEmergencyContact } = useCaregiverStore();
    const params = useLocalSearchParams();

    // Find the individual to edit
    const individualToEdit = currentProfile || managedProfiles.find(p => p.id === params.id);

    const [formData, setFormData] = useState({
        fullName: individualToEdit?.full_name || '',
        dateOfBirth: individualToEdit?.date_of_birth || '',
        phone: individualToEdit?.phone || '',
        address: individualToEdit?.address || '',
        city: individualToEdit?.city || '',
        state: individualToEdit?.state || '',
        zipCode: individualToEdit?.zip_code || '',
        medicalNotes: individualToEdit?.medical_notes || '',
        sex: individualToEdit?.sex || 'other',
        avatarUri: individualToEdit?.avatar_url || null,
        // Legal & Directives
        dnrStatus: individualToEdit?.dnr_status || false,
        dnrDocumentUri: individualToEdit?.dnr_document_url || null,
        livingWillStatus: individualToEdit?.living_will_status || false,
        livingWillDocumentUri: individualToEdit?.living_will_document_url || null,
        poaName: individualToEdit?.poa_name || '',
        poaPhone: individualToEdit?.poa_phone || '',
        endOfLifeWishes: individualToEdit?.end_of_life_wishes || '',
        // Emergency Contact fields (will be populated from separate table)
        emergencyContactName: '',
        emergencyContactRelationship: '',
        emergencyContactPhone: '',
        emergencyContactEmail: '',
    });

    const [primaryContactId, setPrimaryContactId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (individualToEdit) {
            loadEmergencyContacts();
        }
    }, [individualToEdit]);

    const loadEmergencyContacts = async () => {
        if (!individualToEdit) return;
        await fetchEmergencyContacts(individualToEdit.id);
    };

    // Populate form with primary emergency contact when contacts are loaded
    useEffect(() => {
        if (emergencyContacts.length > 0) {
            const primary = emergencyContacts.find(c => c.is_primary) || emergencyContacts[0];
            if (primary) {
                setPrimaryContactId(primary.id);
                setFormData(prev => ({
                    ...prev,
                    emergencyContactName: primary.name,
                    emergencyContactRelationship: primary.relationship || '',
                    emergencyContactPhone: primary.phone || '',
                    emergencyContactEmail: primary.email || '',
                }));
            }
        }
    }, [emergencyContacts]);

    const handleAddPhoto = async () => {
        Alert.alert(
            'Update Profile Picture',
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        const result = await takePhoto();
                        if (result) setFormData({ ...formData, avatarUri: result.uri });
                    },
                },
                {
                    text: 'Choose from Library',
                    onPress: async () => {
                        const result = await pickImage();
                        if (result) setFormData({ ...formData, avatarUri: result.uri });
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handlePickDnrDocument = async () => {
        const result = await pickDocument();
        if (result) {
            setFormData({ ...formData, dnrDocumentUri: result.uri });
        }
    };

    const handlePickLivingWillDocument = async () => {
        const result = await pickDocument();
        if (result) {
            setFormData({ ...formData, livingWillDocumentUri: result.uri });
        }
    };

    const handleUpdate = async () => {
        if (!formData.fullName || !formData.dateOfBirth) {
            alert('Please fill in required fields');
            return;
        }

        setLoading(true);
        try {
            let avatarUrl = formData.avatarUri;

            // Upload new image if it's a local URI (not an http url)
            if (formData.avatarUri && !formData.avatarUri.startsWith('http')) {
                const uploadedUrl = await uploadImageToSupabase(
                    formData.avatarUri,
                    'avatars',
                    `individuals/${individualToEdit!.id}/${Date.now()}.webp`
                );
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl;
                }
            }

            // Upload DNR document if new file selected
            let dnrDocumentUrl = formData.dnrDocumentUri;
            if (formData.dnrDocumentUri && !formData.dnrDocumentUri.startsWith('http')) {
                const uploadedUrl = await uploadDocumentToSupabase(
                    formData.dnrDocumentUri,
                    'documents',
                    `individuals/${individualToEdit!.id}/dnr_${Date.now()}.pdf`,
                    'application/pdf'
                );
                if (uploadedUrl) {
                    dnrDocumentUrl = uploadedUrl;
                }
            }

            // Upload Living Will document if new file selected
            let livingWillDocumentUrl = formData.livingWillDocumentUri;
            if (formData.livingWillDocumentUri && !formData.livingWillDocumentUri.startsWith('http')) {
                const uploadedUrl = await uploadDocumentToSupabase(
                    formData.livingWillDocumentUri,
                    'documents',
                    `individuals/${individualToEdit!.id}/living_will_${Date.now()}.pdf`,
                    'application/pdf'
                );
                if (uploadedUrl) {
                    livingWillDocumentUrl = uploadedUrl;
                }
            }

            // 1. Update Profile
            await updateProfile(individualToEdit!.id, {
                full_name: formData.fullName,
                date_of_birth: formData.dateOfBirth,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zip_code: formData.zipCode,
                medical_notes: formData.medicalNotes,
                sex: formData.sex as 'male' | 'female' | 'other',
                avatar_url: avatarUrl || undefined,
                dnr_status: formData.dnrStatus,
                dnr_document_url: dnrDocumentUrl,
                living_will_status: formData.livingWillStatus,
                living_will_document_url: livingWillDocumentUrl,
                poa_name: formData.poaName,
                poa_phone: formData.poaPhone,
                end_of_life_wishes: formData.endOfLifeWishes,
            });

            // 2. Update or Create Emergency Contact
            if (formData.emergencyContactName) {
                const contactData = {
                    name: formData.emergencyContactName,
                    relationship: formData.emergencyContactRelationship,
                    phone: formData.emergencyContactPhone,
                    email: formData.emergencyContactEmail,
                    is_primary: true,
                    profile_id: individualToEdit!.id
                };

                if (primaryContactId) {
                    await updateEmergencyContact(primaryContactId, contactData);
                } else {
                    await addEmergencyContact(contactData);
                }
            }

            router.back();
        } catch (error) {
            console.error('Error updating client:', error);
            alert('Error updating client. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!individualToEdit) {
        return (
            <View style={styles.container}>
                <Text>Client not found</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Edit details for <Text style={styles.patientName}>{individualToEdit.full_name}</Text>
                </Text>

                <View style={styles.avatarContainer}>
                    <TouchableOpacity onPress={handleAddPhoto}>
                        {formData.avatarUri ? (
                            <Avatar.Image size={100} source={{ uri: formData.avatarUri }} />
                        ) : (
                            <Avatar.Icon size={100} icon="camera-plus" style={{ backgroundColor: '#E0E0E0' }} />
                        )}
                        <Text style={styles.addPhotoText}>{formData.avatarUri ? 'Change Photo' : 'Add Photo'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Basic Information */}
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Basic Information</Text>

                        <TextInput
                            label="Full Name *"
                            value={formData.fullName}
                            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="Date of Birth (YYYY-MM-DD) *"
                            value={formData.dateOfBirth}
                            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                            mode="outlined"
                            placeholder="1950-01-15"
                            style={styles.input}
                        />

                        <TextInput
                            label="Phone Number"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={styles.input}
                        />

                        <Text variant="titleMedium" style={{ marginTop: 8, marginBottom: 8, color: '#00695C', fontSize: 16 }}>Sex</Text>
                        <SegmentedButtons
                            value={formData.sex || 'other'}
                            onValueChange={(value) => setFormData({ ...formData, sex: value as 'male' | 'female' | 'other' })}
                            buttons={[
                                {
                                    value: 'male',
                                    label: 'Male',
                                    icon: 'gender-male',
                                },
                                {
                                    value: 'female',
                                    label: 'Female',
                                    icon: 'gender-female',
                                },
                                {
                                    value: 'other',
                                    label: 'Other',
                                    icon: 'gender-male-female',
                                },
                            ]}
                            style={{ marginBottom: 16 }}
                        />
                    </Card.Content>
                </Card>

                {/* Address Information */}
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Address</Text>

                        <TextInput
                            label="Street Address"
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="City"
                            value={formData.city}
                            onChangeText={(text) => setFormData({ ...formData, city: text })}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="State"
                            value={formData.state}
                            onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
                            mode="outlined"
                            maxLength={2}
                            autoCapitalize="characters"
                            style={styles.input}
                        />

                        <TextInput
                            label="ZIP Code"
                            value={formData.zipCode}
                            onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                            mode="outlined"
                            keyboardType="number-pad"
                            maxLength={5}
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

                {/* Emergency Contact */}
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Primary Emergency Contact</Text>

                        <TextInput
                            label="Contact Name"
                            value={formData.emergencyContactName}
                            onChangeText={(text) => setFormData({ ...formData, emergencyContactName: text })}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="Relationship"
                            value={formData.emergencyContactRelationship}
                            onChangeText={(text) => setFormData({ ...formData, emergencyContactRelationship: text })}
                            mode="outlined"
                            placeholder="e.g., Spouse, Child, Sibling"
                            style={styles.input}
                        />

                        <TextInput
                            label="Phone Number"
                            value={formData.emergencyContactPhone}
                            onChangeText={(text) => setFormData({ ...formData, emergencyContactPhone: text })}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={styles.input}
                        />

                        <TextInput
                            label="Email"
                            value={formData.emergencyContactEmail}
                            onChangeText={(text) => setFormData({ ...formData, emergencyContactEmail: text })}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

                {/* Legal & Directives */}
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Legal & Directives</Text>

                        <View style={styles.switchRow}>
                            <Text variant="bodyMedium">DNR Status (Do Not Resuscitate)</Text>
                            <Switch
                                value={formData.dnrStatus}
                                onValueChange={(value) => setFormData({ ...formData, dnrStatus: value })}
                                color="#00695C"
                            />
                        </View>

                        {formData.dnrStatus && (
                            <View style={styles.documentUploadSection}>
                                <Button
                                    mode="outlined"
                                    icon="file-pdf-box"
                                    onPress={handlePickDnrDocument}
                                    style={styles.documentButton}
                                    compact
                                >
                                    {formData.dnrDocumentUri ? 'Change DNR Document' : 'Upload DNR Document'}
                                </Button>
                                {formData.dnrDocumentUri && (
                                    <Text variant="bodySmall" style={styles.documentSelected}>
                                        ✓ Document selected
                                    </Text>
                                )}
                            </View>
                        )}
                        <Divider style={styles.divider} />

                        <View style={styles.switchRow}>
                            <Text variant="bodyMedium">Living Will on File</Text>
                            <Switch
                                value={formData.livingWillStatus}
                                onValueChange={(value) => setFormData({ ...formData, livingWillStatus: value })}
                                color="#00695C"
                            />
                        </View>

                        {formData.livingWillStatus && (
                            <View style={styles.documentUploadSection}>
                                <Button
                                    mode="outlined"
                                    icon="file-pdf-box"
                                    onPress={handlePickLivingWillDocument}
                                    style={styles.documentButton}
                                    compact
                                >
                                    {formData.livingWillDocumentUri ? 'Change Living Will' : 'Upload Living Will'}
                                </Button>
                                {formData.livingWillDocumentUri && (
                                    <Text variant="bodySmall" style={styles.documentSelected}>
                                        ✓ Document selected
                                    </Text>
                                )}
                            </View>
                        )}
                        <Divider style={styles.divider} />

                        <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 16, fontSize: 16 }]}>Power of Attorney</Text>

                        <TextInput
                            label="POA Name"
                            value={formData.poaName}
                            onChangeText={(text) => setFormData({ ...formData, poaName: text })}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="POA Phone"
                            value={formData.poaPhone}
                            onChangeText={(text) => setFormData({ ...formData, poaPhone: text })}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={styles.input}
                        />

                        <TextInput
                            label="End of Life Wishes"
                            value={formData.endOfLifeWishes}
                            onChangeText={(text) => setFormData({ ...formData, endOfLifeWishes: text })}
                            mode="outlined"
                            multiline
                            numberOfLines={6}
                            placeholder="Specific instructions or wishes..."
                            placeholderTextColor="#C7C7C7"
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

                {/* Medical Notes */}
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Medical Notes</Text>

                        <TextInput
                            label="Medical Notes"
                            value={formData.medicalNotes}
                            onChangeText={(text) => setFormData({ ...formData, medicalNotes: text })}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            placeholder="Allergies, medications, conditions, special needs..."
                            placeholderTextColor="#C7C7C7"
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>
            </ScrollView>

            <View style={styles.buttonContainer}>
                <Button mode="contained" onPress={handleUpdate} loading={loading} style={styles.saveBtn}>
                    Update Details
                </Button>
                <Button mode="text" onPress={() => router.back()}>
                    Cancel
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    subtitle: {
        color: '#666',
        marginBottom: 16,
        marginTop: 60,
        textAlign: 'center',
    },
    patientName: {
        fontWeight: '600',
        color: '#00695C',
    },
    formContainer: {
        flex: 1,
    },
    formContent: {
        padding: 16,
        paddingBottom: 100,
    },
    sectionCard: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    sectionTitle: {
        marginBottom: 12,
        fontWeight: '600',
        color: '#00695C',
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white',
        fontSize: 14,
    },
    buttonContainer: {
        backgroundColor: 'transparent',
        padding: 16,
        paddingBottom: 20,
    },
    saveBtn: {
        marginBottom: 8,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    addPhotoText: {
        marginTop: 8,
        color: '#00695C',
        fontWeight: '500',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    divider: {
        marginVertical: 8,
    },
    documentUploadSection: {
        marginTop: 8,
        marginBottom: 8,
        paddingLeft: 0,
    },
    documentButton: {
        marginBottom: 4,
    },
    documentSelected: {
        color: '#00695C',
        marginLeft: 8,
        fontStyle: 'italic',
    },
});
