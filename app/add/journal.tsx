import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Card, useTheme, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useJournalStore } from '../../store/journalStore';
import { useCaregiverStore } from '../../store/caregiverStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickImage, takePhoto, uploadImageToSupabase } from '../../lib/imageUtils';
import { Image, Alert, ActionSheetIOS } from 'react-native';

const MOODS = [
    { value: 'happy', label: '😊 Happy', emoji: '😊' },
    { value: 'calm', label: '😌 Calm', emoji: '😌' },
    { value: 'sad', label: '😢 Sad', emoji: '😢' },
    { value: 'anxious', label: '😰 Anxious', emoji: '😰' },
    { value: 'angry', label: '😠 Angry', emoji: '😠' },
    { value: 'tired', label: '😴 Tired', emoji: '😴' },
];

const FEELINGS = [
    'Energetic', 'Peaceful', 'Confused', 'Pain', 'Nauseous',
    'Hungry', 'Thirsty', 'Restless', 'Comfortable', 'Alert'
];

export default function AddJournalScreen() {
    const router = useRouter();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { addEntry } = useJournalStore();
    const { currentProfile } = useCaregiverStore();

    // Animation for status bar
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const [mood, setMood] = useState('');
    const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [activities, setActivities] = useState('');
    const [saving, setSaving] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [caption, setCaption] = useState('');

    const toggleFeeling = (feeling: string) => {
        if (selectedFeelings.includes(feeling)) {
            setSelectedFeelings(selectedFeelings.filter(f => f !== feeling));
        } else {
            setSelectedFeelings([...selectedFeelings, feeling]);
        }
    };

    const handleAddPhoto = async () => {
        Alert.alert(
            'Add Photo',
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        const result = await takePhoto();
                        if (result) setImageUri(result.uri);
                    },
                },
                {
                    text: 'Choose from Library',
                    onPress: async () => {
                        const result = await pickImage();
                        if (result) setImageUri(result.uri);
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const handleSave = async () => {
        if (!mood && !notes && !imageUri) {
            alert('Please select a mood, add notes, or add a photo');
            return;
        }

        // Create clean content without mood (mood is stored separately)
        const contentParts = [];

        if (selectedFeelings.length > 0) {
            contentParts.push(`Feelings: ${selectedFeelings.join(', ')}`);
        }
        if (activities) {
            contentParts.push(`Activities: ${activities}`);
        }
        if (notes) {
            contentParts.push(notes);
        }

        const content = contentParts.join('\n\n').trim();

        setSaving(true);
        try {
            let publicUrl = null;
            if (imageUri) {
                publicUrl = await uploadImageToSupabase(
                    imageUri,
                    'journal_photos',
                    `journal/${currentProfile.id}/${Date.now()}.webp`
                );
            }

            await addEntry(content, mood || undefined, publicUrl || undefined, caption || undefined);
            router.back();
        } catch (error) {
            console.error('Error adding journal entry:', error);
            alert('Error saving journal entry. Please try again.');
        } finally {
            setSaving(false);
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
                        Journal entry for <Text style={styles.patientName}>{currentProfile.full_name}</Text>
                    </Text>
                    {/* Mood Selection */}
                    <Card style={styles.sectionCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>How are they feeling? *</Text>
                            <View style={styles.moodGrid}>
                                {MOODS.map((m) => (
                                    <TouchableOpacity
                                        key={m.value}
                                        onPress={() => setMood(m.value)}
                                        style={[
                                            styles.moodBtn,
                                            mood === m.value && styles.moodBtnSelected
                                        ]}
                                    >
                                        <Text style={styles.moodEmoji}>{m.emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {mood && (
                                <Text variant="bodyLarge" style={styles.selectedMood}>
                                    {MOODS.find(m => m.value === mood)?.label}
                                </Text>
                            )}
                        </Card.Content>
                    </Card>

                    {/* Physical/Mental Feelings */}
                    <Card style={styles.sectionCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Physical & Mental State</Text>
                            <View style={styles.chipContainer}>
                                {FEELINGS.map((feeling) => (
                                    <Chip
                                        key={feeling}
                                        selected={selectedFeelings.includes(feeling)}
                                        onPress={() => toggleFeeling(feeling)}
                                        style={styles.chip}
                                    >
                                        {feeling}
                                    </Chip>
                                ))}
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Activities */}
                    <Card style={styles.sectionCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Activities Today</Text>
                            <TextInput
                                value={activities}
                                onChangeText={setActivities}
                                mode="outlined"
                                placeholder="e.g., Walked in the garden, Watched TV"
                                placeholderTextColor="#C7C7C7"
                                multiline
                                numberOfLines={2}
                                style={styles.input}
                                contentStyle={styles.inputContent}
                            />
                        </Card.Content>
                    </Card>

                    {/* Notes */}
                    <Card style={styles.sectionCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Additional Notes</Text>
                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                mode="outlined"
                                placeholder="Any observations, concerns, or highlights..."
                                placeholderTextColor="#C7C7C7"
                                multiline
                                numberOfLines={6}
                                style={styles.input}
                                contentStyle={styles.inputContent}
                            />
                        </Card.Content>
                    </Card>

                    {/* Photo */}
                    <Card style={styles.sectionCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Photo (Optional)</Text>
                            {imageUri ? (
                                <View>
                                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                    <Button mode="text" onPress={() => setImageUri(null)} textColor="red">Remove Photo</Button>
                                    <TextInput
                                        label="Caption"
                                        value={caption}
                                        onChangeText={setCaption}
                                        mode="outlined"
                                        style={styles.input}
                                    />
                                </View>
                            ) : (
                                <Button mode="outlined" icon="camera" onPress={handleAddPhoto}>
                                    Add Photo
                                </Button>
                            )}
                        </Card.Content>
                    </Card>
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <Button mode="contained" onPress={handleSave} loading={saving} style={styles.saveBtn}>
                        Save Entry
                    </Button>
                    <Button mode="text" onPress={() => router.back()}>
                        Cancel
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </View>
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
        marginBottom: 16,
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
        padding: 16,
        paddingBottom: 100,
    },
    sectionCard: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    sectionTitle: {
        marginBottom: 12,
        fontWeight: '600',
        color: '#00695C',
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    moodBtn: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: 'white',
    },
    moodBtnSelected: {
        backgroundColor: '#00695C',
        borderColor: '#00695C',
    },
    moodEmoji: {
        fontSize: 36,
    },
    selectedMood: {
        textAlign: 'center',
        color: '#00695C',
        fontWeight: '600',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        marginBottom: 4,
    },
    input: {
        backgroundColor: 'white',
        fontSize: 14,
    },
    inputContent: {
        paddingTop: 12,
        paddingBottom: 12,
    },
    buttonContainer: {
        backgroundColor: 'transparent',
        padding: 16,
        paddingBottom: 20,
    },
    saveBtn: {
        marginBottom: 8,
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
});
