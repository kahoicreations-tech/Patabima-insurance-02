/**
 * InsuranceWelcomeScreen - Initial welcome screen with animated video
 * Showcases PataBima's services with an engaging animation
 */

import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Colors, Typography } from '../../constants';

export default function InsuranceWelcomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [videoError, setVideoError] = React.useState(false);
  
  // Create video player - auto-play immediately
  const player = useVideoPlayer(require('../../assets/Splash Screen Animation_V2.mp4'), player => {
    player.loop = true;
    player.muted = true;
    player.play(); // Start playing immediately
  });

  // Listen for video errors only
  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      if (status.status === 'error') {
        setVideoError(true);
        console.log('Video error:', status.error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Fullscreen Video Background */}
      {!videoError ? (
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>PataBima Insurance</Text>
          <Text style={styles.fallbackSubtext}>Your trusted insurance partner</Text>
        </View>
      )}
      
      {/* Top curved element - covers entire status bar */}
      <View style={[styles.curvedTopContainer, { height: 80 + insets.top }]}>
        <LinearGradient
          colors={[Colors.primary, '#C01D1D']}
          style={styles.curvedTop}
        />
      </View>

      {/* Actions Container at Bottom */}
      <View style={[styles.actionContainer, { bottom: insets.bottom + 28 }]}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
          style={styles.skipTouchArea}
        >
          <Text style={styles.skipText}>Skip intro</Text>
        </TouchableOpacity>

        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            width: '100%',
            alignItems: 'center',
          }}
        >
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
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  fallbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  fallbackText: {
    fontSize: 28,
    fontFamily: Typography.fontFamily?.bold || 'Poppins-Bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 16,
    fontFamily: Typography.fontFamily?.regular || 'Poppins-Regular',
    color: '#646767',
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
  actionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    width: '100%',
    alignItems: 'center',
    zIndex: 20,
    paddingHorizontal: 24,
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
    width: '85%',
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize?.md || 16,
    fontFamily: Typography.fontFamily?.bold || 'Poppins-Bold',
    letterSpacing: 1.0,
  },
  skipTouchArea: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  skipText: {
    color: Colors.primary,
    fontSize: Typography.fontSize?.md || 15,
    fontFamily: Typography.fontFamily?.semibold || 'Poppins-SemiBold',
    letterSpacing: 0.3,
  },
});
