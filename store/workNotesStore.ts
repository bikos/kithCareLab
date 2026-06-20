import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface WorkNote {
    id: string;
    individual_id: string;
    created_by: string;
    title: string;
    content: string;
    category?: 'observation' | 'update' | 'coordination' | 'concern' | 'general';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    is_resolved: boolean;
    created_at: string;
    updated_at: string;
    // Joined data
    individual_name?: string;
    individual_avatar_url?: string;
    creator_name?: string;
}

interface WorkNotesState {
    notes: WorkNote[];
    loading: boolean;
    error: string | null;

    fetchNotes: (individualId?: string) => Promise<void>;
    addNote: (note: Omit<WorkNote, 'id' | 'created_at' | 'updated_at' | 'is_resolved'>) => Promise<void>;
    updateNote: (id: string, updates: Partial<WorkNote>) => Promise<void>;
    toggleResolved: (id: string) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
}

export const useWorkNotesStore = create<WorkNotesState>((set, get) => ({
    notes: [],
    loading: false,
    error: null,

    fetchNotes: async (individualId?: string) => {
        set({ loading: true, error: null });
        try {
            let query = supabase
                .from('work_notes')
                .select(`
                    *,
                    individual:individual_id (full_name, avatar_url),
                    creator:created_by (full_name)
                `)
                .order('created_at', { ascending: false });

            if (individualId) {
                query = query.eq('individual_id', individualId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase Error fetching notes:', error);
                throw error;
            }

            console.log('Fetched notes:', data?.length, 'for individual:', individualId || 'ALL');

            const formattedNotes = data.map((note: any) => ({
                ...note,
                individual_name: note.individual?.full_name || 'Unknown Patient',
                individual_avatar_url: note.individual?.avatar_url,
                creator_name: note.creator?.full_name || 'Unknown Caregiver',
            }));

            set({ notes: formattedNotes, loading: false });
        } catch (error: any) {
            console.error('Error fetching notes:', error);
            set({ error: error.message, loading: false });
        }
    },

    addNote: async (note) => {
        set({ loading: true, error: null });
        try {
            let { profile } = useAuthStore.getState();

            // Fallback: If store profile is missing, try to get from session
            if (!profile) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('auth_id', user.id)
                        .single();
                    profile = data;
                }
            }

            if (!profile) throw new Error('No profile found - Please sign in again');

            const { error } = await supabase
                .from('work_notes')
                .insert({
                    ...note,
                    created_by: profile.id,
                    is_resolved: false
                });

            if (error) throw error;

            // Refresh notes
            await get().fetchNotes();
        } catch (error: any) {
            console.error('Error adding work note:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateNote: async (id, updates) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('work_notes')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Refresh notes
            await get().fetchNotes();
        } catch (error: any) {
            console.error('Error updating work note:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    toggleResolved: async (id) => {
        const note = get().notes.find(n => n.id === id);
        if (!note) return;

        await get().updateNote(id, { is_resolved: !note.is_resolved });
    },

    deleteNote: async (id) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('work_notes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Refresh notes
            await get().fetchNotes();
        } catch (error: any) {
            console.error('Error deleting work note:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    }
}));
