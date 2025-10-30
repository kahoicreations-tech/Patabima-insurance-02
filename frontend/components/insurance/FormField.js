/**
 import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { FIELD_LIBRARY, FIELD_TYPES } from './FieldLibrary';omponent
 * 
 * Renders different field types based on configuration
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  Dimensions,
  Button
} from 'react-native';
import { FIELD_TYPES } from './FieldLibrary';

export const FormField = ({ 
  name, 
  config, 
  value, 
  onValueChange, 
  onFileUpload,
  formData, 
  calculatedValues,
  isReadOnly = false,
  serviceHints = {}
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  
  // Add subtle visual indicator for background processing
  const isProcessing = serviceHints.dmvicProcessing || 
                      serviceHints.textractProcessing || 
                      serviceHints.pricingActive;
  
  const renderFieldContent = () => {
    switch (config.type) {
      case FIELD_TYPES.TEXT:
      case FIELD_TYPES.EMAIL:
      case FIELD_TYPES.PHONE:
      case FIELD_TYPES.NUMBER:
        return renderTextInput();
        
      case FIELD_TYPES.RADIO:
        return renderRadioGroup();
        
      case FIELD_TYPES.DROPDOWN:
        return renderDropdown();
        
      case FIELD_TYPES.DATE:
        return renderDatePicker();
        
      case FIELD_TYPES.FILE_UPLOAD:
        return renderFileUpload();
        
      case FIELD_TYPES.DISPLAY:
        return renderDisplayField();
        
      case FIELD_TYPES.COMPONENT:
        return renderCustomComponent();
        
      default:
        return renderTextInput();
    }
  };

  const renderTextInput = () => (
    <TextInput
      style={[styles.textInput, isReadOnly && styles.readOnlyInput]}
      value={value || ''}
      onChangeText={onValueChange}
      placeholder={config.placeholder}
      keyboardType={getKeyboardType()}
      editable={!isReadOnly}
      multiline={config.multiline}
      numberOfLines={config.numberOfLines}
    />
  );

  const renderRadioGroup = () => (
    <View style={styles.radioContainer}>
      {config.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.radioOption}
          onPress={() => !isReadOnly && onValueChange(option)}
          disabled={isReadOnly}
        >
          <View style={[
            styles.radioCircle,
            value === option && styles.radioSelected,
            isReadOnly && styles.readOnlyRadio
          ]}>
            {value === option && <View style={styles.radioInner} />}
          </View>
          <Text style={[styles.radioText, isReadOnly && styles.readOnlyText]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDropdown = () => (
    <TouchableOpacity
      style={[styles.dropdown, isReadOnly && styles.readOnlyInput]}
      onPress={() => !isReadOnly && showDropdownModal()}
      disabled={isReadOnly}
    >
      <Text style={[
        styles.dropdownText,
        !value && styles.placeholderText,
        isReadOnly && styles.readOnlyText
      ]}>
        {value || config.placeholder || 'Select an option'}
      </Text>
      {!isReadOnly && <Text style={styles.dropdownArrow}>▼</Text>}
    </TouchableOpacity>
  );

  const renderDatePicker = () => (
    <TouchableOpacity
      style={[styles.dateInput, isReadOnly && styles.readOnlyInput]}
      onPress={() => !isReadOnly && showDatePicker()}
      disabled={isReadOnly}
    >
      <Text style={[
        styles.dateText,
        !value && styles.placeholderText,
        isReadOnly && styles.readOnlyText
      ]}>
        {value ? formatDate(value) : 'Select date'}
      </Text>
      {!isReadOnly && <Text style={styles.dateIcon}>📅</Text>}
    </TouchableOpacity>
  );

  const renderFileUpload = () => (
    <View style={styles.fileUploadContainer}>
      {!isReadOnly && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleFileUpload}
        >
          <Text style={styles.uploadButtonText}>📎 Upload Documents</Text>
        </TouchableOpacity>
      )}
      
      {config.requiredFiles && (
        <View style={styles.requiredFilesContainer}>
          <Text style={styles.requiredFilesTitle}>Required Documents:</Text>
          {config.requiredFiles.map((file, index) => (
            <View key={index} style={styles.requiredFileItem}>
              <Text style={styles.requiredFileText}>• {file}</Text>
              <Text style={[
                styles.fileStatus,
                value?.[file] ? styles.fileUploaded : styles.filePending
              ]}>
                {value?.[file] ? '✓' : '○'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderDisplayField = () => {
    let displayValue = value;
    
    // Format display value based on config
    if (config.format === 'currency' && displayValue) {
      displayValue = `KSh ${Number(displayValue).toLocaleString()}`;
    } else if (config.format === 'date' && displayValue) {
      displayValue = formatDate(displayValue);
    } else if (config.format === 'time' && displayValue) {
      displayValue = formatTime(displayValue);
    }
    
    return (
      <View style={[styles.displayField, config.style === 'highlight' && styles.highlightField]}>
        <Text style={[
          styles.displayText,
          config.style === 'highlight' && styles.highlightText
        ]}>
          {displayValue || config.content || '-'}
        </Text>
      </View>
    );
  };

  const renderCustomComponent = () => {
    // Placeholder for custom components
    switch (config.component) {
      case 'PremiumBreakdown':
        return renderPremiumBreakdown();
      case 'PaymentGateway':
        return renderPaymentGateway();
      case 'AddonsSelector':
        return renderAddonsSelector();
      case 'ReceiptHeader':
        return renderReceiptHeader();
      case 'ReceiptActions':
        return renderReceiptActions();
      default:
        return <Text style={styles.placeholder}>Component: {config.component}</Text>;
    }
  };

  const renderPremiumBreakdown = () => {
    const breakdown = calculatedValues.premium_breakdown;
    if (!breakdown) return null;
    
    return (
      <View style={styles.premiumBreakdown}>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Base Premium</Text>
          <Text style={styles.breakdownValue}>KSh {breakdown.basePremium?.toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Training Levy</Text>
          <Text style={styles.breakdownValue}>KSh {breakdown.trainingLevy?.toFixed(2)}</Text>
        </View>
        {breakdown.pcfLevy !== undefined && (
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>PCF Levy</Text>
            <Text style={styles.breakdownValue}>KSh {Number(breakdown.pcfLevy).toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.breakdownItem}>
          <Text style={styles.breakdownLabel}>Stamp Duty</Text>
          <Text style={styles.breakdownValue}>KSh {breakdown.stampDuty}</Text>
        </View>
        <View style={[styles.breakdownItem, styles.totalItem]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>KSh {breakdown.total?.toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  // Helper functions
  const getKeyboardType = () => {
    switch (config.type) {
      case FIELD_TYPES.EMAIL:
        return 'email-address';
      case FIELD_TYPES.PHONE:
        return 'phone-pad';
      case FIELD_TYPES.NUMBER:
        return 'numeric';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString();
  };

  const showDropdownModal = useCallback(() => {
    setShowDropdown(true);
  }, []);

  const hideDropdownModal = useCallback(() => {
    setShowDropdown(false);
  }, []);

  const selectDropdownOption = useCallback((option) => {
    onValueChange(option);
    setShowDropdown(false);
  }, [onValueChange]);

  const showDatePicker = useCallback(() => {
    setShowDateModal(true);
    if (value) {
      setTempDate(new Date(value));
    } else {
      setTempDate(new Date());
    }
  }, [value]);

  const hideDatePicker = useCallback(() => {
    setShowDateModal(false);
  }, []);

  const selectDate = useCallback(() => {
    const selectedDate = tempDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    onValueChange(selectedDate);
    setShowDateModal(false);
  }, [tempDate, onValueChange]);

  // Dynamic vehicle models based on make - defined before useMemo
  const getVehicleModels = (make) => {
    const modelMap = {
      'Toyota': ['Corolla', 'Camry', 'RAV4', 'Prado', 'Hilux', 'Vitz', 'Probox', 'Succeed'],
      'Nissan': ['X-Trail', 'Note', 'Tiida', 'Wingroad', 'AD Van', 'Patrol', 'Navara'],
      'Mazda': ['Demio', 'Axela', 'CX-5', 'Atenza', 'Familia', 'Tribute'],
      'Honda': ['Fit', 'Civic', 'CR-V', 'Accord', 'Stream', 'Stepwgn'],
      'Subaru': ['Forester', 'Legacy', 'Impreza', 'Outback', 'XV'],
      'Mitsubishi': ['Outlander', 'Lancer', 'Pajero', 'L200', 'Colt'],
      'Other': ['Please specify model']
    };
    
    return modelMap[make] || [];
  };

  // Get options for dropdown fields - memoized for performance  
  const fieldOptions = useMemo(() => {
    if (config.options) {
      return config.options;
    }
    
    // Handle dependent fields
    if (config.dependsOn && formData) {
      const dependentValue = formData[config.dependsOn];
      
      if (name === 'vehicle_model') {
        if (dependentValue) {
          return getVehicleModels(dependentValue);
        } else {
          return ['Please select vehicle make first'];
        }
      }
    }
    
    // Fallback for vehicle_model if no dependency system
    if (name === 'vehicle_model') {
      return ['Please select vehicle make first'];
    }
    
    return [];
  }, [config.options, config.dependsOn, formData?.[config.dependsOn], name]); // More specific dependencies

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    // Generate next 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const createDatePicker = () => {
    const dates = generateDateOptions();
    const today = new Date();
    
    // Create month groups for better navigation
    const monthGroups = {};
    dates.forEach(date => {
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(date);
    });

    return Object.entries(monthGroups).map(([monthName, monthDates]) => ({
      monthName,
      dates: monthDates
    }));
  };

  const datePickerData = useMemo(() => createDatePicker(), []);

  const handleFileUpload = () => {
    // Simulate file selection and trigger background processing
    const mockFile = {
      uri: 'mock://document.jpg',
      type: 'image/jpeg',
      name: `${name}_document.jpg`,
      timestamp: new Date().toISOString()
    };
    
    // Update field value
    onValueChange(mockFile);
    
    // Trigger background processing
    if (onFileUpload) {
      onFileUpload(mockFile);
    }
    
    console.log('File uploaded for:', name, 'Background processing started');
  };

  if (!config) {
    return null;
  }

  return (
    <View style={[
      styles.fieldContainer,
      isProcessing && styles.fieldProcessing
    ]}>
      {config.label && (
        <Text style={styles.fieldLabel}>
          {config.label}
          {config.required && <Text style={styles.required}> *</Text>}
          {isProcessing && <Text style={styles.processingIndicator}> ⚡</Text>}
        </Text>
      )}
      
      {renderFieldContent()}
      
      {/* Subtle processing hint */}
      {serviceHints.dmvicProcessing && name === 'vehicle_registration' && (
        <Text style={styles.processingHint}>Checking DMVIC database...</Text>
      )}
      {serviceHints.textractProcessing && config.type === FIELD_TYPES.FILE_UPLOAD && (
        <Text style={styles.processingHint}>Processing document...</Text>
      )}
      
      {config.validation?.message && value && !isValidValue(value) && (
        <Text style={styles.errorText}>{config.validation.message}</Text>
      )}

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={hideDropdownModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{config.label}</Text>
              <TouchableOpacity onPress={hideDropdownModal}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {fieldOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    value === option && styles.selectedOption
                  ]}
                  onPress={() => selectDropdownOption(option)}
                >
                  <Text style={[
                    styles.optionText,
                    value === option && styles.selectedOptionText
                  ]}>
                    {option}
                  </Text>
                  {value === option && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={hideDatePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {config.label}</Text>
              <TouchableOpacity onPress={hideDatePicker}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {datePickerData.map((monthGroup, groupIndex) => (
                <View key={groupIndex}>
                  <Text style={styles.monthHeader}>{monthGroup.monthName}</Text>
                  {monthGroup.dates.map((date, dateIndex) => (
                    <TouchableOpacity
                      key={dateIndex}
                      style={[
                        styles.optionItem,
                        tempDate.toDateString() === date.toDateString() && styles.selectedOption
                      ]}
                      onPress={() => setTempDate(date)}
                    >
                      <Text style={[
                        styles.optionText,
                        tempDate.toDateString() === date.toDateString() && styles.selectedOptionText
                      ]}>
                        {formatDateForDisplay(date)}
                      </Text>
                      {tempDate.toDateString() === date.toDateString() && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.datePickerButtons}>
              <TouchableOpacity style={styles.dateButton} onPress={hideDatePicker}>
                <Text style={styles.dateButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateButton, styles.confirmButton]} onPress={selectDate}>
                <Text style={[styles.dateButtonText, styles.confirmButtonText]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const isValidValue = (value) => {
  // Add validation logic here
  return true;
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 20,
  },
  fieldProcessing: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFA500',
    paddingLeft: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  processingIndicator: {
    color: '#FFA500',
    fontSize: 12,
  },
  processingHint: {
    fontSize: 12,
    color: '#FFA500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  required: {
    color: '#D5222B',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  readOnlyInput: {
    backgroundColor: '#f9f9f9',
    color: '#666',
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D5222B',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#D5222B',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D5222B',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  dateIcon: {
    fontSize: 16,
  },
  fileUploadContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: 'white',
  },
  uploadButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  requiredFilesContainer: {
    marginTop: 10,
  },
  requiredFilesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  requiredFileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  requiredFileText: {
    fontSize: 14,
    color: '#666',
  },
  fileStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileUploaded: {
    color: '#4CAF50',
  },
  filePending: {
    color: '#ddd',
  },
  displayField: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  highlightField: {
    backgroundColor: '#fff3e0',
    borderColor: '#D5222B',
  },
  displayText: {
    fontSize: 16,
    color: '#333',
  },
  highlightText: {
    fontWeight: 'bold',
    color: '#D5222B',
  },
  premiumBreakdown: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalItem: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#D5222B',
    marginTop: 8,
    paddingTop: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D5222B',
  },
  readOnlyRadio: {
    opacity: 0.6,
  },
  readOnlyText: {
    color: '#666',
  },
  errorText: {
    color: '#D5222B',
    fontSize: 12,
    marginTop: 5,
  },
  placeholder: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    textAlign: 'center',
    color: '#666',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#F8F9FA',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#D5222B',
  },
  checkmark: {
    fontSize: 16,
    color: '#D5222B',
    fontWeight: 'bold',
  },
  monthHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D5222B',
    backgroundColor: '#F8F9FA',
    padding: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dateButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#D5222B',
    borderColor: '#D5222B',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default FormField;