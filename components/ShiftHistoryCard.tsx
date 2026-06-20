import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Shift } from '../store/shiftStore';

interface ShiftHistoryCardProps {
    shift: Shift;
    onPress: () => void;
    showCaregiverName?: boolean;
}

export default function ShiftHistoryCard({ shift, onPress, showCaregiverName }: ShiftHistoryCardProps) {
    const startTime = new Date(shift.start_time);
    const endTime = shift.end_time ? new Date(shift.end_time) : null;

    // Helper to format date "MMM d"
    const dateStr = startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeRange = `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}`;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card style={styles.card} elevation={2}>
                <Card.Content style={styles.content}>
                    {/* Header: Date & Time */}
                    <View style={styles.header}>
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons name="calendar-check" size={24} color="#00695C" />
                        </View>
                        <View>
                            <Text variant="titleMedium" style={styles.dateText}>{dateStr}</Text>
                            <Text variant="bodySmall" style={styles.timeText}>{timeRange}</Text>
                            {showCaregiverName && shift.caregiver_name && (
                                <Text style={styles.caregiverText}>By: {shift.caregiver_name.split(' ')[0]}</Text>
                            )}
                        </View>
                    </View>

                    {/* Handoff Note Snippet (Maximized Area) */}
                    <View style={styles.noteContainer}>
                        {shift.handoff_notes ? (
                            <Text numberOfLines={6} style={styles.noteText} ellipsizeMode="tail">
                                "{shift.handoff_notes}"
                            </Text>
                        ) : (
                            <Text style={[styles.noteText, { color: '#AAA', fontStyle: 'normal' }]}>No handoff notes recorded.</Text>
                        )}
                    </View>

                    {/* Stats Footer (Minimal: Icons + Counts only) */}
                    <View style={styles.statsRow}>
                        {/* Mood */}
                        {shift.mood_summary && (
                            <View style={styles.statChip}>
                                <MaterialCommunityIcons name="emoticon-outline" size={16} color="#E65100" />
                                <Text style={styles.statText}>{shift.mood_summary}</Text>
                            </View>
                        )}

                        {/* Notes Count (Icon + Number only) */}
                        {shift.notes_count !== undefined && (
                            <View style={styles.statChip}>
                                <MaterialCommunityIcons name="notebook-outline" size={16} color="#7B1FA2" />
                                <Text style={[styles.statText, { color: '#7B1FA2' }]}>{shift.notes_count}</Text>
                            </View>
                        )}

                        {/* Meds (Icon + Number only) */}
                        {shift.meds_taken_count !== undefined && (
                            <View style={styles.statChip}>
                                <MaterialCommunityIcons name="pill" size={16} color="#1565C0" />
                                <Text style={[styles.statText, { color: '#1565C0' }]}>{shift.meds_taken_count}</Text>
                            </View>
                        )}
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16, // Use standard bottom margin for vertical list
        height: 200, // Fixed Uniform Height restored for scrollability
    },
    content: {
        padding: 16,
        height: '100%',
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2F1',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#B2DFDB',
    },
    dateText: {
        fontWeight: 'bold',
        color: '#333',
    },
    timeText: {
        color: '#666',
    },
    noteContainer: {
        flex: 1, // Take up all remaining space (restored)
        backgroundColor: '#FAFAFA',
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#EEEEEE',
        marginBottom: 12,
    },
    noteText: {
        fontStyle: 'italic',
        color: '#555',
        fontSize: 13,
        lineHeight: 20, // Increased line height for readability
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12, // More spacing between minimal items
        alignItems: 'center',
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        // Removed background for cleaner "text-less" look, or keep subtle
        backgroundColor: '#F5F5F5',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    statText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#E65100',
    },
    caregiverText: {
        fontSize: 12,
        color: '#00695C',
        marginTop: 2,
        fontWeight: 'bold',
    },
});
