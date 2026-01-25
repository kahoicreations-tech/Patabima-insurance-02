/**
 * Step4_UnderwriterSelection - Comprehensive Flow
 * Displays underwriter comparison cards (similar to Third Party but with add-ons breakdown)
 */

import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useComprehensiveContext } from '../../contexts/ComprehensiveContext';
import StepNavigation from '../../third-party/steps/StepNavigation';
import Motor3Stepper from '../../components/Motor3Stepper';

const UnderwriterCard = React.memo(({ comparison, isSelected, onSelect }) => {
  // Safely extract values - service returns 'name' not 'underwriter_name'
  const underwriterName = comparison.name || comparison.underwriter_name || comparison.company || 'Unknown Provider';
  const totalPremium = Number(comparison.total_premium || comparison.premium || comparison.totalPremium) || 0;
  
  // Safely extract breakdown values with defaults
  const breakdown = comparison.breakdown || {};
  const basePremium = Number(comparison.base_premium || comparison.basePremium || breakdown.base_premium) || 0;
  const itl = breakdown.itl ?? breakdown.training_levy ?? breakdown.trainingLevy ?? 0;
  const pcf = breakdown.pcf ?? breakdown.pcf_levy ?? breakdown.pcfLevy ?? 0;
  const stampDuty = breakdown.stamp_duty ?? breakdown.stampDuty ?? 40;

  // If breakdown is missing but total exists, derive base + levies for display.
  const numericStamp = Number(stampDuty) || 40;
  const levyRate = 0.0025;
  const derivedBase = (!basePremium && totalPremium > numericStamp)
    ? (totalPremium - numericStamp) / (1 + 2 * levyRate)
    : 0;
  const displayBase = basePremium || (derivedBase > 0 ? derivedBase : 0);
  const displayItl = Number(itl) || (displayBase > 0 ? displayBase * levyRate : 0);
  const displayPcf = Number(pcf) || (displayBase > 0 ? displayBase * levyRate : 0);
  
  return (
    <TouchableOpacity 
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.underwriterName}>{underwriterName}</Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>
      
      <View style={styles.premiumRow}>
        <Text style={styles.premiumLabel}>Total Premium:</Text>
        <Text style={styles.premiumValue}>KSh {totalPremium.toLocaleString()}</Text>
      </View>

      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>Breakdown:</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Base Premium:</Text>
          <Text style={styles.breakdownValue}>KSh {Number(displayBase).toLocaleString()}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>ITL + PCF:</Text>
          <Text style={styles.breakdownValue}>
            KSh {Number(displayItl + displayPcf).toLocaleString()}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Stamp Duty:</Text>
          <Text style={styles.breakdownValue}>KSh {stampDuty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const Step4_UnderwriterSelection = ({ onNext, onBack, currentStep, totalSteps }) => {
  const { underwriters, selectedUnderwriter, setSelectedUnderwriter } = useComprehensiveContext();
  const [localSelected, setLocalSelected] = useState(selectedUnderwriter?.id || null);

  const handleSelect = (underwriter) => {
    setLocalSelected(underwriter.id);
    setSelectedUnderwriter(underwriter);
  };

  const validateAndProceed = () => {
    if (!localSelected) {
      Alert.alert('Selection Required', 'Please select an underwriter to proceed');
      return;
    }
    onNext();
  };

  if (!underwriters || underwriters.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No underwriters available</Text>
        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          hideNext
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Motor3Stepper currentStep={currentStep} totalSteps={totalSteps} />
      <FlatList
        data={underwriters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UnderwriterCard
            comparison={item}
            isSelected={localSelected === item.id}
            onSelect={() => handleSelect(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={validateAndProceed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#646767',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedCard: {
    borderColor: '#D5222B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  underwriterName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  checkmark: {
    fontSize: 24,
    color: '#D5222B',
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  premiumLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  premiumValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D5222B',
  },
  breakdown: {
    marginTop: 8,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#646767',
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#646767',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#333',
  },
});

export default Step4_UnderwriterSelection;
