import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, Card, Button, TextInput, Chip, SegmentedButtons, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDietaryStore } from '../../store/dietaryStore';
import { useCaregiverStore } from '../../store/caregiverStore';

export default function LogMealScreen() {
    const router = useRouter();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { individualId } = useLocalSearchParams<{ individualId: string }>();
    const { addLog, loading } = useDietaryStore();
    const { currentProfile } = useCaregiverStore();

    const [mealType, setMealType] = useState<string>('Breakfast');
    const [appetite, setAppetite] = useState<string>('Good');
    const [notes, setNotes] = useState('');

    const handleSave = async () => {
        if (!individualId) {
            Alert.alert('Error', 'Individual ID is required');
            return;
        }

        try {
            await addLog({
                individual_id: individualId,
                meal_type: mealType as any,
                appetite_level: appetite as any,
                notes,
                logged_at: new Date().toISOString()
            });
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to log meal');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        Log meal for <Text style={styles.patientName}>{currentProfile?.full_name || 'Individual'}</Text>
                    </Text>

                    <Card style={styles.sectionCard}>
                        <View style={styles.backgroundIconContainer}>
                            <MaterialCommunityIcons name="food-apple-outline" size={160} color="rgba(76, 175, 80, 0.2)" />
                        </View>
                        <Card.Content style={styles.cardContent}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Meal Details</Text>

                            <Text variant="labelMedium" style={styles.label}>Meal Type</Text>
                            <SegmentedButtons
                                value={mealType}
                                onValueChange={setMealType}
                                buttons={[
                                    { value: 'Breakfast', label: 'Breakfast' },
                                    { value: 'Lunch', label: 'Lunch' },
                                    { value: 'Dinner', label: 'Dinner' },
                                    { value: 'Snack', label: 'Snack' },
                                ]}
                                style={styles.segment}
                                density="medium"
                            />

                            <Text variant="labelMedium" style={styles.label}>Appetite Level</Text>
                            <View style={styles.chipContainer}>
                                {['Good', 'Fair', 'Poor', 'Refused'].map((level) => (
                                    <Chip
                                        key={level}
                                        selected={appetite === level}
                                        onPress={() => setAppetite(level)}
                                        style={styles.chip}
                                        showSelectedOverlay
                                    >
                                        {level}
                                    </Chip>
                                ))}
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={styles.sectionCard}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Notes</Text>
                            <TextInput
                                placeholder="What did they eat?"
                                value={notes}
                                onChangeText={setNotes}
                                style={[styles.input, { height: 100 }]}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                placeholderTextColor="#C7C7C7"
                            />
                        </Card.Content>
                    </Card>
                </ScrollView>

                <View style={styles.buttonContainer}>
                    <Button mode="contained" onPress={handleSave} loading={loading} style={styles.saveBtn}>
                        Save Meal
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
        backgroundColor: '#F5F5F5',
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
        borderRadius: 16,
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
    label: {
        marginBottom: 8,
        color: '#666',
    },
    segment: {
        marginBottom: 24,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    chip: {
        backgroundColor: '#F5F5F5',
    },
    input: {
        backgroundColor: 'white',
        marginBottom: 12,
        fontSize: 14,
    },
    buttonContainer: {
        backgroundColor: 'transparent',
        padding: 16,
        paddingBottom: 30,
    },
    saveBtn: {
        marginBottom: 8,
        backgroundColor: '#2E7D32',
    },
});
