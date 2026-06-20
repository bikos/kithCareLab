import React from 'react';
import { View, Alert } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useShiftStore } from '../store/shiftStore';
import { useAuthStore } from '../store/authStore';

export default function ShiftStatusCard() {
    const router = useRouter();
    const { activeShift, loading: shiftLoading, startShift } = useShiftStore();
    const { profile } = useAuthStore();

    const handlePress = () => {
        if (activeShift) {
            router.push('/end-shift');
        } else {
            console.log('DEBUG: User Profile:', profile);
            console.log('DEBUG: Organization ID:', profile?.organization_id);

            if (!profile?.organization_id) {
                Alert.alert('Organization Required', 'You must join an organization to start a shift.');
                return;
            }
            Alert.alert('Start Shift', 'Begin your shift at your facility?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Start', onPress: () => startShift(profile.organization_id) }
            ]);
        }
    };

    return (
        <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: 'white' }}>
            <Card style={{ backgroundColor: activeShift ? '#e3f2fd' : 'white', elevation: 2 }}>
                <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{
                                width: 48, height: 48, borderRadius: 24,
                                backgroundColor: activeShift ? '#1976D2' : '#f5f5f5',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <MaterialCommunityIcons
                                    name={activeShift ? "clock-check-outline" : "clock-start"}
                                    size={28}
                                    color={activeShift ? "white" : "#666"}
                                />
                            </View>
                            <View>
                                <Text variant="titleMedium" style={{ fontSize: 18, color: activeShift ? '#1565C0' : '#333', fontWeight: 'bold' }}>
                                    {activeShift ? 'Shift Active' : 'Start Your Shift'}
                                </Text>
                                <Text variant="bodySmall" style={{ color: activeShift ? '#1976D2' : '#666' }}>
                                    {activeShift
                                        ? `Started: ${new Date(activeShift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                        : 'Ready to begin working?'}
                                </Text>
                            </View>
                        </View>
                        <Button
                            mode="contained"
                            buttonColor={activeShift ? '#D32F2F' : '#1976D2'}
                            loading={shiftLoading}
                            onPress={handlePress}
                        >
                            {activeShift ? 'End' : 'Start'}
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        </View>
    );
}
