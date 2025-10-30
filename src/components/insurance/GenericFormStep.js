import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  FormInput, 
  RadioGroup, 
  FormDatePicker, 
  SelectorCard 
} from './components';
import { FIELD_TYPES, shouldShowField } from './config';

const GenericFormStep = ({
  stepConfig,
  fields = [],
  formData,
  onUpdateFormData,
  errors = {},
  availableInsurers = [],
  onDocumentSelect,
  showHeader = true,
  style
}) => {
  
  const renderField = (field) => {
    // Check if field should be displayed based on conditions
    if (!shouldShowField(field, formData)) {
      return null;
    }
    
    const fieldProps = {
      value: formData[field.name],
      error: errors[field.name],
      required: field.required,
      onChangeText: (value) => onUpdateFormData({ [field.name]: value }),
      ...field
    };
    
    switch (field.type) {
      case FIELD_TYPES.TEXT:
      case FIELD_TYPES.EMAIL:
      case FIELD_TYPES.PHONE:
      case FIELD_TYPES.NUMBER:
        return (
          <FormInput
            key={field.name}
            {...fieldProps}
            onChangeText={(value) => onUpdateFormData({ [field.name]: value })}
          />
        );
        
      case FIELD_TYPES.TEXTAREA:
        return (
          <FormInput
            key={field.name}
            {...fieldProps}
            multiline={true}
            numberOfLines={field.numberOfLines || 4}
            onChangeText={(value) => onUpdateFormData({ [field.name]: value })}
          />
        );
        
      case FIELD_TYPES.DATE:
        return (
          <FormDatePicker
            key={field.name}
            {...fieldProps}
            onDateChange={(value) => onUpdateFormData({ [field.name]: value })}
          />
        );
        
      case FIELD_TYPES.RADIO:
        return (
          <RadioGroup
            key={field.name}
            {...fieldProps}
            selectedValue={formData[field.name]}
            onValueChange={(value) => onUpdateFormData({ [field.name]: value })}
            options={field.options}
          />
        );
        
      case FIELD_TYPES.SELECT:
        return (
          <SelectorCard
            key={field.name}
            {...fieldProps}
            options={availableInsurers}
            selectedValue={formData[field.name]}
            onValueChange={(value) => onUpdateFormData({ [field.name]: value })}
          />
        );
        
      case FIELD_TYPES.DOCUMENT:
        return renderDocumentField(field);
        
      default:
        return null;
    }
  };
  
  const renderDocumentField = (field) => {
    const documentStatus = formData.documents?.[field.name.replace('Document', '')];
    
    return (
      <View key={field.name} style={styles.documentField}>
        <Text style={styles.documentLabel}>
          {field.label} {field.required && <Text style={styles.required}>*</Text>}
        </Text>
        
        <TouchableOpacity
          style={[
            styles.documentButton,
            documentStatus?.status === 'uploaded' && styles.documentButtonUploaded,
            errors[field.name] && styles.documentButtonError
          ]}
          onPress={() => onDocumentSelect && onDocumentSelect(field.name.replace('Document', ''))}
        >
          <View style={styles.documentButtonContent}>
            <Ionicons 
              name={documentStatus?.status === 'uploaded' ? 'checkmark-circle' : 'cloud-upload-outline'} 
              size={24} 
              color={documentStatus?.status === 'uploaded' ? '#10B981' : '#6B7280'} 
            />
            <View style={styles.documentButtonText}>
              <Text style={[
                styles.documentButtonTitle,
                documentStatus?.status === 'uploaded' && styles.documentButtonTitleUploaded
              ]}>
                {documentStatus?.status === 'uploaded' ? 'Uploaded' : `Upload ${field.label}`}
              </Text>
              <Text style={styles.documentButtonSubtitle}>
                {documentStatus?.status === 'uploaded' ? documentStatus.fileName : 'Tap to select file'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {errors[field.name] && (
          <Text style={styles.errorText}>{errors[field.name]}</Text>
        )}
      </View>
    );
  };
  
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {showHeader && stepConfig && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{stepConfig.title}</Text>
          <Text style={styles.headerSubtitle}>{stepConfig.subtitle}</Text>
        </View>
      )}
      
      {/* Warning for existing cover */}
      {fields.some(field => field.name === 'hasExistingCover') && (
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            If you currently have motor insurance, please ensure to cancel it before starting your new policy to avoid double charges.
          </Text>
        </View>
      )}
      
      {/* Render all fields */}
      {fields.map(renderField)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    marginBottom: 24,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  documentField: {
    marginBottom: 16,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  documentButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  documentButtonUploaded: {
    borderColor: '#10B981',
    borderStyle: 'solid',
    backgroundColor: '#F0FDF4',
  },
  documentButtonError: {
    borderColor: '#EF4444',
  },
  documentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  documentButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  documentButtonTitleUploaded: {
    color: '#065F46',
  },
  documentButtonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
});

export default GenericFormStep;