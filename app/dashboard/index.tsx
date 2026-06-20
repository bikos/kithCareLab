import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Card, Title, Paragraph, Button, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { useEffect } from 'react';
import { useOrganizationStore } from '../../store/organizationStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardIndex() {
    const theme = useTheme();
    const router = useRouter();
    const {
        organization,
        patients,
        members,
        invites,
        loading,
        fetchMyOrganization,
        fetchPatients,
        fetchMembers,
        fetchInvites
    } = useOrganizationStore();

    useEffect(() => {
        fetchMyOrganization().then(() => {
            fetchPatients();
            fetchMembers();
            fetchInvites();
        });
    }, []);

    if (loading && !organization) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!organization) {
        return (
            <View style={{ flex: 1, padding: 24 }}>
                <Title>No Organization Found</Title>
                <Paragraph>You are not linked to any Care Facility.</Paragraph>
            </View>
        );
    }

    const activeStaff = members.filter(m => m.status === 'active').length;
    const pendingInvites = invites?.length || 0;

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back! 👋</Text>
                    <Text style={styles.orgName}>{organization.name}</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <Pressable
                    style={styles.quickActionButton}
                    onPress={() => router.push('/add-client')}
                >
                    <View style={[styles.actionIconCircle, { backgroundColor: '#E3F2FD' }]}>
                        <MaterialCommunityIcons name="account-plus" size={24} color="#1976d2" />
                    </View>
                    <Text style={styles.quickActionText}>Add Client</Text>
                </Pressable>

                <Pressable
                    style={styles.quickActionButton}
                    onPress={() => router.push('/dashboard/clients')}
                >
                    <View style={[styles.actionIconCircle, { backgroundColor: '#F3E5F5' }]}>
                        <MaterialCommunityIcons name="account-group" size={24} color="#7b1fa2" />
                    </View>
                    <Text style={styles.quickActionText}>View Clients</Text>
                </Pressable>

                <Pressable
                    style={styles.quickActionButton}
                    onPress={() => router.push('/dashboard/staff')}
                >
                    <View style={[styles.actionIconCircle, { backgroundColor: '#E8F5E9' }]}>
                        <MaterialCommunityIcons name="account-tie" size={24} color="#388e3c" />
                    </View>
                    <Text style={styles.quickActionText}>Manage Staff</Text>
                </Pressable>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                {/* Total Clients Card */}
                <View style={styles.statCard}>
                    <LinearGradient
                        colors={['#1976d2', '#1565c0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCardGradient}
                    >
                        <View style={styles.statCardContent}>
                            <View style={styles.statHeader}>
                                <View style={styles.statIconCircle}>
                                    <MaterialCommunityIcons name="account-multiple" size={28} color="#fff" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{patients.length}</Text>
                            <Text style={styles.statLabel}>Total Clients</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Active Staff Card */}
                <View style={styles.statCard}>
                    <LinearGradient
                        colors={['#388e3c', '#2e7d32']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCardGradient}
                    >
                        <View style={styles.statCardContent}>
                            <View style={styles.statHeader}>
                                <View style={styles.statIconCircle}>
                                    <MaterialCommunityIcons name="account-tie" size={28} color="#fff" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{activeStaff}</Text>
                            <Text style={styles.statLabel}>Active Staff</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Pending Invites Card */}
                <View style={styles.statCard}>
                    <LinearGradient
                        colors={['#f57c00', '#ef6c00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCardGradient}
                    >
                        <View style={styles.statCardContent}>
                            <View style={styles.statHeader}>
                                <View style={styles.statIconCircle}>
                                    <MaterialCommunityIcons name="email-outline" size={28} color="#fff" />
                                </View>
                            </View>
                            <Text style={styles.statValue}>{pendingInvites}</Text>
                            <Text style={styles.statLabel}>Pending Invites</Text>
                        </View>
                    </LinearGradient>
                </View>
            </View>

            {/* Recent Activity Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Card style={styles.activityCard}>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#1976d2" />
                        </View>
                        <View style={styles.activityContent}>
                            <Text style={styles.activityTitle}>Dashboard Active</Text>
                            <Text style={styles.activitySubtitle}>System running smoothly • Just now</Text>
                        </View>
                    </View>

                    {patients.length > 0 && (
                        <View style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: '#F3E5F5' }]}>
                                <MaterialCommunityIcons name="account-check" size={24} color="#7b1fa2" />
                            </View>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityTitle}>{patients.length} Clients Active</Text>
                                <Text style={styles.activitySubtitle}>All client records accessible</Text>
                            </View>
                        </View>
                    )}

                    {activeStaff > 0 && (
                        <View style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: '#E8F5E9' }]}>
                                <MaterialCommunityIcons name="account-group" size={24} color="#388e3c" />
                            </View>
                            <View style={styles.activityContent}>
                                <Text style={styles.activityTitle}>{activeStaff} Staff Members</Text>
                                <Text style={styles.activitySubtitle}>Currently active in organization</Text>
                            </View>
                        </View>
                    )}
                </Card>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
    },
    greeting: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    orgName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
        marginBottom: 24,
    },
    quickActionButton: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    statCard: {
        flex: 1,
        minWidth: 200,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    statCardGradient: {
        padding: 20,
    },
    statCardContent: {
        gap: 8,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    activityCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    activitySubtitle: {
        fontSize: 13,
        color: '#666',
    },
});
