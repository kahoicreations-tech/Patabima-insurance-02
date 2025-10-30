/**
 * InsuranceWelcomeScreen - Initial welcome screen with video background
 * Showcases PataBima's services with an engaging video introduction
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Colors, Typography, Spacing } from '../../constants';

export default function InsuranceWelcomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  
  // Lock screen to portrait mode
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Auto-slide timer
  useEffect(() => {
    const slideInterval = setInterval(() => {
      if (scrollRef.current) {
        const { width } = Dimensions.get('window');
        const nextSlide = (activeSlide + 1) % slides.length;
        scrollRef.current.scrollTo({ x: nextSlide * width, animated: true });
        setActiveSlide(nextSlide);
      }
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(slideInterval);
  }, [activeSlide]);

  // Animated value for button pulsation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Pulse animation for the CTA button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Slides for lightweight icon slider (no heavy video)
  const slides = [
    {
      key: 'vehicle',
      icon: 'car-sport',
      title: 'Motor Insurance',
      subtitle: 'Instant quotes across Private, Commercial, PSV, and more'
    },
    {
      key: 'medical',
      icon: 'medkit',
      title: 'Medical & WIBA',
      subtitle: 'Admin workflows, pricing, and document support'
    },
    {
      key: 'claims',
      icon: 'shield-checkmark',
      title: 'Claims & Renewals',
      subtitle: 'Track claims and manage upcoming renewals with reminders'
    },
    {
      key: 'payments',
      icon: 'cash-outline',
      title: 'Payments & Policies',
      subtitle: 'M-PESA and gateways with automatic policy generation'
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top curved element - covers entire status bar */}
      <View style={[styles.curvedTopContainer, { height: 80 + insets.top }]}>
        <LinearGradient
          colors={[Colors.primary, '#C01D1D']}
          style={styles.curvedTop}
        />
      </View>
      
      {/* Main content area with fixed height */}
      <View style={styles.mainContent}>
        {/* Slider content */}
        <View style={styles.sliderContainer}>
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: new Animated.Value(0) } } }],
              { useNativeDriver: false, listener: (e) => {
                const { width } = Dimensions.get('window');
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveSlide(index);
              }}
            )}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
          >
            {slides.map((s, index) => (
              <View key={index} style={styles.slideCentered}>
                <View style={styles.slideIconWrap}>
                  <Ionicons name={s.icon} size={90} color={Colors.primary} />
                </View>
                <Text style={styles.slideTitle}>{s.title}</Text>
                <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
              </View>
            ))}
          </Animated.ScrollView>
          
          {/* Pagination dots */}
          <View style={styles.paginationContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { backgroundColor: index === activeSlide ? Colors.primary : '#e0e0e0' }
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Actions Container at Bottom */}
      <View style={[styles.actionContainer, { bottom: insets.bottom + 28 }]}>
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
            style={styles.skipTouchArea}
          >
            <Text style={styles.skipText}>Skip intro</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <LinearGradient
              colors={[Colors.primary, '#C01D1D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.getStartedButton}
            >
              <Text style={styles.getStartedButtonText}>
                GET STARTED
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    paddingTop: 100, // Space below curved header
    paddingBottom: 120, // Space above buttons
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    height: 400, // Fixed height for slider container
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  slide: {
    width: Dimensions.get('window').width,
    paddingHorizontal: 32, // Consistent 32px margins
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideCentered: {
    width: Dimensions.get('window').width,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 400, // Match sliderContainer height
  },
  slideIconWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 3,
    borderColor: '#ffe0e0',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  slideTitle: {
    fontSize: Typography.fontSize?.xxl || 26,
    fontFamily: Typography.fontFamily?.bold || 'Poppins-Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 34,
    letterSpacing: 0.3,
  },
  slideSubtitle: {
    fontSize: Typography.fontSize?.md || 16,
    fontFamily: Typography.fontFamily?.regular || 'Poppins-Regular',
    color: '#6c757d',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  curvedTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  curvedTop: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  // logo removed to simplify layout per request
  fullScreenGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  actionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24, // Fixed position from bottom of screen
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: '85%', // Reduced from 100% for better proportion
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize?.md || 16,
    fontFamily: Typography.fontFamily?.bold || 'Poppins-Bold',
    letterSpacing: 1.0,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  skipText: {
    color: Colors.primary,
    fontSize: Typography.fontSize?.md || 15,
    fontFamily: Typography.fontFamily?.semibold || 'Poppins-SemiBold',
    letterSpacing: 0.3,
  }
  ,
  skipTouchArea: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 10, // Add margin to create space from slide content
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  }
});
