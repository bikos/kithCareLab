import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Linking, TouchableOpacity } from 'react-native';
import { Card, Text, Button, IconButton, Portal, Modal, TextInput, Checkbox, Menu, Divider, Chip } from 'react-native-paper';
import { useCaregiverStore, EmergencyContact } from '../store/caregiverStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
    profileId: string;
}

export const EmergencyContactsSection: React.FC<Props> = ({ profileId }) => {
    const { emergencyContacts, fetchEmergencyContacts, addEmergencyContact, deleteEmergencyContact, loading } = useCaregiverStore();
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [relationship, setRelationship] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);

    useEffect(() => {
        fetchEmergencyContacts(profileId);
    }, [profileId]);

    const handleSave = async () => {
        if (!name) {
            Alert.alert('Error', 'Name is required');
            return;
        }
        try {
            if (editingId) {
                // Update existing contact
                await useCaregiverStore.getState().updateEmergencyContact(editingId, {
                    name,
                    phone,
                    email,
                    relationship,
                    is_primary: isPrimary
                });
            } else {
                // Add new contact
                await addEmergencyContact({
                    profile_id: profileId,
                    name,
                    phone,
                    email,
                    relationship,
                    is_primary: isPrimary
                });
            }
            setVisible(false);
            resetForm();
        } catch (error) {
            Alert.alert('Error', editingId ? 'Failed to update contact' : 'Failed to add contact');
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Contact', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteEmergencyContact(id) }
        ]);
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setEmail('');
        setRelationship('');
        setIsPrimary(false);
        setEditingId(null);
    };

    const handleEdit = (contact: EmergencyContact) => {
        setName(contact.name);
        setPhone(contact.phone || '');
        setEmail(contact.email || '');
        setRelationship(contact.relationship || '');
        setIsPrimary(contact.is_primary || false);
        setEditingId(contact.id);
        setVisible(true);
    };

    const handleCall = (phoneNumber?: string) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        }
    };

    const handleEmail = (emailAddress?: string) => {
        if (emailAddress) {
            Linking.openURL(`mailto:${emailAddress}`);
        }
    };

    const primaryContact = emergencyContacts.find(c => c.is_primary) || emergencyContacts[0];
    const otherContacts = emergencyContacts.filter(c => c.id !== primaryContact?.id);

    const renderContact = (contact: EmergencyContact, isMain: boolean) => (
        <View key={contact.id} style={isMain ? styles.mainContactContainer : styles.otherContactContainer}>
            <View style={styles.contactInfoCompact}>
                {/* Left: Name and Relationship */}
                <View style={styles.contactLeft}>
                    <Text variant="titleMedium" style={[styles.contactNameCompact, { color: '#E65100' }]} numberOfLines={1}>
                        {contact.name}
                    </Text>
                    <View style={styles.badgesRow}>
                        <Chip icon="account-heart" style={styles.relationshipChipCompact} textStyle={styles.chipTextSmall} compact>
                            {contact.relationship || 'Contact'}
                        </Chip>
                        {contact.is_primary && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>PRIMARY</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Right: Contact Details */}
                <View style={styles.contactRight}>
                    {contact.phone && (
                        <TouchableOpacity
                            style={styles.contactRowCompact}
                            onPress={() => handleCall(contact.phone)}
                        >
                            <MaterialCommunityIcons name="phone" size={16} color="#E65100" />
                            <Text variant="bodySmall" style={[styles.contactDetail, { color: '#E65100', textDecorationLine: 'underline' }]}>
                                {contact.phone}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {contact.email && (
                        <TouchableOpacity
                            style={styles.contactRowCompact}
                            onPress={() => handleEmail(contact.email)}
                        >
                            <MaterialCommunityIcons name="email" size={16} color="#E65100" />
                            <Text variant="bodySmall" style={[styles.contactDetail, { color: '#E65100', textDecorationLine: 'underline' }]} numberOfLines={1}>
                                {contact.email}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Edit/Delete Actions */}
                <View style={styles.actionsRow}>
                    <IconButton
                        icon="pencil-outline"
                        size={20}
                        onPress={() => handleEdit(contact)}
                        style={{ margin: 0 }}
                        iconColor="#E65100"
                    />
                    <IconButton
                        icon="delete-outline"
                        size={20}
                        onPress={() => handleDelete(contact.id)}
                        style={{ margin: 0 }}
                        iconColor="#E65100"
                    />
                </View>
            </View>
        </View>
    );

    return (
        <Card style={[styles.sectionCard, styles.emergencyCard]} elevation={2}>
            <Card.Content>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <MaterialCommunityIcons name="phone-alert" size={24} color="#EF6C00" />
                        <Text variant="titleMedium" style={[styles.sectionTitle, { color: '#EF6C00' }]}>Emergency Contact</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <Button mode="text" onPress={() => setVisible(true)} compact textColor="#EF6C00">
                            + Add
                        </Button>
                        {otherContacts.length > 0 && (
                            <IconButton
                                icon={expanded ? "chevron-up" : "chevron-down"}
                                iconColor="#EF6C00"
                                size={24}
                                onPress={() => setExpanded(!expanded)}
                                style={{ margin: 0 }}
                            />
                        )}
                    </View>
                </View>
                <Divider style={[styles.sectionDivider, { backgroundColor: '#FFE0B2' }]} />

                {emergencyContacts.length === 0 ? (
                    <Text style={styles.emptyText}>No emergency contacts listed.</Text>
                ) : (
                    <>
                        {/* Primary Contact (Always Visible) */}
                        {primaryContact && renderContact(primaryContact, true)}

                        {/* Other Contacts (Accordion) */}
                        {expanded && otherContacts.length > 0 && (
                            <View style={styles.expandedList}>
                                <Divider style={[styles.sectionDivider, { backgroundColor: '#FFE0B2', marginVertical: 8 }]} />
                                {otherContacts.map(contact => (
                                    <View key={contact.id}>
                                        {renderContact(contact, false)}
                                        <Divider style={[styles.sectionDivider, { backgroundColor: '#FFE0B2', marginVertical: 8 }]} />
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}

                <Portal>
                    <Modal visible={visible} onDismiss={() => { setVisible(false); resetForm(); }} contentContainerStyle={styles.modal}>
                        <Text variant="titleLarge" style={styles.modalTitle}>{editingId ? 'Edit' : 'Add'} Emergency Contact</Text>
                        <TextInput label="Name" value={name} onChangeText={setName} style={styles.input} mode="outlined" />
                        <TextInput label="Phone" value={phone} onChangeText={setPhone} style={styles.input} mode="outlined" keyboardType="phone-pad" />
                        <TextInput label="Relationship" value={relationship} onChangeText={setRelationship} style={styles.input} mode="outlined" />
                        <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} mode="outlined" keyboardType="email-address" />

                        <View style={styles.checkboxContainer}>
                            <Checkbox status={isPrimary ? 'checked' : 'unchecked'} onPress={() => setIsPrimary(!isPrimary)} />
                            <Text onPress={() => setIsPrimary(!isPrimary)}>Set as Primary Contact</Text>
                        </View>

                        <View style={styles.buttonRow}>
                            <Button onPress={() => { setVisible(false); resetForm(); }} style={styles.button}>Cancel</Button>
                            <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button}>{editingId ? 'Update' : 'Add'}</Button>
                        </View>
                    </Modal>
                </Portal>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    // Card Styles
    sectionCard: {
        marginBottom: 16,
        marginHorizontal: 16,
        backgroundColor: 'white',
    },
    emergencyCard: {
        backgroundColor: '#FFF3E0', // Light orange background
        borderLeftWidth: 4,
        borderLeftColor: '#EF6C00', // Orange accent
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionDivider: {
        marginBottom: 12,
    },

    // Contact Layout
    mainContactContainer: {
        marginBottom: 4,
    },
    otherContactContainer: {
        marginVertical: 4,
    },
    expandedList: {
        marginTop: 8,
    },
    contactInfoCompact: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-start',
    },
    contactLeft: {
        flex: 1,
        gap: 4,
    },
    contactRight: {
        flex: 1,
        gap: 6,
        alignItems: 'flex-end',
    },

    // Text & Badges
    contactNameCompact: {
        fontWeight: '600',
        fontSize: 16,
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    relationshipChipCompact: {
        alignSelf: 'flex-start',
        height: 24,
        backgroundColor: 'rgba(239, 108, 0, 0.1)', // Light orange tint
    },
    chipTextSmall: {
        fontSize: 10,
        marginVertical: 2,
        lineHeight: 14,
        color: '#E65100',
    },
    badge: {
        backgroundColor: '#E65100',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 9,
        color: 'white',
        fontWeight: 'bold',
    },

    // Contact Actions
    contactRowCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    contactDetail: {
        fontSize: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Empty State
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 8,
    },

    // Modal Styles
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        marginBottom: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    button: {
        minWidth: 80,
    }
});
