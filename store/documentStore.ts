import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Document {
    id: string;
    user_id: string;
    title: string;
    file_url: string;
    category: string;
    created_at: string;
}

interface DocumentState {
    documents: Document[];
    loading: boolean;
    fetchDocuments: () => Promise<void>;
    uploadDocument: (title: string, category: string, fileUri: string, individualId?: string, originalName?: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
    documents: [],
    loading: false,
    fetchDocuments: async () => {
        set({ loading: true });
        try {
            const { currentProfile } = require('./caregiverStore').useCaregiverStore.getState();
            if (!currentProfile) {
                set({ documents: [] });
                return;
            }

            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', currentProfile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ documents: data as Document[] });
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            set({ loading: false });
        }
    },
    uploadDocument: async (title, category, fileUri, individualId, originalName) => {
        try {
            const { currentProfile } = require('./caregiverStore').useCaregiverStore.getState();
            const targetProfileId = individualId || currentProfile?.id;
            if (!targetProfileId) throw new Error('No profile selected');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // Determine file extension and type
            let fileExt = 'jpg';
            const nameToUse = originalName || fileUri;
            if (nameToUse.includes('.')) {
                fileExt = nameToUse.split('.').pop()?.toLowerCase() || 'jpg';
            }
            // If the URL is a blob, make sure we clean up any query params or hashes in split
            if (fileExt.includes('?')) fileExt = fileExt.split('?')[0];
            if (fileExt.includes('#')) fileExt = fileExt.split('#')[0];

            const fileName = `${targetProfileId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Fetch the file and convert to ArrayBuffer
            const response = await fetch(fileUri);
            const arrayBuffer = await response.arrayBuffer();

            // Determine content type based on extension
            let contentType = 'image/jpeg';
            if (fileExt === 'pdf') contentType = 'application/pdf';
            else if (fileExt === 'png') contentType = 'image/png';
            else if (fileExt === 'jpg' || fileExt === 'jpeg') contentType = 'image/jpeg';

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, arrayBuffer, {
                    contentType: contentType,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // Insert into database
            const { error: dbError } = await supabase
                .from('documents')
                .insert([
                    {
                        user_id: targetProfileId,
                        title,
                        category,
                        file_url: publicUrl,
                    },
                ]);

            if (dbError) throw dbError;
            await get().fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    },
}));
