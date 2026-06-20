import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Modal, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface JournalEntryDetailModalProps {
    visible: boolean;
    onDismiss: () => void;
    entry: any;
}

export function JournalEntryDetailModal({ visible, onDismiss, entry }: JournalEntryDetailModalProps) {
    if (!entry) return null;

    const moodConfig: { [key: string]: { emoji: string; color: string } } = {
        happy: { emoji: '😊', color: '#4CAF50' },
        calm: { emoji: '😌', color: '#2196F3' },
        sad: { emoji: '😢', color: '#2196F3' },
        anxious: { emoji: '😰', color: '#FF9800' },
        angry: { emoji: '😠', color: '#F44336' },
        tired: { emoji: '😴', color: '#9E9E9E' },
    };

    const mood = moodConfig[entry.mood || ''] || { emoji: '📝', color: '#00695C' };

    // Parse content
    const lines = entry.content.split('\n').filter((l: string) => l.trim());
    const hasLabels = lines.some((l: string) => l.startsWith('Feelings:') || l.startsWith('Activities:'));

    let feelings: string[] = [];
    let activities = '';
    let notes = '';

    if (hasLabels) {
        const feelingsLine = lines.find((l: string) => l.startsWith('Feelings:'));
        const activitiesLine = lines.find((l: string) => l.startsWith('Activities:'));
        feelings = feelingsLine ? feelingsLine.replace('Feelings:', '').trim().split(', ').filter((f: string) => f) : [];
        activities = activitiesLine ? activitiesLine.replace('Activities:', '').trim() : '';
        notes = lines.filter((l: string) => !l.startsWith('Feelings:') && !l.startsWith('Activities:')).join(' ').trim();
    } else {
        if (lines[0] && lines[0].includes(',')) {
            feelings = lines[0].split(', ').filter((f: string) => f);
            lines.shift();
        }
        if (lines.length > 0 && !lines[0].includes('.')) {
            activities = lines[0];
            lines.shift();
        }
        notes = lines.join(' ').trim();
    }

    if (!feelings.length && !activities && !notes) {
        notes = entry.content;
    }

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modalContainer}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name="notebook" size={24} color={mood.color} />
                            </View>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.emoji}>{mood.emoji}</Text>
                                    <Text variant="titleMedium" style={{ color: mood.color, fontWeight: 'bold' }}>
                                        {entry.mood ? entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1) : 'Journal Entry'}
                                    </Text>
                                </View>
                                <Text variant="bodySmall" style={styles.date}>
                                    {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Photo */}
                    {entry.photo_url && (
                        <View style={styles.photoContainer}>
                            <Image
                                source={{ uri: entry.photo_url }}
                                style={styles.photo}
                                resizeMode="contain"
                            />
                            {entry.caption && (
                                <Text style={styles.caption}>{entry.caption}</Text>
                            )}
                        </View>
                    )}

                    {/* Content */}
                    <View style={styles.content}>
                        {activities && (
                            <View style={styles.row}>
                                <MaterialCommunityIcons name="run" size={20} color={mood.color} />
                                <Text variant="bodyMedium" style={styles.text}>
                                    {activities}
                                </Text>
                            </View>
                        )}
                        {notes && (
                            <View style={styles.row}>
                                <MaterialCommunityIcons name="note-text" size={20} color={mood.color} />
                                <Text variant="bodyMedium" style={styles.text}>
                                    {notes}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Button mode="contained" onPress={onDismiss} style={styles.closeButton}>
                        Close
                    </Button>
                </ScrollView>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 12,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emoji: {
        fontSize: 32,
    },
    date: {
        color: '#666',
    },
    photoContainer: {
        marginBottom: 20,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
    },
    photo: {
        width: '100%',
        height: 200,
    },
    caption: {
        padding: 8,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    content: {
        gap: 16,
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    text: {
        flex: 1,
        lineHeight: 22,
        color: '#333',
    },
    closeButton: {
        marginTop: 10,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
