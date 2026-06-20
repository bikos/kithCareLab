import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, TextInput, SegmentedButtons, ActivityIndicator, Divider, useTheme, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShiftStore } from '../store/shiftStore';
import { useWorkNotesStore } from '../store/workNotesStore';
import { useMedicationStore } from '../store/medicationStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EndShiftScreen() {
    const router = useRouter();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const { activeShift, endShift } = useShiftStore();
    const { notes } = useWorkNotesStore();
    const { logs } = useMedicationStore();

    const [handoffNotes, setHandoffNotes] = useState('');
    const [mood, setMood] = useState('Neutral');
    const [loading, setLoading] = useState(false);

    // Calculated Stats
    const [shiftStats, setShiftStats] = useState({ notesCount: 0, medsCount: 0 });

    useEffect(() => {
        if (activeShift) {
            const startTime = new Date(activeShift.start_time);

            // Filter Notes since shift start
            const shiftNotes = notes.filter(n => new Date(n.created_at) >= startTime);

            // Filter Meds since shift start
            let medsCount = 0;
            logs.forEach((logList) => {
                const shiftLogs = logList.filter(l => new Date(l.taken_at) >= startTime && l.status === 'taken');
                medsCount += shiftLogs.length;
            });

            setShiftStats({
                notesCount: shiftNotes.length,
                medsCount: medsCount
            });
        }
    }, [activeShift, notes, logs]);

    const handleConfirm = async () => {
        if (!activeShift) return;
        try {
            setLoading(true);
            await endShift(activeShift.id, {
                notes: handoffNotes,
                mood: mood,
                medsCount: shiftStats.medsCount
            });
            router.back(); // Return to home
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to end shift. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!activeShift) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + 20, alignItems: 'center', justifyContent: 'center' }]}>
                <Text variant="headlineSmall">No Active Shift</Text>
                <Button onPress={() => router.back()} style={{ marginTop: 20 }}>Go Back</Button>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Button icon="arrow-left" mode="text" onPress={() => router.back()} textColor="white">
                    Back
                </Button>
                <Text variant="titleLarge" style={styles.headerTitle}>End Shift</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.intro}>
                            <MaterialCommunityIcons name="clipboard-check-outline" size={40} color={theme.colors.primary} />
                            <View style={{ flex: 1 }}>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Shift Summary</Text>
                                <Text variant="bodyMedium" style={{ color: '#666' }}>
                                    Review your activity before clocking out.
                                </Text>
                            </View>
                        </View>

                        <Divider style={{ marginVertical: 16 }} />

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text variant="headlineMedium" style={{ color: '#1976D2', fontWeight: 'bold' }}>{shiftStats.notesCount}</Text>
                                <Text variant="labelSmall" style={{ color: '#666' }}>NOTES</Text>
                            </View>
                            <View style={[styles.statItem, styles.statBorder]}>
                                <Text variant="headlineMedium" style={{ color: '#388E3C', fontWeight: 'bold' }}>{shiftStats.medsCount}</Text>
                                <Text variant="labelSmall" style={{ color: '#666' }}>MEDS</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>{
                                    Math.max(0, Math.floor((new Date().getTime() - new Date(activeShift.start_time).getTime()) / (1000 * 60 * 60)))
                                }h</Text>
                                <Text variant="labelSmall" style={{ color: '#666' }}>DURATION</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                <Text variant="titleMedium" style={styles.sectionTitle}>Shift Handoff</Text>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleSmall" style={{ marginBottom: 12 }}>How was the shift?</Text>
                        <SegmentedButtons
                            value={mood}
                            onValueChange={setMood}
                            buttons={[
                                { value: 'Calm', label: 'Calm', icon: 'emoticon-happy-outline' },
                                { value: 'Neutral', label: 'Neutral', icon: 'emoticon-neutral-outline' },
                                { value: 'Hectic', label: 'Hectic', icon: 'emoticon-sad-outline' },
                            ]}
                            style={{ marginBottom: 24 }}
                            theme={{ colors: { secondaryContainer: '#E0F2F1' } }}
                        />

                        <TextInput
                            mode="outlined"
                            label="Handoff Notes"
                            placeholder="Key events, behavioral changes, or pending tasks..."
                            placeholderTextColor="#AAA"
                            multiline
                            numberOfLines={10}
                            value={handoffNotes}
                            onChangeText={setHandoffNotes}
                            style={{ backgroundColor: 'white', minHeight: 150, textAlignVertical: 'top' }}
                        />
                    </Card.Content>
                </Card>

            </ScrollView>

            {/* Fixed Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <Button
                    mode="contained"
                    onPress={handleConfirm}
                    loading={loading}
                    disabled={loading}
                    buttonColor="#D32F2F"
                    style={styles.footerButton}
                    contentStyle={{ height: 48 }}
                >
                    End Shift
                </Button>
                <Button
                    mode="outlined"
                    onPress={() => router.back()}
                    style={styles.footerButton}
                    textColor="#666"
                >
                    Cancel
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#00695C', // App Primary
        paddingHorizontal: 8,
        paddingBottom: 16,
    },
    headerTitle: {
        color: 'white',
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100, // Space for footer
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 24,
        elevation: 2,
    },
    intro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#eee',
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        padding: 16,
        paddingTop: 16,
        gap: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    footerButton: {
        borderRadius: 8,
    }
});
