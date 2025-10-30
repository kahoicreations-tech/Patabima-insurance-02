import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  SafeAreaView
} from 'react-native';
import { Colors, Typography } from '../../constants';
import { AdminPricingService } from '../../services/AdminPricingService';

const AdminPricingScreen = ({ navigation }) => {
  const [currentConfig, setCurrentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('medical');
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pricingHistory, setPricingHistory] = useState([]);

  useEffect(() => {
    loadCurrentConfig();
    loadPricingHistory();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setLoading(true);
      const config = await AdminPricingService.getCurrentPricingConfig();
      setCurrentConfig(config);
      setEditedConfig(config);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pricing configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadPricingHistory = async () => {
    try {
      const history = await AdminPricingService.getPricingHistory();
      setPricingHistory(history);
    } catch (error) {
      console.error('Failed to load pricing history:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const adminInfo = { adminId: 'current_admin' }; // TODO: Get from auth context
      const updatedConfig = await AdminPricingService.updatePricingConfig(
        editedConfig,
        adminInfo
      );
      
      if (updatedConfig) {
        setCurrentConfig(updatedConfig);
        setIsEditing(false);
        Alert.alert('Success', 'Pricing configuration updated successfully');
        loadPricingHistory(); // Refresh history
      } else {
        Alert.alert('Error', 'Failed to update pricing configuration');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    }
  };

  const handleExportConfig = async () => {
    try {
      const exportData = await AdminPricingService.exportConfiguration();
      if (exportData) {
        // TODO: Implement file sharing or email functionality
        Alert.alert(
          'Export Ready',
          'Configuration exported successfully. Implementation needed for file sharing.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export configuration');
    }
  };

  const updateConfigValue = (path, value) => {
    const pathArray = path.split('.');
    const newConfig = { ...editedConfig };
    let current = newConfig;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = parseFloat(value) || value;
    setEditedConfig(newConfig);
  };

  const renderMedicalConfig = () => (
    <View style={styles.configSection}>
      <Text style={styles.sectionTitle}>Medical Insurance Configuration</Text>
      
      <Text style={styles.subsectionTitle}>Base Premiums</Text>
      {Object.entries(editedConfig?.medical?.basePremiums || {}).map(([planType, values]) => (
        <View key={planType} style={styles.configItem}>
          <Text style={styles.configLabel}>{planType.toUpperCase()} Plan</Text>
          <View style={styles.configRow}>
            <Text style={styles.fieldLabel}>Individual:</Text>
            <TextInput
              style={styles.configInput}
              value={values.individual?.toString()}
              onChangeText={(value) => updateConfigValue(`medical.basePremiums.${planType}.individual`, value)}
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>
          <View style={styles.configRow}>
            <Text style={styles.fieldLabel}>Family:</Text>
            <TextInput
              style={styles.configInput}
              value={values.family?.toString()}
              onChangeText={(value) => updateConfigValue(`medical.basePremiums.${planType}.family`, value)}
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>
        </View>
      ))}
      
      <Text style={styles.subsectionTitle}>Age Factors</Text>
      {Object.entries(editedConfig?.medical?.ageFactors || {}).map(([ageRange, factor]) => (
        <View key={ageRange} style={styles.configRow}>
          <Text style={styles.fieldLabel}>{ageRange}:</Text>
          <TextInput
            style={styles.configInput}
            value={factor.toString()}
            onChangeText={(value) => updateConfigValue(`medical.ageFactors.${ageRange}`, value)}
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>
      ))}
    </View>
  );

  const renderWIBAConfig = () => (
    <View style={styles.configSection}>
      <Text style={styles.sectionTitle}>WIBA Insurance Configuration</Text>
      
      <Text style={styles.subsectionTitle}>Employee Categories</Text>
      {Object.entries(editedConfig?.wiba?.employeeCategories || {}).map(([category, values]) => (
        <View key={category} style={styles.configItem}>
          <Text style={styles.configLabel}>{category.toUpperCase()}</Text>
          <View style={styles.configRow}>
            <Text style={styles.fieldLabel}>Base Rate:</Text>
            <TextInput
              style={styles.configInput}
              value={values.baseRate?.toString()}
              onChangeText={(value) => updateConfigValue(`wiba.employeeCategories.${category}.baseRate`, value)}
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>
        </View>
      ))}
      
      <Text style={styles.subsectionTitle}>Industry Risk Multipliers</Text>
      {Object.entries(editedConfig?.wiba?.industryRiskMultipliers || {}).map(([industry, multiplier]) => (
        <View key={industry} style={styles.configRow}>
          <Text style={styles.fieldLabel}>{industry}:</Text>
          <TextInput
            style={styles.configInput}
            value={multiplier.toString()}
            onChangeText={(value) => updateConfigValue(`wiba.industryRiskMultipliers.${industry}`, value)}
            keyboardType="numeric"
            editable={isEditing}
          />
        </View>
      ))}
    </View>
  );

  const renderMotorConfig = () => (
    <View style={styles.configSection}>
      <Text style={styles.sectionTitle}>Motor Insurance Configuration</Text>
      
      <Text style={styles.subsectionTitle}>Vehicle Categories</Text>
      {Object.entries(editedConfig?.motor?.vehicleCategories || {}).map(([category, values]) => (
        <View key={category} style={styles.configItem}>
          <Text style={styles.configLabel}>{category.toUpperCase()}</Text>
          <View style={styles.configRow}>
            <Text style={styles.fieldLabel}>Base Rate:</Text>
            <TextInput
              style={styles.configInput}
              value={values.baseRate?.toString()}
              onChangeText={(value) => updateConfigValue(`motor.vehicleCategories.${category}.baseRate`, value)}
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderHistoryModal = () => (
    <Modal visible={showHistory} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pricing History</Text>
          <TouchableOpacity onPress={() => setShowHistory(false)}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.historyList}>
          {pricingHistory.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {new Date(parseInt(item.timestamp)).toLocaleString()}
              </Text>
              <Text style={styles.historyVersion}>Version: {item.config.version}</Text>
              <Text style={styles.historyUpdatedBy}>By: {item.config.updatedBy}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Pricing Management</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, isEditing && styles.activeButton]}
            onPress={() => {
              if (isEditing) {
                setEditedConfig(currentConfig);
              }
              setIsEditing(!isEditing);
            }}
          >
            <Text style={styles.actionButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
          
          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveConfig}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['medical', 'wiba', 'motor'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'medical' && renderMedicalConfig()}
        {selectedTab === 'wiba' && renderWIBAConfig()}
        {selectedTab === 'motor' && renderMotorConfig()}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowHistory(true)}>
          <Text style={styles.secondaryButtonText}>View History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleExportConfig}>
          <Text style={styles.secondaryButtonText}>Export Config</Text>
        </TouchableOpacity>
      </View>

      {renderHistoryModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  activeButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.success,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  configSection: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.heading,
    marginBottom: 16,
    color: Colors.primary,
  },
  subsectionTitle: {
    ...Typography.subheading,
    marginTop: 16,
    marginBottom: 8,
    color: Colors.darkGray,
  },
  configItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  configLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.darkGray,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    flex: 1,
    color: Colors.gray,
  },
  configInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 4,
    padding: 8,
    textAlign: 'right',
    backgroundColor: Colors.white,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  secondaryButtonText: {
    color: Colors.darkGray,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    ...Typography.body,
    color: Colors.gray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    ...Typography.heading,
    color: Colors.primary,
  },
  closeButton: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  historyList: {
    flex: 1,
    padding: 16,
  },
  historyItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyDate: {
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  historyVersion: {
    color: Colors.gray,
    marginTop: 4,
  },
  historyUpdatedBy: {
    color: Colors.gray,
    marginTop: 2,
  },
});

export default AdminPricingScreen;
