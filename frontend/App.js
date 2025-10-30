import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { View, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
// Lazy-load the navigation tree to avoid any import-time errors from blocking splash hide
const AppNavigator = React.lazy(() => import('./navigation'));
import { AWSProviderDev } from './contexts/AWSContextDev';
import { AuthProvider } from './contexts/AuthContext';
import { MotorInsuranceProvider } from './contexts/MotorInsuranceContext';
import { AppDataProvider } from './contexts/AppDataContext';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('[App] Starting initialization...');
        // NOTE: Poppins font loading is disabled for now
        // To enable Poppins fonts:
        // 1. Download fonts from https://fonts.google.com/specimen/Poppins
        // 2. Place font files in assets/fonts/
        // 3. See ADDING_POPPINS_FONTS.md for instructions
        
        console.log('[App] Using system fonts (Poppins fonts disabled)');
        
        // Simulate minimum loading time for smooth experience
        await new Promise(resolve => setTimeout(resolve, 500)); // reduced from 1000ms
        console.log('[App] Preparation complete');
      } catch (e) {
        console.warn('[App] Asset loading error:', e);
      } finally {
        console.log('[App] Setting appIsReady = true');
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && !splashHidden) {
      console.log('[App] onLayoutRootView: hiding splash...');
      try {
        await SplashScreen.hideAsync();
        setSplashHidden(true);
        console.log('[App] Splash hidden successfully');
      } catch (e) {
        console.warn('[App] Splash hide error:', e);
      }
    }
  }, [appIsReady, splashHidden]);

  // Secondary safety: if onLayout somehow doesn't fire, hide splash shortly after ready
  useEffect(() => {
    if (!appIsReady || splashHidden) return;
    console.log('[App] Secondary splash hide fallback starting...');
    const t = setTimeout(() => {
      console.log('[App] Secondary splash hide fallback executing...');
      SplashScreen.hideAsync()
        .then(() => setSplashHidden(true))
        .catch((err) => {
          console.warn('[App] Secondary splash hide failed:', err);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [appIsReady, splashHidden]);

  // Tertiary safety: in case something prevents appIsReady from toggling (import-time crash),
  // force-hide splash after a hard timeout so we can at least see any runtime error screens.
  useEffect(() => {
    const hardTimeout = setTimeout(() => {
      if (!splashHidden) {
        SplashScreen.hideAsync()
          .then(() => setSplashHidden(true))
          .catch(() => {});
      }
    }, 4000);
    return () => clearTimeout(hardTimeout);
  }, [splashHidden]);

  if (!appIsReady) {
    console.log('[App] Returning null - app not ready yet');
    return null; // Splash screen will be shown
  }

  console.log('[App] Rendering main app...');

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#D5222B' }} onLayout={onLayoutRootView}>
        <StatusBar 
          barStyle="light-content" 
          translucent={false}
        />
        <Suspense fallback={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}><ActivityIndicator color="#D5222B" size="large" /></View>}>
          <AuthProvider>
            <AWSProviderDev>
              <MotorInsuranceProvider>
                <AppDataProvider>
                  <AppNavigator />
                </AppDataProvider>
              </MotorInsuranceProvider>
            </AWSProviderDev>
          </AuthProvider>
        </Suspense>
      </View>
    </SafeAreaProvider>
  );
}
