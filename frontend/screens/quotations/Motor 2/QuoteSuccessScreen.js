import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuoteSuccessScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { quoteId, quoteData } = route.params || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Quote Generated Successfully</Text>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>

        {/* Quote Details Card */}
        {quoteData && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quote ID:</Text>
              <Text style={styles.detailValue}>{quoteId}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle:</Text>
              <Text style={styles.detailValue}>
                {quoteData.vehicleMake} {quoteData.vehicleModel} ({quoteData.vehicleYear})
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Registration:</Text>
              <Text style={styles.detailValue}>{quoteData.vehicleRegistration}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coverage:</Text>
              <Text style={styles.detailValue}>{quoteData.coverageType}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Underwriter:</Text>
              <Text style={styles.detailValue}>{quoteData.underwriterName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.premiumRow}>
              <Text style={styles.premiumLabel}>Total Premium:</Text>
              <Text style={styles.premiumValue}>{formatCurrency(quoteData.totalPremium)}</Text>
            </View>

            {quoteData.selectedAddons && quoteData.selectedAddons.length > 0 && (
              <>
                <View style={styles.addonsSection}>
                  <Text style={styles.addonsTitle}>Add-ons Included:</Text>
                  {quoteData.selectedAddons.map((addon, index) => (
                    <View key={index} style={styles.addonRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.addonText}>{addon.name}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => {
              // Navigate to apply/payment screen
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.primaryButtonText}>Apply Now</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                // Download quote as PDF
                console.log('Download quote:', quoteId);
              }}
            >
              <Ionicons name="download-outline" size={20} color="#D5222B" />
              <Text style={styles.secondaryButtonText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                // View quote details
                console.log('View quote:', quoteId);
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#D5222B" />
              <Text style={styles.secondaryButtonText}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                // Share quote
                console.log('Share quote:', quoteId);
              }}
            >
              <Ionicons name="share-social-outline" size={20} color="#D5222B" />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.textButton}
            onPress={() => navigation.navigate('Quotations')}
          >
            <Text style={styles.textButtonText}>Go back to Quotations</Text>
            <Text style={styles.exitText}>(exit)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  dateText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: 'Poppins-Regular',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12,
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
  },
  premiumLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    fontFamily: 'Poppins-Bold',
  },
  premiumValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D5222B',
    fontFamily: 'Poppins-Bold',
  },
  addonsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  addonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  addonText: {
    fontSize: 13,
    color: '#646767',
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#D5222B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D5222B',
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D5222B',
    marginLeft: 6,
    fontFamily: 'Poppins-SemiBold',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  textButtonText: {
    fontSize: 14,
    color: '#646767',
    fontFamily: 'Poppins-Regular',
  },
  exitText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});
