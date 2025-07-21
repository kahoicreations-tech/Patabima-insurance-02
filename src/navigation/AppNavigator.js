import React, { useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  HomeScreen, 
  QuotationsScreenNew, 
  UpcomingScreen, 
  MyAccountScreen, 
  MotorQuotationScreen, 
  MotorCategorySelectionScreen,
  MotorProductSelectionScreen,
  // Medical screens removed from bulk import to avoid conflicts - using direct imports instead
  WIBAQuotationScreen, 
  TravelQuotationScreen, 
  PersonalAccidentQuotationScreen, 
  LastExpenseQuotationScreen,
  ProfessionalIndemnityQuotationScreen,
  DomesticPackageQuotationScreen,
  RenewalScreen,
  ClaimDetailsScreen,
  ExtensionScreen,
  ClaimsSubmissionScreen
} from '../screens';
import SplashScreen from '../screens/auth/SplashScreen';
import InsuranceWelcomeScreen from '../screens/auth/InsuranceWelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
// Direct imports for enhanced insurance screens
import EnhancedMedicalCategoryScreenDirect from '../screens/quotations/medical/EnhancedMedicalCategoryScreen';
import EnhancedIndividualMedicalQuotationDirect from '../screens/quotations/medical/EnhancedIndividualMedicalQuotation';
import EnhancedCorporateMedicalQuotationDirect from '../screens/quotations/medical/EnhancedCorporateMedicalQuotation';
import EnhancedMotorCategorySelectionScreen from '../screens/quotations/motor/EnhancedMotorCategorySelectionScreen';
import { Colors, Typography, Spacing } from '../constants';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Enhanced custom tab bar component with animations
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  
  if (focusedOptions.tabBarVisible === false) {
    return null;
  }

  // Animation references for each tab
  const animatedValues = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;

  // Animate the active tab
  useEffect(() => {
    // Reset all animations
    animatedValues.forEach((value, index) => {
      Animated.timing(value, {
        toValue: index === state.index ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={[
      styles.tabBarContainer,
      { paddingBottom: Math.max(insets.bottom, 8) }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || route.name;
        const emoji = options.tabBarEmoji || '📱';
        const isFocused = state.index === index;
        
        // Animation values
        const iconScale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2]
        });
        
        const dotOpacity = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1]
        });

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <View style={styles.iconContainer}>
                  <Text style={[
                    styles.tabIcon,
                    isFocused && styles.tabIconActive
                  ]}>
                    {emoji}
                  </Text>
                </View>
              </Animated.View>
              
              <Text style={[
                styles.tabLabel,
                isFocused && styles.tabLabelActive
              ]}>
                {label}
              </Text>
              
              {/* Indicator dot */}
              <Animated.View 
                style={[
                  styles.activeDot,
                  { opacity: dotOpacity }
                ]} 
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Authentication Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false 
      }}
      initialRouteName="Splash"
    >
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="InsuranceWelcome" component={InsuranceWelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Home Stack Navigator to include quotation screens
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="MotorCategorySelection" component={EnhancedMotorCategorySelectionScreen} />
      <Stack.Screen name="MotorProductSelection" component={MotorProductSelectionScreen} />
      <Stack.Screen name="MotorQuotation" component={MotorQuotationScreen} />
      {/* Original MedicalQuotation screen removed - using enhanced flow only */}
      <Stack.Screen name="EnhancedMedicalCategory" component={EnhancedMedicalCategoryScreenDirect} />
      <Stack.Screen name="EnhancedIndividualMedicalQuotation" component={EnhancedIndividualMedicalQuotationDirect} />
      <Stack.Screen name="EnhancedCorporateMedicalQuotation" component={EnhancedCorporateMedicalQuotationDirect} />
      <Stack.Screen name="WIBAQuotation" component={WIBAQuotationScreen} />
      <Stack.Screen name="TravelQuotation" component={TravelQuotationScreen} />
      <Stack.Screen name="PersonalAccidentQuotation" component={PersonalAccidentQuotationScreen} />
      <Stack.Screen name="LastExpenseQuotation" component={LastExpenseQuotationScreen} />
      <Stack.Screen name="ProfessionalIndemnityQuotation" component={ProfessionalIndemnityQuotationScreen} />
      <Stack.Screen name="DomesticPackageQuotation" component={DomesticPackageQuotationScreen} />
      <Stack.Screen name="Renewal" component={RenewalScreen} />
      <Stack.Screen name="ClaimDetails" component={ClaimDetailsScreen} />
      <Stack.Screen name="Extension" component={ExtensionScreen} />
      <Stack.Screen name="ClaimsSubmission" component={ClaimsSubmissionScreen} />
    </Stack.Navigator>
  );
}

// Upcoming Stack Navigator to include renewal and claim details screens
function UpcomingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UpcomingMain" component={UpcomingScreen} />
      <Stack.Screen name="Renewal" component={RenewalScreen} />
      <Stack.Screen name="ClaimDetails" component={ClaimDetailsScreen} />
      <Stack.Screen name="Extension" component={ExtensionScreen} />
      <Stack.Screen name="ClaimsSubmission" component={ClaimsSubmissionScreen} />
    </Stack.Navigator>
  );
}

// Main App Tab Navigator - ORIGINAL STRUCTURE: Home | Quotations | Upcoming | Account
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarEmoji: "🏠",
          tabBarLabel: "Home",
          tabBarAccessibilityLabel: "Home Screen"
        }}
      />
      <Tab.Screen
        name="Quotations"
        component={QuotationsScreenNew}
        options={{
          tabBarEmoji: "📋",
          tabBarLabel: "Quotations",
          tabBarAccessibilityLabel: "Quotations Screen"
        }}
      />
      <Tab.Screen
        name="Upcoming"
        component={UpcomingStack}
        options={{
          tabBarEmoji: "⏰",
          tabBarLabel: "Upcoming",
          tabBarAccessibilityLabel: "Upcoming Screen"
        }}
      />
      <Tab.Screen
        name="Account"
        component={MyAccountScreen}
        options={{
          tabBarEmoji: "👤",
          tabBarLabel: "Account",
          tabBarAccessibilityLabel: "My Account Screen"
        }}
      />
    </Tab.Navigator>
  );
}

// Root App Navigator with Authentication Check
function RootNavigator() {
  const { isAuthenticated } = useAuth();
  
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// Main App component with providers
export default function AppNavigator() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

// Custom styles for tab bar
const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    marginBottom: Spacing.xs / 2,
  },
  tabIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  tabIconActive: {
    color: Colors.primary,
  },
  tabLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});
