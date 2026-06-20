import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, ProgressBar, useTheme, SegmentedButtons, Checkbox } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCaregiverStore, IndividualFormData } from '../store/caregiverStore';
import { useOrganizationStore } from '../store/organizationStore';
import { pickImage, takePhoto } from '../lib/imageUtils';
import { Image, TouchableOpacity, Alert } from 'react-native';
import { Avatar } from 'react-native-paper';

export default function AddIndividualScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { createIndividual, loading } = useCaregiverStore();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const [formData, setFormData] = useState<IndividualFormData>({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactEmail: '',
        emergencyContactRelationship: '',
        medicalNotes: '',
        sex: 'other',
        avatarUri: undefined,
        inviteEmergencyContact: false
    });

    const handleAddPhoto = async () => {
        if (Platform.OS === 'web') {
            // On web, Alert with buttons doesn't work. 
            // Also, the browser file picker usually offers "Camera" option on mobile web.
            const result = await pickImage();
            if (result) setFormData({ ...formData, avatarUri: result.uri });
            return;
        }

        Alert.alert(
            'Add Profile Picture',
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

    const params = useLocalSearchParams();
    const isOrg = params.isOrg === 'true';
    const { organization } = useOrganizationStore(); // Get current org

    // ... existing state ...

    const handleCreate = async () => {
        if (!formData.firstName || !formData.lastName) {
            alert('Please enter at least first and last name');
            return;
        }

        try {
            const submissionData = { ...formData };
            if (isOrg && organization?.id) {
                submissionData.organizationId = organization.id;
            }

            await createIndividual(submissionData);
            router.back();
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Error creating client. Please try again.');
        }
    };

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1:
                return formData.firstName.trim() !== '' && formData.lastName.trim() !== '';
            case 2:
            case 3:
            case 4:
                return true;
            default:
                return false;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <Text variant="headlineSmall" style={styles.stepTitle}>Basic Information</Text>

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

                        <TextInput
                            label="First Name *"
                            value={formData.firstName}
                            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Last Name *"
                            value={formData.lastName}
                            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Date of Birth (YYYY-MM-DD)"
                            value={formData.dateOfBirth}
                            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                            style={styles.input}
                            mode="outlined"
                            placeholder="1950-01-15"
                        />
                        <TextInput
                            label="Phone Number"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="phone-pad"
                        />
                        <Text variant="titleMedium" style={{ marginTop: 16, marginBottom: 8, color: '#00695C' }}>Sex</Text>
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
                    </>
                );
            case 2:
                return (
                    <>
                        <Text variant="headlineSmall" style={styles.stepTitle}>Address Information</Text>
                        <TextInput
                            label="Street Address"
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="City"
                            value={formData.city}
                            onChangeText={(text) => setFormData({ ...formData, city: text })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <View style={styles.row}>
                            <TextInput
                                label="State"
                                value={formData.state}
                                onChangeText={(text) => setFormData({ ...formData, state: text })}
                                style={[styles.input, styles.halfInput]}
                                mode="outlined"
                            />
                            <TextInput
                                label="ZIP Code"
                                value={formData.zipCode}
                                onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                                style={[styles.input, styles.halfInput]}
                                mode="outlined"
                                keyboardType="number-pad"
                            />
                        </View>
                    </>
                );
            case 3:
                return (
                    <>
                        <Text variant="headlineSmall" style={styles.stepTitle}>Emergency Contact</Text>
                        <TextInput
                            label="Contact Name"
                            value={formData.emergencyContactName}
                            onChangeText={(text) => setFormData({ ...formData, emergencyContactName: text })}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Contact Phone"
                            value={formData.emergencyContactPhone}
                            onChangeText={(text) => setFormData({ ...formData, emergencyContactPhone: text })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            label="Contact Email"
                            value={formData.emergencyContactEmail}
                            onChangeText={(text) => setFormData({ ...formData, emergencyContactEmail: text })}
                            style={styles.input}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Checkbox.Android
                                status={formData.inviteEmergencyContact ? 'checked' : 'unchecked'}
                                onPress={() => setFormData({ ...formData, inviteEmergencyContact: !formData.inviteEmergencyContact })}
                                color="#00695C"
                            />
                            <TouchableOpacity onPress={() => setFormData({ ...formData, inviteEmergencyContact: !formData.inviteEmergencyContact })}>
                                <Text variant="bodyMedium" style={{ marginLeft: 8 }}>Invite to join Care Team</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            label="Relationship"
                            value={formData.emergencyContactRelationship}
                            onChangeText={(text) => setFormData({ ...formData, emergencyContactRelationship: text })}
                            style={styles.input}
                            mode="outlined"
                            placeholder="e.g., Daughter, Son, Spouse"
                        />
                    </>
                );
            case 4:
                return (
                    <>
                        <Text variant="headlineSmall" style={styles.stepTitle}>Medical Notes (Optional)</Text>
                        <TextInput
                            label="Important Medical Information"
                            value={formData.medicalNotes}
                            onChangeText={(text) => setFormData({ ...formData, medicalNotes: text })}
                            style={styles.input}
                            mode="outlined"
                            multiline
                            numberOfLines={6}
                            placeholder="Allergies, conditions, medications, etc."
                        />
                    </>
                );
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>Add New Client</Text>
                <ProgressBar progress={currentStep / totalSteps} style={styles.progressBar} />
                <Text variant="bodySmall" style={styles.stepIndicator}>Step {currentStep} of {totalSteps}</Text>
            </View>

            <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
                {renderStep()}
            </ScrollView>

            <View style={styles.buttonContainer}>
                <View style={styles.buttonRow}>
                    {currentStep > 1 && (
                        <Button mode="outlined" onPress={() => setCurrentStep(currentStep - 1)} style={styles.navBtn}>
                            Back
                        </Button>
                    )}
                    {currentStep < totalSteps ? (
                        <Button
                            mode="contained"
                            onPress={() => setCurrentStep(currentStep + 1)}
                            style={styles.navBtn}
                            disabled={!canProceedToNextStep()}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button mode="contained" onPress={handleCreate} loading={loading} style={styles.navBtn}>
                            Create Profile
                        </Button>
                    )}
                </View>
                <Button mode="text" onPress={() => router.back()} style={styles.cancelBtn}>
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
    header: {
        backgroundColor: 'white',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontWeight: 'bold',
        color: '#00695C',
        marginBottom: 16,
    },
    progressBar: {
        marginBottom: 8,
        height: 6,
        borderRadius: 3,
    },
    stepIndicator: {
        textAlign: 'center',
        color: '#666',
    },
    formContainer: {
        flex: 1,
    },
    formContent: {
        padding: 20,
    },
    stepTitle: {
        marginBottom: 20,
        fontWeight: 'bold',
        color: '#00695C',
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    halfInput: {
        flex: 1,
    },
    buttonContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    navBtn: {
        flex: 1,
    },
    cancelBtn: {
        marginTop: 4,
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
});
