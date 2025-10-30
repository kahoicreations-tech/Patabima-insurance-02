/**
 * TOR Quotation Flow Screen - Complete Self-Contained Implementation
 * 
 * This file contains EVERYTHING needed for TOR insurance:
 * - Form configuration and data structure
 * - UI rendering and form management
 * - Validation and step navigation
 * - All TOR-specific business logic
 */

import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FormEngine from '../../../../components/insurance/FormEngine';

// =============================================================================
// TOR INSURANCE CONFIGURATION (Moved from torInsuranceConfig.js)
// =============================================================================

const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  DATE: 'date',
  RADIO: 'radio',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  DOCUMENT: 'document',
  DOCUMENT_UPLOAD: 'document'
};

/**
 * TOR INSURANCE COMPLETE CONFIGURATION
 * Three-step process: Policy Details → Client Details → KYC Documents
 */
const TOR_INSURANCE_CONFIG = {
  // STEP 1: POLICY DETAILS
  1: {
    title: 'Policy Details',
    subtitle: 'Enter vehicle and policy information',
    fields: [
      {
        name: 'vehicleRegistrationMethod',
        label: 'Registration Method',
        type: FIELD_TYPES.RADIO,
        required: true,
        options: [
          { label: 'Registered Vehicle', value: 'registered' },
          { label: 'Use Chassis Number', value: 'chassis' }
        ]
      },
      {
        name: 'registrationNumber',
        label: 'Registration Number',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'e.g. KCA 123A',
        condition: { field: 'vehicleRegistrationMethod', value: 'registered' }
      },
      {
        name: 'chassisNumber',
        label: 'Chassis Number',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'Enter chassis number',
        condition: { field: 'vehicleRegistrationMethod', value: 'chassis' }
      },
      {
        name: 'vehicleMake',
        label: 'Vehicle Make',
        type: FIELD_TYPES.SELECT,
        required: true,
        placeholder: 'Select vehicle make',
        options: [
          { label: 'Toyota', value: 'Toyota' },
          { label: 'Nissan', value: 'Nissan' },
          { label: 'Mitsubishi', value: 'Mitsubishi' },
          { label: 'Mazda', value: 'Mazda' },
          { label: 'Honda', value: 'Honda' },
          { label: 'Subaru', value: 'Subaru' },
          { label: 'Suzuki', value: 'Suzuki' },
          { label: 'Mercedes Benz', value: 'Mercedes Benz' },
          { label: 'BMW', value: 'BMW' },
          { label: 'Audi', value: 'Audi' },
          { label: 'Volkswagen', value: 'Volkswagen' },
          { label: 'Isuzu', value: 'Isuzu' },
          { label: 'Ford', value: 'Ford' },
          { label: 'Hyundai', value: 'Hyundai' },
          { label: 'KIA', value: 'KIA' },
          { label: 'Volvo', value: 'Volvo' },
          { label: 'Land Rover', value: 'Land Rover' },
          { label: 'Peugeot', value: 'Peugeot' },
          { label: 'Other', value: 'Other' }
        ]
      },
      {
        name: 'vehicleModel',
        label: 'Vehicle Model',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'e.g. Corolla'
      },
      {
        name: 'vehicleYear',
        label: 'Year of Manufacture',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'e.g. 2020'
      },
      {
        name: 'vehicleValue',
        label: 'Vehicle Value (KES)',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'e.g. 1500000'
      },
      {
        name: 'engineNumber',
        label: 'Engine Number',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: 'Enter engine number'
      },
      {
        name: 'vehicleUsage',
        label: 'Vehicle Usage',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: [
          { label: 'Private Use', value: 'private' },
          { label: 'Commercial Use', value: 'commercial' },
          { label: 'Taxi/PSV', value: 'taxi' }
        ]
      },
      {
        name: 'hasFinancialInterest',
        label: 'Financial Interest',
        type: FIELD_TYPES.RADIO,
        required: false,
        subtitle: 'Does anyone else have financial interest in this vehicle?',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        name: 'financierName',
        label: 'Financier Name',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'Enter financier name',
        condition: { field: 'hasFinancialInterest', value: true }
      },
      {
        name: 'selectedInsurer',
        label: 'Select Insurance Provider',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: [
          { label: 'Jubilee Insurance', value: 'jubilee' },
          { label: 'CIC Insurance', value: 'cic' },
          { label: 'APA Insurance', value: 'apa' },
          { label: 'ICEA LION', value: 'icea' },
          { label: 'Britam', value: 'britam' }
        ]
      }
    ]
  },

  // STEP 2: CLIENT DETAILS
  2: {
    title: 'Client Details',
    subtitle: 'Enter client personal information',
    fields: [
      {
        name: 'fullName',
        label: 'Full Name',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'Enter full name'
      },
      {
        name: 'nationalId',
        label: 'National ID Number',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'Enter national ID'
      },
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '+254 700 000 000'
      },
      {
        name: 'email',
        label: 'Email Address',
        type: FIELD_TYPES.EMAIL,
        required: true,
        placeholder: 'Enter email address'
      },
      {
        name: 'dateOfBirth',
        label: 'Date of Birth',
        type: FIELD_TYPES.DATE,
        required: true
      },
      {
        name: 'licenseNumber',
        label: 'Driving License Number',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: 'Enter license number'
      },
      {
        name: 'licenseIssueDate',
        label: 'License Issue Date',
        type: FIELD_TYPES.DATE,
        required: true
      },
      {
        name: 'hasExistingCover',
        label: 'Existing Insurance Cover',
        type: FIELD_TYPES.RADIO,
        required: false,
        subtitle: 'Do you have existing insurance cover?',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      },
      {
        name: 'existingCoverDetails',
        label: 'Existing Cover Details',
        type: FIELD_TYPES.TEXTAREA,
        required: true,
        placeholder: 'Provide details of existing cover',
        condition: { field: 'hasExistingCover', value: true }
      }
    ]
  },

  // STEP 3: KYC DOCUMENTS
  3: {
    title: 'KYC Documents',
    subtitle: 'Upload required documents',
    fields: [
      {
        name: 'documents.nationalId',
        label: 'National ID',
        type: FIELD_TYPES.DOCUMENT,
        required: true,
        placeholder: 'Upload National ID copy'
      },
      {
        name: 'documents.kraPin',
        label: 'KRA PIN Certificate',
        type: FIELD_TYPES.DOCUMENT,
        required: true,
        placeholder: 'Upload KRA PIN certificate'
      },
      {
        name: 'documents.logbook',
        label: 'Vehicle Logbook',
        type: FIELD_TYPES.DOCUMENT,
        required: true,
        placeholder: 'Upload vehicle logbook copy'
      }
    ]
  }
};

// =============================================================================
// TOR SCREEN COMPONENT
// =============================================================================

const TORQuotationFlowScreen = () => {
  const navigation = useNavigation();

  // Step labels for progress bar
  const TOR_STEP_LABELS = [
    'Policy Details',
    'Client Details', 
    'KYC Documents'
  ];

  const handleFormComplete = (formData) => {
    console.log('TOR Form completed with data:', formData);
    
    // Navigate to summary or confirmation screen
    navigation.navigate('QuotationSummary', { 
      quotationType: 'TOR',
      formData 
    });
  };

  const handleStepChange = (currentStep, formData) => {
    console.log(`TOR Step ${currentStep} data:`, formData);
    // Auto-save or track progress here
  };

  const renderCustomHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>TOR For Private</Text>
      <Text style={styles.successMessage}>
        🎉 SUCCESS! TOR Screen is Working! 🎉
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#D5222B" barStyle="light-content" />
      
      <FormEngine
        config={TOR_INSURANCE_CONFIG}
        stepLabels={TOR_STEP_LABELS}
        onComplete={handleFormComplete}
        onStepChange={handleStepChange}
        customHeader={renderCustomHeader()}
        showProgress={true}
        showStepHeaders={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#D5222B',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  successMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TORQuotationFlowScreen;