import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, Avatar, IconButton, FAB, Portal, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCaregiverStore } from '../store/caregiverStore';
import { useOrganizationStore } from '../store/organizationStore'; // NEW import
import { useJournalStore } from '../store/journalStore';
import { useMedicationStore } from '../store/medicationStore';
import { useDailyCareStore } from '../store/dailyCareStore';
import { useShiftStore } from '../store/shiftStore';
import { OverviewTab } from '../components/client-tabs/OverviewTab';
import { HealthTab } from '../components/client-tabs/HealthTab';
import { CareTeamTab } from '../components/client-tabs/CareTeamTab';
import { InfoTab } from '../components/client-tabs/InfoTab';
import { JournalEntryDetailModal } from '../components/JournalEntryDetailModal';
import { EndShiftModal } from '../components/EndShiftModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useIsFocused } from '@react-navigation/native';

export default function ClientDetailScreen() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams(); // Get ID directly from params
    const { currentProfile, managedProfiles, setCurrentProfile } = useCaregiverStore();
    const { entries, fetchEntries } = useJournalStore();
    const { medications, fetchMedications } = useMedicationStore();
    const { fetchLog, logs } = useDailyCareStore();
    const { activeShift, fetchActiveShift, startShift, endShift, loading: shiftLoading } = useShiftStore();

    const [activeTab, setActiveTab] = useState('overview');
    const [fabOpen, setFabOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [endShiftModalVisible, setEndShiftModalVisible] = useState(false); // NEW


    // NEW: Also check Organization Store (for Web Dashboard)
    const { patients: orgPatients } = useOrganizationStore();

    // Ensure we have the correct profile
    useEffect(() => {
        if (id && (!currentProfile || currentProfile.id !== id)) {
            // Priority 1: Check Managed Profiles (Mobile/Caregiver)
            let profile = managedProfiles.find(p => p.id === id);

            // Priority 2: Check Organization Patients (Web Dashboard)
            if (!profile && orgPatients.length > 0) {
                profile = orgPatients.find(p => p.id === id);
            }

            if (profile) {
                setCurrentProfile(profile);
            }
        }
    }, [id, managedProfiles, orgPatients]);

    useEffect(() => {
        if (currentProfile) {
            fetchEntries();
            fetchMedications();
            fetchActiveShift();
            const today = new Date().toISOString().split('T')[0];
            fetchLog(currentProfile.id, today);
        }
    }, [currentProfile]);

    if (!currentProfile) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading Client...</Text>
                <Button onPress={() => router.back()}>Go Back</Button>
            </View>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyLog = logs[`${currentProfile.id}_${today}`];
    const recentEntries = entries.slice(0, 10);
    const age = currentProfile.date_of_birth
        ? new Date().getFullYear() - new Date(currentProfile.date_of_birth).getFullYear()
        : null;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <OverviewTab
                        profileId={currentProfile.id}
                        dailyLog={dailyLog}
                        recentEntries={recentEntries}
                        onEntryPress={(entry) => {
                            setSelectedEntry(entry);
                            setDetailModalVisible(true);
                        }}
                    />
                );
            case 'health':
                return (
                    <HealthTab
                        profileId={currentProfile.id}
                        medicalNotes={currentProfile.medical_notes}
                        medications={medications}
                    />
                );
            case 'team':
                return <CareTeamTab profileId={currentProfile.id} accessCode={currentProfile.access_code} />;
            case 'info':
                return <InfoTab profile={currentProfile} />;
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                {/* Web Breadcrumb / Back Navigation */}
                {Platform.OS === 'web' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 16 }}>
                        <Button
                            icon="arrow-left"
                            mode="text"
                            compact
                            onPress={() => router.back()}
                        >
                            Back to List
                        </Button>
                        <Text style={{ color: '#666' }}>/ {currentProfile.full_name}</Text>
                    </View>
                )}

                <View style={styles.headerTop}>
                    <View style={styles.profileInfo}>
                        {currentProfile.avatar_url ? (
                            <Avatar.Image size={50} source={{ uri: currentProfile.avatar_url }} />
                        ) : (
                            <Avatar.Text size={50} label={currentProfile.full_name.substring(0, 2).toUpperCase()} />
                        )}
                        <View style={styles.nameContainer}>
                            <Text variant="titleMedium" style={styles.name}>{currentProfile.full_name}</Text>
                            <Text variant="bodySmall" style={styles.details}>
                                {age ? `${age} yrs` : ''}
                                {currentProfile.sex ? ` • ${currentProfile.sex}` : ''}
                            </Text>
                            {currentProfile.access_code && (
                                <Chip icon="key-variant" compact style={{ marginTop: 4, height: 28 }} textStyle={{ fontSize: 12 }}>
                                    {currentProfile.access_code}
                                </Chip>
                            )}
                        </View>
                    </View>
                    <IconButton icon="cog" onPress={() => router.push(`/edit-client?id=${currentProfile.id}`)} />
                </View>

                {/* Tabs */}
                <View style={styles.tabBar}>
                    {['overview', 'health', 'team', 'info'].map((tab) => (
                        <Button
                            key={tab}
                            mode={activeTab === tab ? 'contained-tonal' : 'text'}
                            onPress={() => setActiveTab(tab)}
                            style={styles.tabButton}
                            compact
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Button>
                    ))}
                </View>
            </View>

            {/* Shift Status Banner */}
            {activeShift && (
                <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6, backgroundColor: 'white' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, gap: 8 }}>
                        <MaterialCommunityIcons name="clock-outline" size={24} color="#1976D2" />
                        <View>
                            <Text variant="titleSmall" style={{ color: '#1976D2', fontWeight: 'bold' }}>Global Shift Active</Text>
                            <Text variant="bodySmall" style={{ color: '#0d47a1' }}>
                                Started at {new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Content */}
            <View style={styles.content}>
                {renderTabContent()}
            </View>

            {/* FAB */}
            <Portal>
                <FAB.Group
                    open={fabOpen}
                    visible={isFocused}
                    icon={fabOpen ? 'close' : 'plus'}
                    actions={[
                        { icon: 'notebook', label: 'Journal', onPress: () => router.push('/add/journal') },
                        { icon: 'pill', label: 'Medication', onPress: () => router.push('/add/medication') },
                        { icon: 'food-apple', label: 'Meal', onPress: () => router.push(`/add/meal?individualId=${currentProfile.id}`) },
                        { icon: 'heart-pulse', label: 'Daily Care', onPress: () => router.push(`/add/daily-log?individualId=${currentProfile.id}&date=${new Date().toISOString()}`) },
                        { icon: 'doctor', label: 'Specialist', onPress: () => router.push(`/add/clinician?individualId=${currentProfile.id}`) },
                    ]}
                    onStateChange={({ open }) => setFabOpen(open)}
                    style={styles.fab}
                />
            </Portal>

            <JournalEntryDetailModal
                visible={detailModalVisible}
                onDismiss={() => setDetailModalVisible(false)}
                entry={selectedEntry}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTop: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    nameContainer: {
        justifyContent: 'center',
    },
    name: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    details: {
        color: '#666',
        textTransform: 'capitalize',
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tabButton: {
        flex: 1,
        marginHorizontal: 2,
    },
    content: {
        flex: 1,
    },
    fab: {
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
});
