import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, IconButton, Button, Text, Paragraph, ActivityIndicator } from 'react-native-paper';
import { useOrganizationStore } from '../../store/organizationStore';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import ClientCard from '../../components/ClientCard';
import ClientListRow from '../../components/ClientListRow';
import { Profile } from '../../store/caregiverStore';

export default function ClientsList() {
    const { patients, fetchPatients, loading, organization } = useOrganizationStore();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (organization) {
            fetchPatients();
        }
    }, [organization]);

    const navigateToDetail = (clientId: string) =>
        router.push(`/dashboard/client-detail?id=${clientId}`);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Title style={styles.title}>All Clients</Title>
                <View style={styles.actions}>
                    {/* View Mode Toggle */}
                    <View style={styles.toggleGroup}>
                        <IconButton
                            id="clients-grid-view"
                            icon="view-grid"
                            size={20}
                            iconColor={viewMode === 'grid' ? '#fff' : '#666'}
                            style={[
                                styles.toggleButton,
                                viewMode === 'grid' && styles.toggleButtonActive,
                            ]}
                            onPress={() => setViewMode('grid')}
                        />
                        <IconButton
                            id="clients-list-view"
                            icon="view-list"
                            size={20}
                            iconColor={viewMode === 'list' ? '#fff' : '#666'}
                            style={[
                                styles.toggleButton,
                                viewMode === 'list' && styles.toggleButtonActive,
                            ]}
                            onPress={() => setViewMode('list')}
                        />
                    </View>

                    <IconButton icon="refresh" onPress={() => fetchPatients()} />
                    <Button
                        mode="contained"
                        onPress={() => router.push('/add-client?isOrg=true')}
                        buttonColor="#00695C"
                    >
                        Add Client
                    </Button>
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : patients.length === 0 ? (
                <View style={styles.centered}>
                    <Title>No clients found</Title>
                    <Paragraph>Add your first client to get started</Paragraph>
                </View>
            ) : viewMode === 'grid' ? (
                <View style={styles.grid}>
                    {patients.map((client) => (
                        <ClientCard
                            key={client.id}
                            profile={client as unknown as Profile}
                            onPress={() => navigateToDetail(client.id)}
                            isActive={false}
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.listContainer}>
                    {/* Column headers */}
                    <View style={styles.listHeader}>
                        <View style={{ width: 50 }} />
                        <Text style={[styles.listHeaderText, { flex: 2 }]}>Name</Text>
                        <Text style={[styles.listHeaderText, { flex: 1 }]}>Age/Sex</Text>
                        <Text style={[styles.listHeaderText, { flex: 1.2 }]}>Location</Text>
                        <Text style={[styles.listHeaderText, { flex: 2.5 }]}>Medical Alert</Text>
                        <Text style={[styles.listHeaderText, { flex: 1.2 }]}>Directives</Text>
                    </View>
                    {patients.map((client) => (
                        <ClientListRow
                            key={client.id}
                            profile={client as unknown as Profile}
                            onPress={() => navigateToDetail(client.id)}
                        />
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 24,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    // View toggle
    toggleGroup: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        overflow: 'hidden',
    },
    toggleButton: {
        borderRadius: 0,
        margin: 0,
        backgroundColor: 'transparent',
    },
    toggleButtonActive: {
        backgroundColor: '#00695C',
    },
    // Grid mode
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    // List mode
    listContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    listHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        alignItems: 'center',
    },
    listHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9e9e9e',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingRight: 12,
    },
    // Shared
    centered: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
