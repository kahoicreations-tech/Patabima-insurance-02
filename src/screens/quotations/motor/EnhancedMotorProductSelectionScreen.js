import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { getMotorInsuranceProducts } from '../../../data';

const EnhancedMotorProductSelectionScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { vehicleCategory } = route?.params || {};
  const motorProducts = getMotorInsuranceProducts(vehicleCategory);

  const handleProductSelect = (product) => {
    // Only TOR is fully implemented
    if (product.id === 'tor_private') {
      navigation.navigate('TORQuotationFlow', {
        vehicleCategory,
        productType: product.id,
        productName: product.name
      });
    } else {
      // Show under development alert for other products
      Alert.alert(
        'Under Development',
        `${product.name} is currently under development. Please select TOR for Private for now.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const getCategoryDisplayName = (category) => {
    const categoryNames = {
      'private': 'Private Vehicle',
      'commercial': 'Commercial Vehicle',
      'motorcycle': 'Motorcycle',
      'psv_matatu': 'PSV/Matatu',
      'tuktuk': 'TukTuk',
      'special': 'Special Classes'
    };
    return categoryNames[category] || 'Vehicle';
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Coverage</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Select Coverage Type</Text>
          <Text style={styles.subtitle}>
            Choose coverage for your {getCategoryDisplayName(vehicleCategory)}
          </Text>
          
          {motorProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productCard, 
                product.isPopular && styles.popularCard,
                product.id === 'tor_private' && styles.availableCard,
                product.id !== 'tor_private' && styles.developmentCard
              ]}
              onPress={() => handleProductSelect(product)}
              activeOpacity={0.7}
            >
              {product.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>RECOMMENDED</Text>
                </View>
              )}
              
              {product.id === 'tor_private' && (
                <View style={styles.availableBadge}>
                  <Text style={styles.availableText}>AVAILABLE NOW</Text>
                </View>
              )}
              
              {product.id !== 'tor_private' && (
                <View style={styles.developmentBadge}>
                  <Text style={styles.developmentText}>UNDER DEVELOPMENT</Text>
                </View>
              )}
              
              <View style={styles.productHeader}>
                <View style={styles.productIconContainer}>
                  <Text style={styles.productIcon}>{product.icon}</Text>
                </View>
                <View style={styles.productTitleContainer}>
                  <Text style={styles.productTitle}>{product.name}</Text>
                  <Text style={styles.productSubtitle}>{product.briefDescription}</Text>
                </View>
                <Ionicons 
                  name={product.id === 'tor_private' ? "chevron-forward" : "lock-closed"} 
                  size={20} 
                  color={product.id === 'tor_private' ? Colors.primary : Colors.textSecondary} 
                />
              </View>
              
              <View style={styles.featuresContainer}>
                {product.features.slice(0, 3).map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={14} 
                      color={product.id === 'tor_private' ? Colors.success : Colors.textSecondary} 
                    />
                    <Text style={[
                      styles.featureText,
                      product.id !== 'tor_private' && styles.disabledText
                    ]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Rate</Text>
                <Text style={[
                  styles.priceText,
                  product.id !== 'tor_private' && styles.disabledText
                ]}>
                  {product.id === 'tor_private' ? `${product.baseRate}% + Excess` : `${product.baseRate}% (Coming Soon)`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.infoTitle}>Implementation Status</Text>
            </View>
            <Text style={styles.infoText}>
              • <Text style={{ fontWeight: 'bold', color: Colors.success }}>TOR:</Text> Fully implemented with real underwriter data{'\n'}
              • <Text style={{ fontWeight: 'bold', color: Colors.textSecondary }}>Other Products:</Text> Under development{'\n'}
              • <Text style={{ fontWeight: 'bold' }}>TOR Benefits:</Text> Lowest cost with deductible option{'\n'}
              • <Text style={{ fontWeight: 'bold' }}>Ready for Presentation:</Text> Complete purchase flow available
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  popularCard: {
    borderColor: Colors.primary,
  },
  availableCard: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  developmentCard: {
    borderColor: Colors.textSecondary,
    opacity: 0.7,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  availableBadge: {
    position: 'absolute',
    top: -1,
    left: Spacing.md,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  availableText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  developmentBadge: {
    position: 'absolute',
    top: -1,
    left: Spacing.md,
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  developmentText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  productIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  productIcon: {
    fontSize: 20,
  },
  productTitleContainer: {
    flex: 1,
  },
  productTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  productSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  featuresContainer: {
    marginBottom: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  featureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  priceContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  priceLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  priceText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  infoCard: {
    backgroundColor: Colors.backgroundLightBlue,
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default EnhancedMotorProductSelectionScreen;
