import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMotorInsurance } from '../../../../../contexts/MotorInsuranceContext';

export default function PolicySuccess({ route }) {
  const navigation = useNavigation();
  const { actions } = useMotorInsurance();
  const { policyNumber, policyId, pdfUrl, message } = route?.params || {};

  // Clean up flow state when user navigates away from success screen
  // This handles back button, hardware back, or any other navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (actions?.resetFlow) {
        actions.resetFlow();
        console.log('✅ Motor 2 cache cleared when leaving success screen');
      }
    });

    return unsubscribe;
  }, [navigation, actions]);

  // Clear cache when user navigates away to ensure fresh start for next policy
  // Do NOT clear on mount - let user see success screen first
  const resetFlowAndNavigate = (navigationAction) => {
    // Reset will be handled by beforeRemove listener
    // Just execute the navigation action
    navigationAction();
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Your motor insurance policy has been created successfully!\n\nPolicy Number: ${policyNumber}\n\nThank you for choosing PataBima.`;
      
      await Share.share({
        message: shareMessage,
        title: 'Motor Insurance Policy',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleViewPolicies = () => {
    // Navigate to Quotations tab to view all quotes/policies
    resetFlowAndNavigate(() => {
      navigation.navigate('MainTabs', { 
        screen: 'Quotations' 
      });
    });
  };

  const handleNewQuote = () => {
    // Navigate to Motor2Flow to create a new quote
    resetFlowAndNavigate(() => {
      navigation.navigate('Motor2Flow');
    });
  };

  const handleBackToHome = () => {
    // Navigate to Home tab in MainTabs
    resetFlowAndNavigate(() => {
      navigation.navigate('MainTabs', { 
        screen: 'Home' 
      });
    });
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.successCard}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Policy Created Successfully!</Text>
        
        {/* Policy Number */}
        <View style={styles.policyNumberContainer}>
          <Text style={styles.policyNumberLabel}>Policy Number</Text>
          <Text style={styles.policyNumber}>{policyNumber || 'N/A'}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Your motor insurance policy has been created and is now active.
          </Text>
          <Text style={styles.infoText}>
            You can view your policy details in the Policies section.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {/* Share Policy */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>📤 Share Policy</Text>
          </TouchableOpacity>

          {/* View Policies */}
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleViewPolicies}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>📋 View All Policies</Text>
          </TouchableOpacity>

          {/* New Quote */}
          <TouchableOpacity 
            style={styles.tertiaryButton} 
            onPress={handleNewQuote}
            activeOpacity={0.8}
          >
            <Text style={styles.tertiaryButtonText}>➕ Create New Quote</Text>
          </TouchableOpacity>

          {/* Back to Home */}
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={handleBackToHome}
            activeOpacity={0.8}
          >
            <Text style={styles.linkButtonText}>🏠 Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          Thank you for choosing PataBima for your insurance needs.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d4edda',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 48,
    color: '#28a745',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  policyNumberContainer: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#D5222B',
  },
  policyNumberLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  policyNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D5222B',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#D5222B',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#D5222B',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D5222B',
  },
  secondaryButtonText: {
    color: '#D5222B',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6c757d',
  },
  tertiaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  footerNote: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
