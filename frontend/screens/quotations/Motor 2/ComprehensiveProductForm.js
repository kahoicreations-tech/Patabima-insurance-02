import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import step components
import PolicyDetailsStep from './MotorInsuranceFlow/Comprehensive/PolicyDetailsStep';
import UnderwriterSelectionStep from './MotorInsuranceFlow/Comprehensive/UnderwriterSelectionStep';
import AddonSelectionStep from './MotorInsuranceFlow/AddonsSelection/AddonSelectionStep';

export default function ComprehensiveProductForm({ 
  values, 
  onChange, 
  additional, 
  onChangeAdditional, 
  errors,
  selectedProduct,
  onComplete
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUnderwriter, setSelectedUnderwriter] = useState(null);
  
  const steps = [
    { id: 1, title: 'Policy Details', description: 'Vehicle & coverage information' },
    { id: 2, title: 'Underwriter Selection', description: 'Compare pricing options' },
    { id: 3, title: 'Add-ons Selection', description: 'Optional coverage enhancements' }
  ];

  const currentStepInfo = steps.find(step => step.id === currentStep);

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  // Back navigation removed per user request

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Check if required vehicle details are filled
        return values?.sum_insured && values?.registration_number;
      case 2:
        // Check if underwriter is selected
        return selectedUnderwriter;
      case 3:
        // Add-ons are optional, can always proceed
        return true;
      default:
        return false;
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <View style={styles.progressStep}>
              <View style={[
                styles.progressCircle,
                currentStep >= step.id && styles.progressCircleActive,
                currentStep === step.id && styles.progressCircleCurrent
              ]}>
                <Text style={[
                  styles.progressNumber,
                  currentStep >= step.id && styles.progressNumberActive
                ]}>
                  {step.id}
                </Text>
              </View>
              <Text style={styles.progressLabel}>{step.title}</Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                currentStep > step.id && styles.progressLineActive
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PolicyDetailsStep
            values={values}
            onChange={onChange}
            errors={errors}
            selectedProduct={selectedProduct}
          />
        );
      
      case 2:
        return (
          <UnderwriterSelectionStep
            vehicleData={values}
            selectedProduct={selectedProduct}
            selectedUnderwriter={selectedUnderwriter}
            onUnderwriterSelect={setSelectedUnderwriter}
          />
        );
      
      case 3:
        return (
          <AddonSelectionStep
            selectedProduct={selectedProduct}
            vehicleData={values}
            underwriter={selectedUnderwriter}
            selectedAddons={additional?.selectedAddons || []}
            onAddonsChange={(addons) => {
              if (onChangeAdditional) {
                onChangeAdditional({ ...additional, selectedAddons: addons });
              }
            }}
          />
        );
      
      default:
        return null;
    }
  };

  const renderNavigationButtons = () => (
    <View style={styles.navigationContainer}>
      {/* Back navigation removed per user request */}
      <TouchableOpacity
        style={[
          styles.navButton,
          styles.nextButton,
          !canProceed() && styles.disabledButton,
          { flex: 1 } // Full width since no back button
        ]}
        onPress={handleNextStep}
        disabled={!canProceed()}
      >
        <Text style={[styles.navButtonText, styles.nextButtonText, !canProceed() && styles.disabledText]}>
          {currentStep === steps.length ? 'Complete' : 'Next'}
        </Text>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={!canProceed() ? "#999" : "#fff"} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Comprehensive Cover</Text>
        <Text style={styles.subtitle}>{currentStepInfo?.description}</Text>
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Step Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      {renderNavigationButtons()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  progressContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: '#D5222B',
  },
  progressCircleCurrent: {
    backgroundColor: '#D5222B',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#D5222B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins-SemiBold',
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  progressLine: {
    height: 2,
    backgroundColor: '#e9ecef',
    flex: 1,
    marginHorizontal: 8,
    marginTop: -16,
  },
  progressLineActive: {
    backgroundColor: '#D5222B',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
  },
  backButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  nextButton: {
    backgroundColor: '#D5222B',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  backButtonText: {
    color: '#666',
  },
  nextButtonText: {
    color: '#fff',
  },
  disabledText: {
    color: '#999',
  },
});
