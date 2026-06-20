import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface MedicationAdherence {
    taken: number;
    missed: number;
    skipped: number;
    total: number;
    adherenceRate: number;
}

interface ActivityTrend {
    date: string;
    journalCount: number;
    careLogCount: number;
}

interface StaffActivity {
    staffId: string;
    staffName: string;
    activityCount: number;
}

interface UpcomingVisit {
    id: string;
    clientName: string;
    clinicianName: string;
    visitDate: string;
    specialty?: string;
}

interface MoodData {
    mood: string;
    count: number;
}

interface ReportsState {
    loading: boolean;

    // Data
    medicationAdherence: MedicationAdherence | null;
    activityTrends: ActivityTrend[];
    staffActivity: StaffActivity[];
    upcomingVisits: UpcomingVisit[];
    moodDistribution: MoodData[];

    // Actions
    fetchMedicationAdherence: (organizationId: string) => Promise<void>;
    fetchActivityTrends: (organizationId: string, days?: number) => Promise<void>;
    fetchStaffActivity: (organizationId: string) => Promise<void>;
    fetchUpcomingVisits: (organizationId: string) => Promise<void>;
    fetchMoodDistribution: (organizationId: string) => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
    loading: false,
    medicationAdherence: null,
    activityTrends: [],
    staffActivity: [],
    upcomingVisits: [],
    moodDistribution: [],

    fetchMedicationAdherence: async (organizationId: string) => {
        try {
            // Get all clients in the organization through care_relationships
            const { data: relationships } = await supabase
                .from('care_relationships')
                .select('individual_id, caregiver:profiles!care_relationships_caregiver_id_fkey(id)')
                .in('caregiver_id',
                    supabase
                        .from('organization_members')
                        .select('profile_id')
                        .eq('organization_id', organizationId)
                );

            if (!relationships) return;

            const clientIds = [...new Set(relationships.map(r => r.individual_id))];

            // Get medication logs for last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: logs } = await supabase
                .from('medication_logs')
                .select('status, medication:medications!inner(user_id)')
                .in('medication.user_id', clientIds)
                .gte('taken_at', thirtyDaysAgo.toISOString());

            if (!logs) {
                set({ medicationAdherence: { taken: 0, missed: 0, skipped: 0, total: 0, adherenceRate: 0 } });
                return;
            }

            const taken = logs.filter(l => l.status === 'taken').length;
            const missed = logs.filter(l => l.status === 'missed').length;
            const skipped = logs.filter(l => l.status === 'skipped').length;
            const total = logs.length;
            const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

            set({ medicationAdherence: { taken, missed, skipped, total, adherenceRate } });
        } catch (error) {
            console.error('Error fetching medication adherence:', error);
        }
    },

