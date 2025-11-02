import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';

// Import receipt screens
import InsuranceReceipt from '../screens/receipts/InsuranceReceipt';

// Import other quotation screens
import { 
  EnhancedMedicalCategoryScreen,
  EnhancedIndividualMedicalQuotation,
  EnhancedCorporateMedicalQuotation
} from '../screens/quotations/medical';
import { 
  DomesticPackageQuotationScreen,
  PersonalAccidentQuotationScreen
} from '../screens/quotations';
import { ProfessionalIndemnityQuotationScreen } from '../screens/quotations/professional-indemnity';
import { TravelQuotationScreen } from '../screens/quotations/travel';
import { LastExpenseQuotationScreen } from '../screens/quotations/last-expense';
import { WIBAQuotationScreen } from '../screens/quotations/wiba';
// GenericQuoteCreate removed (deprecated generic multi-line screen)

// Import ClaimDetailsScreen
import ClaimDetailsScreen from '../screens/main/ClaimDetailsScreen';
import RenewalScreen from '../screens/main/RenewalScreen';
import ExtensionScreen from '../screens/main/ExtensionScreen';
import ExtensionPaymentScreen from '../screens/main/ExtensionPaymentScreen';
import ClaimsSubmissionScreen from '../screens/main/ClaimsSubmissionScreen';

// Import Admin screens
import { AdminManualQuotePricingScreen } from '../screens/admin';

// Import Django Test Screen
import DjangoTestScreen from '../screens/testing/DjangoTestScreen';

import DiagnosticsScreen from '../screens/testing/DiagnosticsScreen';
import { MotorInsuranceScreen } from '../screens/quotations/Motor 2';
import PolicySuccess from '../screens/quotations/Motor 2/MotorInsuranceFlow/Success/PolicySuccess';
import QuoteSuccessScreen from '../screens/quotations/Motor 2/QuoteSuccessScreen';




const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { user: appUser, loading: dataLoading, fetchUser } = useAppData();

  console.log('[AppNavigator] Render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  // Show loading screen while checking authentication
  if (isLoading) {
    console.log('[AppNavigator] Showing loading spinner');
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
      }}>
        <ActivityIndicator size="large" color="#D5222B" />
      </View>
    );
  }

  console.log('[AppNavigator] Rendering NavigationContainer');

  // Remove the secondary loading screen - let the dashboard handle its own loading
  // The dashboard can show loading states for individual components while maintaining navigation

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        {isAuthenticated ? (
          // Authenticated user screens
          // Cross-fade into the main app
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{
                animation: 'fade',
                animationTypeForReplace: 'push',
              }}
            />
            
            {/* Motor 2 Insurance Flow - NEW */}
            <Stack.Screen name="Motor2Flow" component={MotorInsuranceScreen} />
            <Stack.Screen name="PolicySuccess" component={PolicySuccess} />
            <Stack.Screen name="QuoteSuccess" component={QuoteSuccessScreen} />
            
            <Stack.Screen name="InsuranceReceipt" component={InsuranceReceipt} options={{ animation: 'slide_from_right' }} />
            
            <Stack.Screen name="Diagnostics" component={DiagnosticsScreen} />
            
            <Stack.Screen name="MedicalCategory" component={EnhancedMedicalCategoryScreen} />
            <Stack.Screen name="EnhancedIndividualMedicalQuotation" component={EnhancedIndividualMedicalQuotation} />
            <Stack.Screen name="EnhancedCorporateMedicalQuotation" component={EnhancedCorporateMedicalQuotation} />
            <Stack.Screen name="EnhancedIndividualMedical" component={EnhancedIndividualMedicalQuotation} />
            <Stack.Screen name="EnhancedCorporateMedical" component={EnhancedCorporateMedicalQuotation} />
            
            <Stack.Screen name="DomesticPackageQuotation" component={DomesticPackageQuotationScreen} />
            <Stack.Screen name="PersonalAccidentQuotation" component={PersonalAccidentQuotationScreen} />
            <Stack.Screen name="ProfessionalIndemnityQuotation" component={ProfessionalIndemnityQuotationScreen} />
            <Stack.Screen name="TravelQuotation" component={TravelQuotationScreen} />
            <Stack.Screen name="LastExpenseQuotation" component={LastExpenseQuotationScreen} />
            <Stack.Screen name="WIBAQuote" component={WIBAQuotationScreen} />
            
            <Stack.Screen name="ClaimDetails" component={ClaimDetailsScreen} />
            
            <Stack.Screen name="Renewal" component={RenewalScreen} />
            
            <Stack.Screen name="Extension" component={ExtensionScreen} />
            
            <Stack.Screen name="ExtensionPayment" component={ExtensionPaymentScreen} />
            
            <Stack.Screen name="ClaimsSubmission" component={ClaimsSubmissionScreen} />
            
            <Stack.Screen name="AdminManualQuotePricing" component={AdminManualQuotePricingScreen} />
            
            <Stack.Screen name="DjangoTest" component={DjangoTestScreen} />
          </>
        ) : (
          // Unauthenticated user screens (fade for smooth entry/exit)
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animation: 'fade',
              animationTypeForReplace: 'push',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
