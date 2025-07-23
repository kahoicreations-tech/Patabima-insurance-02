import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { ENHANCED_VEHICLE_CATEGORIES } from '../../../data/motorCategories';

const { width } = Dimensions.get('window');

const MotorCategoriesDiagramScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleCategoryPress = (category) => {
    navigation.navigate('EnhancedMotorProductSelection', { vehicleCategory: category });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Motor Insurance Categories</Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => {}}
        >
          <Ionicons name="information-circle-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.diagramContainer}>
          {/* Central Hub */}
          <View style={styles.centralHub}>
            <Text style={styles.centralHubText}>Motor{'\n'}Insurance</Text>
          </View>

          {/* Category Cards */}
          <View style={styles.categoriesWrapper}>
            {ENHANCED_VEHICLE_CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: category.color || Colors.primary }
                ]}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDescription}>
                    {category.description}
                  </Text>
                  
                  {/* Features List */}
                  <View style={styles.featuresList}>
                    {category.features?.map((feature, idx) => (
                      <View key={idx} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.commissionRate}>
                      Commission: {(category.commissionRate * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  infoButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  diagramContainer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  centralHub: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centralHubText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  categoriesWrapper: {
    width: '100%',
  },
  categoryCard: {
    width: '100%',
    borderRadius: 16,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryContent: {
    alignItems: 'flex-start',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  categoryName: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  categoryDescription: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.md,
    opacity: 0.9,
  },
  featuresList: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  featureText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    marginLeft: Spacing.xs,
    opacity: 0.9,
  },
  cardFooter: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  commissionRate: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
});

export default MotorCategoriesDiagramScreen;
