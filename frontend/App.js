import React, { useEffect, useState } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Note: remove manual splash/update control in dev to avoid startup hang
// import * as SplashScreen from 'expo-splash-screen';
// import * as Updates from 'expo-updates';
// Temporarily disable lazy loading for debugging
import AppNavigator from './navigation';
import { AWSProviderDev } from './contexts/AWSContextDev';
import { AuthProvider } from './contexts/AuthContext';
import { MotorInsuranceProvider } from './contexts/MotorInsuranceContext';
import { AppDataProvider } from './contexts/AppDataContext';

// Do not call SplashScreen.preventAutoHideAsync() in development

export default function App() {
  // Render immediately in development; remove complex splash gating
  const [appIsReady, setAppIsReady] = useState(true);

  useEffect(() => {
    console.log('[App] Dev fast boot active');
  }, []);
  // Always render in development

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
