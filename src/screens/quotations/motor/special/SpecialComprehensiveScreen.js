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
  SpecialVehicleValueStep,
  SpecialInsurerSelectionStep,
  SpecialDocumentUploadStep
} from './components';

const SpecialComprehensiveScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});

  const totalSteps = 5;
  const stepTitles = [
    'Personal Information',
    'Equipment Details',
    'Value & Coverage',
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
      'Your special equipment insurance application has been submitted successfully. We will review your application and contact you within 2-3 business days.',
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
        return <SpecialVehicleValueStep {...stepProps} />;
      case 4:
        return <SpecialInsurerSelectionStep {...stepProps} />;
      case 5:
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
        <Text style={styles.headerSubtitle}>Comprehensive Coverage</Text>
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

export default SpecialComprehensiveScreen;
