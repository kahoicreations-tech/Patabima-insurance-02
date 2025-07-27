import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SpecialPersonalInformationStep,
  SpecialVehicleDetailsStep,
  SpecialInsurerSelectionStep,
  SpecialDocumentUploadStep
} from './components';

const SpecialThirdPartyScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Pre-set basic third party coverage
    coverageType: 'basic',
    deductibleAmount: '50000',
    additionalCoverage: ['operator_liability', 'third_party_property'],
    riskLevel: 'medium',
    estimatedPremium: 45000 // Base third party premium for special equipment
  });

  const totalSteps = 4;
  const stepTitles = [
    'Personal Information',
    'Equipment Details',
    'Select Insurer',
    'Upload Documents'
  ];

  const handleDataChange = (stepData) => {
    setFormData(prevData => ({
      ...prevData,
      ...stepData
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleComplete = () => {
    Alert.alert(
      'Application Complete',
      'Your special equipment third party insurance application has been submitted successfully. We will process your application and contact you within 1-2 business days.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to quotations list or dashboard
            navigation.navigate('Quotations');
          }
        }
      ]
    );
  };

  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      onDataChange: handleDataChange,
      onNext: handleNext,
      onPrevious: currentStep > 1 ? handlePrevious : null,
      currentStep,
      totalSteps
    };

    switch (currentStep) {
      case 1:
        return <SpecialPersonalInformationStep {...stepProps} />;
      case 2:
        return <SpecialVehicleDetailsStep {...stepProps} />;
      case 3:
        return <SpecialInsurerSelectionStep {...stepProps} />;
      case 4:
        return <SpecialDocumentUploadStep {...stepProps} />;
      default:
        return null;
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <View key={stepNumber} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              isActive && styles.activeStep,
              isCompleted && styles.completedStep
            ]}>
              <Text style={[
                styles.stepText,
                (isActive || isCompleted) && styles.activeStepText
              ]}>
                {stepNumber}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              isActive && styles.activeStepLabel
            ]}>
              {stepTitles[index]}
            </Text>
            {stepNumber < totalSteps && (
              <View style={[
                styles.stepConnector,
                isCompleted && styles.completedConnector
              ]} />
            )}
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Special Equipment Insurance</Text>
        <Text style={styles.headerSubtitle}>Third Party Coverage</Text>
        
        {/* Coverage Info */}
        <View style={styles.coverageInfo}>
          <View style={styles.coverageCard}>
            <Text style={styles.coverageTitle}>Third Party Coverage Includes:</Text>
            <View style={styles.coverageList}>
              <Text style={styles.coverageItem}>• Third party liability protection</Text>
              <Text style={styles.coverageItem}>• Operator liability coverage</Text>
              <Text style={styles.coverageItem}>• Property damage protection</Text>
              <Text style={styles.coverageItem}>• Legal compliance for specialized equipment</Text>
            </View>
            <View style={styles.premiumDisplay}>
              <Text style={styles.premiumLabel}>Estimated Premium:</Text>
              <Text style={styles.premiumAmount}>From KES 45,000/year</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Current Step Content */}
      <View style={styles.stepContent}>
        {renderCurrentStep()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  coverageInfo: {
    width: '100%',
  },
  coverageCard: {
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#D5222B',
  },
  coverageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  coverageList: {
    marginBottom: 12,
  },
  coverageItem: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  premiumDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  premiumLabel: {
    fontSize: 12,
    color: '#666',
  },
  premiumAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D5222B',
  },
  stepIndicator: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeStep: {
    backgroundColor: '#D5222B',
  },
  completedStep: {
    backgroundColor: '#4CAF50',
  },
  stepText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  activeStepText: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    lineHeight: 12,
  },
  activeStepLabel: {
    color: '#D5222B',
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    top: 15,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#e0e0e0',
    zIndex: -1,
  },
  completedConnector: {
    backgroundColor: '#4CAF50',
  },
  stepContent: {
    flex: 1,
  },
});

export default SpecialThirdPartyScreen;
