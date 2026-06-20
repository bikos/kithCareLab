import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, StatusBar as RNStatusBar } from 'react-native';
import { Text, Card, Button, Avatar, useTheme, FAB, Modal, Portal, TextInput, Chip, Divider, Searchbar, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShiftStore } from '../../store/shiftStore'; // NEW
import { Alert } from 'react-native';

import { useAuthStore } from '../../store/authStore';
import { useCaregiverStore, Profile } from '../../store/caregiverStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingAnimation from '../../components/LoadingAnimation';
import ClientCard from '../../components/ClientCard';
import ShiftStatusCard from '../../components/ShiftStatusCard';

// Training resource data
const trainingResources = [
    {
        id: '6',
        title: 'Person-Centered Workflow',
        description: 'Step-by-step guide for compassionate care',
        icon: 'account-heart',
        color: '#E91E63',
    },
    {
        id: '1',
        title: 'Medication Management',
        description: 'Learn best practices for managing medications safely',
        icon: 'pill',
        color: '#4CAF50',
    },
    {
        id: '2',
        title: 'Emergency Response',
        description: 'Quick guide to handling medical emergencies',
        icon: 'ambulance',
        color: '#F44336',
    },
    {
        id: '3',
        title: 'Daily Care Tips',
        description: 'Essential tips for daily caregiving routines',
        icon: 'heart-pulse',
        color: '#2196F3',
    },
    {
        id: '4',
        title: 'Nutrition Guide',
        description: 'Healthy meal planning for seniors',
        icon: 'food-apple',
        color: '#FF9800',
    },
    {
        id: '5',
        title: 'Mental Health',
        description: 'Supporting emotional well-being',
        icon: 'brain',
        color: '#9C27B0',
    },
];

