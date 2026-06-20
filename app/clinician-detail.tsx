import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Button, Card, IconButton, FAB, List, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useClinicianStore } from '../store/clinicianStore';
import { format } from 'date-fns';

export default function ClinicianDetailScreen() {
    const router = useRouter();
    const { id, individualId } = useLocalSearchParams();
    const clinicianId = id as string;
    const indId = individualId as string;

    const { clinicians, visits, fetchVisits, deleteClinician, loading } = useClinicianStore();

    const clinician = clinicians.find(c => c.id === clinicianId);

    useEffect(() => {
        if (indId && clinicianId) {
            fetchVisits(indId, clinicianId);
        }
    }, [indId, clinicianId]);

    const handleDelete = () => {
        Alert.alert(
            'Delete Specialist',
            'Are you sure you want to remove this specialist? This will also delete all visit history.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteClinician(clinicianId);
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete specialist');
                        }
                    }
                }
            ]
        );
    };

    const handleCall = () => {
        if (clinician?.phone) {
            Linking.openURL(`tel:${clinician.phone}`);
        }
    };

    const handleEmail = () => {
        if (clinician?.email) {
            Linking.openURL(`mailto:${clinician.email}`);
        }
    };

    if (!clinician) {
        return (
            <View style={styles.centered}>
                <Text>Specialist not found</Text>
                <Button onPress={() => router.back()}>Go Back</Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Card */}
                <Card style={styles.headerCard}>
                    <Card.Content>
                        <View style={styles.headerTop}>
                            <View>
                                <Text variant="headlineSmall" style={styles.name}>{clinician.name}</Text>
                                <Text variant="titleMedium" style={styles.specialty}>{clinician.specialty || 'Specialist'}</Text>
                            </View>
                            <IconButton icon="pencil" onPress={() => Alert.alert('Edit', 'Edit feature coming soon')} />
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.contactRow}>
                            {clinician.phone && (
                                <Button icon="phone" mode="text" onPress={handleCall} compact>
                                    Call
                                </Button>
                            )}
                            {clinician.email && (
                                <Button icon="email" mode="text" onPress={handleEmail} compact>
                                    Email
                                </Button>
                            )}
                        </View>

                        {clinician.address && (
                            <View style={styles.infoRow}>
                                <IconButton icon="map-marker" size={20} />
                                <Text style={styles.infoText}>{clinician.address}</Text>
                            </View>
                        )}

                        {clinician.notes && (
                            <View style={styles.infoRow}>
                                <IconButton icon="note-text" size={20} />
                                <Text style={styles.infoText}>{clinician.notes}</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Visits Section */}
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Visit History</Text>
                    <Button
                        mode="text"
                        compact
                        onPress={() => router.push({
                            pathname: '/add/clinical-visit',
                            params: { clinicianId: clinician.id, individualId: indId }
                        })}
                    >
                        + Log Visit
                    </Button>
                </View>

                {loading ? (
                    <ActivityIndicator style={styles.loader} />
                ) : visits.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Card.Content>
                            <Text style={styles.emptyText}>No visits recorded yet.</Text>
                            <Text style={styles.emptySubtext}>Tap + Log Visit to add one.</Text>
                        </Card.Content>
                    </Card>
                ) : (
                    visits.map((visit) => (
                        <Card key={visit.id} style={styles.visitCard} onPress={() => { }}>
                            <Card.Content>
                                <View style={styles.visitHeader}>
                                    <Text style={styles.visitDate}>
                                        {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                                    </Text>
                                    {visit.follow_up_date && (
                                        <View style={styles.followUpBadge}>
                                            <Text style={styles.followUpText}>
                                                Follow-up: {format(new Date(visit.follow_up_date), 'MMM d')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.visitReason}>{visit.reason || 'Checkup'}</Text>
                                {visit.notes && (
                                    <Text style={styles.visitNotes} numberOfLines={2}>{visit.notes}</Text>
                                )}
                            </Card.Content>
                        </Card>
                    ))
                )}

                <Button
                    mode="outlined"
                    textColor="red"
                    style={styles.deleteButton}
                    onPress={handleDelete}
                >
                    Remove Specialist
                </Button>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80,
    },
    headerCard: {
        backgroundColor: 'white',
        marginBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    name: {
        fontWeight: 'bold',
        color: '#00695C',
    },
    specialty: {
        color: '#666',
    },
    divider: {
        marginVertical: 12,
    },
    contactRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: -10,
    },
    infoText: {
        flex: 1,
        color: '#444',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontWeight: '600',
        color: '#333',
    },
    loader: {
        marginTop: 20,
    },
    emptyCard: {
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#666',
        fontWeight: '500',
    },
    emptySubtext: {
        color: '#999',
        fontSize: 12,
    },
    visitCard: {
        backgroundColor: 'white',
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#00695C',
    },
    visitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    visitDate: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    followUpBadge: {
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    followUpText: {
        color: '#00695C',
        fontSize: 12,
        fontWeight: '500',
    },
    visitReason: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    visitNotes: {
        fontSize: 13,
        color: '#666',
    },
    deleteButton: {
        marginTop: 24,
        borderColor: '#ffcdd2',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#00695C',
    },
});
