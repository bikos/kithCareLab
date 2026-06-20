import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface JournalEntry {
    id: string;
    user_id: string;
    content: string;
    mood?: string; // happy, neutral, sad, anxious, energetic
    photo_url?: string;
    caption?: string;
    created_at: string;
    created_by: string;
}

interface JournalState {
    entries: JournalEntry[];
    loading: boolean;
    fetchEntries: () => Promise<void>;
    addEntry: (content: string, mood?: string, imageUrl?: string, caption?: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
    entries: [],
    loading: false,
    fetchEntries: async () => {
        set({ loading: true });
        try {
            // Get current profile from caregiver store
            const { currentProfile } = require('./caregiverStore').useCaregiverStore.getState();
            if (!currentProfile) {
                set({ entries: [] });
                return;
            }

            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', currentProfile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ entries: data as JournalEntry[] });
        } catch (error) {
            console.error('Error fetching journal entries:', error);
        } finally {
            set({ loading: false });
        }
    },
    addEntry: async (content, mood, imageUrl, caption) => {
        set({ loading: true });
        try {
            const { currentProfile } = require('./caregiverStore').useCaregiverStore.getState();
            if (!currentProfile) throw new Error('No profile selected');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // Get caregiver profile id
            const { data: caregiverProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('auth_id', user.id)
                .single();

            if (!caregiverProfile) throw new Error('Caregiver profile not found');

            const { error } = await supabase
                .from('journal_entries')
                .insert([
                    {
                        user_id: currentProfile.id, // The Individual
                        created_by: caregiverProfile.id, // The Caregiver
                        content,
                        mood: mood || null,
                        photo_url: imageUrl || null,
                        caption: caption || null,
                    },
                ]);

            if (error) throw error;
            await get().fetchEntries();
        } catch (error) {
            console.error('Error adding journal entry:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },
}));
