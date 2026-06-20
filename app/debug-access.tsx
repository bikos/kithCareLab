import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function DebugAccess() {
    const [logs, setLogs] = useState<string[]>([]);
    const [data, setData] = useState<any>({});

    const addLog = (msg: string) => setLogs(p => [...p, msg]);

    useEffect(() => {
        runDiagnostics();
    }, []);

    const runDiagnostics = async () => {
        addLog('Starting Diagnostics...');

        // 1. Check Session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) addLog(`Session Error: ${sessionError.message}`);
        if (!session) {
            addLog('No active session.');
            return;
        }
        addLog(`Session Found: ${session.user.id} (${session.user.email})`);

        // 2. Fetch Profile by Auth ID
        addLog('Fetching Profile...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

        if (profileError) {
            addLog(`Profile Error: ${profileError.message} (${profileError.code})`);
            addLog(`Hint: RLS might be blocking access to profiles table.`);
        } else {
            addLog(`Profile Found: ID=${profile.id}, Name=${profile.full_name}, Role=${profile.role}`);
            setData(d => ({ ...d, profile }));
        }

        if (profile?.id) {
            // 3. Fetch Organization Membership
            addLog(`Fetching Membership for Profile: ${profile.id}...`);
            const { data: members, error: memberError } = await supabase
                .from('organization_members')
                .select('*, organizations(*)')
                .eq('profile_id', profile.id);

            if (memberError) {
                addLog(`Member Error: ${memberError.message} (${memberError.code})`);
                addLog(`Hint: RLS might be blocking access to organization_members table.`);
            } else {
                addLog(`Memberships Found: ${members?.length || 0}`);
                members?.forEach((m, i) => {
                    addLog(`[${i}] Org: ${m.organization_id}, Role: ${m.role}`);
                });
                setData(d => ({ ...d, members }));
            }
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Debug Access</Text>
            <View style={styles.card}>
                <Text style={styles.subtitle}>Logs:</Text>
                {logs.map((L, i) => <Text key={i} style={styles.log}>• {L}</Text>)}
            </View>

            <View style={styles.card}>
                <Text style={styles.subtitle}>Raw Data:</Text>
                <Text style={styles.code}>{JSON.stringify(data, null, 2)}</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 20 },
    subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
    log: { fontSize: 14, marginBottom: 5, fontFamily: 'monospace' },
    code: { fontSize: 12, fontFamily: 'monospace' }
});
