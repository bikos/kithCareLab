import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import { Alert, Platform } from 'react-native';

export interface ImageResult {
    uri: string;
    width: number;
    height: number;
    base64?: string | null;
}

/**
 * Request permission and pick an image from the library.
 */
export const pickImage = async (): Promise<ImageResult | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            base64: asset.base64,
        };
    }

    return null;
};

/**
 * Request permission and take a photo with the camera.
 */
export const takePhoto = async (): Promise<ImageResult | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
        return null;
    }

    const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            base64: asset.base64,
        };
    }

    return null;
};

/**
 * Process image: Resize and convert to WebP with reduced quality.
 */
export const processImage = async (uri: string): Promise<ImageResult> => {
    // Resize to max dimension of 1024px and compress to 60% quality WebP
    const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Resize width to 1024, height auto-scales
        { compress: 0.6, format: ImageManipulator.SaveFormat.WEBP }
    );

    return {
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
    };
};

/**
 * Upload image to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export const uploadImageToSupabase = async (
    uri: string,
    bucket: string,
    path: string
): Promise<string | null> => {
    try {
        // 1. Process the image first (resize & webp)
        const processedImage = await processImage(uri);

        // 2. Create FormData
        const formData = new FormData();

        if (Platform.OS === 'web') {
            // Web: Fetch the blob from the URI
            const response = await fetch(processedImage.uri);
            const blob = await response.blob();
            formData.append('file', blob, 'upload.webp');
        } else {
            // Native: Use the specific object format expected by React Native's fetch
            formData.append('file', {
                uri: processedImage.uri,
                name: 'upload.webp',
                type: 'image/webp',
            } as any);
        }

        // 3. Upload to Supabase
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, formData, {
                contentType: 'image/webp',
                upsert: true,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Upload Failed', 'There was an error uploading the image.');
        return null;
    }
};

// --- Document Picker ---

import * as DocumentPicker from 'expo-document-picker';

export interface DocumentResult {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
}

/**
 * Pick a document from the device.
 */
export const pickDocument = async (): Promise<DocumentResult | null> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*', // Allow all file types
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return null;
        }

        const asset = result.assets[0];
        return {
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType,
            size: asset.size,
        };
    } catch (error) {
        console.error('Error picking document:', error);
        Alert.alert('Error', 'Failed to pick document');
        return null;
    }
};

/**
 * Upload a document to Supabase Storage.
 */
export const uploadDocumentToSupabase = async (
    uri: string,
    bucket: string,
    path: string,
    mimeType: string = 'application/octet-stream'
): Promise<string | null> => {
    try {
        // Create FormData
        const formData = new FormData();
        const filename = path.split('/').pop() || 'document';

        if (Platform.OS === 'web') {
            // Web: Fetch the blob from the URI
            const response = await fetch(uri);
            const blob = await response.blob();
            formData.append('file', blob, filename);
        } else {
            // Native: Use the specific object format expected by React Native's fetch
            formData.append('file', {
                uri,
                name: filename,
                type: mimeType,
            } as any);
        }

        // Upload to Supabase
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, formData, {
                contentType: mimeType,
                upsert: true,
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading document:', error);
        Alert.alert('Upload Failed', 'There was an error uploading the document.');
        return null;
    }
};
