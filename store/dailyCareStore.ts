import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { useAuthStore } from './authStore';

export interface DailyCareLog {
    id: string;
    individual_id: string;
    created_by: string;
    log_date: string;
    sleep_hours?: number;
    wake_time?: string;
    bed_time?: string;
    sleep_quality?: 'good' | 'fair' | 'poor' | 'interrupted';
    mood?: string;
    hydration_level?: 'low' | 'medium' | 'high';

    // ADL Tracking
    adl_bathing?: 'independent' | 'assisted' | 'dependent' | 'not_applicable';
    adl_dressing?: 'independent' | 'assisted' | 'dependent' | 'not_applicable';
    adl_toileting?: 'independent' | 'assisted' | 'dependent' | 'not_applicable';
    adl_mobility?: 'independent' | 'assisted' | 'dependent' | 'not_applicable';
    adl_feeding?: 'independent' | 'assisted' | 'dependent' | 'not_applicable';

    notes?: string;
    created_at: string;
    updated_at: string;
}

interface DailyCareState {
    logs: Record<string, DailyCareLog>; // Keyed by "individualId_date" for easy lookup
    loading: boolean;
    error: string | null;
    fetchLog: (individualId: string, date: string) => Promise<DailyCareLog | null>;
    upsertLog: (log: Partial<DailyCareLog> & { individual_id: string; log_date: string }) => Promise<void>;
}

export const useDailyCareStore = create<DailyCareState>((set, get) => ({
    logs: {},
    loading: false,
    error: null,

    fetchLog: async (individualId, date) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('daily_care_logs')
                .select('*')
                .eq('individual_id', individualId)
                .eq('log_date', date)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                const key = `${individualId}_${date}`;
                set(state => ({
                    logs: { ...state.logs, [key]: data }
                }));
                return data;
            }
            return null;
        } catch (error: any) {
            console.error('Error fetching daily log:', error);
            set({ error: error.message });
            return null;
        } finally {
            set({ loading: false });
        }
    },

    upsertLog: async (log) => {
        set({ loading: true, error: null });

        // Try to get user from store first
        let user = useAuthStore.getState().user;

        // Fallback: If store user is null, try fetching directly from Supabase
        if (!user) {
            const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !supabaseUser) {
                Alert.alert('Error', 'No session found. Please re-login.');
                throw new Error('No user logged in');
            }
            user = supabaseUser;
        }

        try {
            // Get the caregiver's profile ID first
            const { data: caregiverProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('auth_id', user.id)
                .single();

            console.log('DailyCareStore: Caregiver profile:', caregiverProfile, 'Error:', profileError);

            if (profileError || !caregiverProfile) {
                throw new Error('Caregiver profile not found. Please ensure your profile is set up.');
            }

            const dataToUpsert = {
                ...log,
                created_by: caregiverProfile.id,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('daily_care_logs')
                .upsert(dataToUpsert, { onConflict: 'individual_id, log_date' })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const key = `${log.individual_id}_${log.log_date}`;
                set(state => ({
                    logs: { ...state.logs, [key]: data }
                }));
            } else {
                Alert.alert('Warning', 'Saved but no data returned. Check database.');
            }
        } catch (error: any) {
            console.error('Error upserting daily log:', error);
            set({ error: error.message });
            Alert.alert('Store Error', `Failed to save: ${error.message}`);
            throw error;
        } finally {
            set({ loading: false });
        }
    }
}));
