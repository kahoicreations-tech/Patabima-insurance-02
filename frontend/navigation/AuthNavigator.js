import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SplashScreen,
  InsuranceWelcomeScreen,
  LoginScreen,
  SignupScreen,
  ForgotPasswordScreen,
} from '../screens/auth';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
        // Default animation kept minimal to avoid motion sickness
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Welcome" component={InsuranceWelcomeScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
