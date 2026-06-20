import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, ActivityIndicator, Chip, DataTable } from 'react-native-paper';
import { useOrganizationStore } from '../../store/organizationStore';
import { useReportsStore } from '../../store/reportsStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReportsPage() {
    const { organization } = useOrganizationStore();
    const {
        loading,
        medicationAdherence,
        activityTrends,
        staffActivity,
        upcomingVisits,
        moodDistribution,
        fetchMedicationAdherence,
        fetchActivityTrends,
        fetchStaffActivity,
        fetchUpcomingVisits,
        fetchMoodDistribution
    } = useReportsStore();

    useEffect(() => {
        if (organization?.id) {
            // Fetch all reports
            fetchMedicationAdherence(organization.id);
            fetchActivityTrends(organization.id, 7);
            fetchStaffActivity(organization.id);
            fetchUpcomingVisits(organization.id);
            fetchMoodDistribution(organization.id);
        }
    }, [organization?.id]);

    if (loading && !medicationAdherence) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.pageTitle}>Reports & Analytics</Text>
                <Text style={styles.subtitle}>Insights and trends for {organization?.name}</Text>
            </View>

            {/* Medication Adherence */}
            {medicationAdherence && medicationAdherence.total > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Medication Adherence (Last 30 Days)</Text>
                    <Card style={styles.card}>
                        <View style={styles.adherenceContainer}>
                            {/* Donut Chart Representation */}
                            <View style={styles.donutSection}>
                                <View style={styles.donutCircle}>
                                    <Text style={styles.donutPercentage}>
                                        {Math.round(medicationAdherence.adherenceRate)}%
                                    </Text>
                                    <Text style={styles.donutLabel}>Adherence</Text>
                                </View>
                            </View>

                            {/* Legend */}
                            <View style={styles.legendSection}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
                                    <Text style={styles.legendText}>Taken: {medicationAdherence.taken}</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#f44336' }]} />
                                    <Text style={styles.legendText}>Missed: {medicationAdherence.missed}</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
                                    <Text style={styles.legendText}>Skipped: {medicationAdherence.skipped}</Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalText}>Total Doses: {medicationAdherence.total}</Text>
                                </View>
                            </View>
                        </View>
                    </Card>
                </View>
            )}

            {/* Activity Trends */}
            {activityTrends.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity Trends (Last 7 Days)</Text>
                    <Card style={styles.card}>
                        <View style={styles.chartContainer}>
                            {activityTrends.map((trend, index) => {
                                const total = trend.journalCount + trend.careLogCount;
                                const maxActivity = Math.max(...activityTrends.map(t => t.journalCount + t.careLogCount), 1);
                                const height = (total / maxActivity) * 120;

                                return (
                                    <View key={trend.date} style={styles.barGroup}>
                                        <View style={styles.barContainer}>
                                            <View style={[styles.bar, { height: height || 4, backgroundColor: '#1976d2' }]} />
                                        </View>
                                        <Text style={styles.barLabel}>
                                            {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Text>
                                        <Text style={styles.barCount}>{total}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <View style={styles.activityLegend}>
                            <Text style={styles.activityLegendText}>
                                Combined journal entries and care logs
                            </Text>
                        </View>
                    </Card>
                </View>
            )}

            {/* Staff Activity */}
            {staffActivity.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Contributing Staff</Text>
                    <Card style={styles.card}>
                        {staffActivity.map((staff, index) => (
                            <View key={staff.staffId} style={styles.staffRow}>
                                <View style={styles.staffRank}>
                                    <Text style={styles.rankNumber}>{index + 1}</Text>
                                </View>
                                <View style={styles.staffInfo}>
                                    <Text style={styles.staffName}>{staff.staffName}</Text>
                                    <Text style={styles.staffCount}>{staff.activityCount} activities</Text>
                                </View>
                                <View style={styles.staffBadge}>
                                    <MaterialCommunityIcons
                                        name={index === 0 ? "trophy" : "medal"}
                                        size={24}
                                        color={index === 0 ? "#ffd700" : "#c0c0c0"}
                                    />
                                </View>
                            </View>
                        ))}
                    </Card>
                </View>
            )}

            {/* Upcoming Visits */}
            {upcomingVisits.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Clinical Visits</Text>
                    <Card style={styles.card}>
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title style={{ flex: 2 }}>Client</DataTable.Title>
                                <DataTable.Title style={{ flex: 2 }}>Clinician</DataTable.Title>
                                <DataTable.Title style={{ flex: 1.5 }}>Date</DataTable.Title>
                            </DataTable.Header>
                            {upcomingVisits.map((visit) => (
                                <DataTable.Row key={visit.id}>
                                    <DataTable.Cell style={{ flex: 2 }}>{visit.clientName}</DataTable.Cell>
                                    <DataTable.Cell style={{ flex: 2 }}>
                                        <View>
                                            <Text>{visit.clinicianName}</Text>
                                            {visit.specialty && (
                                                <Text style={styles.specialty}>{visit.specialty}</Text>
                                            )}
                                        </View>
                                    </DataTable.Cell>
                                    <DataTable.Cell style={{ flex: 1.5 }}>
                                        {new Date(visit.visitDate).toLocaleDateString()}
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))}
                        </DataTable>
                    </Card>
                </View>
            )}

            {/* Mood Distribution */}
            {moodDistribution.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Client Mood Trends (Last 30 Days)</Text>
                    <Card style={styles.card}>
                        <View style={styles.moodGrid}>
                            {moodDistribution.map((mood) => (
                                <View key={mood.mood} style={styles.moodChip}>
                                    <Chip
                                        icon={() => <Text style={{ fontSize: 20 }}>{getMoodEmoji(mood.mood)}</Text>}
                                        style={styles.chip}
                                    >
                                        {mood.mood}: {mood.count}
                                    </Chip>
                                </View>
                            ))}
                        </View>
                    </Card>
                </View>
            )}

            {/* Empty State */}
            {!medicationAdherence && activityTrends.length === 0 && staffActivity.length === 0 && (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="chart-line" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No data available yet</Text>
                    <Text style={styles.emptySubtext}>Reports will appear as activity is logged</Text>
                </View>
            )}
        </ScrollView>
    );
}

function getMoodEmoji(mood: string): string {
    const moodMap: { [key: string]: string } = {
        'happy': '😊',
        'sad': '😢',
        'anxious': '😰',
        'energetic': '⚡',
        'neutral': '😐',
        'calm': '😌',
        'excited': '🎉',
        'tired': '😴'
    };
    return moodMap[mood.toLowerCase()] || '💭';
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 24,
        paddingBottom: 16,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    adherenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    donutSection: {
        alignItems: 'center',
    },
    donutCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 16,
        borderColor: '#4caf50',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    donutPercentage: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    donutLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    legendSection: {
        flex: 1,
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    legendDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    legendText: {
        fontSize: 15,
        color: '#333',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    totalText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 160,
        paddingHorizontal: 8,
    },
    barGroup: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    barContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
    },
    bar: {
        width: '60%',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        minHeight: 4,
    },
    barLabel: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
    },
    barCount: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1976d2',
    },
    activityLegend: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    activityLegendText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
    },
    staffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    staffRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1976d2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rankNumber: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    staffInfo: {
        flex: 1,
    },
    staffName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    staffCount: {
        fontSize: 13,
        color: '#666',
    },
    staffBadge: {
        marginLeft: 12,
    },
    specialty: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    moodChip: {
        marginBottom: 8,
    },
    chip: {
        backgroundColor: '#f0f0f0',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 8,
    },
});
