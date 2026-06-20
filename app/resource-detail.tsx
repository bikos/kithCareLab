import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, useTheme, Divider, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// This will eventually be fetched from a CMS
const resourceContent: Record<string, any> = {
    '1': {
        title: 'Medication Management',
        icon: 'pill',
        color: '#4CAF50',
        content: `
# Medication Management Best Practices

## Overview
Proper medication management is crucial for ensuring the health and safety of those in your care. This guide covers essential practices for managing medications effectively.

## Key Principles

### 1. Organization
- Keep all medications in a designated, secure location
- Use a pill organizer for daily medications
- Maintain an up-to-date medication list

### 2. Timing
- Set reminders for medication times
- Take medications at consistent times each day
- Never skip doses without consulting a healthcare provider

### 3. Storage
- Store medications in a cool, dry place
- Keep medications in original containers
- Check expiration dates regularly

### 4. Safety
- Never share medications
- Dispose of expired medications properly
- Keep medications out of reach of children

## Important Reminders
- Always read medication labels carefully
- Report any side effects to healthcare providers
- Keep emergency contact numbers readily available
        `,
    },
    '2': {
        title: 'Emergency Response',
        icon: 'ambulance',
        color: '#F44336',
        content: `
# Emergency Response Guide

## Quick Action Steps

### When to Call 911
- Difficulty breathing or shortness of breath
- Chest pain or pressure
- Sudden severe headache
- Loss of consciousness
- Severe bleeding
- Signs of stroke (F.A.S.T.)

### First Aid Basics

#### Choking
1. Encourage coughing
2. Perform Heimlich maneuver if needed
3. Call 911 if obstruction persists

#### Falls
1. Don't move the person immediately
2. Check for injuries
3. Call for medical help if needed
4. Document the incident

### Emergency Contacts
Keep these numbers readily available:
- 911 (Emergency)
- Poison Control: 1-800-222-1222
- Primary Care Physician
- Family Emergency Contact
        `,
    },
    '3': {
        title: 'Daily Care Tips',
        icon: 'heart-pulse',
        color: '#2196F3',
        content: `
# Daily Care Tips

## Morning Routine
- Assist with personal hygiene
- Help with dressing
- Ensure breakfast and morning medications
- Check for any overnight concerns

## Throughout the Day
- Encourage regular movement and activity
- Provide nutritious meals and snacks
- Monitor hydration
- Engage in meaningful activities

## Evening Routine
- Assist with dinner and evening medications
- Help with bathing if needed
- Ensure comfortable sleeping environment
- Review the day and plan for tomorrow

## General Tips
- Maintain a consistent routine
- Encourage independence when safe
- Practice patience and empathy
- Take breaks to avoid caregiver burnout
        `,
    },
    '4': {
        title: 'Nutrition Guide',
        icon: 'food-apple',
        color: '#FF9800',
        content: `
# Nutrition Guide for Seniors

## Balanced Diet Essentials

### Fruits and Vegetables
- Aim for 5-7 servings daily
- Include a variety of colors
- Fresh, frozen, or canned (low sodium)

### Protein
- Lean meats, fish, eggs
- Beans and legumes
- Nuts and seeds

### Whole Grains
- Brown rice, whole wheat bread
- Oatmeal, quinoa
- Whole grain pasta

### Dairy
- Low-fat milk, yogurt
- Cheese in moderation
- Calcium-fortified alternatives

## Hydration
- 6-8 glasses of water daily
- Limit caffeine and sugary drinks
- Monitor for signs of dehydration

## Meal Planning Tips
- Plan meals in advance
- Prepare easy-to-eat foods
- Consider dietary restrictions
- Make mealtimes social and enjoyable
        `,
    },
    '5': {
        title: 'Mental Health',
        icon: 'brain',
        color: '#9C27B0',
        content: `
# Supporting Emotional Well-Being

## Recognizing Mental Health Needs

### Common Signs
- Changes in mood or behavior
- Social withdrawal
- Loss of interest in activities
- Changes in sleep or appetite

## Support Strategies

### Communication
- Listen actively and without judgment
- Validate feelings and concerns
- Encourage expression of emotions
- Maintain regular conversations

### Activities
- Engage in hobbies and interests
- Encourage social connections
- Promote physical activity
- Practice mindfulness or meditation

### Professional Support
- Know when to seek professional help
- Maintain regular check-ups
- Consider support groups
- Explore therapy options

## Self-Care for Caregivers
- Recognize your own mental health needs
- Take regular breaks
- Seek support from others
- Practice stress management techniques
        `,
    },
    '6': {
        title: 'Person-Centered Care Workflow',
        icon: 'account-heart',
        color: '#E91E63',
        content: `
# Person-Centered Workflow

## Prepare Yourself & the Environment
**Goal:** Ensure you are ready to provide safe, calm and consistent care

### A. Center Yourself
- Take a moment to breathe and reset
- Approach every interaction with patience, respect and empathy

### B. Review the Individual's Support Plan
- Preferred name and communication style
- Life history & meaningful activities
- Mobility, safety risks, triggers, and calming strategies
- Medication or mental health notes for the day

### C. Prepare the Environment
- Reduce clutter or noise
- Set up orientation cues: calendar, clock, familiar items
- Ensure safety features are in place (non-slip mats, clear pathways)

## Build Connections Before Care
**Goal:** Establish trust and reduce anxiety

### A. Approach gently
- Approach from the front
- Make eye contact, smile and introduce yourself
- Speak slowly and clearly

### B. Validate Feelings
Use phrases like:
- "I'm here to help"
- "You seem upset-how can I support you?"
- "It's okay, take your time"

### C. Use Person-Centered Interaction
- Refer to their interests, past roles or routines
- Offer choices (empowerment) "Would you like you like to wash your face first or brush your teeth first?"

## Provide Daily Care Support
**Goal:** Assist with dignity while maximizing independence

### A. Support Activities of Daily Living (ADLs)
- Break tasks into simple steps
- Demonstrate actions ("hand over hand" guidance if needed)
- Allow the individual to do as much as they can independently
- Avoid rushing-pace matters

### B. Use Communication Strategies
- Short sentences, one instruction at a time
- Avoid correcting memory mistakes, use direction instead
- For mental health symptoms:
    - Use grounding techniques
    - Normalize emotions
    - Offer reassurance without arguing with delusions

### C. Encourage Engagement
- Offer meaningful activities based on past interests (music, cooking, art, gardening)
- Include movement: stretching, walking, simple exercises
- Provide social connection opportunities

## Managing Behaviors & Emotional Distress
**Goal:** Understand the cause of distress and respond with compassion

### Use the "STOP - Look - Listen" Method
- **S-Stop:** Pause and stay calm
- **T-Think:** Is the person scared, in pain, overstimulated?
- **O-Observe:** What happened before the behavior?
- **P-Prioritize safety:** Yours and theirs

- **Look:** Body language, facial expressions
- **Listen:** What the person is trying to communicate
- **Respond:** Adjust your approach and environment

### Common Triggers & Responses
- **Confusion:** Use simple orientation ("We're in your room and it's morning.")
- **Overstimulation:** Move to a quieter space
- **Pain or physical needs:** Check for hunger, thirst, toileting needs
- **Anxiety:** Offer grounding: "Take a slow breath with me."
- **Depression/withdrawal:** Offer gentle engagement, validate emotions

## Communication for Mental Health Challenges
**Goal:** Support Emotional well-being and prevent escalation

### A. Support Active Expression
- Encourage the person to talk about feelings
- Acknowledges emotions "That sounds really hard"
- Avoid judgment or dismissiveness

### B. Crisis Prevention
- Watch for sudden changes in behavior or mood
- Use de-escalation techniques:
    - Keep voice soft
    - Reduce demands
    - Offer space and time
- If there is risk of harm, follow emergency protocols immediately

### C. Promote Coping Skills
Examples:
- Deep breathing
- Music therapy
- Sensory tools
- Gentle movement
- Guided distraction (puzzles, simple chores)

## Documentation & Communication
**Goal:** Ensure continuity of care and team collaboration

### Record:
- Mood and behavior changes
- Appetite, sleep and activity participation
- Incidents, triggers, what helped

### Share with Team
- Anything that could improve the next caregiver's shift
- Changes that may require clinical attention

## End of Shift Review
**Goal:** Reflect, reset, and support your own well-being

### A. Quick Reflection
- What went well today?
- What challenges occurred and why?
- What should be adjusted in tomorrow's approach?

### B. Self-Care
Caregiving is emotional work. Take time to:
- Decompress
- Stretch or breathe
- Acknowledge your efforts
        `,
    },
};

