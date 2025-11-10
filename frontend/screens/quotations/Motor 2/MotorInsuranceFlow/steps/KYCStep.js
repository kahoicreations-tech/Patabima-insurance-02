import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMotorInsurance } from '@contexts/MotorInsuranceContext';

export default function KYCStep() {
  const { state, actions } = useMotorInsurance();
  
  console.log('[KYCStep] 🔥 COMPONENT RENDER');
  console.log('[KYCStep] 🔥 state.existingCoverData:', JSON.stringify(state.existingCoverData, null, 2));
  console.log('[KYCStep] 🔥 state.minCoverStartDate:', state.minCoverStartDate);
  console.log('[KYCStep] 🔥 state.showVerificationScreen:', state.showVerificationScreen);

  // ✅ NEW: Auto-show verification modal ONLY if there's a date collision
  const hasShownModal = useRef(false);
  
  useEffect(() => {
    // Only run once
    if (hasShownModal.current) return;
    
    const selectedCoverDateStr = state.vehicleDetails?.cover_start_date || state.vehicleDetails?.coverStartDate;
    const minCoverStartDateStr = state.minCoverStartDate;
    
    // Check if there's a date collision (selected date is BEFORE minimum allowed)
    const isCollision = Boolean(
      minCoverStartDateStr && selectedCoverDateStr && new Date(selectedCoverDateStr) < new Date(minCoverStartDateStr)
    );
    
    // Check if there's existing cover data
    const hasExistingCover = state.existingCoverData?.hasExistingCover;
    
    console.log('[KYCStep] Mount check - Collision:', isCollision, 'HasExistingCover:', hasExistingCover);
    console.log('[KYCStep] Selected date:', selectedCoverDateStr, 'Min date:', minCoverStartDateStr);
    
    // ✅ CRITICAL FIX: Only show modal if there's a COLLISION
    // If user already selected a valid date (after minimum), don't block them
    if (isCollision && !state.showVerificationScreen) {
      console.log('[KYCStep] ⚠️ Date collision detected - opening verification modal');
      hasShownModal.current = true; // Mark as shown to prevent infinite loop
      actions.setShowVerificationScreen(true);
    } else if (hasExistingCover && !isCollision) {
      console.log('[KYCStep] ✅ Existing cover found but date is valid - user can proceed');
      // Don't show modal - user's selected date is already compliant
    }
  }, [state.minCoverStartDate, state.vehicleDetails?.cover_start_date, state.vehicleDetails?.coverStartDate, state.existingCoverData?.hasExistingCover, state.showVerificationScreen, actions]);

  // Get data from vehicle details or pricing inputs
  const vehicleData = state.vehicleDetails || {};
  const clientData = state.clientDetails || {};

  // Selected source comes from global flow state (backward compatible values)
  const selectedSource = state.clientDataSource || 'logbook'; // 'logbook' | 'national_id'
  const isLogbook = selectedSource === 'logbook';

  const handleSelectSource = (source) => {
    // Keep internal enum as 'logbook' | 'national_id' but display KRA PIN in UI
    actions?.setClientDataSource && actions.setClientDataSource(source);
  };

  // Client Details section data (from Logbook)
  const clientDetailsItems = useMemo(() => {
    if (isLogbook) {
      return [
        { label: 'Logbook', value: vehicleData.logbookNumber || 'Pending verification', verified: !!vehicleData.logbookNumber },
      ];
    }
    return [
      { label: 'KRA PIN Certificate', value: clientData.kraPin || 'Pending verification', verified: !!clientData.kraPin },
    ];
  }, [isLogbook, vehicleData.logbookNumber, clientData.kraPin]);

  // Vehicle Details section data (from Logbook)
  const vehicleDetailsItems = [
    { label: 'Logbook', value: vehicleData.logbookNumber || vehicleData.registrationNumber || 'Pending verification', verified: true }
  ];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Client Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client Details</Text>
        <Text style={styles.sectionSubtitle}>Client Details as Per</Text>
        
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.simpleRow}
          onPress={() => handleSelectSource('logbook')}
        >
          <View style={[styles.simpleIndicator, isLogbook && styles.simpleIndicatorSelected]}>
            {isLogbook && <Ionicons name="checkmark-circle" size={20} color="#D5222B" />}
          </View>
          <Text style={[styles.simpleLabel, isLogbook && styles.simpleLabelSelected]}>Logbook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.simpleRow}
          onPress={() => handleSelectSource('national_id')}
        >
          <View style={[styles.simpleIndicator, !isLogbook && styles.simpleIndicatorSelected]}>
            {!isLogbook && <Ionicons name="checkmark-circle" size={20} color="#D5222B" />}
          </View>
          <Text style={[styles.simpleLabel, !isLogbook && styles.simpleLabelSelected]}>KRA PIN Certificate</Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Details as Per</Text>
        
        {vehicleDetailsItems.map((item, index) => (
          <View key={index} style={styles.vehicleChipRow}>
            <View style={styles.vehicleChip}>
              <Text style={styles.vehicleChipText}>{item.label}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#D5222B" />
            </View>
          </View>
        ))}
      </View>

      {/* Info Note */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#646767" />
        <Text style={styles.infoText}>
          The DMVIC check will be performed to verify existing vehicle cover. 
          Please ensure all details are accurate.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#646767',
    marginBottom: 16,
    fontFamily: 'Poppins_400Regular',
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  simpleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D5222B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  simpleIndicatorSelected: {
    backgroundColor: 'transparent',
  },
  simpleLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontFamily: 'Poppins_400Regular',
  },
  simpleLabelSelected: {
    color: '#1A1A1A',
    fontFamily: 'Poppins_400Regular',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  unverifiedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D5222B',
  },
  detailLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    marginLeft: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  vehicleChipRow: {
    marginTop: 6,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFECEC',
    borderColor: '#F9C8CD',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  vehicleChipText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Poppins_500Medium',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  infoText: {
    fontSize: 13,
    color: '#646767',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  }
});
