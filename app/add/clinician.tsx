import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useClinicianStore } from '../../store/clinicianStore';
import { useCaregiverStore } from '../../store/caregiverStore';

export default function AddClinicianScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const individualId = params.individualId as string;

    const { addClinician, loading } = useClinicianStore();
    const { currentProfile } = useCaregiverStore();

    // If no individualId passed, use currentProfile if it's an individual
    const targetId = individualId || (currentProfile?.role === 'individual' ? currentProfile.id : null);

    const [form, setForm] = useState({
        name: '',
        specialty: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
    });

    const [errors, setErrors] = useState({
        name: false,
    });

    const handleSubmit = async () => {
        if (!targetId) {
            Alert.alert('Error', 'No individual selected');
            return;
        }

        if (!form.name.trim()) {
            setErrors({ ...errors, name: true });
            return;
        }

        try {
            await addClinician({
                individual_id: targetId,
                name: form.name,
                specialty: form.specialty,
                phone: form.phone,
                email: form.email,
                address: form.address,
                notes: form.notes,
            });
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to add clinician');
        }
    };

    if (!targetId) {
        return (
            <View style={styles.container}>
                <Text>Error: No individual identified.</Text>
                <Button onPress={() => router.back()}>Go Back</Button>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.title}>Add Specialist</Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Add a doctor or specialist to the care team.
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <TextInput
                            label="Name *"
                            value={form.name}
                            onChangeText={(text) => {
                                setForm({ ...form, name: text });
                                setErrors({ ...errors, name: false });
                            }}
                            mode="outlined"
                            style={styles.input}
                            error={errors.name}
                        />
                        <HelperText type="error" visible={errors.name}>
                            Name is required
                        </HelperText>

                        <TextInput
                            label="Specialty"
                            value={form.specialty}
                            onChangeText={(text) => setForm({ ...form, specialty: text })}
                            mode="outlined"
                            style={styles.input}
                            placeholder="e.g., Cardiologist, PCP, Neurologist"
                        />

                        <TextInput
                            label="Phone"
                            value={form.phone}
                            onChangeText={(text) => setForm({ ...form, phone: text })}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={styles.input}
                        />

                        <TextInput
                            label="Email"
                            value={form.email}
                            onChangeText={(text) => setForm({ ...form, email: text })}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />

                        <TextInput
                            label="Address / Clinic"
                            value={form.address}
                            onChangeText={(text) => setForm({ ...form, address: text })}
                            mode="outlined"
                            style={styles.input}
                            multiline
                        />

                        <TextInput
                            label="Notes"
                            value={form.notes}
                            onChangeText={(text) => setForm({ ...form, notes: text })}
                            mode="outlined"
                            style={styles.input}
                            multiline
                            numberOfLines={3}
                        />
                    </Card.Content>
                </Card>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.button}
                >
                    Save Specialist
                </Button>
                <Button
                    mode="text"
                    onPress={() => router.back()}
                    style={styles.button}
                >
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
    scrollView: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 20,
        marginTop: 40,
    },
    title: {
        fontWeight: 'bold',
        color: '#00695C',
    },
    subtitle: {
        color: '#666',
        marginTop: 4,
    },
    card: {
        backgroundColor: 'white',
        marginBottom: 20,
    },
    cardContent: {
        gap: 12,
    },
    input: {
        backgroundColor: 'white',
    },
    footer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    button: {
        marginBottom: 8,
    },
});