    fetchActivityTrends: async (organizationId: string, days = 7) => {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            // Get staff profile IDs
            const { data: members } = await supabase
                .from('organization_members')
                .select('profile_id')
                .eq('organization_id', organizationId);

            if (!members) return;

            const staffIds = members.map(m => m.profile_id);

            // Get journal entries
            const { data: journals } = await supabase
                .from('journal_entries')
                .select('created_at')
                .in('created_by', staffIds)
                .gte('created_at', startDate.toISOString());

            // Get daily care logs  
            const { data: careLogs } = await supabase
                .from('daily_care_logs')
                .select('log_date')
                .in('logged_by', staffIds)
                .gte('log_date', startDate.toISOString().split('T')[0]);

            // Aggregate by date
            const trends: { [key: string]: ActivityTrend } = {};

            // Initialize all days
            for (let i = 0; i < days; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                trends[dateStr] = { date: dateStr, journalCount: 0, careLogCount: 0 };
            }

            // Count journals
            journals?.forEach(j => {
                const date = j.created_at.split('T')[0];
                if (trends[date]) trends[date].journalCount++;
            });

            // Count care logs
            careLogs?.forEach(c => {
                if (trends[c.log_date]) trends[c.log_date].careLogCount++;
            });

            set({ activityTrends: Object.values(trends).reverse() });
        } catch (error) {
            console.error('Error fetching activity trends:', error);
        }
    },

    fetchStaffActivity: async (organizationId: string) => {
        try {
            // Get all staff members
            const { data: members } = await supabase
                .from('organization_members')
                .select('profile_id, profile:profiles(full_name)')
                .eq('organization_id', organizationId)
                .eq('status', 'active');

            if (!members) return;

            const activityCounts = await Promise.all(
                members.map(async (member: any) => {
                    // Count journal entries
                    const { count: journalCount } = await supabase
                        .from('journal_entries')
                        .select('*', { count: 'exact', head: true })
                        .eq('created_by', member.profile_id);

                    // Count care logs
                    const { count: careLogCount } = await supabase
                        .from('daily_care_logs')
                        .select('*', { count: 'exact', head: true })
                        .eq('logged_by', member.profile_id);

                    // Count work notes
                    const { count: notesCount } = await supabase
                        .from('work_notes')
                        .select('*', { count: 'exact', head: true })
                        .eq('created_by', member.profile_id);

                    const total = (journalCount || 0) + (careLogCount || 0) + (notesCount || 0);

                    return {
                        staffId: member.profile_id,
                        staffName: member.profile?.full_name || 'Unknown',
                        activityCount: total
                    };
                })
            );

            // Sort by activity count
            const sorted = activityCounts
                .filter(a => a.activityCount > 0)
                .sort((a, b) => b.activityCount - a.activityCount)
                .slice(0, 5); // Top 5

            set({ staffActivity: sorted });
        } catch (error) {
            console.error('Error fetching staff activity:', error);
        }
    },

    fetchUpcomingVisits: async (organizationId: string) => {
        try {
            // Get client IDs
            const { data: relationships } = await supabase
                .from('care_relationships')
                .select('individual_id')
                .in('caregiver_id',
                    supabase
                        .from('organization_members')
                        .select('profile_id')
                        .eq('organization_id', organizationId)
                );

            if (!relationships) return;

            const clientIds = [...new Set(relationships.map(r => r.individual_id))];

            // Get upcoming visits
            const { data: visits } = await supabase
                .from('clinical_visits')
                .select(`
                    id,
                    visit_date,
                    individual:profiles!clinical_visits_individual_id_fkey(full_name),
                    clinician:clinicians(name, specialty)
                `)
                .in('individual_id', clientIds)
                .gte('visit_date', new Date().toISOString().split('T')[0])
                .order('visit_date', { ascending: true })
                .limit(5);

            const formatted = visits?.map(v => ({
                id: v.id,
                clientName: (v.individual as any)?.full_name || 'Unknown',
                clinicianName: (v.clinician as any)?.name || 'Unknown',
                visitDate: v.visit_date,
                specialty: (v.clinician as any)?.specialty
            })) || [];

            set({ upcomingVisits: formatted });
        } catch (error) {
            console.error('Error fetching upcoming visits:', error);
        }
    },

    fetchMoodDistribution: async (organizationId: string) => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Get staff IDs
            const { data: members } = await supabase
                .from('organization_members')
                .select('profile_id')
                .eq('organization_id', organizationId);

            if (!members) return;

            const staffIds = members.map(m => m.profile_id);

            const { data: journals } = await supabase
                .from('journal_entries')
                .select('mood')
                .in('created_by', staffIds)
                .not('mood', 'is', null)
                .gte('created_at', thirtyDaysAgo.toISOString());

            // Count moods
            const moodCounts: { [key: string]: number } = {};
            journals?.forEach(j => {
                if (j.mood) {
                    moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
                }
            });

            const distribution = Object.entries(moodCounts)
                .map(([mood, count]) => ({ mood, count }))
                .sort((a, b) => b.count - a.count);

            set({ moodDistribution: distribution });
        } catch (error) {
            console.error('Error fetching mood distribution:', error);
        }
    },
}));
