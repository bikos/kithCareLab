import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Image,
    useWindowDimensions,
    ScrollView,
    Platform,
    Pressable,
    Animated,
} from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const appIcon = require('../assets/images/icon.png');
const familyAbstract = require('../assets/images/seniors_family.png');
const journeyAbstract = require('../assets/images/seniors_caregiver.png');

// Hero video component — web landing page only
function HeroVideo({ style }: { style?: any }) {
    return (
        <View style={style}>
            {/* @ts-ignore — plain HTML video tag, works perfectly on web */}
            <video
                src={require('../assets/images/help1.mp4')}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }}
            />
        </View>
    );
}

// Inject web-only CSS animation keyframes once
function useWebAnimations() {
    useEffect(() => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;
        const id = 'kc-landing-css';
        if (document.getElementById(id)) return;
        const el = document.createElement('style');
        el.id = id;
        el.textContent = `
            @keyframes kc-float {
                0%,100% { transform: translateY(0px); }
                50% { transform: translateY(-14px); }
            }
            @keyframes kc-float2 {
                0%,100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            @keyframes kc-pulse {
                0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.35); }
                70% { box-shadow: 0 0 0 12px rgba(37,99,235,0); }
                100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
            }
            .kc-float { animation: kc-float 6s ease-in-out infinite; }
            .kc-float2 { animation: kc-float2 7s ease-in-out infinite; animation-delay: -3s; }
            .kc-pulse { animation: kc-pulse 2.5s infinite; }
            .kc-card:hover { transform: translateY(-6px); transition: transform 0.3s ease, box-shadow 0.3s ease; }
            @media (prefers-reduced-motion: reduce) {
                .kc-float,.kc-float2,.kc-pulse { animation: none !important; }
                .kc-card:hover { transform: none !important; }
            }
        `;
        document.head.appendChild(el);
    }, []);
}

// Attach a web CSS class to a native view via ref
function useWebClass(className: string) {
    const ref = useRef<any>(null);
    useEffect(() => {
        if (Platform.OS !== 'web' || !ref.current) return;
        const node = ref.current as any;
        // In React Native Web the DOM node is at ._nativeTag or via findDOMNode-equivalent
        const el = node._nativeTag ?? node;
        if (el && el.classList) el.classList.add(...className.split(' '));
    }, [className]);
    return ref;
}

const FEATURES = [
    { icon: 'brain', title: 'Dementia Progress Tracking', desc: 'Monitor daily changes, memory moments, and behavioral patterns over time.' },
    { icon: 'shield-home', title: 'Family Peace of Mind', desc: "Give remote family members a secure window into their loved one's day." },
    { icon: 'note-text-outline', title: 'Daily Care Notes', desc: 'Simple, narrative-driven updates rather than complex medical charts.' },
    { icon: 'handshake', title: 'Caregiver Handoffs', desc: 'Ensure continuity of care between daytime and nighttime caregivers.' },
    { icon: 'bell-ring-outline', title: 'Gentle Reminders', desc: 'Track important daily routines and gentle nudges securely.' },
    { icon: 'office-building', title: 'Facility Oversight', desc: 'High-level organization tools to manage staff without the bloat of an EMR.' },
];

