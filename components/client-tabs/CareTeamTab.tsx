import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Divider, Button, Avatar, IconButton, Portal, Modal, List, RadioButton, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useClinicianStore } from '../../store/clinicianStore';
import { useCaregiverStore } from '../../store/caregiverStore';
import { useOrganizationStore } from '../../store/organizationStore';

interface CareTeamTabProps {
    profileId: string;
    accessCode?: string;
}

export function CareTeamTab({ profileId, accessCode }: CareTeamTabProps) {
    const router = useRouter();
    const { clinicians, fetchClinicians, loading } = useClinicianStore();
    const [assignModalVisible, setAssignModalVisible] = React.useState(false);

    // Family Invite State
    const [inviteModalVisible, setInviteModalVisible] = React.useState(false);
    const [inviteEmail, setInviteEmail] = React.useState('');
    const [inviteName, setInviteName] = React.useState('');
    const [inviteRole, setInviteRole] = React.useState<'editor' | 'viewer'>('viewer');
    const { createFamilyInvite } = useCaregiverStore();
    const {
        organization,
        fetchCareAssignments,
        assignStaff,
        removeAssignment,
        members
    } = useOrganizationStore();
    const [assignments, setAssignments] = React.useState<any[]>([]);

    useEffect(() => {
        if (profileId) {
            fetchClinicians(profileId);
        }
    }, [profileId]);

    useEffect(() => {
        if (profileId && organization) {
            loadAssignments();
        }
    }, [profileId, organization]);

    const loadAssignments = async () => {
        const data = await fetchCareAssignments(profileId);
        setAssignments(data);
    };

    const [selectedStaffId, setSelectedStaffId] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);

    const handleAssign = async () => {
        if (!selectedStaffId || !accessCode) {
            Alert.alert('Error', 'Access code is required to assign staff.');
            return;
        }
        setSubmitting(true);
        try {
            await assignStaff(accessCode, selectedStaffId);
            setAssignModalVisible(false);
            setSelectedStaffId(null);
            loadAssignments();
        } catch (error: any) {
            console.error('Assignment Error:', error);
            Alert.alert('Error', error.message || 'Failed to assign staff.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail || !inviteName) {
            Alert.alert('Error', 'Please enter both name and email.');
            return;
        }
        setSubmitting(true);
        try {
            await createFamilyInvite(profileId, inviteEmail, inviteName, inviteRole);
            setInviteModalVisible(false);
            setInviteEmail('');
            setInviteName('');
            Alert.alert('Success', 'Invitation sent successfully!');
            // Ideally reload assignments if we want to show pending? 
            // Current list only shows active relationships. 
            // We might want to see pending invites too?
            // For now, assume it works.
        } catch (error: any) {
            console.error('Invite Error:', error);
            Alert.alert('Error', error.message || 'Failed to send invite.');
        } finally {
            setSubmitting(false);
        }
    };

    // Filter assignments
    const staffAssignments = assignments.filter(a => members.some(m => m.profile_id === a.staff_id));
    const familyAssignments = assignments.filter(a => !members.some(m => m.profile_id === a.staff_id));

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Organization Staff Section */}
            {organization && (
                <Card style={styles.sectionCard} elevation={1}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <MaterialCommunityIcons name="badge-account" size={24} color="#00695C" />
                                <Text variant="titleMedium" style={styles.sectionTitle}>Assigned Staff</Text>
                            </View>
                            <Button mode="text" compact onPress={() => setAssignModalVisible(true)}>
                                + Assign
                            </Button>
                        </View>
                        <Divider style={styles.sectionDivider} />

                        {staffAssignments.length > 0 ? (
                            staffAssignments.map((assignment, index) => (
                                <View key={assignment.id}>
                                    <View style={styles.clinicianRow}>
                                        <Avatar.Text
                                            size={40}
                                            label={(assignment.staff?.full_name || '??').substring(0, 2).toUpperCase()}
                                            style={[styles.clinicianAvatar, { backgroundColor: '#E3F2FD' }]}
                                        />
                                        <View style={styles.clinicianInfo}>
                                            <Text variant="titleSmall" style={styles.clinicianName}>{assignment.staff?.full_name}</Text>
                                            <Text variant="bodySmall" style={styles.clinicianSpecialty}>
                                                Facility Staff
                                            </Text>
                                        </View>
                                        <IconButton
                                            icon="close"
                                            size={20}
                                            iconColor="red"
                                            onPress={() => {
                                                Alert.alert('Remove Access', 'Are you sure?', [
                                                    { text: 'Cancel' },
                                                    {
                                                        text: 'Remove', onPress: async () => {
                                                            await removeAssignment(assignment.id);
                                                            loadAssignments();
                                                        }
                                                    }
                                                ])
                                            }}
                                        />
                                    </View>
                                    {index < assignments.length - 1 && <Divider style={styles.entryDivider} />}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text variant="bodySmall" style={styles.emptyText}>No staff assigned yet.</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>
            )}

            {/* Clinicians Section */}
            <Card style={styles.sectionCard} elevation={1}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialCommunityIcons name="doctor" size={24} color="#00695C" />
                            <Text variant="titleMedium" style={styles.sectionTitle}>Specialists</Text>
                        </View>
                        <Button
                            mode="text"
                            compact
                            onPress={() => router.push(`/add/clinician?individualId=${profileId}`)}
                        >
                            + Add
                        </Button>
                    </View>
                    <Divider style={styles.sectionDivider} />

                    {clinicians.length > 0 ? (
                        clinicians.map((clinician, index) => (
                            <TouchableOpacity
                                key={clinician.id}
                                onPress={() => router.push({
                                    pathname: '/clinician-detail',
                                    params: { id: clinician.id, individualId: profileId }
                                })}
                            >
                                <View style={styles.clinicianRow}>
                                    <Avatar.Icon size={40} icon="doctor" style={styles.clinicianAvatar} />
                                    <View style={styles.clinicianInfo}>
                                        <Text variant="titleSmall" style={styles.clinicianName}>{clinician.name}</Text>
                                        <Text variant="bodySmall" style={styles.clinicianSpecialty}>
                                            {clinician.specialty || 'Specialist'}
                                        </Text>
                                    </View>
                                    <IconButton icon="chevron-right" size={20} />
                                </View>
                                {index < clinicians.length - 1 && <Divider style={styles.entryDivider} />}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text variant="bodySmall" style={styles.emptyText}>No specialists added yet.</Text>
                        </View>
                    )}
                </Card.Content>
            </Card>

            {/* Family & Care Team Section */}
            <Card style={styles.sectionCard} elevation={1}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialCommunityIcons name="account-group" size={24} color="#00695C" />
                            <Text variant="titleMedium" style={styles.sectionTitle}>Family & Care Team</Text>
                        </View>
                        <Button mode="text" compact onPress={() => setInviteModalVisible(true)}>
                            + Invite
                        </Button>
                    </View>
                    <Divider style={styles.sectionDivider} />

                    {familyAssignments.length > 0 ? (
                        familyAssignments.map((assignment, index) => (
                            <View key={assignment.id}>
                                <View style={styles.clinicianRow}>
                                    <Avatar.Text
                                        size={40}
                                        label={(assignment.staff?.full_name || '??').substring(0, 2).toUpperCase()}
                                        style={[styles.clinicianAvatar, { backgroundColor: '#F3E5F5' }]}
                                    />
                                    <View style={styles.clinicianInfo}>
                                        <Text variant="titleSmall" style={styles.clinicianName}>{assignment.staff?.full_name}</Text>
                                        <Text variant="bodySmall" style={styles.clinicianSpecialty}>
                                            {assignment.relationship_role === 'owner' ? 'Primary Caregiver' : 'Family Member'}
                                        </Text>
                                    </View>
                                    <IconButton
                                        icon="close"
                                        size={20}
                                        iconColor="red"
                                        onPress={() => {
                                            Alert.alert('Remove Access', 'Are you sure?', [
                                                { text: 'Cancel' },
                                                {
                                                    text: 'Remove', onPress: async () => {
                                                        await removeAssignment(assignment.id);
                                                        loadAssignments();
                                                    }
                                                }
                                            ])
                                        }}
                                    />
                                </View>
                                {index < familyAssignments.length - 1 && <Divider style={styles.entryDivider} />}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text variant="bodySmall" style={styles.emptyText}>No family members invited yet.</Text>
                        </View>
                    )}
                </Card.Content>
            </Card>

            <Portal>
                <Modal visible={assignModalVisible} onDismiss={() => setAssignModalVisible(false)} contentContainerStyle={styles.modalContent}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>Assign Staff Member</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {members.map(member => (
                            <List.Item
                                key={member.id}
                                title={member.profile?.full_name || 'Unknown'}
                                description={member.role}
                                left={props => <Avatar.Text {...props} size={40} label={(member.profile?.full_name || '?').substring(0, 1)} />}
                                right={props => (
                                    <IconButton
                                        {...props}
                                        icon={selectedStaffId === member.profile_id ? 'radiobox-marked' : 'radiobox-blank'}
                                        iconColor={selectedStaffId === member.profile_id ? '#00695C' : '#757575'}
                                        onPress={() => setSelectedStaffId(member.profile_id)}
                                    />
                                )}
                                onPress={() => setSelectedStaffId(member.profile_id)}
                                style={[
                                    styles.memberOption,
                                    selectedStaffId === member.profile_id && { backgroundColor: '#E0F2F1' }
                                ]}
                            />
                        ))}
                    </ScrollView>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
                        <Button onPress={() => setAssignModalVisible(false)} disabled={submitting}>Cancel</Button>
                        <Button
                            mode="contained"
                            onPress={handleAssign}
                            disabled={!selectedStaffId || submitting}
                            loading={submitting}
                        >
                            Confirm
                        </Button>
                    </View>
                </Modal>
            </Portal>

            <Portal>
                <Modal visible={inviteModalVisible} onDismiss={() => setInviteModalVisible(false)} contentContainerStyle={styles.modalContent}>
                    <Text variant="titleLarge" style={{ marginBottom: 16 }}>Invite to Care Team</Text>
                    <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                        Invite a family member or friend to view/manage this resident.
                    </Text>

                    <TextInput
                        label="Full Name"
                        value={inviteName}
                        onChangeText={setInviteName}
                        mode="outlined"
                        style={{ marginBottom: 12, backgroundColor: 'white' }}
                    />

                    <TextInput
                        label="Email Address"
                        value={inviteEmail}
                        onChangeText={setInviteEmail}
                        mode="outlined"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={{ marginBottom: 16, backgroundColor: 'white' }}
                    />

                    <Text variant="titleMedium" style={{ marginBottom: 8 }}>Access Level</Text>
                    <RadioButton.Group onValueChange={value => setInviteRole(value as 'editor' | 'viewer')} value={inviteRole}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <RadioButton value="viewer" color="#00695C" />
                            <Text>Viewer (Read Only)</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <RadioButton value="editor" color="#00695C" />
                            <Text>Editor (Can Update/Add Logs)</Text>
                        </View>
                    </RadioButton.Group>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
                        <Button onPress={() => setInviteModalVisible(false)} disabled={submitting}>Cancel</Button>
                        <Button
                            mode="contained"
                            onPress={handleInvite}
                            disabled={!inviteEmail || !inviteName || submitting}
                            loading={submitting}
                        >
                            Send Invite
                        </Button>
                    </View>
                </Modal>
            </Portal>
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
    clinicianRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    clinicianAvatar: {
        backgroundColor: '#E0F2F1',
        marginRight: 12,
    },
    clinicianInfo: {
        flex: 1,
    },
    clinicianName: {
        fontWeight: '600',
        color: '#333',
    },
    clinicianSpecialty: {
        color: '#666',
    },
    entryDivider: {
        marginVertical: 4,
        backgroundColor: '#f0f0f0',
    },
    emptyState: {
        alignItems: 'center',
        padding: 16,
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 24,
        margin: 24,
        borderRadius: 8,
    },
    memberOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    }
});
