import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface Medication {
    id: string;
    user_id: string;
    name: string;
    dosage: string;
    frequency: string;
    scheduled_time?: string; // TIME field from database
    scheduled_days?: string[]; // Array of days
    instructions?: string; // Special instructions
    prescribed_by?: string; // Doctor name
    status?: 'active' | 'discontinued';
    created_at: string;
}

export interface MedicationLog {
    id: string;
    medication_id: string;
    taken_at: string;
    status: 'taken' | 'missed' | 'skipped';
    logged_by: string;
    notes?: string;
    // Joined data
    caregiver_name?: string;
}

export interface MedicationWithLogs extends Medication {
    latest_log?: MedicationLog;
    logs?: MedicationLog[];
    patient_name?: string;
}

interface MedicationState {
    medications: Medication[];
    logs: Map<string, MedicationLog[]>; // Map of medication_id to logs
    loading: boolean;

    // Fetch functions
    fetchMedications: () => Promise<void>;
    fetchAllMedications: () => Promise<MedicationWithLogs[]>;
    fetchMedicationLogs: (medicationId: string) => Promise<MedicationLog[]>;

    // Logging functions
    logMedicationTaken: (medicationId: string, notes?: string) => Promise<void>;
    logMedicationSkipped: (medicationId: string, notes?: string) => Promise<void>;
    logMedicationMissed: (medicationId: string) => Promise<void>;

    // Helper functions
    wasTakenToday: (medicationId: string) => boolean;
    getLatestLog: (medicationId: string) => MedicationLog | undefined;

    // Existing
    addMedication: (
        name: string,
        dosage: string,
        frequency: string,
        scheduledTime?: string,
        scheduledDays?: string[],
        instructions?: string,
        prescribedBy?: string
    ) => Promise<void>;
    deleteMedication: (medicationId: string) => Promise<void>;
    scheduleNotification: (title: string, body: string, seconds: number) => Promise<void>;
}

// Configure notifications handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
});

