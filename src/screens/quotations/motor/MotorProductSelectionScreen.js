/**
 * Motor Insurance Product Selection Screen
 * 
 * Clean listing structure similar to category selection screen
 * Uses FlatList for optimal performance and consistent UX
 * Displays insurance products based on selected vehicle category
 */

import React, { useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import your components
import { CompactCurvedHeader, ActionButton } from '../../../components';

// Import constants and data
import { Colors, Typography, Spacing } from '../../../constants';
import { insuranceProducts } from './data';

export default function MotorProductSelectionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { vehicleCategory } = route.params || {};

  // Get products for the selected vehicle category
  const availableProducts = useMemo(() => {
    if (!vehicleCategory || !insuranceProducts[vehicleCategory.id]) {
      return [];
    }

    const categoryProducts = insuranceProducts[vehicleCategory.id];
    const allProducts = [];

    // Combine third party and comprehensive products
    if (categoryProducts.thirdParty) {
      allProducts.push(
        ...categoryProducts.thirdParty.map(product => ({
          ...product,
          type: 'Third Party',
          description: 'Basic coverage for third-party damages and liability',
          features: ['Third-party liability', 'Legal requirement compliance', 'Affordable premium'],
          recommended: false
        }))
      );
    }

    if (categoryProducts.comprehensive) {
      allProducts.push(
        ...categoryProducts.comprehensive.map(product => ({
          ...product,
          type: 'Comprehensive',
          description: 'Complete coverage including own damage, theft, and third-party',
          features: ['Own damage cover', 'Theft protection', 'Third-party liability', 'Fire and natural disasters'],
          recommended: true
        }))
      );
    }

    return allProducts;
  }, [vehicleCategory]);

  const handleProductSelect = (product) => {
    navigation.navigate('MotorQuotation', { 
      vehicleCategory,
      selectedProduct: product 
    });
  };

  const handleCompareProducts = () => {
    // For now, navigate to quotation with compare mode
    // Later we can implement a dedicated comparison screen
    navigation.navigate('MotorQuotation', { 
      vehicleCategory,
      compareMode: true,
      products: availableProducts 
    });
  };

  const renderProductItem = ({ item: product }) => (
    <TouchableOpacity
      style={[
        styles.productItem,
        product.recommended && styles.productItemRecommended
      ]}
      onPress={() => handleProductSelect(product)}
      activeOpacity={0.7}
    >
      {product.recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}
      
      <View style={styles.productContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.productIcon}>{product.icon || '🛡️'}</Text>
        </View>
        
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.productType}>{product.type}</Text>
          </View>
          
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
          
          <View style={styles.featuresContainer}>
            {product.features?.slice(0, 2).map((feature, index) => (
              <Text key={index} style={styles.featureText}>• {feature}</Text>
            ))}
          </View>
          
          <Text style={styles.productPricing}>
            From {product.baseRate}% of vehicle value
          </Text>
        </View>
        
        <View style={styles.productIndicator}>
          <Text style={styles.productArrow}>▶</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Choose Insurance Product</Text>
      <Text style={styles.headerSubtitle}>
        Select the insurance coverage that best fits your {vehicleCategory?.name?.toLowerCase()} vehicle needs
      </Text>
      
      {/* Compare Products Button */}
      <ActionButton
        title="Compare All Products"
        onPress={handleCompareProducts}
        variant="outline"
        style={styles.compareButton}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Products Available</Text>
      <Text style={styles.emptySubtitle}>
        No insurance products found for {vehicleCategory?.name} vehicles.
      </Text>
      <ActionButton
        title="Go Back"
        onPress={() => navigation.goBack()}
        style={styles.emptyButton}
      />
    </View>
  );

  if (!vehicleCategory) {
    return (
      <SafeAreaView style={styles.container}>
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Curved Header */}
      <CompactCurvedHeader 
        title={`${vehicleCategory.name} Insurance`}
        subtitle="Choose your coverage plan"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        height={80}
      />
      
      <View style={styles.content}>
        {availableProducts.length > 0 ? (
          <FlatList
            data={availableProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            ItemSeparatorComponent={renderSeparator}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    marginTop: Spacing.md,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerContainer: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  compareButton: {
    marginTop: Spacing.sm,
  },
  productItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginVertical: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  productItemRecommended: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    right: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    zIndex: 1,
  },
  recommendedText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  productContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  iconContainer: {
    width: 50,
    height: 50,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 25,
  },
  productIcon: {
    fontSize: 24,
    textAlign: 'center',
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  productHeader: {
    marginBottom: Spacing.sm,
  },
  productTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  productType: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  productDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  featuresContainer: {
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  productPricing: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  productIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  productArrow: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  separator: {
    height: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
  },
});
