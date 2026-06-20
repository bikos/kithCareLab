import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Chip, Checkbox, FAB, Searchbar, SegmentedButtons, Avatar, Portal, Modal, Divider, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useWorkNotesStore } from '../../store/workNotesStore';
import { useCaregiverStore } from '../../store/caregiverStore';
import { useShiftStore, Shift } from '../../store/shiftStore';
import ShiftHistoryCard from '../../components/ShiftHistoryCard';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PRIORITY_COLORS = {
    low: '#9E9E9E',
    normal: '#2196F3',
    high: '#FF9800',
    urgent: '#F44336',
};

const CATEGORY_ICONS: Record<string, string> = {
    observation: 'eye',
    update: 'bell',
    coordination: 'account-group',
    concern: 'alert',
    general: 'note-text',
};

export default function NotesScreen() {
    const router = useRouter();

    // View State
    const [viewMode, setViewMode] = useState<'work' | 'shift'>('work');
    const [shiftViewFilter, setShiftViewFilter] = useState<'mine' | 'team'>('mine');

    // Work Notes Store
    const { notes, loading: notesLoading, fetchNotes, toggleResolved } = useWorkNotesStore();
    const { managedProfiles, currentProfile } = useCaregiverStore();

    // Shift Store
    const { fetchHistory, fetchTeamHistory, recentShifts, teamShifts, loading: shiftLoading } = useShiftStore();

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'resolved'>('active');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

    // Permissions
    const hasWriteAccess = managedProfiles.some(p => p.relationship_role === 'owner' || p.relationship_role === 'editor');
    const getRoleForNote = (individualId?: string) => {
        if (!individualId) return 'viewer'; // General notes -> restrictive by default? Or check org role? Assuming restrictions based on explicit assignment for now.
        // Actually, if it's a general note, maybe we check if they are admin? 
        // For now, let's map individual_id.
        return managedProfiles.find(p => p.id === individualId)?.relationship_role || 'viewer';
    };

    // Initial Load
    useEffect(() => {
        loadData();
    }, [viewMode, shiftViewFilter]);

    // Clear search on mode switch
    useEffect(() => {
        setSearchQuery('');
    }, [viewMode]);

    const loadData = async () => {
        if (viewMode === 'work') {
            await fetchNotes();
        } else {
            if (shiftViewFilter === 'mine') {
                await fetchHistory();
            } else {
                await fetchTeamHistory();
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // --- Work Notes Logic ---
    const filteredWorkNotes = notes.filter(note => {
        if (selectedFilter === 'active' && note.is_resolved) return false;
        if (selectedFilter === 'resolved' && !note.is_resolved) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                note.title.toLowerCase().includes(query) ||
                note.content.toLowerCase().includes(query) ||
                note.individual_name?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    // --- Shift Notes Logic ---
    const shiftsToDisplay = shiftViewFilter === 'mine' ? recentShifts : teamShifts;
    const filteredShifts = shiftsToDisplay.filter(shift => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            (shift.handoff_notes && shift.handoff_notes.toLowerCase().includes(query)) ||
            (shift.caregiver_name && shift.caregiver_name.toLowerCase().includes(query)) ||
            (shift.mood_summary && shift.mood_summary.toLowerCase().includes(query))
        );
    });

    const getIndividualAvatar = (individualId: string) => {
        const individual = [currentProfile, ...managedProfiles].find(p => p?.id === individualId);
        return individual?.avatar_url;
    };

    const getIndividualInitials = (name?: string) => {
        if (!name) return '??';
        return name.substring(0, 2).toUpperCase();
    };

    // --- Render ---
    return (
        <View style={styles.container}>
            {/* Header with Main Toggle */}
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.headerTitle}>Notes</Text>
                <SegmentedButtons
                    key="main-toggle"
                    value={viewMode}
                    onValueChange={(val) => setViewMode(val as 'work' | 'shift')}
                    buttons={[
                        { value: 'work', label: 'Work Notes', icon: 'note-text' },
                        { value: 'shift', label: 'Shift Notes', icon: 'clock-check-outline' },
                    ]}
                    style={styles.mainToggle}
                />
            </View>

            {/* Sub-Filters (Context Sensitive) */}
            <View style={styles.filterContainer}>
                <Searchbar
                    placeholder={viewMode === 'work' ? "Search notes..." : "Search shifts..."}
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                {viewMode === 'work' ? (
                    <SegmentedButtons
                        key="work-filter"
                        value={selectedFilter}
                        onValueChange={(value) => setSelectedFilter(value as 'all' | 'active' | 'resolved')}
                        buttons={[
                            { value: 'all', label: 'All' },
                            { value: 'active', label: 'Active' },
                            { value: 'resolved', label: 'Resolved' },
                        ]}
                        density="small"
                    />
                ) : (
                    <SegmentedButtons
                        key="shift-filter"
                        value={shiftViewFilter}
                        onValueChange={(val) => setShiftViewFilter(val as 'mine' | 'team')}
                        buttons={[
                            { value: 'mine', label: 'My Shifts' },
                            { value: 'team', label: 'Team Shifts' },
                        ]}
                        style={{ width: '100%' }}
                    />
                )}
            </View>

            {/* Main Content Area */}
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {viewMode === 'work' ? (
                    // WORK NOTES LIST
                    filteredWorkNotes.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Card.Content>
                                <Text variant="titleLarge" style={styles.emptyTitle}>
                                    {searchQuery ? '🔍 No matching notes' : selectedFilter === 'resolved' ? '✅ No resolved notes' : '📝 No active notes'}
                                </Text>
                                <Text variant="bodyMedium" style={styles.emptyText}>
                                    {searchQuery ? 'Try adjusting your search' : 'Create a new work note to share with your care team'}
                                </Text>
                            </Card.Content>
                        </Card>
                    ) : (
                        filteredWorkNotes.map((note) => (
                            <Card key={note.id} style={[styles.noteCard, note.is_resolved && styles.resolvedCard]}>
                                <Card.Content>
                                    <View style={styles.noteHeader}>
                                        <View style={styles.patientInfo}>
                                            {note.individual_avatar_url ? (
                                                <Avatar.Image size={32} source={{ uri: note.individual_avatar_url }} />
                                            ) : (
                                                <Avatar.Text size={32} label={getIndividualInitials(note.individual_name)} style={styles.avatar} />
                                            )}
                                            <Text variant="bodySmall" style={styles.patientName}>{note.individual_name}</Text>
                                        </View>
                                        <Checkbox
                                            status={note.is_resolved ? 'checked' : 'unchecked'}
                                            onPress={() => toggleResolved(note.id)}
                                            disabled={getRoleForNote(note.individual_id) === 'viewer'}
                                        />
                                    </View>
                                    <Text variant="titleMedium" style={[styles.noteTitle, note.is_resolved && styles.resolvedText]}>{note.title}</Text>
                                    <Text variant="bodyMedium" style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
                                    <View style={styles.metadataRow}>
                                        {note.category && (
                                            <Chip icon={CATEGORY_ICONS[note.category]} style={styles.categoryChip} textStyle={styles.chipText} compact>{note.category}</Chip>
                                        )}
                                        {note.priority && note.priority !== 'normal' && (
                                            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[note.priority] }]}>
                                                <Text style={styles.priorityText}>{note.priority.toUpperCase()}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.noteFooter}>
                                        <Text variant="bodySmall" style={styles.footerText}>By {note.creator_name} • {format(new Date(note.created_at), 'MMM d, h:mm a')}</Text>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )
                ) : (
                    // SHIFT NOTES LIST - Display as Vertical List
                    <View style={styles.shiftListContainer}>
                        {filteredShifts.length === 0 ? (
                            <Card style={styles.emptyCard}>
                                <Card.Content>
                                    <Text variant="titleLarge" style={styles.emptyTitle}>
                                        {searchQuery ? '🔍 No matching shifts' : 'No shift history found'}
                                    </Text>
                                    <Text variant="bodyMedium" style={styles.emptyText}>
                                        {searchQuery ? 'Try adjusting your search' : 'Completed shifts will appear here'}
                                    </Text>
                                </Card.Content>
                            </Card>
                        ) : (
                            filteredShifts.map((shift) => (
                                <ShiftHistoryCard
                                    key={shift.id}
                                    shift={shift}
                                    onPress={() => setSelectedShift(shift)}
                                    showCaregiverName={shiftViewFilter === 'team'}
                                />
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            {/* FAB for Work Notes only */}
            {viewMode === 'work' && hasWriteAccess && (
                <FAB
                    icon="plus"
                    style={styles.fab}
                    label="New Note"
                    color="white"
                    onPress={() => router.push('/add-work-note')}
                />
            )}

            {/* Shift Detail Modal */}
            <Portal>
                <Modal visible={!!selectedShift} onDismiss={() => setSelectedShift(null)} contentContainerStyle={{ backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 12 }}>
                    {selectedShift && (
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0F2F1', alignItems: 'center', justifyContent: 'center' }}>
                                    <MaterialCommunityIcons name="calendar-check" size={28} color="#00695C" />
                                </View>
                                <View>
                                    <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Shift Details</Text>
                                    <Text variant="bodyMedium" style={{ color: '#666' }}>
                                        {new Date(selectedShift.start_time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </Text>
                                </View>
                            </View>

                            <Divider style={{ marginBottom: 16 }} />

                            <View style={{ gap: 16 }}>
                                <View>
                                    <Text variant="labelLarge" style={{ color: '#00695C', marginBottom: 4 }}>Duration</Text>
                                    <Text variant="bodyLarge">
                                        {new Date(selectedShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {selectedShift.end_time ? new Date(selectedShift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                                    </Text>
                                </View>

                                {selectedShift.handoff_notes && (
                                    <View>
                                        <Text variant="labelLarge" style={{ color: '#00695C', marginBottom: 4 }}>Handoff Notes</Text>
                                        <View style={{ backgroundColor: '#FAFAFA', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#00695C' }}>
                                            <Text style={{ fontStyle: 'italic', color: '#333', lineHeight: 22 }}>
                                                "{selectedShift.handoff_notes}"
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {selectedShift.mood_summary && (
                                        <View style={{ flex: 1, backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="emoticon-outline" size={24} color="#E65100" />
                                            <Text variant="labelMedium" style={{ color: '#E65100', marginTop: 4 }}>Mood</Text>
                                            <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#E65100' }}>{selectedShift.mood_summary}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1, backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="pill" size={24} color="#1565C0" />
                                        <Text variant="labelMedium" style={{ color: '#1565C0', marginTop: 4 }}>Meds</Text>
                                        <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#1565C0' }}>{selectedShift.meds_taken_count ?? 0} Taken</Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#F3E5F5', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="notebook-outline" size={24} color="#7B1FA2" />
                                        <Text variant="labelMedium" style={{ color: '#7B1FA2', marginTop: 4 }}>Notes</Text>
                                        <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: '#7B1FA2' }}>{selectedShift.notes_count ?? 0} Logs</Text>
                                    </View>
                                </View>
                            </View>

                            <Button mode="contained" onPress={() => setSelectedShift(null)} style={{ marginTop: 24, backgroundColor: '#00695C' }}>
                                Close
                            </Button>
                        </View>
                    )}
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { padding: 20, paddingTop: 60, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    headerTitle: { fontWeight: 'bold', color: '#00695C', marginBottom: 12 },
    mainToggle: { marginBottom: 4 },
    filterContainer: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
    shiftFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    searchBar: { marginBottom: 12, backgroundColor: '#F5F5F5', elevation: 0 },
    content: { padding: 16, paddingBottom: 100 },
    emptyCard: { backgroundColor: 'white', marginTop: 20 },
    emptyTitle: { color: '#00695C', marginBottom: 12, textAlign: 'center' },
    emptyText: { color: '#666', textAlign: 'center' },
    noteCard: { marginBottom: 16, backgroundColor: 'white' },
    resolvedCard: { opacity: 0.7, backgroundColor: '#f5f5f5' },
    noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatar: { backgroundColor: '#00695C' },
    patientName: { fontWeight: '600', color: '#00695C' },
    noteTitle: { fontWeight: 'bold', marginBottom: 4 },
    resolvedText: { textDecorationLine: 'line-through', color: '#666' },
    noteContent: { color: '#444', marginBottom: 12 },
    metadataRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    categoryChip: { backgroundColor: '#E0F2F1', height: 32 },
    chipText: { fontSize: 12, color: '#00695C' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    priorityText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    noteFooter: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
    footerText: { color: '#888' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#00695C' },
    shiftListContainer: { width: '100%' },
    modalContainer: { backgroundColor: 'white', padding: 24, margin: 20, borderRadius: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    fullNoteBox: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, minHeight: 100 },
    fullNoteText: { fontSize: 16, lineHeight: 24, color: '#333' },
});
