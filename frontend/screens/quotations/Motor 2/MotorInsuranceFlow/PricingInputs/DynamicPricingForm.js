import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import motorPricingService from '../../../../../services/MotorInsurancePricingService';

const DynamicPricingForm = ({ 
  fields = [], 
  values, 
  onChange, 
  errors = {}, 
  selectedProduct, 
  vehicleData, 
  onPricingComplete, 
  initialData = {} 
}) => {
  const [pricingInputs, setPricingInputs] = useState(initialData || values || {});
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingResult, setPricingResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState(errors);

  const update = (k, v) => {
    const newData = { ...pricingInputs, [k]: v };
    setPricingInputs(newData);
    onChange?.(newData);
    
    // Auto-calculate pricing after input changes
    if (selectedProduct && vehicleData) {
      debounceCalculation(newData);
    }
  };

  // Get required pricing inputs based on product type
  const getPricingFields = () => {
    if (fields && fields.length > 0) return fields;
    if (!selectedProduct) return [];

    const dynamicFields = [];
    const category = selectedProduct.category?.toLowerCase();
    const coverage = selectedProduct.coverage_type?.toLowerCase();

    // Coverage type specific fields (cover start date moved to Policy Details step)
    if (coverage === 'comprehensive') {
      dynamicFields.push({
        key: 'excessAmount',
        label: 'Excess Amount',
        type: 'select',
        required: true,
        options: ['5,000', '10,000', '15,000', '20,000', '25,000'],
        defaultValue: '10,000',
        help: 'Amount you pay before insurance covers the rest'
      });
    }

    // Category specific fields
    switch (category) {
      case 'commercial':
        dynamicFields.push({
          key: 'businessType',
          label: 'Business Type',
          type: 'select',
          required: true,
          options: ['Transport', 'Construction', 'Delivery', 'Agriculture', 'Other'],
        });
        break;

      case 'psv':
        dynamicFields.push({
          key: 'routeType',
          label: 'Route Type',
          type: 'select',
          required: true,
          options: ['Urban', 'Inter-County', 'International'],
        });
        break;
    }

    return dynamicFields;
  };

  // Debounced calculation to avoid too many API calls
  const debounceCalculation = (() => {
    let timeoutId;
    return (inputs) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => calculatePricing(inputs), 500);
    };
  })();

  const calculatePricing = async (inputs = pricingInputs) => {
    if (!selectedProduct || !vehicleData) return;
    const subCode = selectedProduct?.subcategory_code || selectedProduct?.code;
    if (!subCode) return; // cannot calculate without a subcategory code

    try {
      setIsCalculating(true);
      
      // Build payload for pricing service (expects: productType, inputs)
      const productType = selectedProduct?.coverage_type || selectedProduct?.type;
      const enrichedVehicle = {
        ...vehicleData,
        vehicle_year: vehicleData?.vehicle_year || vehicleData?.year,
        vehicle_make: vehicleData?.vehicle_make || vehicleData?.make,
        vehicle_model: vehicleData?.vehicle_model || vehicleData?.model,
      };
      const requestInputs = {
        ...enrichedVehicle,
        ...inputs,
        subcategory_code: subCode,
      };

      const result = await motorPricingService.calculatePremium(productType, requestInputs);
      
      setPricingResult(result);
      
      if (onPricingComplete) {
        onPricingComplete(result, inputs);
      }
    } catch (error) {
      console.error('Pricing calculation error:', error);
      setValidationErrors({ general: 'Failed to calculate pricing. Please try again.' });
    } finally {
      setIsCalculating(false);
    }
  };

  const renderField = (f) => {
    if (f.type === 'select') {
      return (
        <View key={f.key} style={styles.fieldContainer}>
          <Text style={styles.label}>
            {f.label} {f.required && <Text style={styles.required}>*</Text>}
          </Text>
          {f.help && <Text style={styles.helpText}>{f.help}</Text>}
          <View style={styles.selectContainer}>
            {f.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  pricingInputs[f.key] === option && styles.selectedOption
                ]}
                onPress={() => update(f.key, option)}
              >
                <Text style={[
                  styles.selectText,
                  pricingInputs[f.key] === option && styles.selectedText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {validationErrors[f.key] && (
            <Text style={styles.errorText}>{validationErrors[f.key]}</Text>
          )}
        </View>
      );
    }

    if (f.type === 'simple_date') {
      const today = new Date().toISOString().split('T')[0];
      return (
        <View key={f.key} style={styles.fieldContainer}>
          <Text style={styles.label}>
            {f.label} {f.required && <Text style={styles.required}>*</Text>}
          </Text>
          <TextInput
            style={styles.input}
            value={pricingInputs[f.key] || today}
            placeholder="YYYY-MM-DD"
            onChangeText={(text) => update(f.key, text)}
          />
        </View>
      );
    }



    // Legacy field rendering for backward compatibility
    return (
      <View key={f.key} style={styles.fieldContainer}>
        <Text style={styles.label}>{f.label}</Text>
        {f.type === 'sum_insured' && (
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={pricingInputs[f.key] || ''} 
            onChangeText={(v) => update(f.key, v)} 
            placeholder={f.placeholder || 'Enter amount'} 
          />
        )}
        {f.type === 'tonnage' && (
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={pricingInputs[f.key] || ''} 
            onChangeText={(v) => update(f.key, v)} 
            placeholder="Select tonnage" 
          />
        )}
        {f.type === 'passengers' && (
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={pricingInputs[f.key] || ''} 
            onChangeText={(v) => update(f.key, v)} 
            placeholder="Number of passengers" 
          />
        )}
        {!['sum_insured', 'tonnage', 'passengers', 'select'].includes(f.type) && (
          <TextInput 
            style={styles.input} 
            value={pricingInputs[f.key] || ''} 
            onChangeText={(v) => update(f.key, v)} 
            placeholder={f.placeholder || ''} 
          />
        )}
        {f.help && <Text style={styles.help}>{f.help}</Text>}
        {(errors[f.key] || validationErrors[f.key]) && (
          <Text style={styles.error}>{errors[f.key] || validationErrors[f.key]}</Text>
        )}
      </View>
    );
  };

  useEffect(() => {
    // Initialize with default values
    const currentFields = getPricingFields();
    const defaults = {
      coveragePeriod: '12 months',
      cover_start_date: new Date().toISOString().split('T')[0]
    };
    
    currentFields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue;
      }
    });

    const newData = { ...defaults, ...pricingInputs, ...initialData, ...values };
    setPricingInputs(newData);
    setValidationErrors(errors);
  }, [selectedProduct?.id, fields]);

  const currentFields = getPricingFields();

  // Legacy simple rendering
  if (!selectedProduct && !onPricingComplete) {
    return (
      <View style={styles.legacyContainer}>
        {currentFields.map(renderField)}
        {validationErrors.general && (
          <Text style={styles.error}>{validationErrors.general}</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {selectedProduct && (
        <View style={styles.header}>
          <Text style={styles.title}>Pricing Options</Text>
          <Text style={styles.subtitle}>Configure your coverage preferences</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        {currentFields.map(renderField)}
        
        {validationErrors.general && (
          <Text style={styles.errorText}>{validationErrors.general}</Text>
        )}
      </View>

      {/* Pricing Summary */}
      {pricingResult && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Premium Calculation</Text>
            {isCalculating && <ActivityIndicator size="small" color="#D5222B" />}
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Premium</Text>
            <Text style={styles.summaryValue}>
              KSh {pricingResult.basePremium?.toLocaleString() || '0'}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Levies & Taxes</Text>
            <Text style={styles.summaryValue}>
              KSh {pricingResult.leviesAndTaxes?.toLocaleString() || '0'}
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Premium</Text>
            <Text style={styles.totalValue}>
              KSh {pricingResult.totalPremium?.toLocaleString() || '0'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  legacyContainer: {
    gap: 12,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50', 
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#646767',
    fontWeight: '500',
  },
  formContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
    gap: 6,
  },
  label: { 
    fontWeight: '600', 
    color: '#495057',
    fontSize: 14,
    marginBottom: 4,
  },
  required: {
    color: '#D5222B',
  },
  helpText: {
    fontSize: 12,
    color: '#646767',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ced4da', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2c3e50',
  },
  selectContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  selectOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  selectText: {
    fontSize: 16,
    color: '#495057',
  },
  selectedOption: {
    backgroundColor: '#e7f5ff',
  },
  selectedText: {
    color: '#1864ab',
    fontWeight: '600',
  },
  help: { 
    color: '#646767', 
    fontSize: 12,
    fontStyle: 'italic',
  },
  error: { 
    color: '#d90429',
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#D5222B',
    fontSize: 12,
    marginTop: 4,
  },
  summaryContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#646767',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#D5222B',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D5222B',
  },
});

export default DynamicPricingForm;
