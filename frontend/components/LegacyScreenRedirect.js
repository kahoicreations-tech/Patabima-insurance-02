/**
 * Legacy Screen Redirect Component
 * Redirects old quotation screens to the new Enhanced Quotation System
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const LegacyScreenRedirect = ({ 
  screenName = 'Quotation',
  category = null,
  productType = null,
  message = null
}) => {
  const navigation = useNavigation();

  useEffect(() => {
    // Show alert and redirect after a short delay
    const timer = setTimeout(() => {
      Alert.alert(
        'Screen Updated',
        message || `The ${screenName} screen has been updated. Redirecting to the new enhanced quotation system.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation.replace('EnhancedQuotation', {
                initialCategory: category,
                initialProduct: productType
              });
            }
          }
        ]
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation, screenName, category, productType, message]);

  const handleManualRedirect = () => {
    navigation.replace('EnhancedQuotation', {
      initialCategory: category,
      initialProduct: productType
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="arrow-forward-circle" size={64} color="#D5222B" />
        </View>
        
        <Text style={styles.title}>Screen Updated!</Text>
        <Text style={styles.message}>
          {message || `The ${screenName} screen has been updated with improved features and better user experience.`}
        </Text>
        
        <Text style={styles.subMessage}>
          You'll be redirected to the new enhanced quotation system automatically.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleManualRedirect}
          >
            <Text style={styles.primaryButtonText}>Continue to New System</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleGoBack}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>New Features:</Text>
          <Text style={styles.featureItem}>• Enhanced form validation</Text>
          <Text style={styles.featureItem}>• Real-time premium calculation</Text>
          <Text style={styles.featureItem}>• Better category organization</Text>
          <Text style={styles.featureItem}>• Improved user interface</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24
  },
  subMessage: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic'
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 40
  },
  primaryButton: {
    backgroundColor: '#D5222B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D5222B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#D5222B',
    fontSize: 16,
    fontWeight: '600'
  },
  featuresContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20
  }
});

export default LegacyScreenRedirect;