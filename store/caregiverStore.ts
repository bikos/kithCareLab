import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../lib/imageUtils';

export interface EmergencyContact {
    id: string;
    profile_id: string;
    name: string;
    phone?: string;
    email?: string;
    relationship?: string;
    is_primary: boolean;
}

export interface Profile {
    emergency_contact_name: string;
    emergency_contact_relationship: string;
    emergency_contact_phone: string;
    emergency_contact_email: string;
    id: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    medical_notes?: string;
    role: 'caregiver' | 'individual';
    avatar_url?: string;
    sex?: 'male' | 'female' | 'other';
    access_code?: string;
    // Legal & End of Life
    dnr_status?: boolean;
    dnr_document_url?: string;
    living_will_status?: boolean;
    living_will_document_url?: string;
    poa_name?: string;
    poa_phone?: string;
    poa_email?: string;
    end_of_life_wishes?: string;
    organization_id?: string;
    email?: string;
    is_super_admin?: boolean;
    relationship_role?: 'owner' | 'editor' | 'viewer';
}

export interface IndividualFormData {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactEmail?: string;
    emergencyContactRelationship?: string;
    medicalNotes?: string;
    sex?: 'male' | 'female' | 'other';
    avatarUri?: string;
    organizationId?: string; // Optional: Link to an organization during creation
    inviteEmergencyContact?: boolean; // NEW: Auto-invite the emergency contact
}

interface CaregiverState {
    managedProfiles: Profile[];
    currentProfile: Profile | null;
    emergencyContacts: EmergencyContact[];
    loading: boolean;
    fetchManagedProfiles: () => Promise<void>;
    setCurrentProfile: (profile: Profile) => void;
    createIndividual: (data: IndividualFormData) => Promise<void>;
    joinByAccessCode: (code: string) => Promise<void>;
    updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;

    // Emergency Contact Actions
    fetchEmergencyContacts: (profileId: string) => Promise<void>;
    addEmergencyContact: (contact: Omit<EmergencyContact, 'id' | 'created_at'>) => Promise<void>;
    updateEmergencyContact: (id: string, updates: Partial<EmergencyContact>) => Promise<void>;
    deleteEmergencyContact: (id: string) => Promise<void>;

    // Family Invites
    // Family Invites
    createFamilyInvite: (individualId: string, email: string, name: string, role: 'editor' | 'viewer') => Promise<void>;
}

