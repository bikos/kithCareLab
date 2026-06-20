import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { Profile } from '../store/caregiverStore';

interface ClientListRowProps {
    profile: Profile;
    isActive?: boolean;
    onPress: () => void;
}

export default function ClientListRow({ profile, isActive, onPress }: ClientListRowProps) {
    const theme = useTheme();

    const age = profile.date_of_birth
        ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
        : null;

    const hasDirectives = profile.dnr_status || profile.living_will_status;

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.row, isActive && { backgroundColor: '#E0F2F1' }]}
            activeOpacity={0.7}
        >
            {/* Avatar */}
            <View style={styles.avatarCell}>
                {profile.avatar_url ? (
                    <Avatar.Image size={38} source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                    <Avatar.Text
                        size={38}
                        label={profile.full_name.substring(0, 2).toUpperCase()}
                        style={styles.avatar}
                    />
                )}
            </View>

            {/* Name */}
            <View style={[styles.cell, { flex: 2 }]}>
                <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
                    {profile.full_name}
                </Text>
            </View>

            {/* Age / Sex */}
            <View style={[styles.cell, { flex: 1 }]}>
                <Text variant="bodySmall" style={styles.secondary}>
                    {age ? `${age} yrs` : '—'}
                    {age && profile.sex ? ' · ' : ''}
                    {profile.sex ? profile.sex.charAt(0).toUpperCase() : ''}
                </Text>
            </View>

            {/* Location */}
            <View style={[styles.cell, { flex: 1.2 }]}>
                <Text variant="bodySmall" style={styles.secondary} numberOfLines={1}>
                    {profile.city && profile.state
                        ? `${profile.city}, ${profile.state}`
                        : '—'}
                </Text>
            </View>

            {/* Medical Alert */}
            <View style={[styles.cell, { flex: 2.5 }]}>
                <Text variant="bodySmall" style={styles.medicalText} numberOfLines={1}>
                    {profile.medical_notes || 'None'}
                </Text>
            </View>

            {/* Directives */}
            <View style={[styles.cell, styles.directivesCell, { flex: 1.2 }]}>
                {hasDirectives ? (
                    <View style={styles.directivesRow}>
                        {profile.dnr_status && (
                            <View style={styles.dnrChip}>
                                <Text style={styles.dnrChipText}>DNR</Text>
                            </View>
                        )}
                        {profile.living_will_status && (
                            <View style={styles.lwChip}>
                                <Text style={styles.lwChipText}>LW</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <Text variant="bodySmall" style={styles.secondary}>N/A</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    avatarCell: {
        marginRight: 12,
    },
    avatar: {
        backgroundColor: '#E0F2F1',
    },
    cell: {
        paddingRight: 12,
        justifyContent: 'center',
    },
    name: {
        fontWeight: '600',
        color: '#212121',
    },
    secondary: {
        color: '#757575',
    },
    medicalText: {
        color: '#424242',
    },
    directivesCell: {
        paddingRight: 0,
    },
    directivesRow: {
        flexDirection: 'row',
        gap: 4,
        flexWrap: 'wrap',
    },
    dnrChip: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    dnrChipText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#D32F2F',
    },
    lwChip: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    lwChipText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1976D2',
    },
});
