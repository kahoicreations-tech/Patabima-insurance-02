import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { AWSContext } from '../../contexts/AWSContext';
import { AdminPricingService } from '../../services/AdminPricingService';
import { Colors, Typography } from '../../constants';

export const AdminPricingScreenAWS = () => {
  const { isAuthenticated, user } = useContext(AWSContext);
  const [loading, setLoading] = useState(false);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [selectedInsuranceType, setSelectedInsuranceType] = useState('MOTOR');
  
  const [formData, setFormData] = useState({
    basePremium: '',
    factors: {
      ageMultiplier: '',
      genderMultiplier: '',
      occupationMultiplier: ''
    },
    isActive: true
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPricingConfig();
    }
  }, [isAuthenticated, user, selectedInsuranceType]);

  const loadPricingConfig = async () => {
    try {
      setLoading(true);
      const config = await AdminPricingService.getPricingConfiguration(selectedInsuranceType);
      if (config) {
        setPricingConfig(config);
        setFormData({
          basePremium: config.basePremium?.toString() || '',
          factors: config.factors || {
            ageMultiplier: '',
            genderMultiplier: '',
            occupationMultiplier: ''
          },
          isActive: config.isActive || true
        });
      }
    } catch (error) {
      console.error('Error loading pricing config:', error);
      Alert.alert('Error', 'Failed to load pricing configuration');
    } finally {
      setLoading(false);
    }
  };

  const savePricingConfig = async () => {
    try {
      setLoading(true);
      
      const configData = {
        insuranceType: selectedInsuranceType,
        basePremium: parseFloat(formData.basePremium),
        factors: formData.factors,
        isActive: formData.isActive,
        updatedBy: user?.email || 'admin'
      };

      await AdminPricingService.updatePricingConfiguration(selectedInsuranceType, configData);
      Alert.alert('Success', 'Pricing configuration updated successfully');
      await loadPricingConfig(); // Reload to get latest data
    } catch (error) {
      console.error('Error saving pricing config:', error);
      Alert.alert('Error', 'Failed to save pricing configuration');
    } finally {
      setLoading(false);
    }
  };

  const exportConfiguration = async () => {
    try {
      const exported = await AdminPricingService.exportConfiguration();
      Alert.alert('Export Successful', `Configuration exported with ${exported.length} items`);
    } catch (error) {
      Alert.alert('Error', 'Failed to export configuration');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Please sign in to access admin panel</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Pricing Management</Text>
          <Text style={styles.subtitle}>Configure insurance pricing parameters</Text>
        </View>

        {/* Insurance Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance Type</Text>
          <View style={styles.typeSelector}>
            {['MOTOR', 'MEDICAL', 'WIBA', 'TRAVEL'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedInsuranceType === type && styles.typeButtonActive
                ]}
                onPress={() => setSelectedInsuranceType(type)}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedInsuranceType === type && styles.typeButtonTextActive
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading configuration...</Text>
          </View>
        ) : (
          <>
            {/* Base Premium */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Base Premium (KES)</Text>
              <TextInput
                style={styles.input}
                value={formData.basePremium}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  basePremium: text
                }))}
                placeholder="Enter base premium amount"
                keyboardType="numeric"
              />
            </View>

            {/* Factors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Multiplier Factors</Text>
              
              <View style={styles.factorItem}>
                <Text style={styles.factorLabel}>Age Multiplier</Text>
                <TextInput
                  style={styles.factorInput}
                  value={formData.factors.ageMultiplier?.toString() || ''}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    factors: {
                      ...prev.factors,
                      ageMultiplier: text
                    }
                  }))}
                  placeholder="1.0"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.factorItem}>
                <Text style={styles.factorLabel}>Gender Multiplier</Text>
                <TextInput
                  style={styles.factorInput}
                  value={formData.factors.genderMultiplier?.toString() || ''}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    factors: {
                      ...prev.factors,
                      genderMultiplier: text
                    }
                  }))}
                  placeholder="1.0"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.factorItem}>
                <Text style={styles.factorLabel}>Occupation Multiplier</Text>
                <TextInput
                  style={styles.factorInput}
                  value={formData.factors.occupationMultiplier?.toString() || ''}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    factors: {
                      ...prev.factors,
                      occupationMultiplier: text
                    }
                  }))}
                  placeholder="1.0"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Active Status */}
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Configuration Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    isActive: value
                  }))}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                  thumbColor={formData.isActive ? Colors.white : Colors.gray}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={savePricingConfig}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>Save Configuration</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportButton}
                onPress={exportConfiguration}
                disabled={loading}
              >
                <Text style={styles.exportButtonText}>Export All Configs</Text>
              </TouchableOpacity>
            </View>

            {/* Configuration Info */}
            {pricingConfig && (
              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Current Configuration</Text>
                <Text style={styles.infoText}>
                  Last Updated: {new Date(pricingConfig.updatedAt || Date.now()).toLocaleDateString()}
                </Text>
                <Text style={styles.infoText}>
                  Version: {pricingConfig.version || 1}
                </Text>
                <Text style={styles.infoText}>
                  Status: {pricingConfig.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: Typography.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Typography.regular,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.semiBold,
    color: Colors.text,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: Typography.medium,
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: Typography.regular,
    backgroundColor: Colors.white,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  factorLabel: {
    fontSize: 16,
    fontFamily: Typography.medium,
    color: Colors.text,
    flex: 1,
  },
  factorInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: Typography.regular,
    backgroundColor: Colors.white,
    width: 100,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: Typography.medium,
    color: Colors.text,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Typography.semiBold,
    color: Colors.white,
  },
  exportButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 16,
    fontFamily: Typography.semiBold,
    color: Colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Typography.regular,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  infoSection: {
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: Typography.semiBold,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: Typography.regular,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    fontFamily: Typography.regular,
    color: Colors.error,
    textAlign: 'center',
  },
});

export default AdminPricingScreenAWS;
