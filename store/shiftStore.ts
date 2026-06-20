import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Shift {
    id: string;
    caregiver_id: string;
    organization_id?: string;
    start_time: string;
    end_time?: string;
    status: 'active' | 'completed';
    handoff_notes?: string;
    mood_summary?: string;
    meds_taken_count?: number;
    notes_count?: number; // Calculated dynamically
    // Joined
    caregiver_name?: string;
}

interface ShiftState {
    activeShift: Shift | null;
    recentShifts: Shift[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchActiveShift: () => Promise<void>;
    startShift: (organizationId?: string) => Promise<void>;
    endShift: (shiftId: string, summary: { notes: string; mood: string; medsCount: number }) => Promise<void>;
    fetchHistory: () => Promise<void>;
    fetchTeamHistory: () => Promise<void>;
    teamShifts: Shift[];
}

export const useShiftStore = create<ShiftState>((set, get) => ({
    activeShift: null,
    recentShifts: [],
    teamShifts: [],
    loading: false,
    error: null,

    fetchActiveShift: async () => {
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

            if (!profile) return;

            // Check if *this* caregiver has *any* active shift
            const { data, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('caregiver_id', profile.id)
                .eq('status', 'active')
                .single();

            if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
                throw error;
            }

            set({ activeShift: data });
        } catch (error: any) {
            console.error('Error fetching active shift:', error);
            // Don't set error state for missing shift, just null
            set({ activeShift: null });
        } finally {
            set({ loading: false });
        }
    },

    startShift: async (organizationId?: string) => {
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

            if (!profile) throw new Error('No profile found - Please refresh');

            // Ensure no other active shift exists
            if (get().activeShift) throw new Error('Shift already active');

            const { data, error } = await supabase
                .from('shifts')
                .insert({
                    caregiver_id: profile.id,
                    // individual_id is optional/nullable for global shifts
                    individual_id: null,
                    organization_id: organizationId || null,
                    start_time: new Date().toISOString(),
                    status: 'active'
                })
                .select()
                .single();

            if (error) throw error;
            set({ activeShift: data });
        } catch (error: any) {
            console.error('Error starting shift:', error);
            set({ error: error.message, loading: false });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    endShift: async (shiftId, summary) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('shifts')
                .update({
                    end_time: new Date().toISOString(),
                    status: 'completed',
                    handoff_notes: summary.notes,
                    mood_summary: summary.mood,
                    meds_taken_count: summary.medsCount
                })
                .eq('id', shiftId);

            if (error) throw error;
            set({ activeShift: null });

            // Refresh history (global history)
            await get().fetchHistory();
        } catch (error: any) {
            console.error('Error ending shift:', error);
            set({ error: error.message, loading: false });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    fetchTeamHistory: async () => {
        set({ loading: true });
        try {
            let { profile } = useAuthStore.getState();
            if (!profile?.organization_id) {
                // Try to refresh profile if org ID missing
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

            if (!profile?.organization_id) return;

            const { data: shiftsData, error: shiftsError } = await supabase
                .from('shifts')
                .select(`
                    *,
                    caregiver:caregiver_id (full_name)
                `)
                .eq('organization_id', profile.organization_id)
                .neq('caregiver_id', profile.id) // Exclude my own shifts from "Team" view to avoid redundancy
                .order('created_at', { ascending: false })
                .limit(10);

            if (shiftsError) throw shiftsError;

            let formattedShifts = shiftsData.map((s: any) => ({
                ...s,
                caregiver_name: s.caregiver?.full_name || 'Unknown',
                notes_count: 0
            }));

            if (formattedShifts.length > 0) {
                const timestamps = formattedShifts.map((s: any) => new Date(s.start_time).getTime());
                const minTime = new Date(Math.min(...timestamps)).toISOString();
                const caregiverIds = [...new Set(formattedShifts.map((s: any) => s.caregiver_id))];

                const { data: notesData, error: notesError } = await supabase
                    .from('work_notes')
                    .select('id, created_at, created_by')
                    .in('created_by', caregiverIds)
                    .gte('created_at', minTime);

                if (!notesError && notesData) {
                    formattedShifts = formattedShifts.map((shift: any) => {
                        const shiftStart = new Date(shift.start_time).getTime();
                        const shiftEnd = shift.end_time ? new Date(shift.end_time).getTime() : Date.now();

                        const count = notesData.filter((note: any) => {
                            const noteTime = new Date(note.created_at).getTime();
                            return note.created_by === shift.caregiver_id &&
                                noteTime >= shiftStart &&
                                noteTime <= shiftEnd;
                        }).length;

                        return { ...shift, notes_count: count };
                    });
                }
            }

            set({ teamShifts: formattedShifts });
        } catch (error) {
            console.error('Error fetching team history:', error);
        } finally {
            set({ loading: false });
        }
    },

    fetchHistory: async () => {
        set({ loading: true });
        try {
            let { profile } = useAuthStore.getState();
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
            if (!profile) return;

            // 1. Fetch recent shifts
            const { data: shiftsData, error: shiftsError } = await supabase
                .from('shifts')
                .select(`
                    *,
                    caregiver:caregiver_id (full_name)
                `)
                .eq('caregiver_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (shiftsError) throw shiftsError;

            // 2. Fetch Work Notes count for these shifts
            let formattedShifts = shiftsData.map((s: any) => ({
                ...s,
                caregiver_name: s.caregiver?.full_name || 'Unknown',
                notes_count: 0 // Default
            }));

            if (formattedShifts.length > 0) {
                const timestamps = formattedShifts.map((s: any) => new Date(s.start_time).getTime());
                const minTime = new Date(Math.min(...timestamps)).toISOString();

                const { data: notesData, error: notesError } = await supabase
                    .from('work_notes')
                    .select('id, created_at')
                    .eq('created_by', profile.id)
                    .gte('created_at', minTime);

                if (!notesError && notesData) {
                    formattedShifts = formattedShifts.map((shift: any) => {
                        const shiftStart = new Date(shift.start_time).getTime();
                        const shiftEnd = shift.end_time ? new Date(shift.end_time).getTime() : Date.now();

                        const count = notesData.filter((note: any) => {
                            const noteTime = new Date(note.created_at).getTime();
                            return noteTime >= shiftStart && noteTime <= shiftEnd;
                        }).length;

                        return { ...shift, notes_count: count };
                    });
                }
            }

            set({ recentShifts: formattedShifts });
        } catch (error) {
            console.error('Error fetching shift history:', error);
        } finally {
            set({ loading: false });
        }
    }
}));
