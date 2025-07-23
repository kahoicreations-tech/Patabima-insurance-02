import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import AuthNavigator from './AuthNavigator';
import {
  MotorDashboardScreen,
  EnhancedMotorProductSelectionScreen,
  TORQuotationFlowScreen,
  PrivateThirdPartyScreen,
  PrivateThirdPartyExtendibleScreen,
  PrivateComprehensiveScreen,
  PrivateMotorcycleScreen,
  CommercialThirdPartyScreen,
  PSVThirdPartyScreen,
  MotorcycleThirdPartyScreen,
  MotorcycleComprehensiveScreen,
  PrivateVehicleScreen,
  CommercialVehicleScreen,
  MotorcycleScreen,
  PSVScreen,
  TukTukScreen,
  SpecialClassesScreen
} from '../screens/quotations/motor';

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

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
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

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#FFFFFF',
          },
          animation: 'slide_from_right',
        }}
      >
        {isAuthenticated ? (
          // Authenticated user screens
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            
            {/* Motor Insurance Flow */}
            <Stack.Screen name="MotorDashboard" component={MotorDashboardScreen} />
            <Stack.Screen name="MotorProductSelection" component={EnhancedMotorProductSelectionScreen} />
            
            {/* Motor Category Screens */}
            <Stack.Screen name="PrivateVehicleScreen" component={PrivateVehicleScreen} />
            <Stack.Screen name="CommercialVehicleScreen" component={CommercialVehicleScreen} />
            <Stack.Screen name="MotorcycleScreen" component={MotorcycleScreen} />
            <Stack.Screen name="PSVScreen" component={PSVScreen} />
            <Stack.Screen name="TukTukScreen" component={TukTukScreen} />
            <Stack.Screen name="SpecialClassesScreen" component={SpecialClassesScreen} />
            
            {/* Motor Quotation Screens */}
            <Stack.Screen name="TORQuotationFlow" component={TORQuotationFlowScreen} />
            <Stack.Screen name="PrivateThirdParty" component={PrivateThirdPartyScreen} />
            <Stack.Screen name="PrivateThirdPartyExtendible" component={PrivateThirdPartyExtendibleScreen} />
            <Stack.Screen name="PrivateComprehensive" component={PrivateComprehensiveScreen} />
            <Stack.Screen name="PrivateMotorcycle" component={PrivateMotorcycleScreen} />
            <Stack.Screen name="CommercialThirdParty" component={CommercialThirdPartyScreen} />
            <Stack.Screen name="PSVThirdParty" component={PSVThirdPartyScreen} />
            <Stack.Screen name="MotorcycleThirdParty" component={MotorcycleThirdPartyScreen} />
            <Stack.Screen name="MotorcycleComprehensive" component={MotorcycleComprehensiveScreen} />
            
            {/* Medical Insurance Flow */}
            <Stack.Screen name="MedicalCategory" component={EnhancedMedicalCategoryScreen} />
            <Stack.Screen name="EnhancedIndividualMedicalQuotation" component={EnhancedIndividualMedicalQuotation} />
            <Stack.Screen name="EnhancedCorporateMedicalQuotation" component={EnhancedCorporateMedicalQuotation} />
            <Stack.Screen name="EnhancedIndividualMedical" component={EnhancedIndividualMedicalQuotation} />
            <Stack.Screen name="EnhancedCorporateMedical" component={EnhancedCorporateMedicalQuotation} />
            
            {/* Other Insurance Categories */}
            <Stack.Screen name="DomesticPackageQuotation" component={DomesticPackageQuotationScreen} />
            <Stack.Screen name="PersonalAccidentQuotation" component={PersonalAccidentQuotationScreen} />
            <Stack.Screen name="ProfessionalIndemnityQuotation" component={ProfessionalIndemnityQuotationScreen} />
            <Stack.Screen name="TravelQuotation" component={TravelQuotationScreen} />
            <Stack.Screen name="LastExpenseQuotation" component={LastExpenseQuotationScreen} />
            <Stack.Screen name="WIBAQuotation" component={WIBAQuotationScreen} />
          </>
        ) : (
          // Unauthenticated user screens
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
