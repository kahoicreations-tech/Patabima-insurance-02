import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';
import Motor2StaticDataService from '@services/Motor2StaticDataService';
import djangoAPI from '@services/DjangoAPIService';
import { Colors } from '@constants/Colors';
import { Typography } from '@constants/Typography';
import { Spacing } from '@constants/Spacing';
import { stripBracketNotes as stripNotes, normalizeName as normName } from '@utils/textSanitizers';

export default function CategorySelectionStep({ stepName = 'Category', onNext }) {
  const { state, actions } = useMotorInsurance();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  // Modal state for cross-platform registration entry
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkInput, setCheckInput] = useState('');
  const [checking, setChecking] = useState(false);
  // Drawer state for results
  const [showResultDrawer, setShowResultDrawer] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

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
    try {
      // Use Motor2StaticDataService for instant 0ms load with background sync
      const startTime = performance.now();
      const backendCategories = await Motor2StaticDataService.getCategories();
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`🚀 [CategorySelectionStep] Categories loaded in ${loadTime.toFixed(2)}ms`);
      console.log(`📦 [CategorySelectionStep] Loaded ${backendCategories?.length || 0} categories`);
      
      if (Array.isArray(backendCategories) && backendCategories.length) {
        const formatted = formatCategories(backendCategories);
        setCategories(formatted);
      } else {
        setCategories([]);
        setError('No categories available');
      }
    } catch (e) {
      console.error('[CategorySelectionStep] Failed to load categories:', e);
      setCategories([]);
      setError(e?.message || 'Failed to load categories');
      Alert.alert('Connection Error', 'Unable to load insurance categories. Please check your connection.');
    }
  }, [formatCategories]);

  const loadSubcategoriesForCategory = useCallback(async (categoryCode) => {
    try {
      // Use Motor2StaticDataService for instant load with background sync
      const list = await Motor2StaticDataService.getSubcategoriesByCategory(categoryCode);
      
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
    } catch (e) {
      console.error('[CategorySelectionStep] Error loading subcategories:', e);
      actions.setSubcategories([]);
      Alert.alert('Error', e?.message || 'Failed to load coverage types');
    }
  }, [actions, selectedCategory]);

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
    // Step 1: Show only category grid (instant load via Motor2StaticDataService)
    return (
      <View style={styles.container}>
        <Text style={styles.stepTitle}>Select Vehicle Category</Text>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>No Categories Available</Text>
            <Text style={styles.errorText}>{error || 'Failed to load categories'}</Text>
          </View>
        )}
        {!error && (
          <>
            <FlatList
              data={categories}
              keyExtractor={(it, i) => String(it?.key || it?.code || i)}
              renderItem={renderCategory}
              contentContainerStyle={styles.grid}
              numColumns={2}
              columnWrapperStyle={{ gap: 16 }}
              scrollEnabled={false}
            />

            {/* Check Existing Cover CTA */}
            <View style={styles.checkCoverContainer}>
              <TouchableOpacity
                style={[styles.checkCoverButton, checking && { opacity: 0.6 }]}
                onPress={() => {
                  setCheckInput('');
                  setShowCheckModal(true);
                }}
                disabled={checking}
                activeOpacity={0.9}
              >
                <Ionicons name="car-sport" size={20} color="#FFFFFF" />
                <Text style={styles.checkCoverButtonText}>Check Vehicle For{'\n'}Existing Cover</Text>
              </TouchableOpacity>
            </View>

            {/* Input Drawer for entering registration */}
            <Modal
              visible={showCheckModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowCheckModal(false)}
            >
              <View style={styles.inputDrawerOverlay}>
                <TouchableOpacity 
                  style={styles.inputDrawerBackdrop} 
                  activeOpacity={1} 
                  onPress={() => setShowCheckModal(false)}
                />
                <View style={styles.inputDrawerContainer}>
                  <View style={styles.drawerHandle} />
                  
                  <Text style={styles.inputDrawerTitle}>Check Vehicle For Existing Cover</Text>
                  <Text style={styles.inputDrawerSubtitle}>Enter vehicle registration number</Text>
                  
                  <View style={styles.inputDrawerInputRow}>
                    <Ionicons name="car-sport" size={20} color={Colors.primary} />
                    <TextInput
                      style={styles.inputDrawerTextInput}
                      value={checkInput}
                      onChangeText={(t) => setCheckInput((t || '').toUpperCase())}
                      autoCapitalize="characters"
                      placeholder="e.g., KDA 123A"
                      placeholderTextColor={Colors.textMuted}
                      autoFocus
                    />
                  </View>
                  
                  <View style={styles.inputDrawerActions}>
                    <TouchableOpacity
                      style={[styles.inputDrawerButton, styles.inputDrawerButtonSecondary]}
                      onPress={() => setShowCheckModal(false)}
                    >
                      <Text style={styles.inputDrawerButtonSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inputDrawerButton, styles.inputDrawerButtonPrimary, (!checkInput || checking) && { opacity: 0.6 }]}
                      disabled={!checkInput || checking}
                      onPress={async () => {
                        const reg = (checkInput || '').trim().toUpperCase();
                        if (!reg) return;
                        try {
                          setChecking(true);
                          setShowCheckModal(false);
                          
                          let result = null;
                          // Call DMVIC vehicle search endpoint
                          try {
                            const resp = await djangoAPI.makeRequest('/api/insurance/dmvic/search-vehicle/', {
                              method: 'POST',
                              body: JSON.stringify({
                                registration_number: reg
                              })
                            });
                            
                            // Debug logging
                            console.log('DMVIC Response:', JSON.stringify(resp, null, 2));
                            
                            if (resp && resp.success && resp.vehicle) {
                              const vehicle = resp.vehicle;
                              const hasActiveCover = vehicle.has_active_cover || false;
                              const currentPolicy = vehicle.current_policy;
                              
                              console.log('Has Active Cover:', hasActiveCover);
                              console.log('Current Policy:', currentPolicy);
                              console.log('Policy History Count:', vehicle.policy_history?.length || 0);
                              
                              if (hasActiveCover && currentPolicy) {
                                // Vehicle has active cover
                                result = {
                                  found: true,
                                  registration: reg,
                                  policyNumber: currentPolicy.policy_number || 'N/A',
                                  underwriter: currentPolicy.member_company || 'N/A',
                                  expiryDate: currentPolicy.cover_end_date || 'Unknown',
                                  coverType: currentPolicy.certificate_type || 'N/A',
                                  vehicleDetails: {
                                    make: vehicle.make,
                                    model: vehicle.model,
                                    year: vehicle.year_of_manufacture,
                                    chassisNumber: vehicle.chassis_number
                                  }
                                };
                              } else {
                                // Vehicle found but no active cover
                                const hasExpiredPolicies = vehicle.policy_history && vehicle.policy_history.length > 0;
                                const noPolicyHistory = !vehicle.policy_history || vehicle.policy_history.length === 0;
                                
                                result = {
                                  found: false,
                                  registration: reg,
                                  message: noPolicyHistory
                                    ? `Vehicle found: ${vehicle.make} ${vehicle.model}. No policy records in DMVIC database. This may be a new vehicle or policies are registered elsewhere.`
                                    : `Vehicle found: ${vehicle.make} ${vehicle.model}. Previous policies have expired. You may proceed to create a new policy.`,
                                  vehicleDetails: {
                                    make: vehicle.make,
                                    model: vehicle.model,
                                    year: vehicle.year_of_manufacture,
                                    chassisNumber: vehicle.chassis_number
                                  },
                                  hasExpiredPolicies,
                                  noPolicyHistory
                                };
                              }
                            } else {
                              // Vehicle not found in DMVIC
                              result = {
                                found: false,
                                registration: reg,
                                message: 'Vehicle not found in DMVIC database. Please verify the registration number.',
                              };
                            }
                          } catch (apiError) {
                            // DMVIC API error - fallback to pattern check
                            console.log('DMVIC API error:', apiError);
                            const pattern = /^K[A-Z]{2}\s?\d{3}[A-Z]$/;
                            if (pattern.test(reg)) {
                              result = {
                                found: false,
                                registration: reg,
                                message: 'Unable to verify with DMVIC at this time. Registration format appears valid. You may proceed with caution.',
                                warning: true
                              };
                            } else {
                              result = {
                                found: false,
                                registration: reg,
                                message: 'Registration format not recognized. Please verify and try again.',
                                error: true
                              };
                            }
                          }
                          
                          setVerificationResult(result);
                          setShowResultDrawer(true);
                        } catch (err) {
                          setVerificationResult({
                            found: false,
                            registration: reg,
                            error: true,
                            message: err?.message || 'Could not verify policy. Please try again later.',
                          });
                          setShowResultDrawer(true);
                        } finally {
                          setChecking(false);
                        }
                      }}
                    >
                      {checking ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Text style={styles.inputDrawerButtonPrimaryText}>Check</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Loading Drawer - Shows while checking */}
            <Modal
              visible={checking}
              transparent
              animationType="fade"
            >
              <View style={styles.drawerOverlay}>
                <View style={styles.drawerBackdrop} />
                <View style={styles.loadingDrawerContainer}>
                  <View style={styles.drawerHandle} />
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingTitle}>Verifying Vehicle...</Text>
                    <Text style={styles.loadingSubtitle}>Checking DMVIC database for existing cover</Text>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Results Drawer */}
            <Modal
              visible={showResultDrawer}
              transparent
              animationType="slide"
              onRequestClose={() => setShowResultDrawer(false)}
            >
              <View style={styles.drawerOverlay}>
                <TouchableOpacity 
                  style={styles.drawerBackdrop} 
                  activeOpacity={1} 
                  onPress={() => setShowResultDrawer(false)}
                />
                <View style={styles.drawerContainer}>
                  <View style={styles.drawerHandle} />
                  
                  {verificationResult && (
                    <>
                      <View style={styles.drawerHeader}>
                        <Text style={styles.drawerTitle}>Verification Result</Text>
                        <Text style={styles.drawerSubtitle}>
                          Registration: {verificationResult.registration}
                        </Text>
                      </View>

                      <View style={styles.drawerContent}>
                        {verificationResult.error ? (
                          // Error state
                          <View style={styles.resultContainer}>
                            <View style={[styles.resultIconCircle, styles.errorCircle]}>
                              <Ionicons name="alert-circle" size={36} color="#dc3545" />
                            </View>
                            <Text style={styles.resultTitle}>Verification Error</Text>
                            <Text style={styles.resultMessage}>{verificationResult.message}</Text>
                          </View>
                        ) : verificationResult.found ? (
                          // Policy found
                          <View style={styles.resultContainer}>
                            <View style={[styles.resultIconCircle, styles.warningCircle]}>
                              <Ionicons name="shield-checkmark" size={36} color="#ff9800" />
                            </View>
                            <Text style={styles.resultTitle}>Existing Policy Found</Text>
                            <View style={styles.policyDetailsCard}>
                              {verificationResult.vehicleDetails && (
                                <>
                                  <View style={styles.policyDetailRow}>
                                    <Text style={styles.policyDetailLabel}>Vehicle:</Text>
                                    <Text style={styles.policyDetailValue}>
                                      {verificationResult.vehicleDetails.make} {verificationResult.vehicleDetails.model} ({verificationResult.vehicleDetails.year})
                                    </Text>
                                  </View>
                                  <View style={styles.policyDetailRow}>
                                    <Text style={styles.policyDetailLabel}>Chassis Number:</Text>
                                    <Text style={styles.policyDetailValue}>{verificationResult.vehicleDetails.chassisNumber}</Text>
                                  </View>
                                </>
                              )}
                              <View style={styles.policyDetailRow}>
                                <Text style={styles.policyDetailLabel}>Policy Number:</Text>
                                <Text style={styles.policyDetailValue}>{verificationResult.policyNumber}</Text>
                              </View>
                              <View style={styles.policyDetailRow}>
                                <Text style={styles.policyDetailLabel}>Underwriter:</Text>
                                <Text style={styles.policyDetailValue}>{verificationResult.underwriter}</Text>
                              </View>
                              <View style={styles.policyDetailRow}>
                                <Text style={styles.policyDetailLabel}>Cover Type:</Text>
                                <Text style={styles.policyDetailValue}>{verificationResult.coverType}</Text>
                              </View>
                              <View style={styles.policyDetailRow}>
                                <Text style={styles.policyDetailLabel}>Expiry Date:</Text>
                                <Text style={styles.policyDetailValue}>{verificationResult.expiryDate}</Text>
                              </View>
                            </View>
                            <Text style={styles.warningNote}>
                              This vehicle already has active cover. You may proceed if renewing or switching underwriters.
                            </Text>
                          </View>
                        ) : (
                          // No policy found
                          <View style={styles.resultContainer}>
                            <View style={[styles.resultIconCircle, verificationResult.warning ? styles.warningCircle : styles.successCircle]}>
                              <Ionicons 
                                name={verificationResult.warning ? "warning" : "checkmark-circle"} 
                                size={36} 
                                color={verificationResult.warning ? "#ff9800" : "#28a745"} 
                              />
                            </View>
                            <Text style={styles.resultTitle}>No Active Cover Found</Text>
                            {verificationResult.vehicleDetails && (
                              <View style={styles.policyDetailsCard}>
                                <View style={styles.policyDetailRow}>
                                  <Text style={styles.policyDetailLabel}>Vehicle:</Text>
                                  <Text style={styles.policyDetailValue}>
                                    {verificationResult.vehicleDetails.make} {verificationResult.vehicleDetails.model}
                                  </Text>
                                </View>
                                <View style={styles.policyDetailRow}>
                                  <Text style={styles.policyDetailLabel}>Year:</Text>
                                  <Text style={styles.policyDetailValue}>{verificationResult.vehicleDetails.year}</Text>
                                </View>
                                <View style={styles.policyDetailRow}>
                                  <Text style={styles.policyDetailLabel}>Chassis:</Text>
                                  <Text style={styles.policyDetailValue}>{verificationResult.vehicleDetails.chassisNumber}</Text>
                                </View>
                              </View>
                            )}
                            <Text style={styles.resultMessage}>{verificationResult.message}</Text>
                            {verificationResult.noPolicyHistory && (
                              <View style={styles.infoBox}>
                                <Ionicons name="information-circle" size={16} color="#2196F3" />
                                <Text style={styles.infoBoxText}>
                                  Note: DMVIC database shows no policy history. If this vehicle has insurance with another company, they may not be reporting to DMVIC yet.
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>

                      <View style={styles.drawerActions}>
                        <TouchableOpacity 
                          style={[styles.drawerButton, styles.drawerButtonSecondary]}
                          onPress={() => setShowResultDrawer(false)}
                        >
                          <Text style={styles.drawerButtonSecondaryText}>Close</Text>
                        </TouchableOpacity>
                        {!verificationResult.error && (
                          <TouchableOpacity 
                            style={[styles.drawerButton, styles.drawerButtonPrimary]}
                            onPress={() => {
                              setShowResultDrawer(false);
                              // User can proceed with creating policy
                            }}
                          >
                            <Text style={styles.drawerButtonPrimaryText}>
                              {verificationResult.found ? 'Proceed Anyway' : 'Create New Policy'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>
            </Modal>
          </>
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
  // Button container below grid
  checkCoverContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  checkCoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
    minHeight: 48,
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  checkCoverButtonText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.md,
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: 0.2,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    marginTop: 4,
  },
  modalTextInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 6,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semiBold,
  },
  modalConfirm: {
    backgroundColor: Colors.primary,
  },
  modalConfirmText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  // Loading Drawer styles (shows while verifying)
  loadingDrawerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  loadingTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  loadingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  // Input Drawer styles (for registration input)
  inputDrawerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  inputDrawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  inputDrawerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputDrawerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  inputDrawerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  inputDrawerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    marginBottom: 20,
  },
  inputDrawerTextInput: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  inputDrawerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inputDrawerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputDrawerButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  inputDrawerButtonSecondaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  inputDrawerButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  inputDrawerButtonPrimaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  // Results Drawer styles (for verification results)
  drawerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    maxHeight: '80%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerHeader: {
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  drawerContent: {
    marginBottom: 20,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCircle: {
    backgroundColor: '#E8F5E9',
  },
  warningCircle: {
    backgroundColor: '#FFF3E0',
  },
  errorCircle: {
    backgroundColor: '#FFEBEE',
  },
  resultTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  policyDetailsCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    gap: 12,
  },
  policyDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  policyDetailLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  policyDetailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semiBold,
    flex: 1,
    textAlign: 'right',
  },
  warningNote: {
    fontSize: Typography.fontSize.xs,
    color: '#ff9800',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: '#1565C0',
    lineHeight: 18,
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  drawerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  drawerButtonSecondaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },
  drawerButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  drawerButtonPrimaryText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
});