export const useMedicationStore = create<MedicationState>((set, get) => ({
    medications: [],
    logs: new Map(),
    loading: false,

    fetchMedications: async () => {
        set({ loading: true });
        try {
            const { currentProfile } = require('./caregiverStore').useCaregiverStore.getState();
            if (!currentProfile) {
                set({ medications: [] });
                return;
            }

            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .eq('user_id', currentProfile.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ medications: data as Medication[] });
        } catch (error) {
            console.error('Error fetching medications:', error);
        } finally {
            set({ loading: false });
        }
    },

    fetchAllMedications: async () => {
        try {
            const { managedProfiles } = require('./caregiverStore').useCaregiverStore.getState();
            const individuals = managedProfiles.filter((p: any) => p.role === 'individual');

            if (individuals.length === 0) return [];

            const individualIds = individuals.map((p: any) => p.id);

            // Fetch all active medications for managed individuals
            const { data: meds, error: medsError } = await supabase
                .from('medications')
                .select('*')
                .in('user_id', individualIds)
                .eq('status', 'active')
                .order('scheduled_time', { ascending: true });

            if (medsError) throw medsError;

            // Fetch today's logs for all medications
            const medIds = meds?.map(m => m.id) || [];
            const today = new Date().toISOString().split('T')[0];

            const { data: todayLogs, error: logsError } = await supabase
                .from('medication_logs')
                .select(`
                    *,
                    profiles:logged_by (full_name)
                `)
                .in('medication_id', medIds)
                .gte('taken_at', `${today}T00:00:00`)
                .lte('taken_at', `${today}T23:59:59`);

            if (logsError) throw logsError;

            // Combine data
            const medsWithLogs: MedicationWithLogs[] = (meds || []).map(med => {
                const patient = individuals.find((p: any) => p.id === med.user_id);
                const medLogs = (todayLogs || []).filter(log => log.medication_id === med.id);
                const latestLog = medLogs.length > 0 ? medLogs[0] : undefined;

                return {
                    ...med,
                    patient_name: patient?.full_name || 'Unknown',
                    latest_log: latestLog ? {
                        ...latestLog,
                        caregiver_name: latestLog.profiles?.full_name
                    } : undefined,
                    logs: medLogs.map(log => ({
                        ...log,
                        caregiver_name: log.profiles?.full_name
                    }))
                };
            });

            return medsWithLogs;
        } catch (error) {
            console.error('Error fetching all medications:', error);
            return [];
        }
    },

    fetchMedicationLogs: async (medicationId: string) => {
        try {
            const { data, error } = await supabase
                .from('medication_logs')
                .select(`
                    *,
                    profiles:logged_by (full_name)
                `)
                .eq('medication_id', medicationId)
                .order('taken_at', { ascending: false });

            if (error) throw error;

            const logs: MedicationLog[] = (data || []).map(log => ({
                id: log.id,
                medication_id: log.medication_id,
                taken_at: log.taken_at,
                status: log.status,
                logged_by: log.logged_by,
                notes: log.notes,
                caregiver_name: log.profiles?.full_name
            }));

            // Update logs map
            const currentLogs = get().logs;
            currentLogs.set(medicationId, logs);
            set({ logs: new Map(currentLogs) });

            return logs;
        } catch (error) {
            console.error('Error fetching medication logs:', error);
            return [];
        }
    },

    logMedicationTaken: async (medicationId: string, notes?: string) => {
        try {
            const { profile } = require('./authStore').useAuthStore.getState();
            if (!profile) throw new Error('No caregiver profile found');

            const { error } = await supabase
                .from('medication_logs')
                .insert({
                    medication_id: medicationId,
                    status: 'taken',
                    logged_by: profile.id,
                    notes: notes || null,
                    taken_at: new Date().toISOString()
                });

            if (error) throw error;

            // Refresh logs for this medication
            await get().fetchMedicationLogs(medicationId);
        } catch (error) {
            console.error('Error logging medication as taken:', error);
            throw error;
        }
    },

    logMedicationSkipped: async (medicationId: string, notes?: string) => {
        try {
            const { profile } = require('./authStore').useAuthStore.getState();
            if (!profile) throw new Error('No caregiver profile found');

            const { error } = await supabase
                .from('medication_logs')
                .insert({
                    medication_id: medicationId,
                    status: 'skipped',
                    logged_by: profile.id,
                    notes: notes || null,
                    taken_at: new Date().toISOString()
                });

            if (error) throw error;

            await get().fetchMedicationLogs(medicationId);
        } catch (error) {
            console.error('Error logging medication as skipped:', error);
            throw error;
        }
    },

    logMedicationMissed: async (medicationId: string) => {
        try {
            const { profile } = require('./authStore').useAuthStore.getState();
            if (!profile) throw new Error('No caregiver profile found');

            const { error } = await supabase
                .from('medication_logs')
                .insert({
                    medication_id: medicationId,
                    status: 'missed',
                    logged_by: profile.id,
                    taken_at: new Date().toISOString()
                });

            if (error) throw error;

            await get().fetchMedicationLogs(medicationId);
        } catch (error) {
            console.error('Error logging medication as missed:', error);
            throw error;
        }
    },

    wasTakenToday: (medicationId: string) => {
        const logs = get().logs.get(medicationId) || [];
        const today = new Date().toISOString().split('T')[0];

        return logs.some(log => {
            const logDate = new Date(log.taken_at).toISOString().split('T')[0];
            return logDate === today && log.status === 'taken';
        });
    },

    getLatestLog: (medicationId: string) => {
        const logs = get().logs.get(medicationId) || [];
        return logs.length > 0 ? logs[0] : undefined;
    },

    addMedication: async (name, dosage, frequency, scheduledTime?, scheduledDays?, instructions?, prescribedBy?) => {
        try {
            const { currentProfile } = require('./caregiverStore').useCaregiverStore.getState();
            if (!currentProfile) throw new Error('No profile selected');

            const { error } = await supabase
                .from('medications')
                .insert([
                    {
                        user_id: currentProfile.id,
                        name,
                        dosage,
                        frequency,
                        scheduled_time: scheduledTime || null,
                        scheduled_days: scheduledDays || null,
                        instructions: instructions || null,
                        prescribed_by: prescribedBy || null,
                    },
                ]);

            if (error) throw error;
            await get().fetchMedications();

            // Schedule notification for the actual scheduled time
            if (scheduledTime && scheduledDays) {
                const now = new Date();
                const [hours, minutes] = scheduledTime.split(':').map(Number);

                // Create a date object for today at the scheduled time
                const scheduledDate = new Date();
                scheduledDate.setHours(hours, minutes, 0, 0);

                // If the scheduled time has already passed today, schedule for tomorrow
                if (scheduledDate <= now) {
                    scheduledDate.setDate(scheduledDate.getDate() + 1);
                }

                // Calculate seconds until the scheduled time
                const secondsUntilScheduled = Math.floor((scheduledDate.getTime() - now.getTime()) / 1000);

                // Only schedule if it's within a reasonable timeframe (next 24 hours)
                if (secondsUntilScheduled > 0 && secondsUntilScheduled <= 86400) {
                    await get().scheduleNotification(
                        'Medication Reminder',
                        `Time to take ${name} (${dosage})`,
                        secondsUntilScheduled
                    );
                }
            }

        } catch (error) {
            console.error('Error adding medication:', error);
            throw error;
        }
    },

    deleteMedication: async (medicationId: string) => {
        try {
            // We soft-delete/archive the medication to preserve compliance logging history
            const { error } = await supabase
                .from('medications')
                .update({ status: 'discontinued' })
                .eq('id', medicationId);

            if (error) throw error;
            await get().fetchMedications();
        } catch (error) {
            console.error('Error archiving medication:', error);
            throw error;
        }
    },

    scheduleNotification: async (title, body, seconds) => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            console.log('Notification permissions not granted');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: seconds,
                repeats: false,
            },
        });
    },
}));
