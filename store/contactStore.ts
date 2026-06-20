import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Contact {
    id: string;
    user_id: string;
    name: string;
    phone: string;
    role: string; // 'Family', 'Doctor', 'Emergency', etc.
    photo_url: string | null;
}

interface ContactState {
    contacts: Contact[];
    loading: boolean;
    fetchContacts: () => Promise<void>;
    addContact: (name: string, phone: string, role: string) => Promise<void>;
}

export const useContactStore = create<ContactState>((set, get) => ({
    contacts: [],
    loading: false,
    fetchContacts: async () => {
        set({ loading: true });
        try {
            const { currentProfile } = require('./caregiverStore').useCaregiverStore.getState();
            if (!currentProfile) {
                set({ contacts: [] });
                return;
            }

            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('user_id', currentProfile.id)
                .order('name', { ascending: true });

            if (error) throw error;
            set({ contacts: data as Contact[] });
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            set({ loading: false });
        }
    },
    addContact: async (name, phone, role) => {
        try {
            const { currentProfile } = require('./caregiverStore').useCaregiverStore.getState();
            if (!currentProfile) throw new Error('No profile selected');

            const { error } = await supabase
                .from('contacts')
                .insert([
                    {
                        user_id: currentProfile.id,
                        name,
                        phone,
                        role,
                    },
                ]);

            if (error) throw error;
            await get().fetchContacts();
        } catch (error) {
            console.error('Error adding contact:', error);
            throw error;
        }
    },
}));
