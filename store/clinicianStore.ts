import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Clinician {
    id: string;
    individual_id: string;
    name: string;
    specialty?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    created_at: string;
}

export interface ClinicalVisit {
    id: string;
    clinician_id: string;
    individual_id: string;
    visit_date: string;
    reason?: string;
    notes?: string;
    follow_up_date?: string;
    created_at: string;
}

interface ClinicianState {
    clinicians: Clinician[];
    visits: ClinicalVisit[];
    loading: boolean;
    error: string | null;
    fetchClinicians: (individualId: string) => Promise<void>;
    addClinician: (clinician: Omit<Clinician, 'id' | 'created_at'>) => Promise<void>;
    updateClinician: (id: string, updates: Partial<Clinician>) => Promise<void>;
    deleteClinician: (id: string) => Promise<void>;
    fetchVisits: (individualId: string, clinicianId?: string) => Promise<void>;
    addVisit: (visit: Omit<ClinicalVisit, 'id' | 'created_at'>) => Promise<void>;
    updateVisit: (id: string, updates: Partial<ClinicalVisit>) => Promise<void>;
    deleteVisit: (id: string) => Promise<void>;
}

export const useClinicianStore = create<ClinicianState>((set, get) => ({
    clinicians: [],
    visits: [],
    loading: false,
    error: null,

    fetchClinicians: async (individualId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('clinicians')
                .select('*')
                .eq('individual_id', individualId)
                .order('name');

            if (error) throw error;
            set({ clinicians: data as Clinician[] });
        } catch (error: any) {
            console.error('Error fetching clinicians:', error);
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    addClinician: async (clinician) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('clinicians')
                .insert(clinician)
                .select()
                .single();

            if (error) throw error;
            set(state => ({ clinicians: [...state.clinicians, data as Clinician] }));
        } catch (error: any) {
            console.error('Error adding clinician:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    updateClinician: async (id, updates) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('clinicians')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            set(state => ({
                clinicians: state.clinicians.map(c => c.id === id ? { ...c, ...updates } : c)
            }));
        } catch (error: any) {
            console.error('Error updating clinician:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    deleteClinician: async (id) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('clinicians')
                .delete()
                .eq('id', id);

            if (error) throw error;
            set(state => ({
                clinicians: state.clinicians.filter(c => c.id !== id)
            }));
        } catch (error: any) {
            console.error('Error deleting clinician:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    fetchVisits: async (individualId, clinicianId) => {
        set({ loading: true, error: null });
        try {
            let query = supabase
                .from('clinical_visits')
                .select('*')
                .eq('individual_id', individualId)
                .order('visit_date', { ascending: false });

            if (clinicianId) {
                query = query.eq('clinician_id', clinicianId);
            }

            const { data, error } = await query;

            if (error) throw error;
            set({ visits: data as ClinicalVisit[] });
        } catch (error: any) {
            console.error('Error fetching visits:', error);
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    addVisit: async (visit) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('clinical_visits')
                .insert(visit)
                .select()
                .single();

            if (error) throw error;
            set(state => ({ visits: [data as ClinicalVisit, ...state.visits] }));
        } catch (error: any) {
            console.error('Error adding visit:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    updateVisit: async (id, updates) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('clinical_visits')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            set(state => ({
                visits: state.visits.map(v => v.id === id ? { ...v, ...updates } : v)
            }));
        } catch (error: any) {
            console.error('Error updating visit:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    deleteVisit: async (id) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('clinical_visits')
                .delete()
                .eq('id', id);

            if (error) throw error;
            set(state => ({
                visits: state.visits.filter(v => v.id !== id)
            }));
        } catch (error: any) {
            console.error('Error deleting visit:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },
}));
