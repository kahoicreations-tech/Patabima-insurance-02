import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SpecialScreen = ({ navigation }) => {
  const insuranceOptions = [
    {
      id: 'comprehensive',
      title: 'Comprehensive Coverage',
      description: 'Complete protection for heavy equipment and specialized vehicles including breakdown, theft, and operational coverage',
      price: 'From KES 75,000',
      features: ['All Risk Coverage', 'Equipment Breakdown', 'Theft Protection', 'Business Interruption', 'Operator Liability'],
      icon: 'shield-checkmark',
      color: '#D5222B',
      route: 'SpecialComprehensive'
    },
    {
      id: 'thirdparty',
      title: 'Third Party Coverage',
      description: 'Essential liability coverage for specialized equipment operations',
      price: 'From KES 45,000',
      features: ['Third Party Liability', 'Operator Coverage', 'Property Damage', 'Legal Compliance'],
      icon: 'car-sport',
      color: '#646767',
      route: 'SpecialThirdParty'
    }
  ];

  const handleOptionSelect = (option) => {
    if (option.route) {
      navigation.navigate(option.route);
    } else {
      Alert.alert('Coming Soon', `${option.title} will be available soon!`);
    }
  };

  const renderInsuranceCard = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.card, { borderLeftColor: option.color }]}
      onPress={() => handleOptionSelect(option)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
            <Ionicons name={option.icon} size={32} color={option.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>{option.title}</Text>
            <Text style={styles.priceText}>{option.price}</Text>
          </View>
        </View>
        
        <Text style={styles.cardDescription}>{option.description}</Text>
        
        <View style={styles.featuresContainer}>
          {option.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.actionContainer}>
          <LinearGradient
            colors={[option.color, option.color + 'DD']}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Get Quote</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#D5222B', '#B71C1C']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Ionicons name="construct" size={40} color="#FFFFFF" />
              <Text style={styles.headerTitle}>Special Equipment Insurance</Text>
              <Text style={styles.headerSubtitle}>
                Comprehensive protection for specialized vehicles and heavy equipment
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color="#D5222B" />
              <Text style={styles.infoTitle}>Special Equipment Coverage</Text>
            </View>
            <View style={styles.infoBenefits}>
              <View style={styles.benefitItem}>
                <Ionicons name="build" size={16} color="#4CAF50" />
                <Text style={styles.benefitText}>Construction & agricultural equipment</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="business" size={16} color="#4CAF50" />
                <Text style={styles.benefitText}>Industrial machinery protection</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="settings" size={16} color="#4CAF50" />
                <Text style={styles.benefitText}>Equipment breakdown coverage</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.benefitText}>High-value specialized vehicle protection</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Equipment Types */}
        <View style={styles.equipmentSection}>
          <Text style={styles.sectionTitle}>Covered Equipment Types</Text>
          <View style={styles.equipmentGrid}>
            <View style={styles.equipmentCard}>
              <Ionicons name="construct" size={24} color="#FF9800" />
              <Text style={styles.equipmentText}>Construction Equipment</Text>
            </View>
            <View style={styles.equipmentCard}>
              <Ionicons name="leaf" size={24} color="#4CAF50" />
              <Text style={styles.equipmentText}>Agricultural Machinery</Text>
            </View>
            <View style={styles.equipmentCard}>
              <Ionicons name="diamond" size={24} color="#9C27B0" />
              <Text style={styles.equipmentText}>Mining Equipment</Text>
            </View>
            <View style={styles.equipmentCard}>
              <Ionicons name="business" size={24} color="#2196F3" />
              <Text style={styles.equipmentText}>Industrial Machinery</Text>
            </View>
            <View style={styles.equipmentCard}>
              <Ionicons name="car-sport" size={24} color="#F44336" />
              <Text style={styles.equipmentText}>Specialized Transport</Text>
            </View>
            <View style={styles.equipmentCard}>
              <Ionicons name="medical" size={24} color="#E91E63" />
              <Text style={styles.equipmentText}>Emergency Vehicles</Text>
            </View>
          </View>
        </View>

        {/* Insurance Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Choose Your Coverage</Text>
          <Text style={styles.sectionSubtitle}>
            Select the insurance plan that best protects your specialized equipment
          </Text>
          
          {insuranceOptions.map(renderInsuranceCard)}
        </View>

        {/* Footer Spacing */}
        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 5,
    textAlign: 'center',
    opacity: 0.9,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  infoBenefits: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  equipmentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  equipmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '30%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  equipmentText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  optionsSection: {
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D5222B',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  featuresContainer: {
    marginBottom: 20,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footerSpacing: {
    height: 20,
  },
});

export default SpecialScreen;
