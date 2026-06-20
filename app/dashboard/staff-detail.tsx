import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Avatar, IconButton, DataTable, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useOrganizationStore } from '../../store/organizationStore';

export default function StaffDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // Staff member ID
    const { members, fetchMembers, fetchStaffAssignments } = useOrganizationStore();

    const [staffMember, setStaffMember] = useState<any>(null);
    const [assignedClients, setAssignedClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStaffDetails();
    }, [id]);

    const loadStaffDetails = async () => {
        if (!id) return;

        setLoading(true);
        try {
            // Fetch members if not already loaded
            if (members.length === 0) {
                await fetchMembers();
            }

            // Find the staff member
            // Find the staff member
            const member = members.find(m => m.id === id);

            if (member) {
                setStaffMember(member);

                // Fetch their assigned clients
                if (member.profile_id) {
                    const clients = await fetchStaffAssignments(member.profile_id);
                    setAssignedClients(clients);
                }
            }
        } catch (error: any) {
            console.error('Error loading staff details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!staffMember) {
        return (
            <View style={styles.centered}>
                <Text>Staff member not found</Text>
                <Button onPress={() => router.back()}>Go Back</Button>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
                <Text style={styles.headerTitle}>Staff Details</Text>
                <View style={{ width: 48 }} />
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                {staffMember.profile?.avatar_url ? (
                    <Avatar.Image size={80} source={{ uri: staffMember.profile.avatar_url }} />
                ) : (
                    <Avatar.Text
                        size={80}
                        label={(staffMember.profile?.full_name || '??').substring(0, 2).toUpperCase()}
                    />
                )}
                <Text style={styles.name}>{staffMember.profile?.full_name || 'Unknown'}</Text>
                <Text style={styles.email}>{staffMember.profile?.email || ''}</Text>

                <View style={styles.badges}>
                    <Chip style={styles.roleChip}>{staffMember.role.toUpperCase()}</Chip>
                    <Chip
                        style={[
                            styles.statusChip,
                            staffMember.status === 'active' ? styles.statusActive : styles.statusInactive
                        ]}
                    >
                        {staffMember.status === 'active' ? 'Active' : 'Inactive'}
                    </Chip>
                </View>

                <Text style={styles.joinedText}>
                    Joined: {new Date(staffMember.created_at || Date.now()).toLocaleDateString()}
                </Text>
            </View>

            {/* Assigned Clients Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assigned Clients ({assignedClients.length})</Text>

                {assignedClients.length > 0 ? (
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title style={{ flex: 3 }}>Client Name</DataTable.Title>
                            <DataTable.Title style={{ flex: 2 }}>Access Code</DataTable.Title>
                            <DataTable.Title style={{ flex: 2 }}>Assigned Date</DataTable.Title>
                        </DataTable.Header>
                        {assignedClients.map((client) => (
                            <DataTable.Row
                                key={client.id}
                                onPress={() => router.push(`/dashboard/client-detail?id=${client.id}`)}
                            >
                                <DataTable.Cell style={{ flex: 3 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        {client.avatar_url ? (
                                            <Avatar.Image size={32} source={{ uri: client.avatar_url }} />
                                        ) : (
                                            <Avatar.Text
                                                size={32}
                                                label={(client.full_name || '??').substring(0, 2).toUpperCase()}
                                            />
                                        )}
                                        <Text>{client.full_name}</Text>
                                    </View>
                                </DataTable.Cell>
                                <DataTable.Cell style={{ flex: 2 }}>
                                    <Text style={styles.accessCode}>{client.access_code}</Text>
                                </DataTable.Cell>
                                <DataTable.Cell style={{ flex: 2 }}>
                                    {client.assigned_at ? new Date(client.assigned_at).toLocaleDateString() : '-'}
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No clients assigned yet</Text>
                    </View>
                )}
            </View>
        </ScrollView>
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
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    profileSection: {
        backgroundColor: 'white',
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    roleChip: {
        backgroundColor: '#E3F2FD',
    },
    statusChip: {
        paddingHorizontal: 8,
    },
    statusActive: {
        backgroundColor: '#E8F5E9',
    },
    statusInactive: {
        backgroundColor: '#FFF3E0',
    },
    joinedText: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
    },
    section: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    accessCode: {
        fontFamily: 'monospace',
        color: '#1976d2',
        fontWeight: '600',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
    },
});
