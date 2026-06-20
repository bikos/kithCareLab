import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
    session: Session | null;
    user: User | null;
    profile: any | null; // Using any for now to avoid circular deps, or define Profile type here
    loading: boolean;
    initialized: boolean;
    setSession: (session: Session | null) => void;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    setSession: async (session) => {
        let profile = null;
        if (session?.user) {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('auth_id', session.user.id)
                .single();

            if (data) {
                // Fetch Organization Link
                const { data: orgMember } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('profile_id', data.id)
                    .single();

                profile = { ...data, organization_id: orgMember?.organization_id };
            }
        }
        set({ session, user: session?.user ?? null, profile, loading: false, initialized: true });
    },
    signIn: async (email, password) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            set({ loading: false });
            return { error };
        }

        return { error: null };
    },
    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null });
    },
    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const ensureProfile = async (user: User) => {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('auth_id', user.id)
                    .single();

                let finalProfile = data;

                if (!finalProfile) {
                    // Profile missing? Create it!
                    console.log('Profile missing for user, creating one...');
                    const { data: newProfile, error } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                auth_id: user.id,
                                full_name: user.user_metadata.full_name || 'Caregiver',
                                role: 'caregiver',
                                avatar_url: ''
                            }
                        ])
                        .select()
                        .single();

                    if (error) {
                        console.error('Error creating profile:', error);
                        return null;
                    }
                    finalProfile = newProfile;
                }

                // Fetch Organization Link
                if (finalProfile) {
                    const { data: orgMember } = await supabase
                        .from('organization_members')
                        .select('organization_id')
                        .eq('profile_id', finalProfile.id)
                        .single();

                    finalProfile = { ...finalProfile, organization_id: orgMember?.organization_id };
                }

                return finalProfile;
            };

            let profile = null;
            if (session?.user) {
                profile = await ensureProfile(session.user);
            }

            set({ session, user: session?.user ?? null, profile, loading: false, initialized: true });

            supabase.auth.onAuthStateChange(async (_event, session) => {
                let profile = null;
                if (session?.user) {
                    profile = await ensureProfile(session.user);
                }
                set({ session, user: session?.user ?? null, profile, loading: false, initialized: true });
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ loading: false, initialized: true });
        }
    },
}));
