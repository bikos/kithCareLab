import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useClinicianStore } from '../../store/clinicianStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function AddClinicalVisitScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const clinicianId = params.clinicianId as string;
    const individualId = params.individualId as string;

    const { addVisit, loading } = useClinicianStore();

    const [form, setForm] = useState({
        visitDate: new Date(),
        reason: '',
        notes: '',
        followUpDate: null as Date | null,
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);

    const handleSubmit = async () => {
        if (!clinicianId || !individualId) {
            Alert.alert('Error', 'Missing required information');
            return;
        }

        if (!form.reason.trim()) {
            Alert.alert('Error', 'Please enter a reason for the visit');
            return;
        }

        try {
            await addVisit({
                clinician_id: clinicianId,
                individual_id: individualId,
                visit_date: form.visitDate.toISOString(),
                reason: form.reason,
                notes: form.notes,
                follow_up_date: form.followUpDate ? form.followUpDate.toISOString() : undefined,
            });
            Alert.alert('Success', 'Visit logged successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to log visit');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.title}>Log Clinical Visit</Text>
                </View>

                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>

                        {/* Visit Date */}
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
                            <Text variant="labelMedium" style={styles.label}>Visit Date</Text>
                            <Text variant="bodyLarge">{format(form.visitDate, 'MMMM d, yyyy')}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={form.visitDate}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) {
                                        setForm({ ...form, visitDate: selectedDate });
                                    }
                                }}
                            />
                        )}

                        <TextInput
                            label="Reason for Visit *"
                            value={form.reason}
                            onChangeText={(text) => setForm({ ...form, reason: text })}
                            mode="outlined"
                            style={styles.input}
                            placeholder="e.g., Annual Checkup, Sick Visit, Follow-up"
                        />

                        <TextInput
                            label="Notes / Instructions"
                            value={form.notes}
                            onChangeText={(text) => setForm({ ...form, notes: text })}
                            mode="outlined"
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="Doctor's orders, prescriptions changed, etc."
                        />

                        {/* Follow Up Date */}
                        <TouchableOpacity onPress={() => setShowFollowUpPicker(true)} style={styles.dateInput}>
                            <Text variant="labelMedium" style={styles.label}>Follow-up Date (Optional)</Text>
                            <Text variant="bodyLarge">
                                {form.followUpDate ? format(form.followUpDate, 'MMMM d, yyyy') : 'None set'}
                            </Text>
                        </TouchableOpacity>

                        {showFollowUpPicker && (
                            <DateTimePicker
                                value={form.followUpDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowFollowUpPicker(false);
                                    if (selectedDate) {
                                        setForm({ ...form, followUpDate: selectedDate });
                                    }
                                }}
                            />
                        )}
                        {form.followUpDate && (
                            <Button mode="text" onPress={() => setForm({ ...form, followUpDate: null })}>
                                Clear Follow-up
                            </Button>
                        )}

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
                    Save Visit Log
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
    card: {
        backgroundColor: 'white',
        marginBottom: 20,
    },
    cardContent: {
        gap: 16,
    },
    input: {
        backgroundColor: 'white',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#79747E',
        borderRadius: 4,
        padding: 16,
        backgroundColor: 'white',
    },
    label: {
        color: '#00695C',
        marginBottom: 4,
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
