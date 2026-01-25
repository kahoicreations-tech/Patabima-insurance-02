/**
 * Motor3Container - Main container for Motor3 flows
 * Routes to ThirdPartyFlow or ComprehensiveFlow based on product selection
 * 
 * Eliminates Motor2 mistake: Clean flow separation
 * - FIXED pricing (Third Party, TOR) → ThirdPartyFlow
 * - BRACKET pricing (Comprehensive) → ComprehensiveFlow
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar } from 'react-native-paper';
import { Motor3Provider, useMotor3 } from './contexts/Motor3Context';
import ThirdPartyFlow from './third-party/ThirdPartyFlow';
import ComprehensiveFlow from './comprehensive/ComprehensiveFlow';
import { getFlowType } from './utils/productFieldConfig';
import { autoCheckVersionInDev } from './utils/categoryVersionChecker';
import { BRAND, UI, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../../theme';

// ✅ CRITICAL FIX 1: Error Boundary for resilient step rendering
class StepErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(err, errorInfo) {
    console.error('[Motor3Container] Step render error:', err);
    console.error('[Motor3Container] Error info:', errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: SPACING.lg, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: FONT_SIZES.h3, fontWeight: FONT_WEIGHTS.semibold, color: BRAND.primary, marginBottom: SPACING.sm }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: FONT_SIZES.bodyLarge, color: UI.textSecondary, textAlign: 'center' }}>
            Please go back and try again. If the problem persists, restart the app.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// ✅ CRITICAL FIX 2: Cache clearing on mount for fresh start
const clearMotor3Cache = async () => {
  const keysToRemove = [
    'MOTOR3_FLOW_STATE',
    'MOTOR3_VEHICLE_DETAILS',
    'MOTOR3_CLIENT_DETAILS',
    'MOTOR3_UNDERWRITER_SELECTION',
    'MOTOR3_DOCUMENTS',
    'MOTOR3_CATEGORY_SELECTION',
    'MOTOR3_SUBCATEGORY_SELECTION',
    'DMVIC_CACHE', // Shared with Motor2
    'policy_submission_guard', // Shared with Motor2
  ];
  
  try {
    await Promise.all(keysToRemove.map(key => AsyncStorage.removeItem(key)));
    console.log('[Motor3Container] ✅ Cleared Motor3 cache');
  } catch (error) {
    console.warn('[Motor3Container] Cache clearing failed:', error);
  }
};


const Motor3Content = () => {
  const { selectedSubcategory, snackbar, hideSnackbar } = useMotor3();
  const navigation = useNavigation();

  const getSubcategoryHeaderLabel = (sub) => {
    if (!sub) return '';
    if (sub.public_label) return String(sub.public_label);
    if (sub.name && sub.name !== sub.subcategory_code) return String(sub.name);

    const code = String(sub.subcategory_code || sub.name || '');
    const specialMap = {
      PRIVATE_TOR: 'Third Party (T.O.R)',
      PRIVATE_THIRD_PARTY: 'Third Party',
      PRIVATE_THIRD_PARTY_EXT: 'Third Party (Extended)',
      PRIVATE_THIRD_PARTY_EXTENDIBLE: 'Third Party (Extended)',
      PRIVATE_COMPREHENSIVE: 'Comprehensive',
    };
    if (specialMap[code]) return specialMap[code];

    return code
      .split('_')
      .map((word) => {
        const upperWord = String(word).toUpperCase();
        if (['TP', 'TOR', 'COMP', 'PSV', 'PM', 'EXT', 'KG'].includes(upperWord)) return upperWord;
        if (/^\d+[MWK]?$/.test(word)) return word;
        return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word;
      })
      .join(' ');
  };
  
  // ✅ CRITICAL FIX 2: Clear cache on mount
  useEffect(() => {
    clearMotor3Cache();
  }, []);
  
  // ✅ PHASE 4: Version checking (development only)
  useEffect(() => {
    if (__DEV__) {
      autoCheckVersionInDev();
    }
  }, []);
  
  // If no product selected, start with Third Party flow (will show category selection)
  if (!selectedSubcategory) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND.primary} />
        {/* Top safe-area only; avoid double-padding on some Android devices */}
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          {/* Custom Header matching Motor2 */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Motor Vehicle Insurance</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>

        <View style={styles.content}>
          <StepErrorBoundary>
            <ThirdPartyFlow />
          </StepErrorBoundary>
        </View>
        <Snackbar
          visible={snackbar.visible}
          onDismiss={hideSnackbar}
          duration={3000}
          style={{ backgroundColor: snackbar.type === 'error' ? '#D32F2F' : '#323232' }}
        >
          {snackbar.message}
        </Snackbar>
      </View>
    );
  }
  
  // Determine flow type based on product configuration
  const flowType = getFlowType(selectedSubcategory.subcategory_code);
  
  console.log('[Motor3Container] Routing to flow:', flowType, 'for product:', selectedSubcategory.subcategory_code);
  
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND.primary} />
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
              <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Motor Vehicle Insurance</Text>
            {selectedSubcategory && (
              <Text style={styles.headerSubtitle}>
                {getSubcategoryHeaderLabel(selectedSubcategory)}
              </Text>
            )}
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <StepErrorBoundary>
          {flowType === 'COMPREHENSIVE' ? <ComprehensiveFlow /> : <ThirdPartyFlow />}
        </StepErrorBoundary>
      </View>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={hideSnackbar}
        duration={3000}
        style={{ backgroundColor: snackbar.type === 'error' ? '#D32F2F' : '#323232' }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

const Motor3Container = () => {
  return (
    <Motor3Provider>
      <Motor3Content />
    </Motor3Provider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.primary, // Match header color
  },
  headerSafeArea: {
    backgroundColor: BRAND.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#fff',
    textAlign: 'center',
    marginTop: SPACING.xxs,
    opacity: 0.9,
  },
  headerSpacer: {
    width: 40, // Balance the back button
  },
  content: {
    flex: 1,
    backgroundColor: UI.background,
  },
  container: {
    flex: 1,
    backgroundColor: UI.backgroundGray,
  },
});

export default Motor3Container;
