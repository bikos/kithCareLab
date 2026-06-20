import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Avatar, useTheme } from 'react-native-paper';
import { Profile } from '../store/caregiverStore';

interface ClientCardProps {
    profile: Profile;
    isActive?: boolean;
    onPress: () => void;
}

export default function ClientCard({ profile, isActive, onPress }: ClientCardProps) {
    const theme = useTheme();

    const age = profile.date_of_birth
        ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
        : null;

    const hasDirectives = profile.dnr_status || profile.living_will_status;

    return (
        <TouchableOpacity onPress={onPress} style={styles.cardWrapper}>
            <Card style={[styles.card, isActive && styles.activeCard]} elevation={isActive ? 4 : 1}>
                <Card.Content style={styles.content}>
                    {/* Header: Avatar & Demographics */}
                    <View style={styles.header}>
                        {profile.avatar_url ? (
                            <Avatar.Image
                                size={72}
                                source={{ uri: profile.avatar_url }}
                                style={styles.avatar}
                            />
                        ) : (
                            <Avatar.Text
                                size={72}
                                label={profile.full_name.substring(0, 2).toUpperCase()}
                                style={styles.avatar}
                            />
                        )}
                        <View style={styles.headerInfo}>
                            <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
                                {profile.full_name}
                            </Text>
                            <Text variant="bodySmall" style={styles.demographics}>
                                {age ? `${age} yrs` : ''}
                                {age && profile.sex ? ' • ' : ''}
                                {profile.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : ''}
                            </Text>
                            {/* Low profile location */}
                            {profile.city && profile.state && (
                                <Text variant="labelSmall" style={styles.location}>
                                    {profile.city}, {profile.state}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.body}>
                        {/* Medical Snippet - Main Context - Always Visible */}
                        <View style={styles.medicalBox}>
                            <Text variant="titleSmall" style={styles.sectionLabel}>Medical Alert</Text>
                            <Text variant="bodySmall" style={styles.medicalText} numberOfLines={2}>
                                {profile.medical_notes || 'None'}
                            </Text>
                        </View>

                        {/* Directives - Always Visible */}
                        <View style={styles.directivesRow}>
                            <Text variant="labelSmall" style={styles.directiveLabel}>Directives:</Text>
                            <Text variant="bodySmall" style={styles.directiveText}>
                                {hasDirectives ? (
                                    <>
                                        {profile.dnr_status && <Text style={styles.dnrText}>DNR</Text>}
                                        {profile.dnr_status && profile.living_will_status && ' • '}
                                        {profile.living_will_status && <Text style={styles.lwText}>Living Will</Text>}
                                    </>
                                ) : (
                                    'N/A'
                                )}
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginRight: 16,
        paddingBottom: 4, // Shadow space
    },
    card: {
        width: 280, // Slightly wider for better text flow
        backgroundColor: 'white',
        borderRadius: 12,
    },
    activeCard: {
        borderColor: '#00695C',
        borderWidth: 2,
    },
    content: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        backgroundColor: '#E0F2F1', // Light teal bg for text avatars
    },
    headerInfo: {
        marginLeft: 12,
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontWeight: 'bold',
        color: '#212121',
    },
    demographics: {
        color: '#757575',
    },
    location: {
        color: '#9E9E9E',
        marginTop: 2,
    },
    body: {
        gap: 8,
    },
    medicalBox: {
        backgroundColor: '#FFF8E1', // Light amber/orange background
        padding: 8,
        borderRadius: 6,
        borderLeftWidth: 3,
        borderLeftColor: '#FF6F00', // Amber 900
    },
    sectionLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        color: '#E65100', // Orange 900
        fontWeight: '700',
        marginBottom: 2,
    },
    medicalText: {
        color: '#424242',
        lineHeight: 16,
    },
    directivesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    directiveLabel: {
        color: '#757575',
        marginRight: 6,
    },
    directiveText: {
        fontWeight: '500',
    },
    dnrText: {
        color: '#D32F2F', // Red
        fontWeight: 'bold',
    },
    lwText: {
        color: '#1976D2', // Blue
        fontWeight: 'bold',
    },
});
