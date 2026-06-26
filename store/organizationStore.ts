import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Profile } from './caregiverStore';

export interface Organization {
    id: string;
    name: string;
    type: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    subscription_plan: string;
}

export interface CareAssignment {
    id: string;
    organization_id: string;
    profile_id: string;
    staff_id: string;
    staff?: Profile; // Joined    profile?: Profile;
}

export interface OrganizationInvite {
    id: string;
    organization_id: string;
    email: string;
    role: 'admin' | 'nurse' | 'staff';
    status: 'pending' | 'accepted' | 'expired';
    created_at: string;
}

export interface OrganizationMember {
    id: string;
    organization_id: string;
    profile_id: string;
    role: 'admin' | 'nurse' | 'staff';
    status: 'active' | 'inactive';
    created_at?: string;
    profile?: Profile; // Joined data
    organizations?: Organization; // Joined data
}

interface OrganizationState {
    organization: Organization | null;
    members: OrganizationMember[];
    patients: Profile[]; // Patients belonging to the org
    invites: OrganizationInvite[];
    loading: boolean;
    error: string | null;

    fetchMyOrganization: () => Promise<void>;
    fetchPatients: () => Promise<void>;
    fetchMembers: () => Promise<void>;
    fetchInvites: () => Promise<void>;

    // Care Assignments
    fetchCareAssignments: (patientId: string) => Promise<CareAssignment[]>;
    fetchStaffAssignments: (staffProfileId: string) => Promise<Profile[]>;
    assignStaff: (accessCode: string, staffId: string) => Promise<void>;
    removeAssignment: (assignmentId: string) => Promise<void>;

    // Staff Management
    inviteMember: (email: string, name: string, role: string, firstName?: string, lastName?: string) => Promise<void>;
    resendInvite: (inviteId: string, email: string, name: string, role: string) => Promise<void>;
    deleteInvite: (inviteId: string) => Promise<void>;
    updateMember: (memberId: string, updates: { full_name?: string; first_name?: string; last_name?: string }) => Promise<void>;
    updateMemberRole: (memberId: string, role: 'admin' | 'nurse' | 'staff') => Promise<void>;
    deactivateMember: (memberId: string) => Promise<void>;
    activateMember: (memberId: string) => Promise<void>;
    deleteMember: (memberId: string) => Promise<void>;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
    organization: null,
    members: [],
    patients: [],
    invites: [],
    loading: false,
    error: null,

