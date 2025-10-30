import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../../constants';

export default function SplashScreen() {
  const navigation = useNavigation();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Curved red background */}
      <View style={styles.curvedBackground} />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Circular logo container */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/PataLogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Agency text */}
        <Text style={styles.agencyText}>PATA BIMA AGENCY</Text>
        <Text style={styles.taglineText}>Insurance for Protection</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  curvedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '75%',
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: Colors.background,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 80,
    height: 80,
  },
  agencyText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.background,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  taglineText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.background,
    textAlign: 'center',
    opacity: 0.9,
  },
});
