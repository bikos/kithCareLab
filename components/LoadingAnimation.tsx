import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';

interface LoadingAnimationProps {
    visible: boolean;
    style?: any;
    source?: any; // Allow overriding the source
}

export default function LoadingAnimation({ visible, style, source }: LoadingAnimationProps) {
    if (!visible) return null;

    // Default to the local asset, but allow override
    const animationSource = source || require('../assets/loading.json');

    return (
        <View style={[styles.container, style]}>
            <LottieView
                autoPlay
                loop
                source={animationSource}
                style={styles.animation}
            // Fallback to ActivityIndicator if Lottie fails (though LottieView doesn't have a built-in fallback prop like Image, we can handle errors if needed, but usually it just doesn't render)
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    animation: {
        width: 200,
        height: 200,
    },
});
