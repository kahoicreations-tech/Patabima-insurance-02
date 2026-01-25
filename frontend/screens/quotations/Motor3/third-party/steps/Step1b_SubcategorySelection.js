import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMotor3 } from '../../contexts/Motor3Context';
import { useThirdParty } from '../../contexts/ThirdPartyContext';
import { getSubcategoriesByCategory } from '../../constants/staticCategories';
import { BRAND, UI, SEMANTIC, SPACING, BORDER_RADIUS, BORDER_WIDTH, FONT_SIZES, FONT_WEIGHTS } from '../../../../../theme';
import Motor3Stepper from '../../components/Motor3Stepper';
import { getFlowType } from '../../utils/productFieldConfig';

// Motor2-matching step labels
const STEP_LABELS = ['Vehicle Type', 'Coverage', 'Vehicle', 'Underwriter', 'Client', 'Documents', 'Review', 'Payment'];

const Step1b_SubcategorySelection = ({ onNext, onBack }) => {
  const { selectedCategory, setCategorySelection } = useMotor3();
  const { setSelectedProduct } = useThirdParty();
  const [error, setError] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // ✅ HYBRID STATIC: Load subcategories instantly from static data
  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    
    try {
      const categoryCode = selectedCategory.code || selectedCategory.category_code;
      const startTime = performance.now();
      const data = getSubcategoriesByCategory(categoryCode);
      const endTime = performance.now();
      
      console.log(`🚀 [Motor3] Subcategories loaded INSTANTLY in ${(endTime - startTime).toFixed(2)}ms (static data)`);
      console.log(`📦 [Motor3] Loaded ${data?.length || 0} subcategories for ${categoryCode}`);
      console.log('[Motor3] Showing ALL subcategories:', data);
      
      return data || [];
    } catch (err) {
      console.error('[Motor3] Failed to load subcategories:', err);
      setError(err.message);
      return [];
    }
  }, [selectedCategory, retryNonce]);

  // No loading state needed - data is instant

  const handleSubcategorySelect = (subcategory) => {
    console.log('[Step1b] ========================================');
    console.log('[Step1b] Subcategory selected:', subcategory);
    console.log('[Step1b] Subcategory code:', subcategory?.subcategory_code);
    console.log('[Step1b] Coverage type:', subcategory?.coverage_type);
    console.log('[Step1b] Pricing model:', subcategory?.pricing_model);
    
    // Update Motor3Context with category + subcategory
    console.log('[Step1b] Setting category selection in Motor3Context...');
    setCategorySelection(selectedCategory, subcategory);

    const flowType = getFlowType(subcategory?.subcategory_code);
    
    // Only the Third Party flow uses ThirdPartyContext state.
    if (flowType !== 'COMPREHENSIVE') {
      console.log('[Step1b] Setting product in ThirdPartyContext...');
      setSelectedProduct(subcategory);
    }
    
    console.log('[Step1b] Navigating to next step (Vehicle Details)...');
    console.log('[Step1b] ========================================');
    
    // If Comprehensive product is selected, Motor3Container will reroute flows.
    // Avoid advancing the Third Party step index to prevent flicker.
    if (flowType !== 'COMPREHENSIVE') {
      onNext();
    }
  };

  const getDisplayLabel = (item) => {
    if (item?.public_label) return item.public_label;
    if (item?.name && item?.name !== item?.subcategory_code) return item.name;

    const code = item?.subcategory_code || item?.name || '';
    const specialMap = {
      PRIVATE_TOR: 'Third Party (T.O.R)',
      PRIVATE_THIRD_PARTY: 'Third Party',
      PRIVATE_THIRD_PARTY_EXT: 'Third Party (Extended)',
      PRIVATE_THIRD_PARTY_EXTENDIBLE: 'Third Party (Extended)',
      PRIVATE_COMPREHENSIVE: 'Comprehensive',
    };
    if (specialMap[code]) return specialMap[code];

    return String(code)
      .split('_')
      .map((word) => {
        const upperWord = String(word).toUpperCase();
        if (['TP', 'TOR', 'COMP', 'PSV', 'PM', 'EXT', 'KG'].includes(upperWord)) return upperWord;
        if (/^\d+[MWK]?$/.test(word)) return word;
        return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word;
      })
      .join(' ');
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setRetryNonce((n) => n + 1);
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subcategories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={UI.textSecondary} />
        <Text style={styles.emptyText}>No Third-Party products available for {selectedCategory?.name || 'this category'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stepper Header - Motor2 Style */}
      <Motor3Stepper currentStep={2} />

      <Text style={styles.stepTitle}>Choose coverage for {selectedCategory?.name || 'category'}</Text>

      {/* Subcategory List */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {subcategories.map((item, index) => {
           const isSelected = false; // Logic for selection if needed
           const displayLabel = getDisplayLabel(item);
           return (
            <TouchableOpacity 
              key={item.subcategory_code || index}
              style={[styles.categoryCard, isSelected && styles.selectedCard]}
              onPress={() => handleSubcategorySelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIconWrapper}>
                 {/* Use an icon based on the subcategory or a generic one */}
                 <Ionicons name={getIconForSubcategory({ ...item, name: displayLabel })} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.categoryTitle}>{displayLabel}</Text>
              {isSelected && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={BRAND.primary} />
                </View>
              )}
            </TouchableOpacity>
           );
        })}
      </ScrollView>
    </View>
  );
};

// Helper to pick icon
const getIconForSubcategory = (item) => {
  const name = (item.name || '').toLowerCase();
  if (name.includes('commercial')) return 'truck';
  if (name.includes('psv')) return 'bus';
  if (name.includes('motorcycle')) return 'bicycle'; // or bicycle for bike
  if (name.includes('tuktuk')) return 'car'; // need a better icon
  if (name.includes('special')) return 'construct';
  return 'car-sport'; // default
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI.background,
    paddingTop: 0,
  },
  stepTitle: {
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.semibold,
    color: UI.textPrimary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: BORDER_WIDTH.thin,
    borderColor: UI.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: BORDER_WIDTH.medium,
    borderColor: BRAND.primary,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  categoryIconWrapper: {
    width: SPACING.huge + SPACING.sm,
    height: SPACING.huge + SPACING.sm,
    borderRadius: (SPACING.huge + SPACING.sm) / 2,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryTitle: {
    flex: 1,
    fontSize: FONT_SIZES.bodyLarge,
    fontWeight: FONT_WEIGHTS.semibold,
    color: UI.textPrimary,
  },
  checkmarkContainer: {
    marginLeft: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: UI.surface,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: UI.textSecondary,
  },
  errorText: {
    fontSize: FONT_SIZES.body,
    color: SEMANTIC.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: UI.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxxl,
  },
  retryButton: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    color: '#fff',
    fontSize: FONT_SIZES.button,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.textSecondary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  backButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.button,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});

export default Step1b_SubcategorySelection;
