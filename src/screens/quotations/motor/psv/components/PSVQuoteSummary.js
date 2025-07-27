/**
 * PSV Quote Summary Component
 * Displays PSV insurance quote summary with breakdown
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../../../constants';

const PSVQuoteSummary = ({ 
  vehicleInfo, 
  ownerInfo, 
  coverageDetails, 
  premiumBreakdown, 
  insurerInfo 
}) => {
  const formatCurrency = (amount) => {
    return `KSh ${amount?.toLocaleString() || '0'}`;
  };

  const SummarySection = ({ title, icon, children }) => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const SummaryRow = ({ label, value, highlight = false }) => (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, highlight && styles.highlightLabel]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, highlight && styles.highlightValue]}>
        {value}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Vehicle Information */}
      <SummarySection title="Vehicle Information" icon="car-outline">
        <SummaryRow label="PSV Type" value={vehicleInfo?.psvType} />
        <SummaryRow label="Make & Model" value={`${vehicleInfo?.make} ${vehicleInfo?.model}`} />
        <SummaryRow label="Registration Number" value={vehicleInfo?.registrationNumber} />
        <SummaryRow label="Year of Manufacture" value={vehicleInfo?.yearOfManufacture} />
        <SummaryRow label="Engine Number" value={vehicleInfo?.engineNumber} />
        <SummaryRow label="Chassis Number" value={vehicleInfo?.chassisNumber} />
        <SummaryRow label="Seating Capacity" value={`${vehicleInfo?.seatingCapacity} passengers`} />
        <SummaryRow label="Vehicle Value" value={formatCurrency(vehicleInfo?.vehicleValue)} />
      </SummarySection>

      {/* PSV Operations */}
      <SummarySection title="PSV Operations" icon="business-outline">
        <SummaryRow label="Route" value={vehicleInfo?.route} />
        <SummaryRow label="Operating Area" value={vehicleInfo?.operatingArea} />
        {vehicleInfo?.saccoName && (
          <SummaryRow label="SACCO/Company" value={vehicleInfo.saccoName} />
        )}
        <SummaryRow label="Average Daily Earnings" value={formatCurrency(vehicleInfo?.dailyEarnings)} />
        <SummaryRow label="Operating Days/Week" value={`${vehicleInfo?.operatingDays} days`} />
      </SummarySection>

      {/* Owner Information */}
      <SummarySection title="Owner Information" icon="person-outline">
        <SummaryRow label="Owner Type" value={ownerInfo?.ownerType} />
        <SummaryRow label="Name" value={ownerInfo?.name || `${ownerInfo?.firstName} ${ownerInfo?.lastName}`} />
        <SummaryRow label="ID/Passport Number" value={ownerInfo?.idNumber} />
        <SummaryRow label="Phone Number" value={ownerInfo?.phoneNumber} />
        <SummaryRow label="Email" value={ownerInfo?.email} />
        <SummaryRow label="County" value={ownerInfo?.county} />
        {ownerInfo?.kraPin && (
          <SummaryRow label="KRA PIN" value={ownerInfo.kraPin} />
        )}
      </SummarySection>

      {/* Driver Information */}
      {ownerInfo?.operatorType === 'hired' && ownerInfo?.driverInfo && (
        <SummarySection title="Driver Information" icon="person-circle-outline">
          <SummaryRow label="Driver Name" value={`${ownerInfo.driverInfo.firstName} ${ownerInfo.driverInfo.lastName}`} />
          <SummaryRow label="License Number" value={ownerInfo.driverInfo.licenseNumber} />
          <SummaryRow label="License Class" value={ownerInfo.driverInfo.licenseClass} />
          <SummaryRow label="Years of Experience" value={`${ownerInfo.driverInfo.yearsOfExperience} years`} />
          <SummaryRow label="Date of Birth" value={ownerInfo.driverInfo.dateOfBirth} />
        </SummarySection>
      )}

      {/* Coverage Details */}
      <SummarySection title="Coverage Details" icon="shield-checkmark-outline">
        <SummaryRow label="Coverage Type" value={coverageDetails?.coverageType} />
        <SummaryRow label="Policy Period" value={`${coverageDetails?.startDate} to ${coverageDetails?.endDate}`} />
        
        {coverageDetails?.coverageType === 'comprehensive' && (
          <>
            <SummaryRow label="Excess Amount" value={formatCurrency(coverageDetails?.excess)} />
            <SummaryRow label="Windscreen Cover" value={coverageDetails?.windscreenCover ? 'Yes' : 'No'} />
            <SummaryRow label="Radio/Accessories Cover" value={coverageDetails?.accessoriesCover ? 'Yes' : 'No'} />
            <SummaryRow label="Courtesy Car" value={coverageDetails?.courtesyCar ? 'Yes' : 'No'} />
            <SummaryRow label="Towing Services" value={coverageDetails?.towingServices ? 'Yes' : 'No'} />
          </>
        )}
        
        <SummaryRow label="Passenger Liability" value={formatCurrency(coverageDetails?.passengerLiability)} />
        <SummaryRow label="Third Party Property" value={formatCurrency(coverageDetails?.thirdPartyProperty)} />
      </SummarySection>

      {/* Insurer Information */}
      <SummarySection title="Selected Insurer" icon="business-outline">
        <SummaryRow label="Insurance Company" value={insurerInfo?.name} />
        <SummaryRow label="Rating" value={`${insurerInfo?.rating}/5 stars`} />
        <SummaryRow label="Claims Process" value={insurerInfo?.claimsRating} />
        <SummaryRow label="Customer Service" value={insurerInfo?.serviceRating} />
      </SummarySection>

      {/* Premium Breakdown */}
      <SummarySection title="Premium Breakdown" icon="calculator-outline">
        <SummaryRow label="Base Premium" value={formatCurrency(premiumBreakdown?.basePremium)} />
        <SummaryRow label="PSV Loading" value={formatCurrency(premiumBreakdown?.psvLoading)} />
        <SummaryRow label="Route Risk Loading" value={formatCurrency(premiumBreakdown?.routeRiskLoading)} />
        <SummaryRow label="Age Loading" value={formatCurrency(premiumBreakdown?.ageLoading)} />
        <SummaryRow label="Experience Discount" value={`-${formatCurrency(premiumBreakdown?.experienceDiscount)}`} />
        
        <View style={styles.divider} />
        
        <SummaryRow label="Net Premium" value={formatCurrency(premiumBreakdown?.netPremium)} />
        <SummaryRow label="Training Levy (0.2%)" value={formatCurrency(premiumBreakdown?.trainingLevy)} />
        <SummaryRow label="Stamp Duty" value={formatCurrency(premiumBreakdown?.stampDuty)} />
        <SummaryRow label="VAT (16%)" value={formatCurrency(premiumBreakdown?.vat)} />
        
        <View style={styles.divider} />
        
        <SummaryRow 
          label="Total Premium" 
          value={formatCurrency(premiumBreakdown?.totalPremium)} 
          highlight={true}
        />
      </SummarySection>

      {/* Payment Information */}
      <SummarySection title="Payment Information" icon="card-outline">
        <SummaryRow label="Payment Frequency" value={coverageDetails?.paymentFrequency} />
        {coverageDetails?.paymentFrequency !== 'annual' && (
          <SummaryRow 
            label="Installment Amount" 
            value={formatCurrency(premiumBreakdown?.installmentAmount)} 
          />
        )}
        <SummaryRow label="First Payment Due" value={coverageDetails?.firstPaymentDate} />
      </SummarySection>

      {/* Additional Notes */}
      {coverageDetails?.notes && (
        <SummarySection title="Additional Notes" icon="document-text-outline">
          <Text style={styles.notesText}>{coverageDetails.notes}</Text>
        </SummarySection>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  sectionContainer: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'right',
    flex: 1,
    fontFamily: 'Poppins_500Medium',
  },
  highlightLabel: {
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  highlightValue: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontFamily: 'Poppins_700Bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  notesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
});

export default PSVQuoteSummary;
