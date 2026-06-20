import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import { useDietaryStore } from '../store/dietaryStore';
import { useCaregiverStore } from '../store/caregiverStore';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Props {
    individualId: string;
}

export const DietaryLogsSection: React.FC<Props> = ({ individualId }) => {
    const { logs, fetchLogs, deleteLog } = useDietaryStore();
    const router = useRouter();

    // Permission Check
    const { managedProfiles } = useCaregiverStore();
    const profile = managedProfiles.find(p => p.id === individualId);
    const isViewer = profile?.relationship_role === 'viewer';

    useEffect(() => {
        fetchLogs(individualId);
    }, [individualId]);

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this log?')) {
            deleteLog(id);
        }
    };

    const getAppetiteColor = (level: string) => {
        switch (level) {
            case 'Good': return '#4CAF50';
            case 'Fair': return '#FF9800';
            case 'Poor': return '#F44336';
            case 'Refused': return '#9E9E9E';
            default: return '#666';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <MaterialCommunityIcons name="food-apple" size={24} color="#00695C" />
                    <Text variant="titleMedium" style={styles.title}>Dietary Logs</Text>
                </View>
                {!isViewer && (
                    <Button mode="text" onPress={() => router.push(`/add/meal?individualId=${individualId}`)} compact>
                        + Log Meal
                    </Button>
                )}
            </View>

            {logs.length === 0 ? (
                <Text style={styles.emptyText}>No meals logged recently.</Text>
            ) : (
                logs.slice(0, 5).map((log) => ( // Show last 5
                    <Card key={log.id} style={styles.card}>
                        <Card.Content>
                            <View style={styles.row}>
                                <View style={styles.info}>
                                    <View style={styles.topRow}>
                                        <Text variant="titleSmall" style={styles.mealType}>{log.meal_type}</Text>
                                        <Text variant="bodySmall" style={styles.date}>
                                            {format(new Date(log.logged_at), 'MMM d, h:mm a')}
                                        </Text>
                                    </View>
                                    <View style={styles.appetiteRow}>
                                        <Text variant="bodySmall" style={{ color: '#666' }}>Appetite: </Text>
                                        <Text variant="bodySmall" style={{ color: getAppetiteColor(log.appetite_level), fontWeight: 'bold' }}>
                                            {log.appetite_level}
                                        </Text>
                                    </View>
                                    {log.notes && (
                                        <Text variant="bodySmall" style={styles.notes} numberOfLines={2}>
                                            "{log.notes}"
                                        </Text>
                                    )}
                                </View>
                                {!isViewer && (
                                    <IconButton
                                        icon="delete-outline"
                                        size={20}
                                        onPress={() => handleDelete(log.id)}
                                    />
                                )}
                            </View>
                        </Card.Content>
                    </Card>
                ))
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontWeight: '600',
        color: '#00695C',
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
        marginLeft: 4,
    },
    card: {
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    mealType: {
        fontWeight: 'bold',
        color: '#00695C',
    },
    date: {
        color: '#999',
        fontSize: 11,
    },
    appetiteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    notes: {
        fontStyle: 'italic',
        color: '#555',
    },
});
