

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDocumentStore } from '../../store/documentStore';
import { useCaregiverStore } from '../../store/caregiverStore';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AddDocumentScreen() {
    const router = useRouter();
    const { uploadDocument, loading } = useDocumentStore();
    const { currentProfile } = useCaregiverStore();

    const [title, setTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);

    const pickDocument = async () => {
        if (Platform.OS === 'web') {
            try {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,application/pdf';
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                        setSelectedFile({
                            uri: URL.createObjectURL(file),
                            name: file.name,
                            mimeType: file.type,
                        });
                        // Auto-fill title if empty
                        if (!title) {
                            const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
                            setTitle(nameWithoutExt);
                        }
                    }
                };
                input.click();
            } catch (err) {
                console.error('Error picking document on web:', err);
            }
        } else {
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: ['image/*', 'application/pdf'],
                    copyToCacheDirectory: true,
                });

                if (result.canceled) return;

                const asset = result.assets[0];
                setSelectedFile({
                    uri: asset.uri,
                    name: asset.name,
                    mimeType: asset.mimeType,
                });

                // Auto-fill title if empty
                if (!title) {
                    const nameWithoutExt = asset.name.split('.').slice(0, -1).join('.');
                    setTitle(nameWithoutExt);
                }
            } catch (err) {
                console.error('Error picking document:', err);
            }
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !selectedFile) {
            alert('Please provide a title and select a document');
            return;
        }

        try {
            await uploadDocument(title, 'Medical', selectedFile.uri, undefined, selectedFile.name);
            router.back();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Error uploading document. Please try again.');
        }
    };

    if (!currentProfile) {
        return (
            <View style={styles.container}>
                <Text>No individual selected</Text>
            </View>
        );
    }

    const isImage = selectedFile?.mimeType?.startsWith('image/');
    const isPdf = selectedFile?.mimeType === 'application/pdf';

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    Upload document for <Text style={styles.patientName}>{currentProfile.full_name}</Text>
                </Text>
                <Card style={styles.sectionCard}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Document Details</Text>

                        <TextInput
                            label="Document Title *"
                            value={title}
                            onChangeText={setTitle}
                            mode="outlined"
                            style={styles.input}
                            placeholder="e.g., Lab Results, Prescription"
                            placeholderTextColor="#C7C7C7"
                        />

                        <Button
                            mode="outlined"
                            onPress={pickDocument}
                            icon="file-document-outline"
                            style={styles.pickBtn}
                        >
                            {selectedFile ? 'Change Document' : 'Select Document (PDF or Image)'}
                        </Button>

                        {selectedFile && (
                            <View style={styles.previewContainer}>
                                <Text variant="bodySmall" style={styles.previewLabel}>Selected File:</Text>
                                <View style={styles.filePreview}>
                                    {isImage ? (
                                        <Image
                                            source={{ uri: selectedFile.uri }}
                                            style={styles.imagePreview}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.pdfPreview}>
                                            <MaterialCommunityIcons name="file-pdf-box" size={48} color="#E53935" />
                                            <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                <Card style={styles.infoCard}>
                    <Card.Content>
                        <Text variant="bodySmall" style={styles.infoText}>
                            💡 You can upload images (JPG, PNG) or PDF documents.
                        </Text>
                    </Card.Content>
                </Card>
            </ScrollView>

            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={!title || !selectedFile || loading}
                    style={styles.saveBtn}
                >
                    {loading ? 'Uploading...' : 'Upload Document'}
                </Button>
                <Button mode="text" onPress={() => router.back()}>
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
    input: {
        marginBottom: 16,
        backgroundColor: 'white',
        fontSize: 14,
    },
    pickBtn: {
        marginBottom: 16,
    },
    previewContainer: {
        marginTop: 8,
    },
    previewLabel: {
        color: '#666',
        marginBottom: 8,
    },
    filePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    pdfPreview: {
        alignItems: 'center',
        padding: 16,
    },
    fileName: {
        marginTop: 8,
        color: '#333',
        fontWeight: '500',
    },
    infoCard: {
        backgroundColor: '#E8F5E9',
        marginBottom: 16,
    },
    infoText: {
        color: '#2E7D32',
    },
    buttonContainer: {
        backgroundColor: 'transparent',
        padding: 16,
        paddingBottom: 20,
    },
    saveBtn: {
        marginBottom: 8,
    },
});