export default function ResourceDetailScreen() {
    const router = useRouter();
    const theme = useTheme();
    const params = useLocalSearchParams();
    const resourceId = params.id as string;

    const resource = resourceContent[resourceId];

    if (!resource) {
        return (
            <View style={styles.container}>
                <Text>Resource not found</Text>
            </View>
        );
    }

    // Parse markdown-like content into sections
    const sections = resource.content.trim().split('\n\n');

    // Helper to render text with bold segments
    const renderText = (text: string) => {
        const parts = text.split('**');
        return parts.map((part, index) => {
            if (index % 2 === 1) { // Odd indices are inside ** **
                return (
                    <Text key={index} style={styles.inlineBold}>
                        {part}
                    </Text>
                );
            }
            return <Text key={index}>{part}</Text>;
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={[styles.header, { backgroundColor: resource.color }]}>
                    <MaterialCommunityIcons name={resource.icon as any} size={48} color="white" />
                    <Text variant="headlineMedium" style={styles.headerTitle}>{resource.title}</Text>
                </View>

                <View style={styles.content}>
                    {sections.map((section, index) => {
                        const lines = section.split('\n').filter(line => line.trim());
                        return (
                            <View key={index} style={styles.section}>
                                {lines.map((line, lineIndex) => {
                                    if (line.startsWith('# ')) {
                                        return <Text key={lineIndex} variant="headlineMedium" style={styles.h1}>{line.replace('# ', '')}</Text>;
                                    } else if (line.startsWith('## ')) {
                                        return <Text key={lineIndex} variant="titleLarge" style={styles.h2}>{line.replace('## ', '')}</Text>;
                                    } else if (line.startsWith('### ')) {
                                        return <Text key={lineIndex} variant="titleMedium" style={styles.h3}>{line.replace('### ', '')}</Text>;
                                    } else if (line.startsWith('#### ')) {
                                        return <Text key={lineIndex} variant="titleSmall" style={styles.h4}>{line.replace('#### ', '')}</Text>;
                                    } else if (line.startsWith('- ')) {
                                        return (
                                            <View key={lineIndex} style={styles.bulletPoint}>
                                                <Text style={styles.bullet}>•</Text>
                                                <Text variant="bodyMedium" style={styles.bulletText}>
                                                    {renderText(line.replace('- ', ''))}
                                                </Text>
                                            </View>
                                        );
                                    } else if (line.startsWith('**')) {
                                        // Handle bold lines like "**Goal:** ..."
                                        const content = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*\*/g, '');
                                        return <Text key={lineIndex} variant="titleMedium" style={styles.boldText}>{content}</Text>;
                                    } else if (line.match(/^\d+\./)) {
                                        const match = line.match(/^(\d+)\.\s*(.*)$/);
                                        if (match) {
                                            return (
                                                <View key={lineIndex} style={styles.bulletPoint}>
                                                    <Text style={styles.bullet}>{match[1]}.</Text>
                                                    <Text variant="bodyMedium" style={styles.bulletText}>
                                                        {renderText(match[2])}
                                                    </Text>
                                                </View>
                                            );
                                        }
                                    }
                                    return <Text key={lineIndex} variant="bodyMedium" style={styles.paragraph}>
                                        {renderText(line)}
                                    </Text>;
                                })}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 32,
        paddingTop: 60,
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginTop: 12,
        textAlign: 'center',
    },
    content: {
        padding: 16,
    },
    infoCard: {
        marginBottom: 16,
        backgroundColor: '#E3F2FD',
    },
    chip: {
        alignSelf: 'flex-start',
        backgroundColor: '#2196F3',
    },
    section: {
        marginBottom: 24,
    },
    h1: {
        fontWeight: 'bold',
        color: '#00695C',
        marginBottom: 16,
    },
    h2: {
        fontWeight: 'bold',
        color: '#00695C',
        marginTop: 16,
        marginBottom: 12,
    },
    h3: {
        fontWeight: '600',
        color: '#00695C',
        marginTop: 12,
        marginBottom: 8,
    },
    h4: {
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 6,
    },
    paragraph: {
        marginBottom: 8,
        lineHeight: 24,
        color: '#333',
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingLeft: 8,
    },
    bullet: {
        marginRight: 8,
        color: '#00695C',
        fontWeight: 'bold',
        minWidth: 20,
    },
    bulletText: {
        flex: 1,
        lineHeight: 24,
        color: '#333',
    },
    boldText: {
        fontWeight: 'bold',
        color: '#00695C',
        marginTop: 8,
        marginBottom: 4,
    },
    inlineBold: {
        fontWeight: 'bold',
        color: '#00695C',
    },
});
