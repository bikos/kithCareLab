import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Divider, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DietaryLogsSection } from '../DietaryLogsSection';

interface HealthTabProps {
    profileId: string;
    medicalNotes: string | undefined;
    medications: any[];
}

import { useCaregiverStore } from '../../store/caregiverStore';
import { useMedicationStore } from '../../store/medicationStore';

export function HealthTab({ profileId, medicalNotes, medications }: HealthTabProps) {
    const router = useRouter();
    const { managedProfiles } = useCaregiverStore();
    const { deleteMedication, fetchMedications } = useMedicationStore();
    const profile = managedProfiles.find(p => p.id === profileId);
    const isViewer = profile?.relationship_role === 'viewer';

    const upcomingMeds = medications.slice(0, 5); // Show top 5

    const handleDeleteMed = (med: any) => {
        Alert.alert(
            'Discontinue Medication',
            `Are you sure you want to discontinue ${med.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Discontinue',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMedication(med.id);
                            await fetchMedications();
                            Alert.alert('Success', `${med.name} has been discontinued.`);
                        } catch (error) {
                            console.error('Error discontinuing medication:', error);
                            Alert.alert('Error', 'Could not discontinue medication.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Medical Notes */}
            {medicalNotes && (
                <Card style={[styles.sectionCard, styles.medicalNotesCard]} elevation={2}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <MaterialCommunityIcons name="clipboard-text" size={24} color="#00695C" />
                                <Text variant="titleMedium" style={styles.sectionTitle}>Medical Notes</Text>
                            </View>
                        </View>
                        <Divider style={[styles.sectionDivider, { backgroundColor: '#B2DFDB' }]} />
                        <Text variant="bodyMedium" style={styles.medicalNotes}>
                            {medicalNotes}
                        </Text>
                    </Card.Content>
                </Card>
            )}

            {/* Medications */}
            <Card style={styles.sectionCard} elevation={1}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialCommunityIcons name="pill" size={24} color="#00695C" />
                            <Text variant="titleMedium" style={styles.sectionTitle}>Medications</Text>
                        </View>
                        {!isViewer && (
                            <Button
                                mode="text"
                                compact
                                onPress={() => router.push('/add/medication')}
                            >
                                + Add
                            </Button>
                        )}
                    </View>
                    <Divider style={styles.sectionDivider} />
                    {upcomingMeds.length > 0 ? (
                        upcomingMeds.map((med, index) => (
                            <View key={med.id}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text variant="titleSmall" style={styles.medName}>{med.name}</Text>
                                        <Text variant="bodySmall" style={styles.medDetails}>
                                            {med.dosage} • {med.frequency}
                                        </Text>
                                    </View>
                                    {!isViewer && (
                                        <IconButton
                                            icon="trash-can-outline"
                                            iconColor="#d32f2f"
                                            size={20}
                                            onPress={() => handleDeleteMed(med)}
                                        />
                                    )}
                                </View>
                                {index < upcomingMeds.length - 1 && <Divider style={styles.entryDivider} />}
                            </View>
                        ))
                    ) : (
                        <Text variant="bodySmall" style={styles.emptyText}>No medications</Text>
                    )}
                    {medications.length > 5 && (
                        <Button mode="text" compact onPress={() => router.push('/(tabs)/medications')} style={{ marginTop: 8 }}>
                            View All
                        </Button>
                    )}
                </Card.Content>
            </Card>

            {/* Dietary Logs */}
            <Card style={styles.sectionCard} elevation={1}>
                <Card.Content>
                    <DietaryLogsSection individualId={profileId} />
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 80,
        paddingTop: 16,
    },
    sectionCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: 'white',
    },
    medicalNotesCard: {
        backgroundColor: '#E0F2F1',
        borderLeftWidth: 4,
        borderLeftColor: '#00695C',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontWeight: '600',
        color: '#00695C',
    },
    sectionDivider: {
        marginBottom: 12,
    },
    medicalNotes: {
        lineHeight: 22,
        color: '#004D40',
    },
    medName: {
        fontWeight: '600',
        color: '#333',
    },
    medDetails: {
        color: '#666',
        marginBottom: 8,
    },
    entryDivider: {
        marginVertical: 8,
        backgroundColor: '#f0f0f0',
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
    },
});
