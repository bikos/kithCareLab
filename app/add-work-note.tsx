import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, useTheme, Chip, Divider, Searchbar, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useWorkNotesStore } from '../store/workNotesStore';
import { useCaregiverStore } from '../store/caregiverStore';

export default function AddWorkNoteScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { addNote, loading } = useWorkNotesStore();
    const { managedProfiles, currentProfile } = useCaregiverStore();

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        individualId: ''
    });

    const [searchQuery, setSearchQuery] = useState('');

    // Get list of individuals
    const individuals = useMemo(() => {
        if (!managedProfiles) return [];
        return managedProfiles.filter(p => p.role === 'individual');
    }, [managedProfiles]);

    // Filter individuals based on search query
    const filteredIndividuals = useMemo(() => {
        if (!searchQuery.trim()) return individuals;
        const query = searchQuery.toLowerCase();
        return individuals.filter(individual => {
            const fullName = `${individual.first_name} ${individual.last_name}`.toLowerCase();
            return fullName.includes(query);
        });
    }, [individuals, searchQuery]);

    // Set default individual
    React.useEffect(() => {
        if (!formData.individualId) {
            if (currentProfile?.role === 'individual') {
                setFormData(prev => ({ ...prev, individualId: currentProfile.id }));
            } else if (individuals.length > 0) {
                setFormData(prev => ({ ...prev, individualId: individuals[0].id }));
            }
        }
    }, [currentProfile, individuals]);

    const handleSave = async () => {
        if (!formData.individualId) {
            Alert.alert('Error', 'Please select a patient');
            return;
        }
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        if (!formData.content.trim()) {
            Alert.alert('Error', 'Please enter content');
            return;
        }

        try {
            await addNote({
                individual_id: formData.individualId,
                title: formData.title.trim(),
                content: formData.content.trim(),
                category: formData.category as any,
                priority: formData.priority as any,
                created_by: '', // Handled by store
            });
            router.back();
        } catch (error) {
            console.error('Error saving note:', error);
            Alert.alert('Error', 'Failed to save note');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>New Work Note</Text>
            </View>

            <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Patient</Text>

                <Searchbar
                    placeholder="Search patients..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                <View style={styles.chipContainer}>
                    {filteredIndividuals.map((individual) => (
                        <Chip
                            key={individual.id}
                            selected={formData.individualId === individual.id}
                            onPress={() => setFormData({ ...formData, individualId: individual.id })}
                            style={styles.chip}
                            showSelectedOverlay
                            avatar={
                                individual.avatar_url ? (
                                    <Avatar.Image size={24} source={{ uri: individual.avatar_url }} />
                                ) : (
                                    <Avatar.Text
                                        size={24}
                                        label={`${individual.first_name?.[0] || ''}${individual.last_name?.[0] || ''}`.toUpperCase()}
                                    />
                                )
                            }
                        >
                            {individual.first_name} {individual.last_name}
                        </Chip>
                    ))}
                </View>

                <TextInput
                    label="Title *"
                    placeholder="Enter a brief title..."
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    style={styles.input}
                    mode="outlined"
                    placeholderTextColor="#999"
                />

                <TextInput
                    label="Content *"
                    placeholder="Enter detailed notes about the patient..."
                    value={formData.content}
                    onChangeText={(text) => setFormData({ ...formData, content: text })}
                    style={[styles.input, styles.textArea]}
                    mode="outlined"
                    multiline
                    numberOfLines={12}
                    placeholderTextColor="#999"
                />

                <Text variant="titleMedium" style={styles.sectionTitle}>Priority</Text>
                <SegmentedButtons
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    buttons={[
                        { value: 'low', label: 'Low' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' },
                    ]}
                    style={styles.segmentedButton}
                />

                <Text variant="titleMedium" style={styles.sectionTitle}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryChipsContent}>
                    {['observation', 'update', 'coordination', 'concern', 'general'].map((cat) => (
                        <Chip
                            key={cat}
                            selected={formData.category === cat}
                            onPress={() => setFormData({ ...formData, category: cat })}
                            style={styles.categoryChip}
                            showSelectedOverlay
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Chip>
                    ))}
                </ScrollView>
            </ScrollView>

            <Divider />
            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    style={styles.saveButton}
                >
                    Save Note
                </Button>
                <Button
                    mode="text"
                    onPress={() => router.back()}
                    style={styles.cancelButton}
                >
                    Cancel
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontWeight: 'bold',
        color: '#00695C',
    },
    formContainer: {
        flex: 1,
    },
    formContent: {
        padding: 20,
    },
    sectionTitle: {
        marginBottom: 12,
        color: '#00695C',
        fontWeight: '500',
    },
    searchBar: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    textArea: {
        minHeight: 150,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    chip: {
        backgroundColor: 'white',
    },
    segmentedButton: {
        marginBottom: 20,
    },
    categoryScroll: {
        marginBottom: 20,
    },
    categoryChipsContent: {
        paddingRight: 10,
    },
    categoryChip: {
        marginRight: 8,
        backgroundColor: 'white',
    },
    buttonContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    saveButton: {
        backgroundColor: '#00695C',
        marginBottom: 8,
    },
    cancelButton: {
        marginTop: 4,
    }
});