export default function HomeScreen() {
    const router = useRouter();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [now, setNow] = useState(new Date()); // Timer state

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);
    const { user, profile } = useAuthStore();
    const { managedProfiles, currentProfile, fetchManagedProfiles, setCurrentProfile, joinByAccessCode, loading } = useCaregiverStore();
    const { fetchActiveShift } = useShiftStore();

    const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');


    // Animation for status bar
    const scrollY = useRef(new Animated.Value(0)).current;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Snackbar State
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    useEffect(() => {
        fetchManagedProfiles();
        fetchActiveShift(); // Check for global shift
        fetchActiveShift(); // Check for global shift
    }, []);


    const handleJoin = async () => {
        if (!accessCode) return;
        try {
            await joinByAccessCode(accessCode);
            setIsJoinModalVisible(false);
            setAccessCode('');
            setSnackbarMessage('Successfully joined care team!');
            setSnackbarType('success');
            setSnackbarVisible(true);
        } catch (error: any) {
            console.error('Error joining:', error);
            setSnackbarMessage(error.message || 'Failed to join care team');
            setSnackbarType('error');
            setSnackbarVisible(true);
        }
    };

    const handleSelectProfile = (profile: Profile) => {
        setCurrentProfile(profile);
        router.push('/client-detail');
    };

    const individuals = managedProfiles.filter(p => p.role === 'individual');
    const filteredIndividuals = individuals.filter(p =>
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.statusBarOverlay,
                    {
                        height: insets.top,
                        opacity: headerOpacity,
                        backgroundColor: '#6fc543ff', // Dark Green
                    },
                ]}
            />
            <ScrollView
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Global Shift Status Card */}


                {/* Patients Section */}
                <View style={styles.patientsSection}>
                    <View style={styles.headerRow}>
                        <Text variant="headlineMedium" style={styles.header}>Your Patients</Text>
                        <Button
                            mode="text"
                            onPress={() => setIsJoinModalVisible(true)}
                            icon="account-plus"
                            compact
                            textColor="#00695C"
                            style={styles.joinButton}
                        >
                            Join
                        </Button>
                    </View>

                    {/* Search Bar */}
                    <Searchbar
                        placeholder="Search patients..."
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={styles.searchBar}
                        iconColor="#00695C"
                    />


                    {/* Patients Grid */}
                    {loading ? (
                        <LoadingAnimation visible={true} style={styles.loadingContainer} />
                    ) : filteredIndividuals.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Card.Content style={styles.emptyContent}>
                                <MaterialCommunityIcons name="account-heart" size={64} color="#ccc" />
                                <Text variant="titleMedium" style={styles.emptyTitle}>
                                    {searchQuery ? 'No patients found' : 'No patients yet'}
                                </Text>
                                <Text variant="bodyMedium" style={styles.emptyText}>
                                    {searchQuery
                                        ? 'Try a different search term'
                                        : 'Start by adding someone you care for'
                                    }
                                </Text>
                                {!searchQuery && (
                                    <Button
                                        mode="contained"
                                        onPress={() => router.push('/add-client')}
                                        icon="plus"
                                        style={styles.emptyBtn}
                                    >
                                        Add Patient
                                    </Button>
                                )}
                            </Card.Content>
                        </Card>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalScroll}
                            style={styles.scrollContainer}
                        >
                            {filteredIndividuals.map((profile) => (
                                <ClientCard
                                    key={profile.id}
                                    profile={profile}
                                    isActive={currentProfile?.id === profile.id}
                                    onPress={() => handleSelectProfile(profile)}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>

                <Divider style={styles.sectionDivider} />

                {/* Global Shift Status Card */}
                <ShiftStatusCard />




                <Divider style={styles.sectionDivider} />

                {/* Training Resources Section */}
                <View style={styles.resourcesSection}>
                    <Text variant="headlineMedium" style={styles.resourcesSectionTitle}>
                        Caregiver Resources
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.resourcesScroll}
                        snapToInterval={296}
                        decelerationRate="fast"
                    >
                        {trainingResources.map((resource) => (
                            <TouchableOpacity
                                key={resource.id}
                                onPress={() => router.push(`/resource-detail?id=${resource.id}`)}
                            >
                                <Card style={styles.resourceCard}>
                                    <Card.Content style={styles.resourceContent}>
                                        <View style={[styles.resourceIcon, { backgroundColor: resource.color }]}>
                                            <MaterialCommunityIcons
                                                name={resource.icon as any}
                                                size={32}
                                                color="white"
                                            />
                                        </View>
                                        <Text variant="titleSmall" style={styles.resourceCardTitle}>
                                            {resource.title}
                                        </Text>
                                        <Text variant="bodySmall" style={styles.resourceCardDesc} numberOfLines={2}>
                                            {resource.description}
                                        </Text>
                                        <Button
                                            mode="text"
                                            compact
                                            style={styles.resourceBtn}
                                            textColor={resource.color}
                                        >
                                            Learn More
                                        </Button>
                                    </Card.Content>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <Divider style={styles.sectionDivider} />


            </ScrollView>

            {/* FAB */}
            <FAB
                icon="plus"
                label="Add Patient"
                style={styles.fab}
                color="white"
                onPress={() => router.push('/add-client')}
            />

            {/* Join Modal */}
            <Portal>
                <Modal visible={isJoinModalVisible} onDismiss={() => setIsJoinModalVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>Join Care Team</Text>
                    <Text variant="bodyMedium" style={styles.modalText}>
                        Enter the access code shared by another caregiver
                    </Text>
                    <TextInput
                        label="Access Code"
                        value={accessCode}
                        onChangeText={setAccessCode}
                        mode="outlined"
                        autoCapitalize="characters"
                        style={styles.input}
                    />
                    <View style={styles.modalButtons}>
                        <Button mode="text" onPress={() => setIsJoinModalVisible(false)}>Cancel</Button>
                        <Button mode="contained" onPress={handleJoin} disabled={!accessCode}>Join</Button>
                    </View>
                </Modal>
            </Portal>

            {/* Top Toast Notification */}
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{
                    backgroundColor: snackbarType === 'success' ? '#4CAF50' : '#D32F2F',
                    borderRadius: 8,
                    margin: 16,
                }}
                wrapperStyle={{ top: 50 }} // Position at top, below status bar
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    statusBarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    sectionDivider: {
        height: 8,
        backgroundColor: '#f5f5f5',
    },
    patientsSection: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: 5,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingRight: 10,
    },
    header: {
        padding: 20,
        paddingTop: 30,
        backgroundColor: 'white',
        fontWeight: 'bold',
        color: '#00695C',
        flex: 1,
    },
    joinButton: {
        marginTop: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontWeight: '600',
        color: '#00695C',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    searchBar: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 0,
        marginBottom: 8,
    },
    horizontalScroll: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 12,
    },
    // Removed old card styles (cardWrapper, profileCard, etc)
    locationText: {
        color: '#666',
        fontSize: 11,
    },
    emptyCard: {
        backgroundColor: 'white',
        margin: 20,
    },
    emptyContent: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
        color: '#666',
    },
    emptyText: {
        color: '#999',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyBtn: {
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: '#00695C',
    },
    modal: {
        backgroundColor: 'white',
        padding: 24,
        margin: 20,
        borderRadius: 8,
    },
    modalTitle: {
        marginBottom: 8,
        color: '#00695C',
    },
    modalText: {
        marginBottom: 16,
        color: '#666',
    },
    input: {
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    resourcesSection: {
        backgroundColor: 'white',
        paddingTop: 16,
        paddingBottom: 100,
    },
    resourcesSectionTitle: {
        paddingHorizontal: 20,
        marginBottom: 12,
        fontWeight: 'bold',
        color: '#00695C',
    },
    resourcesScroll: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 16,
    },
    resourceCard: {
        width: 240,
        height: 190,
        backgroundColor: 'white',
    },
    resourceContent: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    resourceIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    resourceCardTitle: {
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 6,
    },
    resourceCardDesc: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 12,
    },
    resourceBtn: {
        marginTop: 4,
    },
    loadingContainer: {
        marginTop: 40,
        marginBottom: 40,
    },
});
