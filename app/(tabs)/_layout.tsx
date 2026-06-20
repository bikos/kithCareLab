import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useCaregiverStore } from '../../store/caregiverStore';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#00695C',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="medications"
                options={{
                    title: 'Medications',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="pill" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="work-notes"
                options={{
                    title: 'Notes',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="note-text" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="account" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
