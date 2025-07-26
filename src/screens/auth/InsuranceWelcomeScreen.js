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
  Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Colors, Typography, Spacing } from '../../constants';

export default function InsuranceWelcomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const videoRef = useRef(null);
  
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Lock screen to portrait mode
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

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
  
  // Configure video playback
  useEffect(() => {
    if (videoRef.current) {
      (async () => {
        try {
          await videoRef.current.loadAsync(
            require('../../../assets/Patabima.mp4'),
            {},
            false
          );
          await videoRef.current.playAsync();
          videoRef.current.setIsLoopingAsync(true);
          videoRef.current.setIsMutedAsync(true);
        } catch (error) {
          console.log("Video playback error:", error);
        }
      })();
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Video Background */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.backgroundVideo}
          resizeMode={ResizeMode.CONTAIN}
          onError={(error) => console.log("Video error:", error)}
          onReadyForDisplay={() => setVideoLoaded(true)}
        />
      </View>
      
      {/* Top curved element */}
      <View style={styles.curvedTopContainer}>
        <LinearGradient
          colors={[Colors.primary, '#C01D1D']}
          style={styles.curvedTop}
        />
      </View>
      
      {/* Actions Container */}
      <View 
        style={[
          styles.actionContainer, 
          { paddingBottom: insets.bottom || Spacing.md }
        ]}
      >
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            width: '100%',
            paddingHorizontal: Spacing.xl,
          }}
        >
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
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
        
        {/* Skip button with no visual separation */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip intro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundVideo: {
    width: '100%',
    height: '40%',
    flex: 1,
  },
  curvedTopContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100, // Adjust height as needed
    zIndex: 10,
    overflow: 'hidden',
  },
  curvedTop: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    opacity: 0.85,
  },
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
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Added slight background to ensure text visibility
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    width: '100%',
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize?.md || 16,
    fontFamily: Typography.fontFamily?.bold || 'Poppins-Bold',
    letterSpacing: 0.5,
  },
  skipButton: {
    padding: Spacing.sm,
    marginTop: 2,
  },
  skipText: {
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize?.sm || 14,
    fontFamily: Typography.fontFamily?.medium || 'Poppins-Medium',
  }
});
