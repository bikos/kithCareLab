import React, { useState, useEffect } from 'react';
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

    const { addVisit, fetchClinicians, clinicians, loading } = useClinicianStore();
    const [selectedClinicianId, setSelectedClinicianId] = useState(clinicianId || '');

    const [form, setForm] = useState({
        visitDate: new Date(),
        reason: '',
        notes: '',
        followUpDate: null as Date | null,
    });

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);

    useEffect(() => {
        if (individualId && !clinicianId) {
            fetchClinicians(individualId);
        }
    }, [individualId, clinicianId]);

    const handleSubmit = async () => {
        const targetClinicianId = clinicianId || selectedClinicianId;

        if (!targetClinicianId || !individualId) {
            Alert.alert('Error', 'Missing required information. Please select a clinician.');
            return;
        }

        if (!form.reason.trim()) {
            Alert.alert('Error', 'Please enter a reason for the visit');
            return;
        }

        try {
            await addVisit({
                clinician_id: targetClinicianId,
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

                        {/* Clinician Selector (when clinicianId is not provided in URL) */}
                        {!clinicianId && (
                            <View style={styles.clinicianSection}>
                                <Text variant="labelMedium" style={styles.label}>Select Clinician *</Text>
                                {clinicians.length === 0 ? (
                                    <View style={styles.noCliniciansContainer}>
                                        <Text style={styles.noCliniciansText}>No clinicians registered for this individual.</Text>
                                        <Button 
                                            mode="outlined" 
                                            onPress={() => router.push(`/add/clinician?individualId=${individualId}`)}
                                            style={styles.addClinicianBtn}
                                            textColor="#00695C"
                                        >
                                            Add Clinician First
                                        </Button>
                                    </View>
                                ) : (
                                    <View style={styles.clinicianGrid}>
                                        {clinicians.map((c) => {
                                             const isSelected = selectedClinicianId === c.id;
                                             return (
                                                 <TouchableOpacity
                                                     key={c.id}
                                                     style={[
                                                         styles.clinicianOption,
                                                         isSelected && styles.clinicianOptionSelected
                                                     ]}
                                                     onPress={() => setSelectedClinicianId(c.id)}
                                                 >
                                                     <Text style={[
                                                         styles.clinicianName,
                                                         isSelected && styles.clinicianNameSelected
                                                     ]}>
                                                         {c.name}
                                                     </Text>
                                                     {c.specialty ? (
                                                         <Text style={[
                                                             styles.clinicianSpecialty,
                                                             isSelected && styles.clinicianSpecialtySelected
                                                         ]}>
                                                             {c.specialty}
                                                         </Text>
                                                     ) : null}
                                                 </TouchableOpacity>
                                             );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

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
    clinicianSection: {
        marginBottom: 8,
    },
    noCliniciansContainer: {
        padding: 16,
        backgroundColor: '#F8FAF9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    noCliniciansText: {
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
        fontSize: 14,
    },
    addClinicianBtn: {
        borderColor: '#00695C',
    },
    clinicianGrid: {
        gap: 8,
        marginTop: 4,
    },
    clinicianOption: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    clinicianOptionSelected: {
        borderColor: '#00695C',
        backgroundColor: '#E0F2F1',
    },
    clinicianName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    clinicianNameSelected: {
        color: '#00695C',
    },
    clinicianSpecialty: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    clinicianSpecialtySelected: {
        color: '#004D40',
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
