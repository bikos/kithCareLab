import { Slot, useRouter, usePathname } from 'expo-router';
import { View, Text, StyleSheet, Platform, useWindowDimensions, Image, Modal as RNModal, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Appbar, useTheme, Drawer } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { useOrganizationStore } from '../../store/organizationStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const appIcon = require('../../assets/icon.png');

export default function DashboardLayout() {
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const isLargeScreen = width > 768;
    const [active, setActive] = useState('dashboard');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { fetchMyOrganization, organization } = useOrganizationStore();
    const { session } = useAuthStore();

    useEffect(() => {
        fetchMyOrganization();
    }, []);

    useEffect(() => {
        if (pathname === '/dashboard' || pathname === '/dashboard/') {
            setActive('dashboard');
        } else if (pathname.startsWith('/dashboard/client')) {
            setActive('clients');
        } else if (pathname.startsWith('/dashboard/staff')) {
            setActive('staff');
        } else if (pathname.startsWith('/dashboard/report')) {
            setActive('reports');
        } else if (pathname.startsWith('/dashboard/profile')) {
            setActive('profile');
        } else {
            setActive('dashboard');
        }
    }, [pathname]);

    if (Platform.OS !== 'web') {
        return <Slot />;
    }

    const navigateTo = (route: string) => {
        if (route === 'dashboard') router.push('/dashboard/');
        else router.push(`/dashboard/${route}`);
        setDrawerOpen(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const sidebarContent = (onNavigate: (route: string) => void) => (
        <>
            {/* Branding Header */}
            <View style={styles.sidebarHeader}>
                <Image source={appIcon} style={styles.sidebarLogo} resizeMode="contain" />
                <View style={styles.sidebarBrandText}>
                    <Text style={styles.sidebarTitle}>KithCare</Text>
                    <Text style={styles.sidebarOrgName} numberOfLines={1}>
                        {organization?.name || 'Admin Portal'}
                    </Text>
                </View>
            </View>

            <Drawer.Section title="Management">
                <Drawer.Item
                    label="Dashboard"
                    active={active === 'dashboard'}
                    onPress={() => onNavigate('dashboard')}
                    icon="view-dashboard"
                />
                <Drawer.Item
                    label="Clients"
                    active={active === 'clients'}
                    onPress={() => onNavigate('clients')}
                    icon="account-group"
                />
                <Drawer.Item
                    label="Staff"
                    active={active === 'staff'}
                    onPress={() => onNavigate('staff')}
                    icon="doctor"
                />
            </Drawer.Section>
            <Drawer.Section title="Analytics">
                <Drawer.Item
                    label="Reports"
                    active={active === 'reports'}
                    onPress={() => onNavigate('reports')}
                    icon="chart-bar"
                />
            </Drawer.Section>
            <Drawer.Section title="Account">
                <Drawer.Item
                    label="Profile"
                    active={active === 'profile'}
                    onPress={() => onNavigate('profile')}
                    icon="account"
                />
                <Drawer.Item
                    label="Logout"
                    onPress={handleSignOut}
                    icon="logout"
                />
            </Drawer.Section>
        </>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Small-screen top app bar */}
            {!isLargeScreen && (
                <Appbar.Header style={styles.appBar} elevated>
                    <Appbar.Action icon="menu" onPress={() => setDrawerOpen(true)} />
                    <Appbar.Content
                        title="KithCare"
                        titleStyle={styles.appBarTitle}
                    />
                    <Appbar.Action icon="logout" onPress={handleSignOut} />
                </Appbar.Header>
            )}

            <View style={styles.contentContainer}>
                {/* Sidebar (Permanent on large screens) */}
                {isLargeScreen && (
                    <View style={styles.sidebar}>
                        {sidebarContent(navigateTo)}
                    </View>
                )}

                {/* Main Content Area */}
                <View style={styles.main}>
                    <Slot />
                </View>
            </View>

            {/* Mobile Slide-out Drawer */}
            {!isLargeScreen && (
                <RNModal
                    visible={drawerOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setDrawerOpen(false)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
                            <View style={styles.modalBackdrop} />
                        </TouchableWithoutFeedback>
                        <View style={styles.drawerModal}>
                            {sidebarContent((route) => {
                                setDrawerOpen(false);
                                // Small delay lets modal close animation start before navigation
                                setTimeout(() => navigateTo(route), 50);
                            })}
                        </View>
                    </View>
                </RNModal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    // App bar (small screens)
    appBar: {
        backgroundColor: '#fff',
        elevation: 2,
    },
    appBarTitle: {
        fontWeight: 'bold',
        color: '#00695C',
        fontSize: 18,
    },
    // Sidebar
    sidebar: {
        width: 250,
        backgroundColor: '#fff',
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        marginBottom: 8,
    },
    sidebarLogo: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    sidebarBrandText: {
        marginLeft: 12,
        flex: 1,
    },
    sidebarTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#00695C',
    },
    sidebarOrgName: {
        fontSize: 12,
        color: '#999',
        marginTop: 1,
    },
    // Main content
    main: {
        flex: 1,
        padding: 24,
    },
    // Mobile drawer
    modalOverlay: {
        flex: 1,
        flexDirection: 'row',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawerModal: {
        backgroundColor: '#fff',
        width: 280,
        height: '100%',
        paddingTop: Platform.OS === 'ios' ? 48 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
});
