import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, TextInput, Button, Card, Chip, IconButton, Divider, SegmentedButtons } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDailyCareStore, DailyCareLog } from '../../store/dailyCareStore';
import { useCaregiverStore } from '../../store/caregiverStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DailyLogScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { individualId, date } = useLocalSearchParams<{ individualId: string; date: string }>();
    const { fetchLog, upsertLog, loading } = useDailyCareStore();
    const { managedProfiles, currentProfile } = useCaregiverStore();

    // Find the individual's name
    const individual = currentProfile?.id === individualId ? currentProfile : managedProfiles.find(p => p.id === individualId);
    const individualName = individual?.full_name || 'Individual';

    const [logDate, setLogDate] = useState(new Date());
    const [sleepHours, setSleepHours] = useState('');
    const [wakeTime, setWakeTime] = useState<Date | null>(null);
    const [bedTime, setBedTime] = useState<Date | null>(null);
    const [sleepQuality, setSleepQuality] = useState<DailyCareLog['sleep_quality'] | undefined>(undefined);
    const [mood, setMood] = useState('');
    const [hydration, setHydration] = useState<DailyCareLog['hydration_level'] | undefined>(undefined);

    // ADL State
    const [adlBathing, setAdlBathing] = useState<DailyCareLog['adl_bathing'] | undefined>(undefined);
    const [adlDressing, setAdlDressing] = useState<DailyCareLog['adl_dressing'] | undefined>(undefined);
    const [adlToileting, setAdlToileting] = useState<DailyCareLog['adl_toileting'] | undefined>(undefined);
    const [adlMobility, setAdlMobility] = useState<DailyCareLog['adl_mobility'] | undefined>(undefined);
    const [adlFeeding, setAdlFeeding] = useState<DailyCareLog['adl_feeding'] | undefined>(undefined);
    const [notes, setNotes] = useState('');

    const [showWakePicker, setShowWakePicker] = useState(false);
    const [showBedPicker, setShowBedPicker] = useState(false);

    useEffect(() => {
        if (date) {
            setLogDate(new Date(date));
        }
    }, [date]);

    useEffect(() => {
        loadLog();
    }, [individualId, logDate]);

    const loadLog = async () => {
        if (!individualId) return;

        // Clear form state immediately to prevent stale data
        setSleepHours('');
        setWakeTime(null);
        setBedTime(null);
        setSleepQuality(undefined);
        setMood('');
        setHydration(undefined);
        setAdlBathing(undefined);
        setAdlDressing(undefined);
        setAdlToileting(undefined);
        setAdlMobility(undefined);
        setAdlFeeding(undefined);
        setNotes('');

        const dateStr = logDate.toISOString().split('T')[0];
        const log = await fetchLog(individualId, dateStr);

        if (log) {
            setSleepHours(log.sleep_hours?.toString() || '');
            setWakeTime(log.wake_time ? new Date(`2000-01-01T${log.wake_time}`) : null);
            setBedTime(log.bed_time ? new Date(`2000-01-01T${log.bed_time}`) : null);
            setSleepQuality(log.sleep_quality);
            setMood(log.mood || '');
            setHydration(log.hydration_level);
            setAdlBathing(log.adl_bathing);
            setAdlDressing(log.adl_dressing);
            setAdlToileting(log.adl_toileting);
            setAdlMobility(log.adl_mobility);
            setAdlFeeding(log.adl_feeding);
            setNotes(log.notes || '');
        } else {
            // Reset form if no log exists for this date
            setSleepHours('');
            setWakeTime(null);
            setBedTime(null);
            setSleepQuality(undefined);
            setMood('');
            setHydration(undefined);
            setAdlBathing(undefined);
            setAdlDressing(undefined);
            setAdlToileting(undefined);
            setAdlMobility(undefined);
            setAdlFeeding(undefined);
            setNotes('');
        }
    };

    const handleSave = async () => {
        if (!individualId) return;

        try {
            const dateStr = logDate.toISOString().split('T')[0];

            await upsertLog({
                individual_id: individualId,
                log_date: dateStr,
                sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
                wake_time: wakeTime ? wakeTime.toTimeString().split(' ')[0] : undefined,
                bed_time: bedTime ? bedTime.toTimeString().split(' ')[0] : undefined,
                sleep_quality: sleepQuality,
                mood,
                hydration_level: hydration,
                adl_bathing: adlBathing,
                adl_dressing: adlDressing,
                adl_toileting: adlToileting,
                adl_mobility: adlMobility,
                adl_feeding: adlFeeding,
                notes
            });

            router.back();
        } catch (error: any) {
            console.error('DailyLog: Save failed:', error);
            Alert.alert('Error', error.message);
        }
    };

    const formatTime = (date: Date | null) => {
        if (!date) return 'Set Time';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>


            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Log for <Text style={styles.patientName}>{individualName}</Text> on {logDate.toDateString()}
                    </Text>

                    <Card style={styles.sectionCard}>
                        <View style={styles.backgroundIconContainer}>
                            <MaterialCommunityIcons name="bed-clock" size={160} color="rgba(92, 107, 192, 0.2)" />
                        </View>
                        <Card.Content style={styles.cardContent}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Sleep</Text>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text variant="labelMedium" style={styles.label}>Hours Slept</Text>
                                    <TextInput
                                        mode="outlined"
                                        value={sleepHours}
                                        onChangeText={setSleepHours}
                                        keyboardType="numeric"
                                        placeholder="e.g. 7.5"
                                        placeholderTextColor="#C7C7C7"
                                        style={styles.input}
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text variant="labelMedium" style={styles.label}>Bed Time</Text>
                                    <Button mode="outlined" onPress={() => setShowBedPicker(true)} style={styles.timeButton}>
                                        {formatTime(bedTime)}
                                    </Button>
                                    {showBedPicker && (
                                        <DateTimePicker
                                            value={bedTime || new Date()}
                                            mode="time"
                                            onChange={(event, selectedDate) => {
                                                setShowBedPicker(false);
                                                if (selectedDate) setBedTime(selectedDate);
                                            }}
                                        />
                                    )}
                                </View>
                                <View style={styles.halfInput}>
                                    <Text variant="labelMedium" style={styles.label}>Wake Time</Text>
                                    <Button mode="outlined" onPress={() => setShowWakePicker(true)} style={styles.timeButton}>
                                        {formatTime(wakeTime)}
                                    </Button>
                                    {showWakePicker && (
                                        <DateTimePicker
                                            value={wakeTime || new Date()}
                                            mode="time"
                                            onChange={(event, selectedDate) => {
                                                setShowWakePicker(false);
                                                if (selectedDate) setWakeTime(selectedDate);
                                            }}
                                        />
                                    )}
                                </View>
                            </View>

                            <Text variant="labelMedium" style={styles.label}>Quality</Text>
                            <View style={styles.chipGroup}>
                                {['good', 'fair', 'poor', 'interrupted'].map((q) => (
                                    <Chip
                                        key={q}
                                        selected={sleepQuality === q}
                                        onPress={() => setSleepQuality(q as any)}
                                        style={styles.chip}
                                        showSelectedOverlay
                                    >
                                        {q.charAt(0).toUpperCase() + q.slice(1)}
                                    </Chip>
                                ))}
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={styles.sectionCard}>
                        <View style={styles.backgroundIconContainer}>
                            <MaterialCommunityIcons name="water-outline" size={160} color="rgba(239, 83, 80, 0.2)" />
                        </View>
                        <Card.Content style={styles.cardContent}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Wellness</Text>

                            <Text variant="labelMedium" style={styles.label}>Hydration</Text>
                            <View style={styles.chipGroup}>
                                {['low', 'medium', 'high'].map((h) => (
                                    <Chip
                                        key={h}
                                        selected={hydration === h}
                                        onPress={() => setHydration(h as any)}
                                        style={styles.chip}
                                        showSelectedOverlay
                                    >
                                        {h.charAt(0).toUpperCase() + h.slice(1)}
                                    </Chip>
                                ))}
                            </View>


                        </Card.Content>
                    </Card>

                    <Card style={styles.sectionCard}>
                        <View style={styles.backgroundIconContainer}>
                            <MaterialCommunityIcons name="human-cane" size={160} color="rgba(76, 175, 80, 0.2)" />
                        </View>
                        <Card.Content style={styles.cardContent}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Activities of Daily Living</Text>

                            {[
                                { label: 'Bathing', value: adlBathing, setter: setAdlBathing },
                                { label: 'Dressing', value: adlDressing, setter: setAdlDressing },
                                { label: 'Toileting', value: adlToileting, setter: setAdlToileting },
                                { label: 'Mobility', value: adlMobility, setter: setAdlMobility },
                                { label: 'Feeding', value: adlFeeding, setter: setAdlFeeding },
                            ].map((adl, index) => (
                                <View key={index} style={styles.adlRow}>
                                    <Text variant="labelMedium" style={styles.label}>{adl.label}</Text>
                                    <SegmentedButtons
                                        value={adl.value || ''}
                                        onValueChange={(val) => adl.setter(val as any)}
                                        buttons={[
                                            { value: 'independent', label: 'Indep' },
                                            { value: 'assisted', label: 'Assist' },
                                            { value: 'dependent', label: 'Dep' },
                                        ]}
                                        style={styles.segmentedButton}
                                        density="small"
                                    />
                                </View>
                            ))}
                        </Card.Content>
                    </Card>

                    <Card style={styles.sectionCard}>
                        <View style={styles.backgroundIconContainer}>
                            <MaterialCommunityIcons name="emoticon-happy-outline" size={160} color="rgba(255, 167, 38, 0.2)" />
                        </View>
                        <Card.Content style={styles.cardContent}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Mood & Notes</Text>

                            <TextInput
                                label="Overall Mood"
                                value={mood}
                                onChangeText={setMood}
                                mode="outlined"
                                style={styles.input}
                                placeholder="e.g. Happy, Anxious, Agitated"
                                placeholderTextColor="#C7C7C7"
                            />

                            <TextInput
                                label="Daily Notes"
                                value={notes}
                                onChangeText={setNotes}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                style={[styles.input, { height: 100 }]}
                                placeholder="Any significant events or observations..."
                                placeholderTextColor="#C7C7C7"
                            />
                        </Card.Content>
                    </Card>
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveBtn}>
                        Save Log
                    </Button>
                    <Button mode="text" onPress={() => router.back()}>
                        Cancel
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 10,
        paddingBottom: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontWeight: 'bold',
        color: '#00695C',
        fontSize: 18,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    subtitle: {
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    patientName: {
        fontWeight: '600',
        color: '#00695C',
    },
    sectionCard: {
        marginBottom: 16,
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    cardContent: {
        zIndex: 1,
        padding: 16,
    },
    backgroundIconContainer: {
        position: 'absolute',
        right: -20,
        top: -20,
        opacity: 0.5,
        zIndex: 0,
    },
    sectionTitle: {
        marginBottom: 16,
        fontWeight: '600',
        color: '#00695C',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    halfInput: {
        width: '48%',
    },
    input: {
        backgroundColor: 'white',
        marginBottom: 12,
        fontSize: 14,
    },
    timeButton: {
        marginTop: 6,
        borderColor: '#BDBDBD',
        backgroundColor: 'white',
    },
    label: {
        marginBottom: 4,
        color: '#666',
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    chip: {
        backgroundColor: '#F5F5F5',
    },
    divider: {
        marginVertical: 16,
    },
    buttonContainer: {
        backgroundColor: 'transparent',
        padding: 16,
        paddingBottom: 30,
    },
    saveBtn: {
        marginBottom: 8,
        backgroundColor: '#00695C',
    },
    adlRow: {
        marginBottom: 16,
    },
    segmentedButton: {
        marginTop: 4,
    },
});