export default function Index() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isWide = width > 768;
    const scrollViewRef = useRef<ScrollView>(null);

    useWebAnimations();

    // Floating animations via RN Animated API (works on all platforms)
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const makeFloat = (val: Animated.Value, duration: number, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: -14, duration, delay, useNativeDriver: true }),
                    Animated.timing(val, { toValue: 0, duration, useNativeDriver: true }),
                ])
            );
        const a1 = makeFloat(float1, 3000, 0);
        const a2 = makeFloat(float2, 3500, 500);
        a1.start(); a2.start();
        return () => { a1.stop(); a2.stop(); };
    }, []);

    const scrollTo = (y: number) => scrollViewRef.current?.scrollTo({ y, animated: true });

    const heroRef = useWebClass('kc-float');
    const familyRef = useWebClass('kc-float2');
    const journeyRef = useWebClass('kc-float');
    const badgeRef = useWebClass('kc-pulse');

    return (
        <View style={s.root}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
            >
                {/* ── Navbar ── */}
                <View style={[s.navbar, isWide ? s.navWide : s.navNarrow,
                    Platform.OS === 'web'
                        ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any
                        : undefined
                ]}>
                    <View style={s.brand}>
                        <Image source={appIcon} style={s.brandLogo} resizeMode="contain" />
                        <Text style={s.brandName}>KithCare</Text>
                    </View>
                    {isWide && (
                        <View style={s.navLinks}>
                            <Pressable onPress={() => scrollTo(700)}><Text style={s.navLink}>Architecture</Text></Pressable>
                            <Pressable onPress={() => scrollTo(1400)}><Text style={s.navLink}>Features</Text></Pressable>
                            <Pressable onPress={() => scrollTo(2200)}><Text style={s.navLink}>How It Works</Text></Pressable>
                        </View>
                    )}
                    <Button mode="contained" onPress={() => router.push('/auth/login')}
                        style={s.navCta} labelStyle={s.navCtaLabel}>
                        Get Started
                    </Button>
                </View>

                {/* ── Hero ── */}
                <View style={[s.hero, isWide ? s.heroWide : s.heroNarrow]}>
                    <View style={s.heroText}>
                        <View ref={badgeRef as any} style={s.badge}>
                            <MaterialCommunityIcons name="heart-pulse" size={15} color="#1D4ED8" style={{ marginRight: 6 }} />
                            <Text style={s.badgeText}>For Families & Memory Care Facilities</Text>
                        </View>
                        <Text style={[s.headline, isWide ? s.headlineWide : s.headlineNarrow]}>
                            Connecting families.{'\n'}Tracking memories.{'\n'}Enhancing care.
                        </Text>
                        <Text style={s.subheadline}>
                            Whether you're managing care at home or running a memory care facility — KithCare provides peace of mind by keeping everyone connected to the daily progress of your loved ones.
                        </Text>
                        <View style={[s.ctaRow, !isWide && s.ctaRowNarrow]}>
                            <Button mode="contained" onPress={() => router.push('/auth/login')}
                                style={s.ctaPrimary} contentStyle={s.ctaContent} labelStyle={s.ctaPrimaryLabel}>
                                Get Started
                            </Button>
                            <Button mode="outlined" onPress={() => scrollTo(700)}
                                style={s.ctaSecondary} contentStyle={s.ctaContent} labelStyle={s.ctaSecondaryLabel}>
                                See How It Works
                            </Button>
                        </View>
                    </View>
                    {isWide && (
                        <View style={s.heroImgWrap}>
                            <HeroVideo style={s.heroVideo} />
                        </View>
                    )}
                </View>
                {!isWide && (
                    <View style={s.heroImgMobile}>
                        <HeroVideo style={s.heroImgMobileImg} />
                    </View>
                )}

                {/* ── Social Proof ── */}
                <View style={s.proof}>
                    <Text style={s.proofText}>Built for memory care, assisted living, home health, and families at home.</Text>
                    <View style={s.proofIcons}>
                        {(['home-heart', 'hospital-building', 'hand-heart', 'human-male-child'] as const).map((icon, i) => (
                            <MaterialCommunityIcons key={i} name={icon} size={32} color="#94A3B8" />
                        ))}
                    </View>
                </View>

                {/* ── Architecture ── */}
                <View style={[s.section, isWide ? s.sectionWide : s.sectionNarrow]}>
                    <Text style={s.sectionEyebrow}>BUILT FOR CONNECTION</Text>
                    <Text style={s.sectionTitle}>One platform, tailored for your journey</Text>
                    <View style={isWide ? s.archRow : s.archCol}>
                        <Surface style={s.archCard} elevation={2}>
                            <LinearGradient colors={['#EFF6FF', '#FFFFFF']} style={s.archGrad}>
                                <View style={[s.archIcon, { backgroundColor: '#DBEAFE' }]}>
                                    <MaterialCommunityIcons name="home-heart" size={34} color="#2563EB" />
                                </View>
                                <Text style={s.archTitle}>For Families at Home</Text>
                                <Text style={s.archSub}>Caring for a loved one?</Text>
                                {[
                                    'Track daily routines and moments of clarity',
                                    'Keep remote family members updated in real-time',
                                    'Share notes securely with visiting caregivers',
                                    'Free for individual families',
                                ].map((t, i) => (
                                    <View key={i} style={s.archItem}>
                                        <MaterialCommunityIcons name="check-circle" size={18} color="#2563EB" />
                                        <Text style={s.archItemText}>{t}</Text>
                                    </View>
                                ))}
                            </LinearGradient>
                        </Surface>
                        <Surface style={s.archCard} elevation={2}>
                            <LinearGradient colors={['#FDF4FF', '#FFFFFF']} style={s.archGrad}>
                                <View style={[s.archIcon, { backgroundColor: '#FCE7F3' }]}>
                                    <MaterialCommunityIcons name="domain" size={34} color="#DB2777" />
                                </View>
                                <Text style={s.archTitle}>For Care Organizations</Text>
                                <Text style={s.archSub}>Running a memory care facility?</Text>
                                {[
                                    'Update families daily without phone tag',
                                    'Track resident progress over time',
                                    'Manage staff assignments simply',
                                    'Secure, high-level oversight',
                                ].map((t, i) => (
                                    <View key={i} style={s.archItem}>
                                        <MaterialCommunityIcons name="check-circle" size={18} color="#DB2777" />
                                        <Text style={s.archItemText}>{t}</Text>
                                    </View>
                                ))}
                            </LinearGradient>
                        </Surface>
                    </View>
                </View>

                {/* ── Features ── */}
                <View style={[s.section, isWide ? s.sectionWide : s.sectionNarrow]}>
                    <Text style={s.sectionTitle}>Meaningful insights, not medical clutter</Text>
                    <Text style={s.sectionBody}>Focused on what matters most: well-being, connection, and progress.</Text>
                    <View style={s.featGrid}>
                        {FEATURES.map((f, i) => (
                            <Surface key={i} style={s.featCard} elevation={1}>
                                <View style={s.featIcon}>
                                    <MaterialCommunityIcons name={f.icon as any} size={26} color="#0F172A" />
                                </View>
                                <Text style={s.featTitle}>{f.title}</Text>
                                <Text style={s.featDesc}>{f.desc}</Text>
                            </Surface>
                        ))}
                    </View>
                </View>

                {/* ── How It Works ── */}
                <View style={[s.section, s.howSection, isWide ? s.sectionWide : s.sectionNarrow]}>
                    <Text style={s.sectionTitle}>Up and running in minutes</Text>
                    <View style={isWide ? s.stepsRow : s.stepsCol}>
                        {[
                            { n: '1', title: 'Set Up', desc: 'Create your organization or personal care profile.' },
                            { n: '2', title: 'Invite', desc: 'Send secure email invites to staff, nurses, or family members.' },
                            { n: '3', title: 'Care', desc: 'Your team begins documenting care from day one.' },
                        ].map((step, i) => (
                            <React.Fragment key={i}>
                                <View style={s.step}>
                                    <View style={s.stepCircle}><Text style={s.stepNum}>{step.n}</Text></View>
                                    <Text style={s.stepTitle}>{step.title}</Text>
                                    <Text style={s.stepDesc}>{step.desc}</Text>
                                </View>
                                {isWide && i < 2 && <View style={s.stepLine} />}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* ── Showcase 1: Family ── */}
                <View style={[s.showcase, isWide ? s.sectionWide : s.sectionNarrow, isWide ? s.showcaseRow : s.showcaseCol]}>
                    <View style={s.showcaseText}>
                        <View style={[s.badge, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' }]}>
                            <Text style={[s.badgeText, { color: '#047857' }]}>FAMILY PORTAL</Text>
                        </View>
                        <Text style={s.showcaseTitle}>Connecting the Family</Text>
                        <Text style={s.showcaseBody}>Keep everyone in the loop without group text chaos or playing phone tag with the facility.</Text>
                        {['No more playing phone tag', 'Share moments of clarity', 'Secure access for verified family only', 'Daily peace of mind'].map((t, i) => (
                            <View key={i} style={s.bullet}>
                                <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                                <Text style={s.bulletText}>{t}</Text>
                            </View>
                        ))}
                    </View>
                    <Animated.View ref={familyRef as any} style={[s.showcaseImgWrap, { transform: [{ translateY: float2 }] }]}>
                        <Image source={familyAbstract} style={s.showcaseImg} resizeMode="contain" />
                    </Animated.View>
                </View>

                {/* ── Showcase 2: Journey ── */}
                <View style={[s.showcase, isWide ? s.sectionWide : s.sectionNarrow, isWide ? s.showcaseRowReverse : s.showcaseCol]}>
                    <View style={s.showcaseText}>
                        <View style={[s.badge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                            <Text style={[s.badgeText, { color: '#D97706' }]}>CARE TRACKING</Text>
                        </View>
                        <Text style={s.showcaseTitle}>Tracking the Journey</Text>
                        <Text style={s.showcaseBody}>Document daily care naturally, allowing you to spot long-term patterns in behavior and memory.</Text>
                        {['Spot patterns in behavior over time', 'Log daily routines simply', 'Seamless caregiver handoffs', 'Focus on care, not charts'].map((t, i) => (
                            <View key={i} style={s.bullet}>
                                <MaterialCommunityIcons name="check-circle" size={20} color="#D97706" />
                                <Text style={s.bulletText}>{t}</Text>
                            </View>
                        ))}
                    </View>
                    <Animated.View ref={journeyRef as any} style={[s.showcaseImgWrap, { transform: [{ translateY: float1 }] }]}>
                        <Image source={journeyAbstract} style={s.showcaseImg} resizeMode="contain" />
                    </Animated.View>
                </View>

                {/* ── Vision Quote ── */}
                <View style={[s.vision, isWide ? s.sectionWide : s.sectionNarrow]}>
                    <MaterialCommunityIcons name="format-quote-open" size={56} color="rgba(255,255,255,0.2)" />
                    <Text style={s.visionText}>
                        "KithCare isn't an EMR. It's a bridge between caregivers and families, built to track what truly matters: the daily progress and well-being of the people we love."
                    </Text>
                </View>

                {/* ── CTA Banner ── */}
                <LinearGradient colors={['#0F172A', '#1E3A8A']}
                    style={[s.ctaBanner, isWide ? s.sectionWide : s.sectionNarrow]}>
                    <Text style={s.ctaBannerTitle}>Ready to transform your care journey?</Text>
                    <Text style={s.ctaBannerSub}>Get started for free — no credit card required.</Text>
                    <Button mode="contained" onPress={() => router.push('/auth/login')}
                        style={s.bannerBtn}
                        contentStyle={{ height: 58, paddingHorizontal: 36 }}
                        labelStyle={{ fontSize: 17, fontWeight: 'bold', color: '#0F172A' }}>
                        Create Free Account
                    </Button>
                </LinearGradient>

                {/* ── Footer ── */}
                <View style={[s.footer, isWide ? s.sectionWide : s.sectionNarrow]}>
                    <View style={isWide ? s.footerRow : s.footerCol}>
                        <View style={s.footerBrandCol}>
                            <View style={s.footerBrand}>
                                <Image source={appIcon} style={s.footerLogo} />
                                <Text style={s.footerBrandName}>KithCare</Text>
                            </View>
                            <Text style={s.footerTagline}>Connecting families. Tracking memories. Enhancing care.</Text>
                        </View>
                        <View style={s.footerLinkCol}>
                            <Text style={s.footerColTitle}>Product</Text>
                            <Text style={s.footerLink}>Features</Text>
                            <Text style={s.footerLink}>How It Works</Text>
                            <Text style={s.footerLink}>Security</Text>
                        </View>
                        <View style={s.footerLinkCol}>
                            <Text style={s.footerColTitle}>Company</Text>
                            <Text style={s.footerLink}>About Us</Text>
                            <Text style={s.footerLink}>Contact Support</Text>
                            <Text style={s.footerLink}>Privacy Policy</Text>
                        </View>
                    </View>
                    <View style={s.footerBottom}>
                        <Text style={s.copyright}>© {new Date().getFullYear()} KithCare Inc. All rights reserved.</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8FAFC' },
    scroll: { flexGrow: 1 },

    // Navbar
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 72,
        backgroundColor: 'rgba(255,255,255,0.88)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(226,232,240,0.8)',
        zIndex: 100,
    },
    navWide: { paddingHorizontal: 60 },
    navNarrow: { paddingHorizontal: 20 },
    brand: { flexDirection: 'row', alignItems: 'center' },
    brandLogo: { width: 34, height: 34, borderRadius: 8, marginRight: 10 },
    brandName: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
    navLinks: { flexDirection: 'row', gap: 28 },
    navLink: { fontSize: 15, fontWeight: '600', color: '#475569' },
    navCta: { backgroundColor: '#0F172A', borderRadius: 20 },
    navCtaLabel: { color: '#FFFFFF', fontWeight: 'bold' },

    // Hero
    hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroWide: { paddingHorizontal: 60, paddingTop: 80, paddingBottom: 60, minHeight: 580 },
    heroNarrow: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40, flexDirection: 'column' },
    heroText: { flex: 1, maxWidth: 580 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        marginBottom: 22,
    },
    badgeText: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 13 },
    headline: { fontWeight: '900', color: '#0F172A', letterSpacing: -1.5, marginBottom: 22 },
    headlineWide: { fontSize: 64, lineHeight: 72 },
    headlineNarrow: { fontSize: 40, lineHeight: 50 },
    subheadline: { fontSize: 18, lineHeight: 30, color: '#475569', marginBottom: 36, maxWidth: 540 },
    ctaRow: { flexDirection: 'row', gap: 14 },
    ctaRowNarrow: { flexDirection: 'column', maxWidth: 320 },
    ctaContent: { height: 54, paddingHorizontal: 28 },
    ctaPrimary: { backgroundColor: '#2563EB', borderRadius: 28 },
    ctaPrimaryLabel: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
    ctaSecondary: { borderRadius: 28, borderColor: '#CBD5E1', borderWidth: 1 },
    ctaSecondaryLabel: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
    heroImgWrap: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', height: 500 },
    heroVideo: { width: '100%', height: 460, maxWidth: 600, borderRadius: 20, overflow: 'hidden' },
    heroImgMobile: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
    heroImgMobileImg: { width: '100%', height: 260, borderRadius: 16 },

    // Social Proof
    proof: {
        alignItems: 'center',
        paddingVertical: 36,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    proofText: { color: '#64748B', fontSize: 15, fontWeight: '500', marginBottom: 20, textAlign: 'center', paddingHorizontal: 20 },
    proofIcons: { flexDirection: 'row', gap: 32 },

    // Sections
    section: { paddingTop: 80, paddingBottom: 60 },
    howSection: { alignItems: 'center' },
    sectionWide: { paddingHorizontal: 60, alignSelf: 'center', width: '100%', maxWidth: 1200 },
    sectionNarrow: { paddingHorizontal: 20 },
    sectionEyebrow: { color: '#2563EB', fontWeight: '800', fontSize: 12, letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
    sectionTitle: { fontSize: 36, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 48, letterSpacing: -0.8 },
    sectionBody: { fontSize: 17, color: '#475569', textAlign: 'center', marginTop: -36, marginBottom: 48, lineHeight: 26 },

    // Architecture
    archRow: { flexDirection: 'row', gap: 28 },
    archCol: { flexDirection: 'column', gap: 24 },
    archCard: { flex: 1, borderRadius: 22, overflow: 'hidden' },
    archGrad: { padding: 36, flexGrow: 1 },
    archIcon: { width: 60, height: 60, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    archTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 },
    archSub: { fontSize: 16, color: '#475569', fontStyle: 'italic', marginBottom: 28 },
    archItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
    archItemText: { fontSize: 15, color: '#334155', flex: 1, lineHeight: 22 },

    // Features
    featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center' },
    featCard: { width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF', padding: 28, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9' },
    featIcon: { width: 52, height: 52, borderRadius: 13, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    featTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 10 },
    featDesc: { fontSize: 15, color: '#64748B', lineHeight: 22 },

    // Steps
    stepsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', maxWidth: 860, marginTop: 16 },
    stepsCol: { flexDirection: 'column', gap: 36, marginTop: 16 },
    step: { flex: 1, alignItems: 'center', maxWidth: 260 },
    stepCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', marginBottom: 20, zIndex: 2 },
    stepNum: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
    stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginBottom: 10, textAlign: 'center' },
    stepDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },
    stepLine: { height: 2, backgroundColor: '#E2E8F0', flex: 1, marginTop: 30, marginHorizontal: -20, zIndex: 1 },

    // Showcases
    showcase: { paddingTop: 40, paddingBottom: 80 },
    showcaseRow: { flexDirection: 'row', alignItems: 'center', gap: 48 },
    showcaseRowReverse: { flexDirection: 'row-reverse', alignItems: 'center', gap: 48 },
    showcaseCol: { flexDirection: 'column', gap: 32 },
    showcaseText: { flex: 1 },
    showcaseTitle: { fontSize: 32, fontWeight: 'bold', color: '#0F172A', marginBottom: 16, letterSpacing: -0.8, marginTop: 12 },
    showcaseBody: { fontSize: 17, color: '#475569', lineHeight: 26, marginBottom: 28 },
    bullet: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    bulletText: { fontSize: 15, fontWeight: '600', color: '#334155' },
    showcaseImgWrap: { flex: 1, alignItems: 'center' },
    showcaseImg: { width: '100%', height: 380, maxWidth: 460 },

    // Vision
    vision: { backgroundColor: '#0F172A', paddingVertical: 90, alignItems: 'center', borderRadius: 36, marginTop: 20, marginBottom: 80 },
    visionText: { fontSize: 24, color: '#FFFFFF', textAlign: 'center', lineHeight: 36, maxWidth: 780, fontStyle: 'italic', marginTop: 16 },

    // CTA Banner
    ctaBanner: { paddingVertical: 72, alignItems: 'center', borderRadius: 28, marginBottom: 80 },
    ctaBannerTitle: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 14, letterSpacing: -0.8 },
    ctaBannerSub: { fontSize: 18, color: '#93C5FD', textAlign: 'center', marginBottom: 36 },
    bannerBtn: { backgroundColor: '#FFFFFF', borderRadius: 28 },

    // Footer
    footer: { paddingTop: 56, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 48 },
    footerCol: { flexDirection: 'column', gap: 36, marginBottom: 48 },
    footerBrandCol: { flex: 1.5 },
    footerBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    footerLogo: { width: 30, height: 30, borderRadius: 7, marginRight: 10 },
    footerBrandName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    footerTagline: { color: '#64748B', fontSize: 15, lineHeight: 22, maxWidth: 280 },
    footerLinkCol: { flex: 1 },
    footerColTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginBottom: 20 },
    footerLink: { fontSize: 15, color: '#64748B', marginBottom: 14 },
    footerBottom: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 28, alignItems: 'center' },
    copyright: { color: '#94A3B8', fontSize: 13 },
});
