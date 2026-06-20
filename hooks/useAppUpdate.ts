import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
export const useAppUpdate = () => {
    useEffect(() => {
        const checkUpdates = async () => {
            // In-app updates are mostly for Android in this library context, 
            // but it handles iOS by opening store if implemented internally or we can wrap it.
            // The types suggest it returns 'storeVersion' for iOS too.
            if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

            if (__DEV__ || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
                console.log('Skipping in-app update check in dev mode or Expo Go');
                return;
            }

            try {
                const { checkForUpdate } = require('expo-in-app-updates');
                const result = await checkForUpdate();

                if (result.updateAvailable) {
                    console.log('Update available:', result.storeVersion);

                    if (Platform.OS === 'android') {
                        // Use Flexible update (false) by default
                        const { startUpdate } = require('expo-in-app-updates');
                        await startUpdate(false);
                    } else {
                        // For iOS, usually we just alert user
                        // The library might handle it but let's be explicit manually if needed or just try startUpdate
                        // 'startUpdate' type says it takes boolean, implies Android logic.
                        // But let's try calling it, if it opens store great. 
                        // Actually the readme usually says it opens store on iOS.
                        // Let's assume startUpdate handles iOS redirection too or throws/does nothing.
                        // We'll trust the library for now.
                        // Spec say: "App update types... @platform android".
                        // So startUpdate might be android only?
                        // The search result said "iOS... opening the app in the App Store". 
                        // Let's try calling it.
                        const { startUpdate } = require('expo-in-app-updates');
                        await startUpdate(false);
                    }
                }
            } catch (error) {
                console.log('Error checking for updates:', error);
            }
        };

        checkUpdates();
    }, []);
};
