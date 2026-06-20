import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text, Card, Divider, Button, List, Chip, Portal, Modal, TextInput, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Profile, useCaregiverStore } from '../../store/caregiverStore';
import { useDocumentStore } from '../../store/documentStore';

interface InfoTabProps {
    profile: Profile;
}

export function InfoTab({ profile }: InfoTabProps) {
    const router = useRouter();
    const { documents, fetchDocuments } = useDocumentStore();
    const { updateProfile } = useCaregiverStore();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleOpenDocument = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Profile Details */}
                <Card style={styles.sectionCard} elevation={1}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <MaterialCommunityIcons name="account-details" size={24} color="#00695C" />
                                <Text variant="titleMedium" style={styles.sectionTitle}>Profile Details</Text>
                            </View>
                            {profile.relationship_role !== 'viewer' && (
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => router.push(`/edit-client?id=${profile.id}`)}
                                >
                                    Edit
                                </Button>
                            )}
                        </View>
                        <Divider style={styles.sectionDivider} />

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="cake" size={20} color="#666" />
                            <View>
                                <Text variant="bodySmall" style={styles.label}>Date of Birth</Text>
                                <Text variant="bodyMedium">{profile.date_of_birth || '--'}</Text>
                            </View>
                        </View>
                        <Divider style={styles.rowDivider} />

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="gender-male-female" size={20} color="#666" />
                            <View>
                                <Text variant="bodySmall" style={styles.label}>Sex</Text>
                                <Text variant="bodyMedium" style={{ textTransform: 'capitalize' }}>{profile.sex || '--'}</Text>
                            </View>
                        </View>
                        <Divider style={styles.rowDivider} />

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                            <View>
                                <Text variant="bodySmall" style={styles.label}>Address</Text>
                                <Text variant="bodyMedium">
                                    {profile.address ? `${profile.address}, ${profile.city || ''} ${profile.state || ''} ${profile.zip_code || ''}` : '--'}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Legal & End of Life */}
                <Card style={styles.sectionCard} elevation={1}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <MaterialCommunityIcons name="gavel" size={24} color="#00695C" />
                                <Text variant="titleMedium" style={styles.sectionTitle}>Legal & Directives</Text>
                            </View>
                            {profile.relationship_role !== 'viewer' && (
                                <IconButton
                                    icon="pencil"
                                    size={20}
                                    onPress={() => router.push(`/edit-legal?id=${profile.id}`)}
                                />
                            )}
                        </View>
                        <Divider style={styles.sectionDivider} />

                        <View style={styles.statusRow}>
                            <Text variant="bodyMedium">DNR Status</Text>
                            <View style={styles.statusActions}>
                                <Chip
                                    icon={profile.dnr_status ? "check" : "close"}
                                    style={profile.dnr_status ? styles.chipActive : styles.chipInactive}
                                    textStyle={profile.dnr_status ? styles.chipTextActive : styles.chipTextInactive}
                                >
                                    {profile.dnr_status ? 'Active' : 'None'}
                                </Chip>
                                {profile.dnr_status && profile.dnr_document_url && (
                                    <Button
                                        mode="text"
                                        compact
                                        onPress={() => handleOpenDocument(profile.dnr_document_url!)}
                                        style={styles.viewDocButton}
                                    >
                                        View Doc
                                    </Button>
                                )}
                            </View>
                        </View>
                        <Divider style={styles.rowDivider} />

                        <View style={styles.statusRow}>
                            <Text variant="bodyMedium">Living Will</Text>
                            <View style={styles.statusActions}>
                                <Chip
                                    icon={profile.living_will_status ? "check" : "close"}
                                    style={profile.living_will_status ? styles.chipActive : styles.chipInactive}
                                    textStyle={profile.living_will_status ? styles.chipTextActive : styles.chipTextInactive}
                                >
                                    {profile.living_will_status ? 'On File' : 'None'}
                                </Chip>
                                {profile.living_will_status && profile.living_will_document_url && (
                                    <Button
                                        mode="text"
                                        compact
                                        onPress={() => handleOpenDocument(profile.living_will_document_url!)}
                                        style={styles.viewDocButton}
                                    >
                                        View Doc
                                    </Button>
                                )}
                            </View>
                        </View>
                        <Divider style={styles.rowDivider} />

                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="account-tie" size={20} color="#666" />
                            <View>
                                <Text variant="bodySmall" style={styles.label}>Power of Attorney</Text>
                                <Text variant="bodyMedium">{profile.poa_name || 'Not designated'}</Text>
                                {profile.poa_phone && <Text variant="bodySmall" style={styles.subText}>{profile.poa_phone}</Text>}
                                {profile.poa_email && <Text variant="bodySmall" style={styles.subText}>{profile.poa_email}</Text>}
                            </View>
                        </View>

                        <Divider style={styles.rowDivider} />
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="book-heart" size={20} color="#666" />
                            <View style={{ flex: 1 }}>
                                <Text variant="bodySmall" style={styles.label}>End of Life Wishes</Text>
                                <Text variant="bodyMedium" numberOfLines={4}>
                                    {profile.end_of_life_wishes || 'Not specified'}
                                </Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Documents */}
                <Card style={styles.sectionCard} elevation={1}>
                    <Card.Content>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <MaterialCommunityIcons name="file-document-multiple" size={24} color="#00695C" />
                                <Text variant="titleMedium" style={styles.sectionTitle}>Documents</Text>
                            </View>
                            {profile.relationship_role !== 'viewer' && (
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => router.push('/add/document')}
                                >
                                    + Add
                                </Button>
                            )}
                        </View>
                        <Divider style={styles.sectionDivider} />

                        {documents.length === 0 ? (
                            <Text style={styles.emptyText}>No documents uploaded yet.</Text>
                        ) : (
                            documents.map((doc) => (
                                <View key={doc.id}>
                                    <TouchableOpacity onPress={() => handleOpenDocument(doc.file_url)} style={styles.documentRow}>
                                        <View style={styles.docIcon}>
                                            <MaterialCommunityIcons
                                                name={doc.file_url.toLowerCase().endsWith('.pdf') ? "file-pdf-box" : "file-image"}
                                                size={32}
                                                color={doc.file_url.toLowerCase().endsWith('.pdf') ? "#E53935" : "#1976D2"}
                                            />
                                        </View>
                                        <View style={styles.docInfo}>
                                            <Text variant="bodyMedium" style={styles.docTitle}>{doc.title}</Text>
                                            <Text variant="bodySmall" style={styles.docDate}>
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                                    </TouchableOpacity>
                                    <Divider style={styles.rowDivider} />
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>
            </ScrollView>

            {/* POA Modal */}
        </>
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        paddingVertical: 4,
    },
    label: {
        color: '#666',
        marginBottom: 2,
    },
    subText: {
        color: '#888',
    },
    rowDivider: {
        marginVertical: 8,
        backgroundColor: '#f0f0f0',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    statusActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    viewDocButton: {
        marginLeft: 4,
    },
    chipActive: {
        backgroundColor: '#E8F5E9',
    },
    chipInactive: {
        backgroundColor: '#F5F5F5',
    },
    chipTextActive: {
        color: '#2E7D32',
    },
    chipTextInactive: {
        color: '#757575',
    },
    documentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    docIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    docInfo: {
        flex: 1,
    },
    docTitle: {
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    docDate: {
        color: '#888',
    },
    emptyText: {
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 16,
    },
});
