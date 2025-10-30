/**
 * Enhanced FormEngine with Template Support
 * 
 * A comprehensive form engine that works with the template system to render
 * dynamic, multi-step insurance forms with validation and document upload.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { FIELD_TYPES } from './templates/FieldTemplates';
import { 
  generateDefaultFormData, 
  updateFormConfigWithData, 
  validateFormData,
  resolveConditionalFields
} from './templates/FormGenerator';

const FormEngine = ({ 
  config,
  navigation,
  route,
  onSubmit,
  onStepChange,
  showProgressBar = true,
  enableValidation = true,
  enableDocumentUpload = true,
  customComponents = {},
  initialData = {}
}) => {
  
  // Initialize form data with defaults and any initial data
  const [formData, setFormData] = useState(() => {
    const defaultData = generateDefaultFormData(config);
    return { ...defaultData, ...initialData };
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [uploading, setUploading] = useState({});
  
  // Update form config when data changes (for conditional fields)
  const [dynamicConfig, setDynamicConfig] = useState(config);
  
  const scrollViewRef = useRef(null);

  // Update dynamic configuration when form data changes
  useEffect(() => {
    const updatedConfig = updateFormConfigWithData(config, formData);
    setDynamicConfig(updatedConfig);
  }, [formData, config]);

  // Handle field value changes
  const handleFieldChange = (fieldId, value) => {
    const newFormData = { ...formData, [fieldId]: value };
    setFormData(newFormData);
    
    // Clear field error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Validate current step
  const validateCurrentStep = () => {
    if (!enableValidation) return true;
    
    const currentStepConfig = dynamicConfig.steps[currentStep];
    const stepFields = resolveConditionalFields(currentStepConfig.fields, formData);
    
    const stepErrors = {};
    let isValid = true;
    
    stepFields.forEach(field => {
      const value = formData[field.id];
      
      // Required field validation
      if (field.required && (!value || value === '')) {
        stepErrors[field.id] = [`${field.label} is required`];
        isValid = false;
      }
      
      // Pattern validation
      if (value && field.validation && field.validation.pattern) {
        if (!field.validation.pattern.test(value)) {
          stepErrors[field.id] = [field.validation.message || `Invalid ${field.label} format`];
          isValid = false;
        }
      }
    });
    
    setErrors(stepErrors);
    return isValid;
  };

  // Navigate to next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      if (onStepChange) {
        onStepChange(nextStep, formData);
      }
      
      // Scroll to top of next step
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    
    if (onStepChange) {
      onStepChange(prevStep, formData);
    }
    
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    // Final validation of entire form
    const validation = validateFormData(dynamicConfig, formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please check all required fields and try again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      Alert.alert('Submission Error', 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (fieldId) => {
    if (!enableDocumentUpload) return;
    
    setUploading(prev => ({ ...prev, [fieldId]: true }));
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        handleFieldChange(fieldId, {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
          size: file.size
        });
      }
    } catch (error) {
      console.error('Document upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (fieldId) => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => takePhoto(fieldId) },
        { text: 'Gallery', onPress: () => pickImage(fieldId) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async (fieldId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    setUploading(prev => ({ ...prev, [fieldId]: true }));

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        handleFieldChange(fieldId, {
          uri: asset.uri,
          name: `camera_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const pickImage = async (fieldId) => {
    setUploading(prev => ({ ...prev, [fieldId]: true }));

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        handleFieldChange(fieldId, {
          uri: asset.uri,
          name: `gallery_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Image Error', 'Failed to pick image. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  // Render field based on type
  const renderField = (field) => {
    const value = formData[field.id] || '';
    const hasError = errors[field.id];
    const isUploading = uploading[field.id];

    // Check if field should be rendered (conditional logic)
    const shouldRender = !field.conditional || resolveConditionalFields([field], formData).length > 0;
    
    if (!shouldRender) return null;

    // Use custom component if provided
    if (customComponents[field.type]) {
      const CustomComponent = customComponents[field.type];
      return (
        <CustomComponent
          key={field.id}
          field={field}
          value={value}
          onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          error={hasError}
        />
      );
    }

    return (
      <View key={field.id} style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>
        
        {renderFieldInput(field, value, hasError, isUploading)}
        
        {hasError && (
          <Text style={styles.errorText}>{hasError[0]}</Text>
        )}
      </View>
    );
  };

  // Render specific field input based on type
  const renderFieldInput = (field, value, hasError, isUploading) => {
    const inputStyle = [
      styles.input,
      hasError && styles.inputError
    ];

    switch (field.type) {
      case FIELD_TYPES.TEXT:
      case FIELD_TYPES.EMAIL:
      case FIELD_TYPES.PHONE:
      case FIELD_TYPES.NUMBER:
        return (
          <TextInput
            style={inputStyle}
            value={value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder}
            keyboardType={getKeyboardType(field.type)}
            autoCapitalize={field.type === FIELD_TYPES.EMAIL ? 'none' : 'words'}
            multiline={field.multiline}
            numberOfLines={field.numberOfLines}
          />
        );

      case FIELD_TYPES.SELECT:
        return (
          <View style={[styles.pickerContainer, hasError && styles.inputError]}>
            <Picker
              selectedValue={value}
              onValueChange={(itemValue) => handleFieldChange(field.id, itemValue)}
              style={styles.picker}
            >
              <Picker.Item label={`Select ${field.label}`} value="" />
              {field.options.map(option => (
                <Picker.Item
                  key={option}
                  label={option}
                  value={option}
                />
              ))}
            </Picker>
          </View>
        );

      case FIELD_TYPES.RADIO:
        return (
          <View style={styles.radioContainer}>
            {field.options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.radioOption}
                onPress={() => handleFieldChange(field.id, option.value)}
              >
                <View style={[
                  styles.radioCircle,
                  value === option.value && styles.radioSelected
                ]} />
                <Text style={styles.radioLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case FIELD_TYPES.DATE:
        return (
          <>
            <TouchableOpacity
              style={inputStyle}
              onPress={() => setShowDatePicker(field.id)}
            >
              <Text style={[styles.dateText, !value && styles.placeholder]}>
                {value ? new Date(value).toLocaleDateString() : field.placeholder || 'Select Date'}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker === field.id && (
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(null);
                  if (selectedDate) {
                    handleFieldChange(field.id, selectedDate.toISOString().split('T')[0]);
                  }
                }}
                minimumDate={field.minDate ? new Date(field.minDate) : undefined}
                maximumDate={field.maxDate ? new Date(field.maxDate) : undefined}
              />
            )}
          </>
        );

      case FIELD_TYPES.DOCUMENT:
        return (
          <View>
            <TouchableOpacity
              style={[styles.uploadButton, hasError && styles.uploadButtonError]}
              onPress={() => handleDocumentUpload(field.id)}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.uploadButtonText}>
                  {value ? 'Change Document' : `Upload ${field.label}`}
                </Text>
              )}
            </TouchableOpacity>
            
            {value && value.uri && (
              <View style={styles.uploadedFile}>
                <Text style={styles.fileName}>{value.name}</Text>
                {value.type && value.type.startsWith('image/') && (
                  <Image source={{ uri: value.uri }} style={styles.uploadedImage} />
                )}
              </View>
            )}
          </View>
        );

      case FIELD_TYPES.CURRENCY:
        return (
          <View style={styles.currencyContainer}>
            <Text style={styles.currencySymbol}>KSh</Text>
            <TextInput
              style={[styles.currencyInput, hasError && styles.inputError]}
              value={value}
              onChangeText={(text) => handleFieldChange(field.id, text)}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
        );

      default:
        return (
          <TextInput
            style={inputStyle}
            value={value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  // Get keyboard type for different field types
  const getKeyboardType = (fieldType) => {
    switch (fieldType) {
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

  // Render progress bar
  const renderProgressBar = () => {
    if (!showProgressBar || dynamicConfig.steps.length <= 1) return null;
    
    const progress = ((currentStep + 1) / dynamicConfig.steps.length) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {dynamicConfig.steps.length}
        </Text>
      </View>
    );
  };

  // Render navigation buttons
  const renderNavigationButtons = () => {
    const isLastStep = currentStep === dynamicConfig.steps.length - 1;
    
    return (
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.previousButton]}
            onPress={handlePrevious}
            disabled={isSubmitting}
          >
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.nextButton,
            currentStep === 0 && styles.fullWidthButton
          ]}
          onPress={isLastStep ? handleSubmit : handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Submit' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Get current step configuration
  const currentStepConfig = dynamicConfig.steps[currentStep];
  
  if (!currentStepConfig) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid step configuration</Text>
      </View>
    );
  }

  // Get visible fields for current step
  const visibleFields = resolveConditionalFields(currentStepConfig.fields, formData);

  return (
    <View style={styles.container}>
      {renderProgressBar()}
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{currentStepConfig.title}</Text>
          
          {currentStepConfig.description && (
            <Text style={styles.stepDescription}>{currentStepConfig.description}</Text>
          )}
          
          <View style={styles.fieldsContainer}>
            {visibleFields.map(field => renderField(field))}
          </View>
        </View>
      </ScrollView>
      
      {renderNavigationButtons()}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D5222B',
    borderRadius: 3
  },
  progressText: {
    fontSize: 12,
    color: '#646767',
    textAlign: 'center'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8
  },
  stepDescription: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 20
  },
  fieldsContainer: {
    gap: 15
  },
  fieldContainer: {
    marginBottom: 15
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8
  },
  required: {
    color: '#D5222B'
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF'
  },
  inputError: {
    borderColor: '#D5222B'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF'
  },
  picker: {
    height: 50
  },
  radioContainer: {
    gap: 10
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 10
  },
  radioSelected: {
    borderColor: '#D5222B',
    backgroundColor: '#D5222B'
  },
  radioLabel: {
    fontSize: 16,
    color: '#333333'
  },
  dateText: {
    fontSize: 16,
    color: '#333333',
    paddingVertical: 12
  },
  placeholder: {
    color: '#999999'
  },
  uploadButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center'
  },
  uploadButtonError: {
    backgroundColor: '#E74C3C'
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  uploadedFile: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 8
  },
  fileName: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 8
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF'
  },
  currencySymbol: {
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#646767',
    fontWeight: '600'
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 15,
    fontSize: 16,
    borderWidth: 0
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 15
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  fullWidthButton: {
    flex: 1
  },
  previousButton: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  previousButtonText: {
    color: '#646767',
    fontSize: 16,
    fontWeight: '600'
  },
  nextButton: {
    backgroundColor: '#D5222B'
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    color: '#D5222B',
    fontSize: 14,
    marginTop: 5
  }
});

export default FormEngine;