    fetchMyOrganization: async () => {
        set({ loading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get current profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('auth_id', user.id)
                .single();

            if (!profile) return;

            // Get Organization Membership
            const { data: membership, error: memberError } = await supabase
                .from('organization_members')
                .select('organization_id, role, organizations(*)')
                .eq('profile_id', profile.id); // Changed .single() to standard fetch to inspect array

            if (membership && membership.length > 0 && membership[0].organizations) {
                // @ts-ignore
                set({ organization: membership[0].organizations as Organization });
            } else {
                // Check if we can fetch organizations directly?
                const { data: orgs } = await supabase.from('organizations').select('*');
            }
        } catch (error: any) {
            console.error('Error fetching organization:', error);
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    fetchPatients: async () => {
        const { organization } = get();
        if (!organization) return;

        set({ loading: true, error: null });
        try {
            // Get all staff members in this organization
            const { data: staff, error: staffError } = await supabase
                .from('organization_members')
                .select('profile_id')
                .eq('organization_id', organization.id);

            if (staffError) throw staffError;
            if (!staff || staff.length === 0) {
                set({ patients: [] });
                return;
            }

            const staffIds = staff.map(s => s.profile_id);

            // Get all clients assigned to these staff members via care_relationships
            const { data: relationships, error: relError } = await supabase
                .from('care_relationships')
                .select('individual_id, individual:profiles!care_relationships_individual_id_fkey(*)')
                .in('caregiver_id', staffIds);

            if (relError) throw relError;

            // Extract unique clients
            const clientMap = new Map();
            relationships?.forEach(rel => {
                const client = Array.isArray(rel.individual) ? rel.individual[0] : rel.individual;
                if (client && !clientMap.has(client.id)) {
                    clientMap.set(client.id, client);
                }
            });

            const patients = Array.from(clientMap.values());
            set({ patients: patients as Profile[] });
        } catch (error: any) {
            console.error('Error fetching patients:', error);
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    fetchMembers: async () => {
        const { organization } = get();
        if (!organization) return;

        set({ loading: true, error: null });
        try {
            const { data: members, error } = await supabase
                .from('organization_members')
                .select('*, profile:profiles(*)') // Join profile data
                .eq('organization_id', organization.id);

            if (error) throw error;
            set({ members: members as any[] });
        } catch (error: any) {
            console.error('Error fetching members:', error);
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    fetchInvites: async () => {
        const { organization } = get();
        if (!organization) return;

        try {
            const { data, error } = await supabase
                .from('organization_invites')
                .select('*')
                .eq('organization_id', organization.id)
                .eq('status', 'pending');

            if (error) throw error;
            set({ invites: data as OrganizationInvite[] });
        } catch (error: any) {
            console.error('Error fetching invites:', error);
        }
    },

    fetchCareAssignments: async (patientId: string) => {
        const { organization } = get();
        if (!organization) return [];

        try {
            // Query care_relationships instead of care_assignments
            const { data, error } = await supabase
                .from('care_relationships')
                .select('id, caregiver_id, individual_id, relationship_role, status, staff:profiles!care_relationships_caregiver_id_fkey(id, full_name, role)')
                .eq('individual_id', patientId);

            if (error) throw error;

            // Transform to match CareAssignment interface
            return data.map(rel => ({
                id: rel.id,
                organization_id: organization.id,
                profile_id: rel.individual_id,
                staff_id: rel.caregiver_id,
                staff: Array.isArray(rel.staff) ? rel.staff[0] : rel.staff
            })) as any as CareAssignment[];
        } catch (error: any) {
            console.error('Error fetching assignments:', error);
            return [];
        }
    },

    fetchStaffAssignments: async (staffProfileId: string) => {
        try {
            // Query care_relationships to find clients assigned to this staff member
            const { data, error } = await supabase
                .from('care_relationships')
                .select('individual_id, created_at, client:profiles!care_relationships_individual_id_fkey(id, full_name, avatar_url, access_code)')
                .eq('caregiver_id', staffProfileId);

            if (error) throw error;

            // Extract and return the client profiles
            return (data || []).map(rel => ({
                ...(Array.isArray(rel.client) ? rel.client[0] : rel.client),
                assigned_at: rel.created_at
            })) as any as Profile[];
        } catch (error: any) {
            console.error('Error fetching staff assignments:', error);
            return [];
        }
    },

    assignStaff: async (accessCode: string, staffId: string) => {
        const { organization } = get();
        if (!organization) throw new Error('No organization');

        // Look up client by access code
        const { data: clientProfile, error: clientError } = await supabase
            .from('profiles')
            .select('id')
            .eq('access_code', accessCode)
            .single();

        if (clientError || !clientProfile) {
            throw new Error('Invalid access code');
        }

        // Create care relationship directly (admin has permission via RLS)
        const { error: relError } = await supabase
            .from('care_relationships')
            .upsert({
                caregiver_id: staffId,
                individual_id: clientProfile.id,
                relationship_role: 'editor',
                status: 'active'
            }, { onConflict: 'caregiver_id, individual_id' });

        if (relError) throw relError;
    },

    removeAssignment: async (assignmentId: string) => {
        const { error } = await supabase
            .from('care_relationships')
            .delete()
            .eq('id', assignmentId);

        if (error) throw error;
    },

    inviteMember: async (email: string, name: string, role: string, firstName?: string, lastName?: string) => {
        const organization = get().organization;
        if (!organization) throw new Error('No organization selected');

        // 1. Create/Update Pending Invite Record in DB
        const { error: dbError } = await supabase
            .from('organization_invites')
            .upsert(
                {
                    organization_id: organization.id,
                    email,
                    role,
                    status: 'pending' // Reset to pending if it existed
                },
                {
                    onConflict: 'organization_id,email'
                }
            );

        if (dbError) throw dbError;

        // 2. Trigger the Edge Function to send email
        const { data, error } = await supabase.functions.invoke('invite-user', {
            body: {
                email,
                name,
                firstName: firstName || name.split(' ')[0],
                lastName: lastName || name.split(' ').slice(1).join(' '),
                role,
                organization_id: organization.id
            }
        });

        // Check for function error
        if (error) {
            console.error('Failed to trigger invite email:', error);
            throw error;
        }

        await get().fetchInvites();
    },

    resendInvite: async (inviteId: string, email: string, name: string, role: string) => {
        const organization = get().organization;
        if (!organization) throw new Error('No organization selected');

        // Reuse the same invite-user edge function to resend
        const { error } = await supabase.functions.invoke('invite-user', {
            body: {
                email,
                name,
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' '),
                role,
                organization_id: organization.id
            }
        });

        if (error) {
            console.error('Failed to resend invite:', error);
            throw error;
        }

        await get().fetchInvites();
    },

    deleteInvite: async (inviteId: string) => {
        const { error } = await supabase
            .from('organization_invites')
            .delete()
            .eq('id', inviteId);

        if (error) throw error;
        await get().fetchInvites();
    },

    updateMember: async (memberId: string, updates: { full_name?: string; first_name?: string; last_name?: string }) => {
        // Get the profile_id from the member record
        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('profile_id')
            .eq('id', memberId)
            .single();

        if (memberError || !member) throw new Error('Member not found');

        // Update the profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', member.profile_id);

        if (profileError) throw profileError;
        await get().fetchMembers();
    },

    updateMemberRole: async (memberId: string, role: 'admin' | 'nurse' | 'staff') => {
        const { error } = await supabase
            .from('organization_members')
            .update({ role })
            .eq('id', memberId);

        if (error) throw error;
        await get().fetchMembers();
    },

    deactivateMember: async (memberId: string) => {
        // Update the organization_member to set status as inactive
        const { error } = await supabase
            .from('organization_members')
            .update({ status: 'inactive' })
            .eq('id', memberId);

        if (error) throw error;
        await get().fetchMembers();
    },

    activateMember: async (memberId: string) => {
        // Reactivate a deactivated member
        const { error } = await supabase
            .from('organization_members')
            .update({ status: 'active' })
            .eq('id', memberId);

        if (error) throw error;
        await get().fetchMembers();
    },

    deleteMember: async (memberId: string) => {
        // 1. Find the member to get their email address before deleting
        const member = get().members.find(m => m.id === memberId);
        const email = member?.profile?.email;

        // 2. Delete the organization member (this removes them from the org but not their profile)
        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('id', memberId);

        if (error) throw error;

        // 3. Delete from organization_invites to clean up the invite
        if (email) {
            const org = get().organization;
            if (org) {
                await supabase
                    .from('organization_invites')
                    .delete()
                    .eq('email', email)
                    .eq('organization_id', org.id);
            }
        }

        await get().fetchMembers();
        await get().fetchInvites();
    }
}));
