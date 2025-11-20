import React, { useEffect, useState } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
// Temporarily disable lazy loading for debugging
import AppNavigator from './navigation';
import { AWSProviderDev } from './contexts/AWSContextDev';
import { AuthProvider } from './contexts/AuthContext';
import { MotorInsuranceProvider } from './contexts/MotorInsuranceContext';
import { AppDataProvider } from './contexts/AppDataContext';

// Do not call SplashScreen.preventAutoHideAsync() in development

export default function App() {
  const [appIsReady, setAppIsReady] = useState(__DEV__ ? true : false);

  useEffect(() => {
    const run = async () => {
      try {
        if (__DEV__) {
          console.log('[App] Dev fast boot active');
          setAppIsReady(true);
          return;
        }

        // Keep splash until we check for updates (production only)
        await SplashScreen.preventAutoHideAsync();

        // If there is an update available, fetch and reload before showing UI
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log('[App] Update available. Fetching...');
          await Updates.fetchUpdateAsync();
          console.log('[App] Update fetched. Reloading...');
          await Updates.reloadAsync();
          return; // reloadAsync will remount the app
        }
      } catch (e) {
        console.warn('[App] Update check failed (continuing):', e?.message || e);
      } finally {
        setAppIsReady(true);
        try { await SplashScreen.hideAsync(); } catch {}
      }
    };
    run();
  }, []);

  if (!appIsReady) {
    return null; // Keep native splash until ready
  }

  console.log('[App] Rendering main app...');

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#D5222B' }}>
        <StatusBar 
          barStyle="light-content" 
          translucent={false}
        />
        <AuthProvider>
          <AWSProviderDev>
            <MotorInsuranceProvider>
              <AppDataProvider>
                <AppNavigator />
              </AppDataProvider>
            </MotorInsuranceProvider>
          </AWSProviderDev>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