export const useCaregiverStore = create<CaregiverState>((set, get) => ({
    managedProfiles: [],
    currentProfile: null,
    emergencyContacts: [],
    loading: false,
    fetchManagedProfiles: async () => {
        set({ loading: true });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get the caregiver's profile ID first
            const { data: caregiverProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('auth_id', user.id)
                .single();

            if (!caregiverProfile) return;

            // Fetch profiles that this caregiver manages
            // 1. Get IDs of individuals from care_relationships
            const { data: relationships } = await supabase
                .from('care_relationships')
                .select('individual_id, relationship_role')
                .eq('caregiver_id', caregiverProfile.id);

            const individualIds = relationships?.map(r => r.individual_id) || [];

            // Create a map for easy lookup
            const roleMap = new Map();
            relationships?.forEach(r => roleMap.set(r.individual_id, r.relationship_role));

            // 2. Fetch profiles (Self + Individuals)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('id', [caregiverProfile.id, ...individualIds]);

            if (error) throw error;

            // 3. Attach relationship roles
            const profilesWithRoles = data.map((p: Profile) => ({
                ...p,
                relationship_role: p.id === caregiverProfile.id ? 'owner' : (roleMap.get(p.id) || 'viewer')
            }));

            set({ managedProfiles: profilesWithRoles as Profile[] });

            // Set default current profile if none selected
            if (!get().currentProfile && profilesWithRoles.length > 0) {
                // Prefer the first individual, otherwise self
                const firstIndividual = profilesWithRoles.find((p: Profile) => p.role === 'individual');
                set({ currentProfile: firstIndividual || profilesWithRoles[0] });
            }
        } catch (error) {
            console.error('Error fetching managed profiles:', error);
        } finally {
            set({ loading: false });
        }
    },
    setCurrentProfile: (profile) => set({ currentProfile: profile }),
    createIndividual: async (data) => {
        try {
            set({ loading: true });
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // Get caregiver profile id
            const { data: caregiverProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('auth_id', user.id)
                .single();

            if (!caregiverProfile) throw new Error('Caregiver profile not found');

            let avatarUrl = null;
            if (data.avatarUri) {
                avatarUrl = await uploadImageToSupabase(
                    data.avatarUri,
                    'avatars',
                    `individuals/${Date.now()}.webp` // We don't have the ID yet, so use timestamp
                );
            }

            // Use RPC to create profile and relationship atomically
            const { data: newProfile, error } = await supabase.rpc('create_individual', {
                p_first_name: data.firstName,
                p_last_name: data.lastName,
                p_date_of_birth: data.dateOfBirth || null,
                p_phone: data.phone || null,
                p_address: data.address || null,
                p_city: data.city || null,
                p_state: data.state || null,
                p_zip_code: data.zipCode || null,
                p_emergency_contact_name: data.emergencyContactName || null,
                p_emergency_contact_phone: data.emergencyContactPhone || null,
                p_emergency_contact_email: data.emergencyContactEmail || null,
                p_emergency_contact_relationship: data.emergencyContactRelationship || null,
                p_medical_notes: data.medicalNotes || null,
                p_sex: data.sex || null,
                p_avatar_url: avatarUrl || null,
                p_organization_id: data.organizationId || null, // NEW: Pass optional org ID
                p_invite_emergency_contact: data.inviteEmergencyContact || false // NEW: Pass invite flag
            });

            if (error) throw error;

            await get().fetchManagedProfiles();
        } catch (error) {
            console.error('Error creating individual:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    joinByAccessCode: async (code) => {
        try {
            set({ loading: true });
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // Use RPC to securely join team (bypassing RLS for access code lookup)
            const { data: joinedProfile, error } = await supabase.rpc('join_care_team', {
                p_access_code: code
            });

            if (error) throw error;

            await get().fetchManagedProfiles();
        } catch (error) {
            console.error('Error joining by code:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },
    updateProfile: async (id, updates) => {
        set({ loading: true });
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Refresh managed profiles and update currentProfile if it was the one edited
            await get().fetchManagedProfiles();
            const current = get().currentProfile;
            if (current && current.id === id) {
                const updated = get().managedProfiles.find(p => p.id === id);
                if (updated) {
                    set({ currentProfile: updated });
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Emergency Contact Actions
    fetchEmergencyContacts: async (profileId) => {
        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('emergency_contacts')
                .select('*')
                .eq('profile_id', profileId)
                .order('is_primary', { ascending: false });

            if (error) throw error;
            set({ emergencyContacts: data as EmergencyContact[] });
        } catch (error) {
            console.error('Error fetching emergency contacts:', error);
        } finally {
            set({ loading: false });
        }
    },

    addEmergencyContact: async (contact) => {
        set({ loading: true });
        try {
            const { error } = await supabase
                .from('emergency_contacts')
                .insert([contact]);

            if (error) throw error;
            await get().fetchEmergencyContacts(contact.profile_id);
        } catch (error) {
            console.error('Error adding emergency contact:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    updateEmergencyContact: async (id, updates) => {
        set({ loading: true });
        try {
            const { error } = await supabase
                .from('emergency_contacts')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // We need profile_id to refresh the list, but we might not have it in args.
            // We can get it from the current list if available, or just re-fetch if we know the current profile.
            // Best effort: refresh if currentProfile matches, or just update local state?
            // Let's just update local state for immediate feedback or re-fetch if we can.

            const currentContacts = get().emergencyContacts;
            const contact = currentContacts.find(c => c.id === id);
            if (contact) {
                await get().fetchEmergencyContacts(contact.profile_id);
            }
        } catch (error) {
            console.error('Error updating emergency contact:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    deleteEmergencyContact: async (id) => {
        set({ loading: true });
        try {
            // Get contact first to know profile_id for refresh
            const { data: contact } = await supabase
                .from('emergency_contacts')
                .select('profile_id')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('emergency_contacts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            if (contact) {
                await get().fetchEmergencyContacts(contact.profile_id);
            }
        } catch (error) {
            console.error('Error deleting emergency contact:', error);
            throw error;
        } finally {
            set({ loading: false });
            set({ loading: false });
        }
    },

    createFamilyInvite: async (individualId: string, email: string, name: string, role: 'editor' | 'viewer') => {
        set({ loading: true });
        try {
            // 1. Create DB Record
            const { error } = await supabase.rpc('create_family_invite', {
                p_individual_id: individualId,
                p_email: email,
                p_role: role
            });

            if (error) throw error;

            // 2. Trigger Edge Function to send email
            const { error: fnError } = await supabase.functions.invoke('invite-user', {
                body: {
                    email,
                    name,
                    firstName: name.split(' ')[0],
                    lastName: name.split(' ').slice(1).join(' ') || '',
                    // We don't verify organization_id for family invites, leave undefined or handle in edge function
                    // The edge function uses it for metadata, but family members aren't org members.
                    // Sending individual_id might be useful if we update edge function, but for now standard invite is enough.
                }
            });

            if (fnError) {
                console.error('Failed to trigger invite email:', fnError);
                // We don't throw here to avoid rolling back the DB success, just warn user? 
                // Or maybe we should throw? The user expects an email.
                throw fnError;
            }

        } catch (error) {
            console.error('Error creating family invite:', error);
            throw error;
        } finally {
            set({ loading: false });
        }
    }
}));
