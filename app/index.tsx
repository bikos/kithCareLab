import React from 'react';
import { View, StyleSheet, Image, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

const appIcon = require('../assets/images/icon.png');

export default function Index() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWide = width > 768;

    // Subtle dotted background for Web
    const webDottedBackground = Platform.OS === 'web' ? {
        backgroundImage: 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)',
        backgroundSize: '32px 32px',
    } as any : {};

    return (
        <View style={[styles.container, webDottedBackground]}>
            <View style={styles.contentWrapper}>
                
                {/* Header Navbar */}
                <View style={[styles.navbar, isWide ? styles.navbarWide : styles.navbarNarrow]}>
                    <View style={styles.navBrand}>
                        <Image source={appIcon} style={styles.navLogo} resizeMode="contain" />
                        <Text style={styles.navTitle}>KithCare</Text>
                    </View>
                    <Button 
                        mode="outlined" 
                        onPress={() => router.push('/auth/login')}
                        textColor="#0F172A"
                        style={styles.navLoginBtn}
                    >
                        Log In
                    </Button>
                </View>

                {/* Hero Content */}
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.heroContent, isWide ? styles.heroContentWide : styles.heroContentNarrow]}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Now Available</Text>
                        </View>
                        <Text style={[styles.heroHeadline, isWide ? styles.heroHeadlineWide : styles.heroHeadlineNarrow]}>
                            Compassionate care,{'\n'}beautifully organized.
                        </Text>
                        <Text style={[styles.heroSubheadline, isWide ? styles.heroSubheadlineWide : styles.heroSubheadlineNarrow]}>
                            The complete operating system for modern caregiving facilities. Manage staff, oversee resident well-being, and connect with families seamlessly.
                        </Text>
                        
                        <View style={[styles.ctaContainer, isWide ? styles.ctaContainerWide : styles.ctaContainerNarrow]}>
                            <Button 
                                mode="contained" 
                                onPress={() => router.push('/auth/login')}
                                style={styles.ctaButtonPrimary}
                                contentStyle={styles.ctaButtonContent}
                                labelStyle={styles.ctaButtonLabel}
                            >
                                Access Portal
                            </Button>
                        </View>
                    </View>

                    {/* Feature Cards */}
                    <View style={[styles.featuresGrid, isWide ? styles.featuresGridWide : styles.featuresGridNarrow]}>
                        <View style={styles.featureCard}>
                            <View style={styles.iconWrapper}>
                                <Text style={styles.featureIcon}>🛡️</Text>
                            </View>
                            <Text style={styles.featureTitle}>Secure Access</Text>
                            <Text style={styles.featureDesc}>Role-based access controls designed for strict compliance and data privacy.</Text>
                        </View>
                        <View style={styles.featureCard}>
                            <View style={styles.iconWrapper}>
                                <Text style={styles.featureIcon}>⏱️</Text>
                            </View>
                            <Text style={styles.featureTitle}>Real-time Shifts</Text>
                            <Text style={styles.featureDesc}>Live tracking of staff shifts, handoff notes, and active care operations.</Text>
                        </View>
                        <View style={styles.featureCard}>
                            <View style={styles.iconWrapper}>
                                <Text style={styles.featureIcon}>❤️</Text>
                            </View>
                            <Text style={styles.featureTitle}>Patient Centric</Text>
                            <Text style={styles.featureDesc}>Holistic patient profiles with integrated medication tracking and emergency directives.</Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>© {new Date().getFullYear()} KithCare Inc. All rights reserved.</Text>
                    </View>
                </ScrollView>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Egg white / off-white base
    },
    contentWrapper: {
        flex: 1,
        backgroundColor: 'rgba(250, 250, 250, 0.6)', // Slight wash over dots
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    navbarWide: {
        paddingHorizontal: 60,
    },
    navbarNarrow: {
        paddingHorizontal: 20,
    },
    navBrand: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navLogo: {
        width: 36,
        height: 36,
        marginRight: 12,
        borderRadius: 8,
    },
    navTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    navLoginBtn: {
        borderColor: '#CBD5E1',
        borderRadius: 20,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    heroContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingBottom: 80,
    },
    heroContentWide: {
        paddingHorizontal: 60,
    },
    heroContentNarrow: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 60,
    },
    badge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginBottom: 24,
    },
    badgeText: {
        color: '#1D4ED8',
        fontWeight: 'bold',
        fontSize: 14,
    },
    heroHeadline: {
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: -1,
    },
    heroHeadlineWide: {
        fontSize: 72,
        lineHeight: 80,
    },
    heroHeadlineNarrow: {
        fontSize: 48,
        lineHeight: 56,
    },
    heroSubheadline: {
        color: '#475569',
        textAlign: 'center',
        marginBottom: 48,
        maxWidth: 700,
    },
    heroSubheadlineWide: {
        fontSize: 22,
        lineHeight: 34,
    },
    heroSubheadlineNarrow: {
        fontSize: 18,
        lineHeight: 28,
    },
    ctaContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    ctaContainerWide: {
        // Horizontal on wide
    },
    ctaContainerNarrow: {
        flexDirection: 'column',
        width: '100%',
        maxWidth: 320,
    },
    ctaButtonPrimary: {
        backgroundColor: '#0F172A',
        borderRadius: 30,
        elevation: 0,
    },
    ctaButtonContent: {
        height: 60,
        paddingHorizontal: 40,
    },
    ctaButtonLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 32,
        marginTop: 20,
    },
    featuresGridWide: {
        paddingHorizontal: 60,
    },
    featuresGridNarrow: {
        paddingHorizontal: 20,
        flexDirection: 'column',
        alignItems: 'center',
    },
    featureCard: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 24,
        width: '100%',
        maxWidth: 360,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    featureIcon: {
        fontSize: 28,
    },
    featureTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 12,
    },
    featureDesc: {
        color: '#64748B',
        fontSize: 16,
        lineHeight: 26,
    },
    footer: {
        marginTop: 100,
        alignItems: 'center',
        paddingVertical: 40,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 15,
    },
});
