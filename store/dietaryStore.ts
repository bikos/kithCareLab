import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface DietaryLog {
    id: string;
    individual_id: string;
    created_by: string;
    meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    appetite_level: 'Good' | 'Fair' | 'Poor' | 'Refused';
    notes?: string;
    logged_at: string;
    created_at: string;
}

interface DietaryState {
    logs: DietaryLog[];
    loading: boolean;
    fetchLogs: (individualId: string) => Promise<void>;
    addLog: (log: Omit<DietaryLog, 'id' | 'created_at' | 'created_by'>) => Promise<void>;
    deleteLog: (id: string) => Promise<void>;
}

export const useDietaryStore = create<DietaryState>((set, get) => ({
    logs: [],
    loading: false,
    fetchLogs: async (individualId) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('dietary_logs')
                .select('*')
                .eq('individual_id', individualId)
                .order('logged_at', { ascending: false });

            if (error) throw error;
            set({ logs: data as DietaryLog[] });
        } catch (error) {
            console.error('Error fetching dietary logs:', error);
        } finally {
            set({ loading: false });
        }
    },
    addLog: async (log) => {
        set({ loading: true });
        try {
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
                .from('dietary_logs')
                .insert([{
                    ...log,
                    created_by: caregiverProfile.id
                }]);

            if (error) throw error;
            await get().fetchLogs(log.individual_id);
        } catch (error) {
            console.error('Error adding dietary log:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    deleteLog: async (id) => {
        set({ loading: true });
        try {
            // Get log first to know individual_id for refresh
            const { data: log } = await supabase
                .from('dietary_logs')
                .select('individual_id')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('dietary_logs')
                .delete()
                .eq('id', id);

            if (error) throw error;

            if (log) {
                await get().fetchLogs(log.individual_id);
            }
        } catch (error) {
            console.error('Error deleting dietary log:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    }
}));
