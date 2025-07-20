/**
 * Admin Pricing Configuration Component
 * For testing and monitoring admin pricing updates
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { dynamicPricingManager } from '../services/DynamicPricingManager';

const AdminPricingConfig = ({ navigation }) => {
  const [rateInfo, setRateInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRateInfo();
  }, []);

  const loadRateInfo = async () => {
    try {
      const info = await dynamicPricingManager.getRateUpdateInfo();
      const currentRates = await dynamicPricingManager.getCurrentRates();
      
      setRateInfo({
        ...info,
        totalUnderwriters: currentRates.length,
        ratesAvailable: currentRates.length > 0
      });
    } catch (error) {
      console.error('Failed to load rate info:', error);
      Alert.alert('Error', 'Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const handleForceUpdate = async () => {
    try {
      setUpdating(true);
      await dynamicPricingManager.forceUpdate();
      await loadRateInfo();
      Alert.alert('Success', 'Rates updated successfully from admin');
    } catch (error) {
      console.error('Failed to force update:', error);
      Alert.alert('Error', 'Failed to update rates from server');
    } finally {
      setUpdating(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRateInfo();
    setRefreshing(false);
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (info) => {
    if (!info?.ratesAvailable) return '#FF6B6B';
    if (info.version === 'local-fallback') return '#FFD93D';
    return '#6BCF7F';
  };

  const getStatusText = (info) => {
    if (!info?.ratesAvailable) return 'No Rates Available';
    if (info.version === 'local-fallback') return 'Using Local Rates';
    return 'Admin Rates Active';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D5222B" />
        <Text style={styles.loadingText}>Loading pricing configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dynamic Pricing Configuration</Text>
        <Text style={styles.subtitle}>Admin-controlled motor insurance rates</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(rateInfo) }]} />
          <Text style={styles.statusTitle}>{getStatusText(rateInfo)}</Text>
        </View>
        
        <View style={styles.statusDetails}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Rate Version:</Text>
            <Text style={styles.statusValue}>{rateInfo?.version || 'Unknown'}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Update:</Text>
            <Text style={styles.statusValue}>{formatDate(rateInfo?.lastUpdate)}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Next Update:</Text>
            <Text style={styles.statusValue}>{formatDate(rateInfo?.nextUpdate)}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Underwriters:</Text>
            <Text style={styles.statusValue}>{rateInfo?.totalUnderwriters || 0}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.updateButton]}
          onPress={handleForceUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Force Update from Admin</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.testButton]}
          onPress={() => navigation.navigate('MotorQuotation')}
        >
          <Text style={styles.actionButtonText}>Test Motor Quotation</Text>
        </TouchableOpacity>
      </View>

      {/* Information Cards */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔄 Auto Updates</Text>
          <Text style={styles.infoText}>
            Rates are automatically checked for updates every 24 hours. 
            The app will seamlessly use the latest rates provided by admin.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📱 Offline Support</Text>
          <Text style={styles.infoText}>
            When offline, the app uses cached rates from the last successful update. 
            Local binder rates serve as fallback if no admin rates are available.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⚡ Real-time Sync</Text>
          <Text style={styles.infoText}>
            Admin rate changes are synchronized across all agent devices. 
            Premium calculations always use the most current approved rates.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔐 Version Control</Text>
          <Text style={styles.infoText}>
            Each rate update includes version tracking for audit purposes. 
            All quotes are tagged with the rate version used for calculation.
          </Text>
        </View>
      </View>

      {/* Debug Information */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Information</Text>
          <Text style={styles.debugText}>
            {JSON.stringify(rateInfo, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#646767',
    fontFamily: 'Poppins-Regular',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#646767',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
  },
  statusDetails: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#646767',
  },
  statusValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  updateButton: {
    backgroundColor: '#D5222B',
  },
  testButton: {
    backgroundColor: '#646767',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  infoContainer: {
    padding: 16,
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#646767',
    lineHeight: 20,
  },
  debugContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  debugTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#646767',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#495057',
  },
});

export default AdminPricingConfig;
