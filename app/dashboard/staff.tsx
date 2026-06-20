import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Title, DataTable, Avatar, IconButton, Button, Text, ActivityIndicator, Portal, Modal, TextInput, SegmentedButtons, Dialog, Paragraph, Card } from 'react-native-paper';
import { useOrganizationStore } from '../../store/organizationStore';
import { useCaregiverStore } from '../../store/caregiverStore';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function StaffList() {
    const { members, invites, fetchMembers, fetchInvites, loading, organization, resendInvite, deleteInvite, updateMember, updateMemberRole, deactivateMember, activateMember, deleteMember } = useOrganizationStore();
    const router = useRouter();
    const { currentProfile } = useCaregiverStore();
    const [staffViewMode, setStaffViewMode] = React.useState<'list' | 'grid'>('list');

    useEffect(() => {
        if (organization) {
            fetchMembers();
            fetchInvites();
        }
    }, [organization]);

    // Invite modal state
    const [inviteModalVisible, setInviteModalVisible] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [firstName, setFirstName] = React.useState('');
    const [lastName, setLastName] = React.useState('');
    const [inviteRole, setInviteRole] = React.useState('staff');
    const { inviteMember } = useOrganizationStore();
    const [sending, setSending] = React.useState(false);

    // Edit member modal state
    const [editModalVisible, setEditModalVisible] = React.useState(false);
    const [editingMember, setEditingMember] = React.useState<any>(null);
    const [editFirstName, setEditFirstName] = React.useState('');
    const [editLastName, setEditLastName] = React.useState('');
    const [editRole, setEditRole] = React.useState<'admin' | 'nurse' | 'staff'>('staff');

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = React.useState<{
        visible: boolean;
        title: string;
        message: string;
        action: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        action: () => { }
    });

    const handleInvite = async () => {
        if (!email || !firstName || !lastName) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setSending(true);
        try {
            await inviteMember(email, `${firstName} ${lastName}`, inviteRole, firstName, lastName);
            setInviteModalVisible(false);
            setEmail('');
            setFirstName('');
            setLastName('');
            Alert.alert('Success', 'Invite sent! They will check their email.');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setSending(false);
        }
    }

    const handleResendInvite = async (invite: any) => {
        setConfirmDialog({
            visible: true,
            title: 'Resend Invitation',
            message: `Resend invite to ${invite.email}?`,
            action: async () => {
                try {
                    await resendInvite(invite.id, invite.email, invite.email, invite.role);
                    Alert.alert('Success', 'Invitation resent!');
                } catch (e: any) {
                    Alert.alert('Error', e.message);
                }
            }
        });
    };

    const handleDeleteInvite = async (inviteId: string, email: string) => {
        setConfirmDialog({
            visible: true,
            title: 'Delete Invitation',
            message: `Delete pending invitation for ${email}?`,
            action: async () => {
                try {
                    await deleteInvite(inviteId);
                    Alert.alert('Success', 'Invitation deleted');
                } catch (e: any) {
                    Alert.alert('Error', e.message);
                }
            }
        });
    };

    const handleEditMember = (member: any) => {
        setEditingMember(member);
        setEditFirstName(member.profile?.first_name || member.profile?.full_name?.split(' ')[0] || '');
        setEditLastName(member.profile?.last_name || member.profile?.full_name?.split(' ').slice(1).join(' ') || '');
        setEditRole(member.role);
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editingMember || !editFirstName || !editLastName) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await updateMember(editingMember.id, {
                first_name: editFirstName,
                last_name: editLastName,
                full_name: `${editFirstName} ${editLastName}`
            });
            await updateMemberRole(editingMember.id, editRole);
            setEditModalVisible(false);
            Alert.alert('Success', 'Member updated!');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const handleDeactivateMember = (member: any) => {
        setConfirmDialog({
            visible: true,
            title: 'Deactivate Member',
            message: `Deactivate ${member.profile?.full_name}? They will lose access to the organization.`,
            action: async () => {
                try {
                    await deactivateMember(member.id);
                    Alert.alert('Success', 'Member deactivated');
                } catch (e: any) {
                    Alert.alert('Error', e.message);
                }
            }
        });
    };

    const handleActivateMember = (member: any) => {
        setConfirmDialog({
            visible: true,
            title: 'Activate Member',
            message: `Reactivate ${member.profile?.full_name}? They will regain access to the organization.`,
            action: async () => {
                try {
                    await activateMember(member.id);
                    Alert.alert('Success', 'Member activated');
                } catch (e: any) {
                    Alert.alert('Error', e.message);
                }
            }
        });
    };



    const handleDeleteMember = (member: any) => {
        // PERMISSION CHECKS
        const isTargetSuperAdmin = member.profile?.is_super_admin;
        const isTargetAdmin = member.role === 'admin';
        const amISuperAdmin = currentProfile?.is_super_admin;

        // 1. Protection: Nobody can delete a Super Admin (except maybe via database/another super admin, but let's block UI)
        if (isTargetSuperAdmin) {
            Alert.alert('Permission Denied', 'You cannot delete a Super Admin.');
            return;
        }

        // 2. Protection: Admins cannot delete other Admins (Unless they are Super Admin)
        if (isTargetAdmin && !amISuperAdmin) {
            Alert.alert('Permission Denied', 'Admins cannot delete other Admins. Only a Super Admin can do this.');
            return;
        }

        setConfirmDialog({
            visible: true,
            title: 'Delete Member',
            message: `Permanently remove ${member.profile?.full_name} from the organization? This cannot be undone.`,
            action: async () => {
                try {
                    await deleteMember(member.id);
                    Alert.alert('Success', 'Member removed');
                } catch (e: any) {
                    Alert.alert('Error', e.message);
                }
            }
        });
    };

    const handleConfirm = async () => {
        setConfirmDialog({ ...confirmDialog, visible: false });
        await confirmDialog.action();
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Title style={styles.title}>Staff Members</Title>
                <View style={styles.actions}>
                    <IconButton icon="refresh" onPress={() => fetchMembers()} />
                    <Button mode="contained" icon="plus" onPress={() => setInviteModalVisible(true)} buttonColor="#00695C">
                        Invite Staff
                    </Button>
                </View>
            </View>

            {/* Pending Invites Section */}
            <View style={{ marginBottom: 24 }}>
                <Title style={{ fontSize: 20, marginBottom: 16 }}>Pending Invites</Title>
                {invites && invites.length > 0 ? (
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title style={{ flex: 3 }}>Email</DataTable.Title>
                            <DataTable.Title style={{ flex: 1 }}>Role</DataTable.Title>
                            <DataTable.Title style={{ flex: 1 }}>Status</DataTable.Title>
                            <DataTable.Title numeric style={{ flex: 1 }}>Actions</DataTable.Title>
                        </DataTable.Header>
                        {invites.map((invite) => (
                            <DataTable.Row key={invite.id}>
                                <DataTable.Cell style={{ flex: 3 }}>{invite.email}</DataTable.Cell>
                                <DataTable.Cell style={{ flex: 1 }}>{invite.role}</DataTable.Cell>
                                <DataTable.Cell style={{ flex: 1 }}>{invite.status}</DataTable.Cell>
                                <DataTable.Cell numeric style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }}>
                                        <IconButton
                                            icon="email-sync"
                                            size={20}
                                            onPress={() => handleResendInvite(invite)}
                                        />
                                        <IconButton
                                            icon="delete"
                                            size={20}
                                            iconColor="#d32f2f"
                                            onPress={() => handleDeleteInvite(invite.id, invite.email)}
                                        />
                                    </View>
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                ) : (
                    <Text style={{ color: '#666', fontStyle: 'italic' }}>No pending invites.</Text>
                )}
            </View>

            {/* Active Staff Header with View Toggle */}
            <View style={styles.sectionHeader}>
                <Title style={{ ...styles.title, marginBottom: 0 }}>Active Staff</Title>
                {members.length > 0 && (
                    <View style={styles.toggleGroup}>
                        <IconButton
                            id="staff-list-view"
                            icon="view-list"
                            size={20}
                            iconColor={staffViewMode === 'list' ? '#fff' : '#666'}
                            style={[
                                styles.toggleButton,
                                staffViewMode === 'list' && styles.toggleButtonActive,
                            ]}
                            onPress={() => setStaffViewMode('list')}
                        />
                        <IconButton
                            id="staff-grid-view"
                            icon="view-grid"
                            size={20}
                            iconColor={staffViewMode === 'grid' ? '#fff' : '#666'}
                            style={[
                                styles.toggleButton,
                                staffViewMode === 'grid' && styles.toggleButtonActive,
                            ]}
                            onPress={() => setStaffViewMode('grid')}
                        />
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            ) : members.length === 0 ? (
                <View style={styles.centered}>
                    <Title>No staff found</Title>
                    <Text>Invite your team to get started.</Text>
                </View>
            ) : staffViewMode === 'list' ? (
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title style={{ flex: 2 }}>Name</DataTable.Title>
                        <DataTable.Title style={{ flex: 2 }}>Email</DataTable.Title>
                        <DataTable.Title style={{ flex: 0.8 }}>Role</DataTable.Title>
                        <DataTable.Title style={{ flex: 0.8 }}>Status</DataTable.Title>
                        <DataTable.Title style={{ flex: 0.8 }}>Joined</DataTable.Title>
                        <DataTable.Title numeric style={{ flex: 1 }}>Actions</DataTable.Title>
                    </DataTable.Header>

                    {members.map((member) => (
                        <DataTable.Row
                            key={member.id}
                            onPress={() => router.push(`/dashboard/staff-detail?id=${member.id}`)}
                        >
                            <DataTable.Cell style={{ flex: 2 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    {member.profile?.avatar_url ? (
                                        <Avatar.Image size={32} source={{ uri: member.profile.avatar_url }} />
                                    ) : (
                                        <Avatar.Text size={32} label={(member.profile?.full_name || '??').substring(0, 2).toUpperCase()} />
                                    )}
                                    <View>
                                        <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>{member.profile?.full_name || 'Unknown'}</Text>
                                        <Text variant="bodySmall" style={{ color: '#666' }}>{member.profile?.role}</Text>
                                    </View>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell style={{ flex: 2 }}>
                                <Text numberOfLines={1} style={{ fontSize: 13 }}>{member.profile?.email || 'No email'}</Text>
                            </DataTable.Cell>
                            <DataTable.Cell style={{ flex: 0.8 }}>
                                <View style={styles.roleTag}>
                                    <Text style={styles.roleText}>{member.role.toUpperCase()}</Text>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell style={{ flex: 0.8 }}>
                                <View style={{ justifyContent: 'center', height: '100%' }}>
                                    <View style={[
                                        styles.statusChip,
                                        member.status === 'active' ? styles.statusActive : styles.statusInactive
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            member.status === 'active' ? styles.statusTextActive : styles.statusTextInactive
                                        ]}>
                                            {member.status === 'active' ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>
                                </View>
                            </DataTable.Cell>
                            <DataTable.Cell style={{ flex: 0.8 }}>{new Date(member.created_at || Date.now()).toLocaleDateString()}</DataTable.Cell>
                            <DataTable.Cell numeric style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }}>
                                    <IconButton
                                        icon="account-cog"
                                        size={20}
                                        iconColor="#1976d2"
                                        onPress={() => handleEditMember(member)}
                                    />
                                    {member.status === 'active' ? (
                                        <IconButton
                                            icon="account-off"
                                            size={20}
                                            iconColor="#ff9800"
                                            onPress={() => handleDeactivateMember(member)}
                                        />
                                    ) : (
                                        <IconButton
                                            icon="account-check"
                                            size={20}
                                            iconColor="#4caf50"
                                            onPress={() => handleActivateMember(member)}
                                        />
                                    )}
                                    <IconButton
                                        icon="delete"
                                        size={20}
                                        iconColor={
                                            (member.profile?.is_super_admin || (member.role === 'admin' && !currentProfile?.is_super_admin))
                                                ? "#ccc"
                                                : "#d32f2f"
                                        }
                                        disabled={member.profile?.is_super_admin || (member.role === 'admin' && !currentProfile?.is_super_admin)}
                                        onPress={() => handleDeleteMember(member)}
                                    />
                                </View>
                            </DataTable.Cell>
                        </DataTable.Row>
                    ))}
                </DataTable>
            ) : (
                /* Grid / Card View */
                <View style={styles.staffGrid}>
                    {members.map((member) => (
                        <TouchableOpacity
                            key={member.id}
                            onPress={() => router.push(`/dashboard/staff-detail?id=${member.id}`)}
                            style={styles.staffCardWrapper}
                            activeOpacity={0.75}
                        >
                            <Card style={styles.staffCard} elevation={2}>
                                <Card.Content style={styles.staffCardContent}>
                                    <View style={styles.staffCardHeader}>
                                        {member.profile?.avatar_url ? (
                                            <Avatar.Image size={54} source={{ uri: member.profile.avatar_url }} />
                                        ) : (
                                            <Avatar.Text
                                                size={54}
                                                label={(member.profile?.full_name || '??').substring(0, 2).toUpperCase()}
                                                style={{ backgroundColor: '#E0F2F1' }}
                                            />
                                        )}
                                        <View style={styles.staffCardInfo}>
                                            <Text variant="titleMedium" style={styles.staffCardName} numberOfLines={1}>
                                                {member.profile?.full_name || 'Unknown'}
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: '#666' }} numberOfLines={1}>
                                                {member.profile?.email || 'No email'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.staffCardBadges}>
                                        <View style={styles.roleTag}>
                                            <Text style={styles.roleText}>{member.role.toUpperCase()}</Text>
                                        </View>
                                        <View style={[
                                            styles.statusChip,
                                            member.status === 'active' ? styles.statusActive : styles.statusInactive
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                member.status === 'active' ? styles.statusTextActive : styles.statusTextInactive
                                            ]}>
                                                {member.status === 'active' ? 'Active' : 'Inactive'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text variant="labelSmall" style={{ color: '#bbb', marginTop: 8 }}>
                                        Joined {new Date(member.created_at || Date.now()).toLocaleDateString()}
                                    </Text>
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Portal>
                <Modal visible={inviteModalVisible} onDismiss={() => setInviteModalVisible(false)} contentContainerStyle={styles.modalContent}>
                    <Title style={{ marginBottom: 16 }}>Invite Staff Member</Title>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TextInput
                            label="First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                            mode="outlined"
                            style={{ flex: 1, marginBottom: 16, backgroundColor: 'white' }}
                        />
                        <TextInput
                            label="Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                            mode="outlined"
                            style={{ flex: 1, marginBottom: 16, backgroundColor: 'white' }}
                        />
                    </View>

                    <TextInput
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        mode="outlined"
                        style={{ marginBottom: 16, backgroundColor: 'white' }}
                    />

                    <Text variant="titleSmall" style={{ marginBottom: 8 }}>Role</Text>
                    <SegmentedButtons
                        value={inviteRole}
                        onValueChange={setInviteRole}
                        buttons={[
                            { value: 'admin', label: 'Admin' },
                            { value: 'nurse', label: 'Nurse' },
                            { value: 'staff', label: 'Staff' },
                        ]}
                        style={{ marginBottom: 24 }}
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                        <Button onPress={() => setInviteModalVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleInvite} loading={sending}>Send Invite</Button>
                    </View>
                </Modal>

                <Modal visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} contentContainerStyle={styles.modalContent}>
                    <Title style={{ marginBottom: 16 }}>Edit Staff Member</Title>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TextInput
                            label="First Name"
                            value={editFirstName}
                            onChangeText={setEditFirstName}
                            mode="outlined"
                            style={{ flex: 1, marginBottom: 16, backgroundColor: 'white' }}
                        />
                        <TextInput
                            label="Last Name"
                            value={editLastName}
                            onChangeText={setEditLastName}
                            mode="outlined"
                            style={{ flex: 1, marginBottom: 16, backgroundColor: 'white' }}
                        />
                    </View>

                    <Text variant="titleSmall" style={{ marginBottom: 8 }}>Role</Text>
                    <SegmentedButtons
                        value={editRole}
                        onValueChange={(value) => setEditRole(value as 'admin' | 'nurse' | 'staff')}
                        buttons={[
                            { value: 'admin', label: 'Admin' },
                            { value: 'nurse', label: 'Nurse' },
                            { value: 'staff', label: 'Staff' },
                        ]}
                        style={{ marginBottom: 24 }}
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                        <Button onPress={() => setEditModalVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleSaveEdit}>Save Changes</Button>
                    </View>
                </Modal>

                <Dialog
                    visible={confirmDialog.visible}
                    onDismiss={() => setConfirmDialog({ ...confirmDialog, visible: false })}
                    style={{ maxWidth: 500, alignSelf: 'center' }}
                >
                    <Dialog.Title>{confirmDialog.title}</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>{confirmDialog.message}</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setConfirmDialog({ ...confirmDialog, visible: false })}>Cancel</Button>
                        <Button mode="contained" onPress={handleConfirm}>Confirm</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
    // Staff grid
    staffGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    staffCardWrapper: {
        width: 260,
    },
    staffCard: {
        borderRadius: 14,
        backgroundColor: '#fff',
    },
    staffCardContent: {
        padding: 16,
    },
    staffCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    staffCardInfo: {
        marginLeft: 12,
        flex: 1,
    },
    staffCardName: {
        fontWeight: 'bold',
        color: '#212121',
    },
    staffCardBadges: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    centered: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    roleText: {
        color: '#1565C0',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusActive: {
        backgroundColor: '#E8F5E9',
    },
    statusInactive: {
        backgroundColor: '#FFF3E0',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextActive: {
        color: '#2E7D32',
    },
    statusTextInactive: {
        color: '#E65100',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 24,
        margin: 24,
        borderRadius: 8,
    }
});
