import React from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { Text, Card, Divider, Button, Chip, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import LottieView from 'lottie-react-native';
import { EmergencyContactsSection } from '../EmergencyContactsSection';
import { DailyCareLog } from '../../store/dailyCareStore';

interface OverviewTabProps {
    profileId: string;
    dailyLog: DailyCareLog | null;
    recentEntries: any[];
    onEntryPress: (entry: any) => void;
}

export function OverviewTab({ profileId, dailyLog, recentEntries, onEntryPress }: OverviewTabProps) {
    const router = useRouter();
    const theme = useTheme();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Emergency Contacts - High Priority */}
            <EmergencyContactsSection profileId={profileId} />

            {/* Daily Care Summary */}
            <Card style={styles.sectionCard} elevation={1}>
                <Card.Content>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialCommunityIcons name="heart-pulse" size={24} color="#00695C" />
                            <Text variant="titleMedium" style={styles.sectionTitle}>Today's Care</Text>
                        </View>
                        <Button
                            mode="text"
                            compact
                            onPress={() => {
                                const dateStr = new Date().toISOString();
                                router.push(`/add/daily-log?individualId=${profileId}&date=${dateStr}`);
                            }}
                        >
                            + Log
                        </Button>
                    </View>
                    <Divider style={styles.sectionDivider} />

                    {/* Sleep Section - Compact */}
                    <View style={styles.compactSection}>
                        <View style={styles.compactHeaderRow}>
                            <View style={styles.headerLabelContainer}>
                                <MaterialCommunityIcons name="bed-clock" size={18} color="#5C6BC0" />
                                <Text variant="labelMedium" style={[styles.compactHeaderTitle, { color: '#5C6BC0' }]}>SLEEP</Text>
                            </View>
                            <Text variant="titleMedium" style={styles.compactHeaderValue}>
                                {dailyLog?.sleep_hours ? `${dailyLog.sleep_hours} hrs` : '--'}
                            </Text>
                        </View>
                        <Text variant="bodySmall" style={styles.compactDetails}>
                            {dailyLog ? (
                                <>
                                    {dailyLog.sleep_quality ? <Text style={{ textTransform: 'capitalize' }}>{dailyLog.sleep_quality}</Text> : '--'}
                                    <Text> • </Text>
                                    {dailyLog.bed_time && dailyLog.wake_time ? `${dailyLog.bed_time.slice(0, 5)} - ${dailyLog.wake_time.slice(0, 5)}` : '--'}
                                </>
                            ) : 'No data logged'}
                        </Text>
                    </View>

                    <Divider style={styles.compactDivider} />

                    {/* ADL Section - New */}
                    <View style={styles.compactSection}>
                        <View style={styles.compactHeaderRow}>
                            <View style={styles.headerLabelContainer}>
                                <MaterialCommunityIcons name="human-cane" size={18} color="#4CAF50" />
                                <Text variant="labelMedium" style={[styles.compactHeaderTitle, { color: '#4CAF50' }]}>ADLs</Text>
                            </View>
                        </View>
                        <View style={styles.adlContainer}>
                            {[
                                { label: 'Bathing', value: dailyLog?.adl_bathing },
                                { label: 'Dressing', value: dailyLog?.adl_dressing },
                                { label: 'Toileting', value: dailyLog?.adl_toileting },
                                { label: 'Mobility', value: dailyLog?.adl_mobility },
                                { label: 'Feeding', value: dailyLog?.adl_feeding },
                            ].map((adl, index) => {
                                if (!adl.value) return null;
                                let color = '#757575'; // default/not_applicable
                                let shortVal = 'N/A';
                                if (adl.value === 'independent') { color = '#4CAF50'; shortVal = 'Indep'; }
                                if (adl.value === 'assisted') { color = '#FF9800'; shortVal = 'Assist'; }
                                if (adl.value === 'dependent') { color = '#EF5350'; shortVal = 'Dep'; }

                                return (
                                    <View key={index} style={styles.adlItem}>
                                        <Text variant="bodySmall" style={styles.adlLabel}>{adl.label}:</Text>
                                        <Text variant="bodySmall" style={{ color, fontWeight: '600' }}>{shortVal}</Text>
                                    </View>
                                );
                            })}
                            {!dailyLog && <Text variant="bodySmall" style={{ color: '#9E9E9E' }}>No data logged</Text>}
                            {dailyLog && !dailyLog.adl_bathing && !dailyLog.adl_dressing && !dailyLog.adl_toileting && !dailyLog.adl_mobility && !dailyLog.adl_feeding && (
                                <Text variant="bodySmall" style={{ color: '#9E9E9E' }}>No ADLs recorded</Text>
                            )}
                        </View>
                    </View>

                    <Divider style={styles.compactDivider} />

                    {/* Wellness Section - Compact */}
                    <View style={styles.compactSection}>
                        <View style={styles.compactHeaderRow}>
                            <View style={styles.headerLabelContainer}>
                                <MaterialCommunityIcons name="human-handsup" size={18} color="#EF5350" />
                                <Text variant="labelMedium" style={[styles.compactHeaderTitle, { color: '#EF5350' }]}>WELLNESS</Text>
                            </View>
                        </View>
                        <Text variant="bodySmall" style={styles.compactDetails}>
                            Hydration: <Text style={{ fontWeight: '600' }}>{dailyLog?.hydration_level ? dailyLog.hydration_level.charAt(0).toUpperCase() + dailyLog.hydration_level.slice(1) : '--'}</Text>
                            <Text> • </Text>
                            Mood: <Text style={{ fontWeight: '600' }}>{dailyLog?.mood || '--'}</Text>
                        </Text>
                    </View>

                    {/* Notes Section - Compact */}
                    {dailyLog?.notes && (
                        <>
                            <Divider style={styles.compactDivider} />
                            <View style={styles.compactSection}>
                                <View style={styles.compactHeaderRow}>
                                    <View style={styles.headerLabelContainer}>
                                        <MaterialCommunityIcons name="note-text-outline" size={18} color="#FFA726" />
                                        <Text variant="labelMedium" style={[styles.compactHeaderTitle, { color: '#FFA726' }]}>NOTES</Text>
                                    </View>
                                </View>
                                <Text variant="bodySmall" style={styles.compactDetails} numberOfLines={2}>
                                    {dailyLog.notes}
                                </Text>
                            </View>
                        </>
                    )}
                </Card.Content>
            </Card>

            {/* Recent Activity Grid */}
            <View style={styles.activityGrid}>
                <View style={styles.journalSection}>
                    <View style={[styles.sectionHeader, { marginHorizontal: 16 }]}>
                        <View style={styles.sectionTitleRow}>
                            <MaterialCommunityIcons name="notebook" size={24} color="#00695C" />
                            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Activity</Text>
                        </View>
                        <Button
                            mode="text"
                            compact
                            onPress={() => router.push('/add/journal')}
                        >
                            + Log
                        </Button>
                    </View>
                    {recentEntries.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.journalScroll}
                            snapToInterval={328} // card width + margin
                            decelerationRate="fast"
                        >
                            {recentEntries.map((entry) => {
                                const moodConfig: { [key: string]: { emoji: string; color: string; bg: string } } = {
                                    happy: { emoji: '😊', color: '#4CAF50', bg: '#E8F5E9' },
                                    calm: { emoji: '😌', color: '#2196F3', bg: '#E3F2FD' },
                                    sad: { emoji: '😢', color: '#2196F3', bg: '#E3F2FD' },
                                    anxious: { emoji: '😰', color: '#FF9800', bg: '#FFF3E0' },
                                    angry: { emoji: '😠', color: '#F44336', bg: '#FFEBEE' },
                                    tired: { emoji: '😴', color: '#9E9E9E', bg: '#F5F5F5' },
                                };

                                const mood = moodConfig[entry.mood || ''] || { emoji: '📝', color: '#00695C', bg: '#E0F2F1' };

                                // Parse content
                                const lines = entry.content.split('\n').filter((l: string) => l.trim());
                                const hasLabels = lines.some((l: string) => l.startsWith('Feelings:') || l.startsWith('Activities:'));

                                let activities = '';
                                let notes = '';

                                if (hasLabels) {
                                    const activitiesLine = lines.find((l: string) => l.startsWith('Activities:'));
                                    activities = activitiesLine ? activitiesLine.replace('Activities:', '').trim() : '';
                                    notes = lines.filter((l: string) => !l.startsWith('Feelings:') && !l.startsWith('Activities:')).join(' ').trim();
                                } else {
                                    // Legacy fallback
                                    if (lines.length > 0 && !lines[0].includes('.')) {
                                        activities = lines[0];
                                        lines.shift();
                                    }
                                    notes = lines.join(' ').trim();
                                }

                                if (!activities && !notes) {
                                    notes = entry.content;
                                }

                                return (
                                    <Pressable
                                        key={entry.id}
                                        onPress={() => onEntryPress(entry)}
                                        style={({ pressed }) => [
                                            { opacity: pressed ? 0.95 : 1 }
                                        ]}
                                    >
                                        <Card
                                            style={[styles.journalCard, { backgroundColor: mood.bg }]}
                                            elevation={1}
                                        >
                                            <Card.Content style={styles.journalCardContent}>
                                                <View style={styles.journalCardTopRow}>
                                                    <View style={styles.journalCardHeader}>
                                                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                                        <Text variant="bodySmall" style={[styles.journalDate, { color: mood.color }]}>
                                                            {format(new Date(entry.created_at), 'MMM d • h:mm a')}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View style={styles.photoPreviewContainer}>
                                                    {entry.photo_url ? (
                                                        <Image
                                                            source={{ uri: entry.photo_url }}
                                                            style={styles.journalPhotoPreview}
                                                            resizeMode="cover"
                                                        />
                                                    ) : (
                                                        <View style={styles.placeholderContainer}>
                                                            <MaterialCommunityIcons name="image-off-outline" size={48} color="#E0E0E0" />
                                                        </View>
                                                    )}
                                                </View>

                                                <View style={styles.journalTextContainer}>
                                                    {activities ? (
                                                        <View style={[styles.notesRow, { marginBottom: 4 }]}>
                                                            <MaterialCommunityIcons name="run" size={16} color={mood.color} />
                                                            <Text variant="bodyMedium" style={styles.notesText} numberOfLines={1}>
                                                                {activities}
                                                            </Text>
                                                        </View>
                                                    ) : null}

                                                    {notes ? (
                                                        <View style={styles.notesRow}>
                                                            <MaterialCommunityIcons name="note-text" size={16} color={mood.color} />
                                                            <Text variant="bodyMedium" style={styles.notesText} numberOfLines={entry.photo_url ? 2 : 3}>
                                                                {notes}
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </Card.Content>
                                        </Card>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <Card style={styles.emptyJournalCard} elevation={1}>
                            <Card.Content style={styles.emptyJournalContent}>
                                <View style={styles.emptyStateContainer}>
                                    <LottieView
                                        source={require('../../assets/no-data.json')}
                                        autoPlay
                                        loop
                                        style={styles.lottie}
                                    />
                                    <Text variant="bodyMedium" style={styles.emptyText}>No recent activity</Text>
                                </View>
                            </Card.Content>
                        </Card>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 80,
        paddingTop: 16,
    },
    sectionCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: 'white',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontWeight: '600',
        color: '#00695C',
    },
    sectionDivider: {
        marginBottom: 12,
    },
    subsectionDivider: {
        marginVertical: 12,
        backgroundColor: '#E0E0E0',
    },
    compactSection: {
        marginVertical: 4,
    },
    compactHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    headerLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    compactHeaderTitle: {
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    compactHeaderValue: {
        fontWeight: 'bold',
        color: '#424242',
    },
    compactDetails: {
        color: '#616161',
        marginLeft: 26, // Align with title text (18px icon + 8px gap)
    },
    compactDivider: {
        marginVertical: 12,
        backgroundColor: '#F5F5F5',
    },
    adlContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginLeft: 26,
        marginTop: 4,
    },
    adlItem: {
        flexDirection: 'row',
        gap: 4,
    },
    adlLabel: {
        color: '#616161',
    },
    activityGrid: {
        marginBottom: 16,
    },
    journalSection: {
        marginBottom: 0,
    },
    journalScroll: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 12,
    },
    journalCard: {
        width: 320,
        height: 360,
        marginRight: 4,
    },
    journalCardContent: {
        padding: 12,
        height: '100%',
    },
    journalCardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    journalCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    moodEmoji: {
        fontSize: 20,
    },
    journalDate: {
        fontWeight: '600',
    },
    photoPreviewContainer: {
        height: 200,
        marginBottom: 8,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    journalPhotoPreview: {
        width: '100%',
        height: '100%',
    },
    journalTextContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    notesRow: {
        flexDirection: 'row',
        gap: 6,
    },
    notesText: {
        flex: 1,
        color: '#455A64',
        fontSize: 13,
        lineHeight: 18,
    },
    emptyJournalCard: {
        marginHorizontal: 16,
        backgroundColor: '#F5F5F5',
    },
    emptyJournalContent: {
        padding: 24,
        alignItems: 'center',
    },
    emptyStateContainer: {
        alignItems: 'center',
        gap: 8,
    },
    lottie: {
        width: 100,
        height: 100,
    },
    emptyText: {
        color: '#9E9E9E',
    },
});
