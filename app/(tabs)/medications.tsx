import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Divider, IconButton, Portal, Modal, Button, TextInput } from 'react-native-paper';
import { useCaregiverStore } from '../../store/caregiverStore';
import { useMedicationStore, MedicationWithLogs } from '../../store/medicationStore';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoadingAnimation from '../../components/LoadingAnimation';

export default function MedicationsScreen() {
    const { managedProfiles, fetchManagedProfiles } = useCaregiverStore();
    const { fetchAllMedications, logMedicationTaken, loading } = useMedicationStore();
    const [medicationsByPatient, setMedicationsByPatient] = useState<{ title: string; data: MedicationWithLogs[] }[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // Modal state
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState<MedicationWithLogs | null>(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const init = async () => {
            await fetchManagedProfiles();
            // If no profiles are found, we stop initializing here as the second effect won't run
            const profiles = useCaregiverStore.getState().managedProfiles;
            if (profiles.length === 0) {
                setIsInitializing(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        // Load medications when managed profiles are available
        if (managedProfiles.length > 0) {
            loadMedications().finally(() => {
                setIsInitializing(false);
            });
        }
    }, [managedProfiles]);

    const loadMedications = async () => {
        setRefreshing(true);
        try {
            const allMeds = await fetchAllMedications();

            // Group by patient
            const grouped = managedProfiles
                .filter(p => p.role === 'individual')
                .map(patient => {
                    const patientMeds = allMeds.filter(med => med.user_id === patient.id);
                    return {
                        title: patient.full_name,
                        data: patientMeds,
                    };
                })
                .filter(section => section.data.length > 0);

            setMedicationsByPatient(grouped);
        } catch (error) {
            console.error('Error loading medications:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleMedicationPress = (med: MedicationWithLogs) => {
        const isTakenToday = med.latest_log?.status === 'taken';

        if (!isTakenToday) {
            // Show confirmation modal
            setSelectedMedication(med);
            setNotes('');
            setConfirmModalVisible(true);
        }
    };

    const handleConfirmMedication = async () => {
        if (!selectedMedication) return;

        setSubmitting(true);
        try {
            await logMedicationTaken(selectedMedication.id, notes.trim() || undefined);
            setConfirmModalVisible(false);
            setSelectedMedication(null);
            setNotes('');
            // Reload to show updated status
            await loadMedications();
        } catch (error) {
            console.error('Error confirming medication:', error);
            alert('Error logging medication. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderMedication = (med: MedicationWithLogs) => {
        const isTakenToday = med.latest_log?.status === 'taken';

        return (
            <Card
                key={med.id}
                style={[
                    styles.medCard,
                    isTakenToday && styles.medCardTaken
                ]}
                onPress={() => handleMedicationPress(med)}
            >
                <Card.Content style={styles.medContent}>
                    <View style={styles.medHeader}>
                        <View style={styles.medInfo}>
                            <Text
                                variant="titleMedium"
                                style={[
                                    styles.medName,
                                    isTakenToday && styles.medNameDone
                                ]}
                            >
                                {med.name}
                            </Text>
                            <Text variant="bodyMedium" style={styles.medDetails}>
                                {med.dosage} • {med.frequency}
                            </Text>
                            {med.instructions && (
                                <View style={styles.instructionsRow}>
                                    <MaterialCommunityIcons name="information-outline" size={14} color="#666" />
                                    <Text variant="bodySmall" style={styles.instructionsText}>
                                        {med.instructions}
                                    </Text>
                                </View>
                            )}
                            {med.scheduled_time && (
                                <View style={styles.timeRow}>
                                    <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                                    <Text variant="bodySmall" style={styles.timeText}>
                                        {med.scheduled_time}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.statusContainer}>
                            {isTakenToday ? (
                                <View style={styles.takenBadge}>
                                    <MaterialCommunityIcons name="check-circle" size={32} color="#00695C" />
                                </View>
                            ) : (
                                <View style={styles.pendingBadge}>
                                    <MaterialCommunityIcons name="circle-outline" size={32} color="#999" />
                                </View>
                            )}
                        </View>
                    </View>

                    {isTakenToday && med.latest_log && (
                        <View style={styles.logInfo}>
                            <Divider style={styles.logDivider} />
                            <View style={styles.logDetails}>
                                <MaterialCommunityIcons name="check-circle" size={16} color="#00695C" />
                                <Text variant="bodySmall" style={styles.logText}>
                                    Given at {format(new Date(med.latest_log.taken_at), 'h:mm a')}
                                    {med.latest_log.caregiver_name && ` by ${med.latest_log.caregiver_name}`}
                                </Text>
                            </View>
                            {med.latest_log.notes && (
                                <Text variant="bodySmall" style={styles.logNotes}>
                                    Note: {med.latest_log.notes}
                                </Text>
                            )}
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.header}>Medication Reminders</Text>

            {(loading || isInitializing) && medicationsByPatient.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <LoadingAnimation visible={true} />
                </View>
            ) : medicationsByPatient.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="pill-off" size={64} color="#ccc" />
                    <Text variant="bodyLarge" style={styles.emptyText}>
                        No medications scheduled
                    </Text>
                    <Text variant="bodyMedium" style={styles.emptySubtext}>
                        Add medications from each patient's detail page
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {medicationsByPatient.map((section) => (
                        <View key={section.title} style={styles.patientSection}>
                            <View style={styles.patientHeader}>
                                <Text variant="titleLarge" style={styles.patientName}>
                                    {section.title}
                                </Text>
                                <Chip icon="pill" style={styles.countChip} textStyle={styles.countChipText}>
                                    {section.data.length}
                                </Chip>
                            </View>
                            {section.data.map(med => renderMedication(med))}
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Confirmation Modal */}
            <Portal>
                <Modal
                    visible={confirmModalVisible}
                    onDismiss={() => !submitting && setConfirmModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text variant="headlineSmall" style={styles.modalTitle}>
                        Confirm Medication
                    </Text>

                    {selectedMedication && (
                        <>
                            <View style={styles.modalMedInfo}>
                                <Text variant="titleMedium" style={styles.modalMedName}>
                                    {selectedMedication.name}
                                </Text>
                                <Text variant="bodyMedium" style={styles.modalMedDetails}>
                                    {selectedMedication.dosage} • {selectedMedication.frequency}
                                </Text>
                                {selectedMedication.instructions && (
                                    <View style={styles.modalInstructions}>
                                        <MaterialCommunityIcons name="information" size={16} color="#00695C" />
                                        <Text variant="bodySmall" style={styles.modalInstructionsText}>
                                            {selectedMedication.instructions}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <TextInput
                                label="Notes (Optional)"
                                value={notes}
                                onChangeText={setNotes}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                placeholder="e.g., Patient took with breakfast, No side effects"
                                style={styles.notesInput}
                            />

                            <View style={styles.modalButtons}>
                                <Button
                                    mode="contained"
                                    onPress={handleConfirmMedication}
                                    loading={submitting}
                                    disabled={submitting}
                                    style={styles.confirmButton}
                                    icon="check"
                                >
                                    Confirm Given
                                </Button>
                                <Button
                                    mode="text"
                                    onPress={() => setConfirmModalVisible(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                            </View>
                        </>
                    )}
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
        fontWeight: 'bold',
        color: '#00695C',
    },
    content: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 16,
        color: '#666',
    },
    emptySubtext: {
        marginTop: 8,
        color: '#999',
        textAlign: 'center',
    },
    patientSection: {
        marginBottom: 24,
    },
    patientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    patientName: {
        fontWeight: '600',
        color: '#00695C',
    },
    countChip: {
        backgroundColor: '#E8F5E9',
    },
    countChipText: {
        fontSize: 12,
        color: '#00695C',
    },
    medCard: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    medCardTaken: {
        backgroundColor: '#F1F8F4',
    },
    medContent: {
        padding: 16,
    },
    medHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    medInfo: {
        flex: 1,
    },
    medName: {
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    medNameDone: {
        color: '#00695C',
    },
    medDetails: {
        color: '#666',
        marginBottom: 6,
    },
    instructionsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        marginTop: 4,
    },
    instructionsText: {
        color: '#666',
        flex: 1,
        fontStyle: 'italic',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    timeText: {
        color: '#666',
    },
    statusContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    takenBadge: {
        padding: 4,
    },
    pendingBadge: {
        padding: 4,
    },
    logInfo: {
        marginTop: 12,
    },
    logDivider: {
        marginBottom: 8,
    },
    logDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logText: {
        color: '#00695C',
        fontStyle: 'italic',
    },
    logNotes: {
        color: '#666',
        marginTop: 4,
        marginLeft: 22,
        fontStyle: 'italic',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 12,
    },
    modalTitle: {
        fontWeight: 'bold',
        color: '#00695C',
        marginBottom: 16,
    },
    modalMedInfo: {
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    modalMedName: {
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    modalMedDetails: {
        color: '#666',
        marginBottom: 8,
    },
    modalInstructions: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#E8F5E9',
        padding: 8,
        borderRadius: 4,
        marginTop: 8,
    },
    modalInstructionsText: {
        color: '#00695C',
        flex: 1,
    },
    notesInput: {
        marginBottom: 20,
        backgroundColor: 'white',
    },
    modalButtons: {
        gap: 8,
    },
    confirmButton: {
        backgroundColor: '#00695C',
    },
});
