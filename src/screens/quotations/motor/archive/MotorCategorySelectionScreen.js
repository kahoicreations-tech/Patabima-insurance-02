/**
 * Motor Vehicle Category Selection Screen
 * 
 * Clean listing structure similar to quotation screen modal selector
 * Uses FlatList for optimal performance and consistent UX
 */

import React from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  SafeAreaView,
  Alert 
} from 'react-native';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import your components
import { CompactCurvedHeader, ActionButton } from '../../../components';

// Import constants and data
import { Colors, Typography, Spacing } from '../../../constants';
import { vehicleCategories } from './data';

export default function MotorCategorySelectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleCategorySelect = (category) => {
    navigation.navigate('MotorProductSelection', { vehicleCategory: category });
  };

  const handleCheckInsurance = () => {
    Alert.alert(
      'Check Insurance Status',
      'Enter your vehicle registration number to check if your car is currently insured.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Check Now', 
          onPress: () => {
            Alert.prompt(
              'Vehicle Registration',
              'Enter your vehicle registration number:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Check', 
                  onPress: (registrationNumber) => {
                    if (registrationNumber && registrationNumber.trim()) {
                      // Simulate API call
                      setTimeout(() => {
                        const isInsured = Math.random() > 0.5;
                        Alert.alert(
                          isInsured ? 'Vehicle is Insured ✅' : 'Vehicle Not Insured ❌',
                          isInsured 
                            ? `Your vehicle (${registrationNumber}) is currently insured.`
                            : `Your vehicle (${registrationNumber}) does not appear to be insured. Would you like to get a quote?`,
                          [{ text: 'OK' }]
                        );
                      }, 1000);
                    } else {
                      Alert.alert('Error', 'Please enter a valid registration number.');
                    }
                  }
                }
              ],
              'plain-text',
              '',
              'default'
            );
          }
        }
      ]
    );
  };

  const renderCategoryItem = ({ item: category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(category)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryContent}>
        <View style={styles.animationContainer}>
          {category.animation ? (
            <LottieView
              source={category.animation}
              autoPlay
              loop
              style={styles.categoryAnimation}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.categoryIcon}>{category.icon || '🚗'}</Text>
          )}
        </View>
        
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {category.description}
          </Text>
          {category.priceRange && (
            <Text style={styles.categoryPricing}>
              From {category.priceRange}
            </Text>
          )}
        </View>
        
        <View style={styles.categoryIndicator}>
          <Text style={styles.categoryArrow}>▶</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Select Vehicle Category</Text>
      <Text style={styles.headerSubtitle}>
        Choose your vehicle type to get an accurate insurance quote
      </Text>
      
      {/* Check Insurance Status Button */}
      <ActionButton
        title="Check Insurance Status"
        onPress={handleCheckInsurance}
        variant="outline"
        style={styles.checkInsuranceButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      
      {/* Curved Header */}
      <CompactCurvedHeader 
        title="Motor Insurance"
        subtitle="Get the best insurance quotes for your vehicle"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        height={80}
      />
      
      <View style={styles.content}>
        <FlatList
          data={vehicleCategories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategoryItem}
          ItemSeparatorComponent={renderSeparator}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
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
  },
  checkInsuranceButton: {
    marginTop: Spacing.sm,
  },
  categoryItem: {
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
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  animationContainer: {
    width: 60,
    height: 60,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 30,
  },
  categoryAnimation: {
    width: 40,
    height: 40,
  },
  categoryIcon: {
    fontSize: 32,
    textAlign: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  categoryPricing: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
  categoryIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  categoryArrow: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  separator: {
    height: Spacing.sm,
  },
});
