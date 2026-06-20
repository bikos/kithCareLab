import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Text, TextInput, Button, Chip, Switch, Menu, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useMedicationStore } from '../../store/medicationStore';
import { useCaregiverStore } from '../../store/caregiverStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

const FREQUENCY_PRESETS = [
    'Once Daily',
    'Twice Daily',
    'Three Times Daily',
    'Four Times Daily',
    'Every Other Day',
    'Weekly',
    'As Needed',
    'Custom',
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddMedicationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { addMedication, loading } = useMedicationStore();
    const { currentProfile } = useCaregiverStore();

    // Animation for status bar
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('Once Daily');
    const [customFrequency, setCustomFrequency] = useState('');
    const [showFrequencyMenu, setShowFrequencyMenu] = useState(false);

    // New fields
    const [instructions, setInstructions] = useState('');
    const [prescribedBy, setPrescribedBy] = useState('');

    // Scheduling
    const [enableSchedule, setEnableSchedule] = useState(false);
    const [scheduledTime, setScheduledTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>(['Daily']);

    const handleSave = async () => {
        if (!name || !dosage) {
            alert('Please enter medication name and dosage');
            return;
        }

        try {
            const finalFrequency = frequency === 'Custom' ? customFrequency : frequency;

            if (frequency === 'Custom' && !customFrequency.trim()) {
                alert('Please enter custom frequency');
                return;
            }

            // Format time as HH:MM:SS for PostgreSQL TIME type
            const timeString = enableSchedule
                ? scheduledTime.toTimeString().split(' ')[0]
                : undefined;

            const daysArray = enableSchedule ? selectedDays : undefined;

            await addMedication(
                name,
                dosage,
                finalFrequency,
                timeString,
                daysArray,
                instructions.trim() || undefined,
                prescribedBy.trim() || undefined
            );
            router.back();
        } catch (error) {
            console.error('Error adding medication:', error);
            alert('Error saving medication. Please try again.');
        }
    };

    const toggleDay = (day: string) => {
        if (day === 'Daily') {
            setSelectedDays(['Daily']);
        } else {
            const newDays = selectedDays.filter(d => d !== 'Daily');
            if (selectedDays.includes(day)) {
                const filtered = newDays.filter(d => d !== day);
                setSelectedDays(filtered.length > 0 ? filtered : ['Daily']);
            } else {
                setSelectedDays([...newDays, day]);
            }
        }
    };

    if (!currentProfile) {
        return (
            <View style={styles.container}>
                <Text>No individual selected</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.statusBarOverlay,
                    {
                        height: insets.top,
                        opacity: headerOpacity,
                        backgroundColor: '#6fc543ff',
                    },
                ]}
            />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.formContainer}
                    contentContainerStyle={styles.formContent}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Add medication for <Text style={styles.patientName}>{currentProfile.full_name}</Text>
                    </Text>

                    {/* Basic Information */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>Medication Details</Text>

                    <TextInput
                        label="Medication Name *"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                        placeholder="e.g., Aspirin, Lisinopril"
                    />

                    <TextInput
                        label="Dosage *"
                        value={dosage}
                        onChangeText={setDosage}
                        mode="outlined"
                        style={styles.input}
                        placeholder="e.g., 10mg, 1 tablet"
                    />

                    {/* Frequency Selector */}
                    <Text variant="bodyMedium" style={styles.label}>Frequency *</Text>
                    <Menu
                        visible={showFrequencyMenu}
                        onDismiss={() => setShowFrequencyMenu(false)}
                        anchor={
                            <Button
                                mode="outlined"
                                onPress={() => setShowFrequencyMenu(true)}
                                style={styles.frequencyButton}
                                contentStyle={styles.frequencyButtonContent}
                                icon="chevron-down"
                            >
                                {frequency === 'Custom' && customFrequency ? customFrequency : frequency}
                            </Button>
                        }
                    >
                        {FREQUENCY_PRESETS.map((preset) => (
                            <Menu.Item
                                key={preset}
                                onPress={() => {
                                    setFrequency(preset);
                                    setShowFrequencyMenu(false);
                                }}
                                title={preset}
                            />
                        ))}
                    </Menu>

                    {frequency === 'Custom' && (
                        <TextInput
                            label="Custom Frequency"
                            value={customFrequency}
                            onChangeText={setCustomFrequency}
                            mode="outlined"
                            style={styles.input}
                            placeholder="e.g., Every 6 hours, Twice weekly"
                        />
                    )}

                    <TextInput
                        label="Instructions"
                        value={instructions}
                        onChangeText={setInstructions}
                        mode="outlined"
                        style={styles.input}
                        placeholder="e.g., Take with food, Take before bed"
                        multiline
                        numberOfLines={2}
                    />

                    <TextInput
                        label="Prescribed By"
                        value={prescribedBy}
                        onChangeText={setPrescribedBy}
                        mode="outlined"
                        style={styles.input}
                        placeholder="Doctor's name"
                    />

                    <Divider style={styles.divider} />

                    {/* Scheduling Section */}
                    <View style={styles.scheduleSection}>
                        <View style={styles.scheduleHeader}>
                            <View>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    Schedule Reminder
                                </Text>
                                <Text variant="bodySmall" style={styles.scheduleSubtitle}>
                                    Get notified when it's time to take this medication
                                </Text>
                            </View>
                            <Switch
                                value={enableSchedule}
                                onValueChange={setEnableSchedule}
                                color="#00695C"
                            />
                        </View>

                        {enableSchedule && (
                            <>
                                <Text variant="bodyMedium" style={styles.label}>Time</Text>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowTimePicker(true)}
                                    style={styles.timeButton}
                                    contentStyle={styles.timeButtonContent}
                                    icon="clock-outline"
                                >
                                    {scheduledTime.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    })}
                                </Button>

                                {showTimePicker && (
                                    <DateTimePicker
                                        value={scheduledTime}
                                        mode="time"
                                        is24Hour={false}
                                        onChange={(event, selectedTime) => {
                                            setShowTimePicker(Platform.OS === 'ios');
                                            if (selectedTime) {
                                                setScheduledTime(selectedTime);
                                            }
                                        }}
                                    />
                                )}

                                <Text variant="bodyMedium" style={styles.label}>Days</Text>
                                <View style={styles.daysContainer}>
                                    <Chip
                                        selected={selectedDays.includes('Daily')}
                                        onPress={() => toggleDay('Daily')}
                                        style={styles.dayChip}
                                        selectedColor="#00695C"
                                    >
                                        Daily
                                    </Chip>
                                    {DAYS_OF_WEEK.map(day => (
                                        <Chip
                                            key={day}
                                            selected={selectedDays.includes(day)}
                                            onPress={() => toggleDay(day)}
                                            style={styles.dayChip}
                                            selectedColor="#00695C"
                                        >
                                            {day.substring(0, 3)}
                                        </Chip>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>

                    <View style={styles.buttonContainer}>
                        <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveBtn}>
                            Save Medication
                        </Button>
                        <Button mode="text" onPress={() => router.back()}>
                            Cancel
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    statusBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    keyboardView: {
        flex: 1,
    },
    subtitle: {
        color: '#666',
        marginBottom: 20,
        marginTop: 60,
        textAlign: 'center',
    },
    patientName: {
        fontWeight: '600',
        color: '#00695C',
    },
    formContainer: {
        flex: 1,
    },
    formContent: {
        padding: 20,
        paddingBottom: 120,
    },
    sectionTitle: {
        marginBottom: 12,
        marginTop: 8,
        fontWeight: '600',
        color: '#00695C',
    },
    label: {
        marginBottom: 8,
        marginTop: 8,
        color: '#666',
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    frequencyButton: {
        marginBottom: 16,
        backgroundColor: 'white',
        justifyContent: 'flex-start',
    },
    frequencyButtonContent: {
        justifyContent: 'space-between',
        flexDirection: 'row-reverse',
    },
    divider: {
        marginVertical: 20,
    },
    scheduleSection: {
        marginTop: 8,
    },
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    scheduleSubtitle: {
        color: '#999',
        marginTop: 4,
    },
    timeButton: {
        marginBottom: 16,
        backgroundColor: 'white',
        justifyContent: 'flex-start',
    },
    timeButtonContent: {
        justifyContent: 'flex-start',
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayChip: {
        marginBottom: 8,
    },
    buttonContainer: {
        backgroundColor: 'white',
        padding: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    saveBtn: {
        marginBottom: 8,
    },
});
