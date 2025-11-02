import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';
import motorPricingService from '@services/MotorInsurancePricingService';
import djangoAPI from '@services/DjangoAPIService';
import { Colors } from '@constants/Colors';
import { Typography } from '@constants/Typography';
import { Spacing } from '@constants/Spacing';
import { stripBracketNotes as stripNotes, normalizeName as normName } from '@utils/textSanitizers';

export default function CategorySelectionStep({ stepName = 'Category', onNext }) {
  const { state, actions } = useMotorInsurance();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = state.selectedCategory || null;
  const subcategories = useMemo(() => state.availableSubcategories || [], [state.availableSubcategories]);

  const getCategoryIcon = useCallback((code) => {
    const iconMap = {
      PRIVATE: 'car-sport-outline',
      COMMERCIAL: 'cube-outline',
      PSV: 'bus-outline',
      MOTORCYCLE: 'bicycle-outline',
      TUKTUK: 'car-outline',
      SPECIAL: 'construct-outline',
    };
    return iconMap[code] || 'car-outline';
  }, []);

  const getDefaultDescription = useCallback((name) => {
    const descMap = {
      Private: 'Personal vehicles',
      Commercial: 'Goods carriers',
      PSV: 'Passenger service',
      Motorcycle: 'Boda & private',
      TukTuk: 'Three-wheeler',
      Special: 'Agric./institutional',
    };
    return descMap[name] || 'Motor vehicle insurance';
  }, []);

  const formatCategories = useCallback((backendCategories) => {
    return (backendCategories || []).map((cat) => ({
      key: cat.code || cat.category_code || cat.id,
      category_code: cat.code || cat.category_code,
      title: cat.name || cat.category_name,
      icon: getCategoryIcon(cat.code || cat.category_code || cat.name),
      desc: cat.description || getDefaultDescription(cat.name || cat.category_name),
      // Keep raw for debugging/future use
      raw: cat,
    }));
  }, [getCategoryIcon, getDefaultDescription]);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Try cache first
      const cached = await AsyncStorage.getItem('motor_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24h
        if (age < maxAge && Array.isArray(parsed.data)) {
          setCategories(parsed.data);
          setLoading(false);
          // Background refresh
          motorPricingService.getCategories().then(async (backend) => {
            if (Array.isArray(backend) && backend.length) {
              const formatted = formatCategories(backend);
              setCategories(formatted);
              await AsyncStorage.setItem('motor_categories', JSON.stringify({ data: formatted, timestamp: Date.now() }));
            }
          }).catch(() => {});
          return;
        }
      }
      // Fresh fetch
      const backendCategories = await motorPricingService.getCategories();
      if (Array.isArray(backendCategories) && backendCategories.length) {
        const formatted = formatCategories(backendCategories);
        setCategories(formatted);
        await AsyncStorage.setItem('motor_categories', JSON.stringify({ data: formatted, timestamp: Date.now() }));
      } else {
        setCategories([]);
        setError('No categories available from backend');
      }
    } catch (e) {
      console.error('[CategorySelectionStep] Failed to load categories:', e);
      setCategories([]);
      setError(e?.message || 'Failed to load categories');
      Alert.alert('Connection Error', 'Unable to load insurance categories from server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formatCategories]);

  const loadSubcategoriesForCategory = useCallback(async (categoryCode) => {
    const cacheKey = `motor_subcategories_v2_${categoryCode}`; // v2 to invalidate old cache format
    try {
      // Try cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - (parsed.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24h
        if (age < maxAge && Array.isArray(parsed.data)) {
          actions.setSubcategories(parsed.data);
          // Background refresh
          djangoAPI.getSubcategories(categoryCode).then(async (list) => {
            const transformed = (Array.isArray(list) ? list : []).map((sub) => {
              const type = String(sub.cover_type || sub.product_type || sub.pricing_model || '').toUpperCase();
              const rawReq = sub.pricing_requirements || sub.required_fields || [];
              const requirements = Array.isArray(rawReq) ? rawReq : Object.values(rawReq || {});
              return {
                id: sub.id,
                code: sub.subcategory_code || sub.code,
                subcategory_code: sub.subcategory_code || sub.code,
                name: sub.subcategory_name || sub.name,
                type,
                coverage_type: type, // Map type to coverage_type for DynamicVehicleForm compatibility
                category: selectedCategory?.code || categoryCode, // Add category for DynamicVehicleForm
                pricing_model: sub.pricing_model,
                description: sub.description,
                requirements,
                is_extendible: Boolean(sub.is_extendible),
                extendible_variant_id: sub.extendible_variant_id || sub.extendible_variant || null,
                additionalFields: sub.additional_fields || sub.additionalFields || [],
                fieldValidations: sub.field_validations || sub.fieldValidations || {},
                complex: (sub.pricing_model && sub.pricing_model !== 'FIXED') || requirements.length > 0,
                raw: sub,
              };
            });
            actions.setSubcategories(transformed);
            await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: transformed, timestamp: Date.now() }));
          }).catch(() => {});
          return;
        }
      }
      // Fresh fetch
      const list = await djangoAPI.getSubcategories(categoryCode);
      const transformed = (Array.isArray(list) ? list : []).map((sub) => {
        const type = String(sub.cover_type || sub.product_type || sub.pricing_model || '').toUpperCase();
        const rawReq = sub.pricing_requirements || sub.required_fields || [];
        const requirements = Array.isArray(rawReq) ? rawReq : Object.values(rawReq || {});
        return {
          id: sub.id,
          code: sub.subcategory_code || sub.code,
          subcategory_code: sub.subcategory_code || sub.code,
          name: sub.subcategory_name || sub.name,
          type,
          coverage_type: type, // Map type to coverage_type for DynamicVehicleForm compatibility
          category: selectedCategory?.code || categoryCode, // Add category for DynamicVehicleForm
          pricing_model: sub.pricing_model,
          description: sub.description,
          requirements,
          is_extendible: Boolean(sub.is_extendible),
          extendible_variant_id: sub.extendible_variant_id || sub.extendible_variant || null,
          additionalFields: sub.additional_fields || sub.additionalFields || [],
          fieldValidations: sub.field_validations || sub.fieldValidations || {},
          complex: (sub.pricing_model && sub.pricing_model !== 'FIXED') || requirements.length > 0,
          raw: sub,
        };
      });
      actions.setSubcategories(transformed);
      await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: transformed, timestamp: Date.now() }));
    } catch (e) {
      console.error('[CategorySelectionStep] Error loading subcategories:', e);
      actions.setSubcategories([]);
      Alert.alert('Error', e?.message || 'Failed to load coverage types');
    }
  }, [actions]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const renderCategory = ({ item }) => {
    const selected = selectedCategory?.key === item.key || selectedCategory?.category_code === item.category_code;
    return (
      <TouchableOpacity
        style={[styles.categoryCard, selected && styles.selectedCard]}
        onPress={() => {
          // Persist selection in context and load subcategories
          actions.setCategorySelection && actions.setCategorySelection({ category: item, subcategory: null, productType: null });
          const code = item.category_code || item.key;
          if (code) {
            loadSubcategoriesForCategory(code);
          }
          // Advance to Subcategory
          if (stepName === 'Category' && typeof onNext === 'function') onNext();
        }}
        activeOpacity={0.8}
      >
        <View style={styles.categoryIconWrapper}>
          <Ionicons 
            name={item.icon || 'car-sport'} 
            size={40} 
            color="#D5222B"
            style={{ fontWeight: '300' }}
          />
        </View>
        <Text style={styles.categoryTitle}>{item?.title || item?.name || item?.label || 'Category'}</Text>
      </TouchableOpacity>
    );
  };

  const renderSubcategory = ({ item }) => {
    const selected = (state.selectedSubcategory?.code || state.selectedSubcategory?.key) === (item.code || item.key);
    
    const toTitle = (str = '') => {
      if (!str) return '';
      return String(str)
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
    };
    
    return (
      <TouchableOpacity 
        style={[styles.subcategoryCard, selected && styles.subSelected]}
        onPress={() => {
          console.log('[CategorySelectionStep] Subcategory selected:', item);
          // Normalize product type for validation rules
          const t = String(item?.type || '').toUpperCase();
          const normalizedType = t.includes('COMP') ? 'COMPREHENSIVE' : (t.includes('TOR') ? 'TOR' : 'THIRD_PARTY');
          console.log('[CategorySelectionStep] Normalized type:', normalizedType);
          
          // Set both category+subcategory and productType for validation/calculations
          if (actions.setCategorySelection) {
            console.log('[CategorySelectionStep] Calling setCategorySelection with:', {
              category: selectedCategory,
              subcategory: item,
              productType: normalizedType,
            });
            actions.setCategorySelection({
              category: selectedCategory,
              subcategory: item,
              productType: normalizedType,
            });
          } else {
            console.error('[CategorySelectionStep] setCategorySelection action not found!');
          }
          
          console.log('[CategorySelectionStep] Calling onNext');
          if (typeof onNext === 'function') onNext();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.subcategoryTitle}>{toTitle(item?.name || item?.code || item?.type)}</Text>
        <View style={styles.badgesRow}>
          <Text style={styles.badge}>{toTitle(item.type)}</Text>
          {item.is_extendible ? (
            <Text style={[styles.badge, styles.badgeInfo]}>Extendible</Text>
          ) : null}
        </View>
        {item?.requirements && item.requirements.length > 0 && (
          <Text style={styles.requirements}>Requires: {item.requirements.join(', ')}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Group subcategories by Third Party vs Comprehensive
  const groupedSubcategories = useMemo(() => {
    const thirdParty = [];
    const comprehensive = [];
    
    subcategories.forEach(item => {
      const type = (item.type || item.cover_type || '').toUpperCase();
      const name = (item.name || '').toUpperCase();
      
      // Check if it's comprehensive
      if (type.includes('COMPREHENSIVE') || type === 'COMP' || name.includes('COMPREHENSIVE')) {
        comprehensive.push(item);
      } 
      // Everything else is third party (including TOR, TPO, Third-Party, Extendible)
      else {
        thirdParty.push(item);
      }
    });
    
    return { thirdParty, comprehensive };
  }, [subcategories]);

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  // Render based on which step we're on
  if (stepName === 'Category') {
    // Step 1: Show only category grid
    return (
      <View style={styles.container}>
        <Text style={styles.stepTitle}>Select Vehicle Category</Text>
        {loading && (
          <View style={[styles.loadingContainer, { paddingVertical: 24 }]}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading categories from backend...</Text>
          </View>
        )}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>No Categories Available</Text>
            <Text style={styles.errorText}>{error || 'Failed to load from backend'}</Text>
          </View>
        )}
        {!loading && !error && (
          <FlatList
            data={categories}
            keyExtractor={(it, i) => String(it?.key || it?.code || i)}
            renderItem={renderCategory}
            contentContainerStyle={styles.grid}
            numColumns={2}
            columnWrapperStyle={{ gap: 16 }}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  }

  // Step 2: Show subcategory selection (only show if we have a selected category)
  if (stepName === 'Subcategory') {
    if (!selectedCategory) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Please select a category first</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.stepTitle}>Choose coverage for {selectedCategory.title}</Text>
        
        {subcategories.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading coverage types...</Text>
          </View>
        )}

        {subcategories.length > 0 && (
          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
          >
            {/* Third Party Section */}
            {groupedSubcategories.thirdParty.length > 0 && (
              <View>
                {renderSectionHeader('Third Party')}
                {groupedSubcategories.thirdParty.map((item, idx) => (
                  <View key={item.code || `tp-${idx}`}>
                    {renderSubcategory({ item })}
                    {idx < groupedSubcategories.thirdParty.length - 1 && <View style={{ height: 8 }} />}
                  </View>
                ))}
              </View>
            )}
            
            {/* Spacing between sections */}
            {groupedSubcategories.thirdParty.length > 0 && groupedSubcategories.comprehensive.length > 0 && (
              <View style={{ height: 24 }} />
            )}
            
            {/* Comprehensive Section */}
            {groupedSubcategories.comprehensive.length > 0 && (
              <View>
                {renderSectionHeader('Comprehensive')}
                {groupedSubcategories.comprehensive.map((item, idx) => (
                  <View key={item.code || `comp-${idx}`}>
                    {renderSubcategory({ item })}
                    {idx < groupedSubcategories.comprehensive.length - 1 && <View style={{ height: 8 }} />}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // Fallback
  return null;
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: 0,
    alignItems: 'stretch',
  },
  stepTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'left',
    letterSpacing: 0.3,
    paddingHorizontal: Spacing.md,
  },
  grid: { 
    gap: 16, 
    paddingBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconWrapper: {
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sectionHeaderContainer: {
    backgroundColor: Colors.backgroundGray,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.md,
    borderRadius: Spacing.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sectionHeaderText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subcategoryCard: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.padding.component,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.02,
    elevation: 1,
    width: 'auto',
  },
  subSelected: { 
    borderColor: Colors.primary, 
    borderWidth: 2, 
    backgroundColor: '#fff5f5' 
  },
  subcategoryTitle: {
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontSize: Typography.fontSize.md,
    lineHeight: Typography.lineHeight.md,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.backgroundGray,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Spacing.borderRadius.sm,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  badgeInfo: { 
    backgroundColor: '#e7f1ff', 
    color: '#1e66f5' 
  },
  requirements: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
    marginTop: Spacing.xs / 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#dc3545',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: Typography.lineHeight.sm,
  },
});
