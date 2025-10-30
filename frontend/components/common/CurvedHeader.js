import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, UI, SPACING, FONT_SIZES } from '../../theme';
import Heading from './Heading';
import Text from './TextDS';

const CurvedHeader = ({ 
  title, 
  subtitle, 
  showLogo = true, 
  rightComponent,
  onLogoPress,
  backgroundColor = BRAND.primary,
  height, // optional explicit pixel height; otherwise computed from ratio
  heightRatio = 0.28 // default: ~28% of screen width for full header
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Compute base height from ratio of screen width if not provided explicitly
  const computedBase = Math.round(screenWidth * (Number(heightRatio) || 0.28));
  // Clamp to reasonable bounds for phones/tablets
  const clampedBase = Math.max(120, Math.min(220, computedBase));
  const baseHeight = typeof height === 'number' && Number.isFinite(height) ? height : clampedBase;

  const headerTopPadding = Math.max(SPACING.lg, insets.top * 0.6);
  const controlTop = SPACING.lg + Math.max(0, insets.top * 0.25);
  const notchReserve = Math.max(16, Math.min(insets.top, 24));
  const effectiveHeight = baseHeight + notchReserve;

  return (
    <View style={[
      styles.curvedHeader, 
      { 
        backgroundColor,
        paddingTop: headerTopPadding,
        height: effectiveHeight
      }
    ]}>
      {/* Logo Container */}
      {showLogo && (
        <TouchableOpacity 
          style={styles.logoContainer}
          onPress={onLogoPress}
          activeOpacity={0.8}
        >
          <Image 
            source={require('../../assets/PataLogo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
      
      {/* Header Content */}
      <View style={styles.headerContent}>
        {title && (
          <Heading level={2} color={UI.surface} style={styles.headerTitle}>{title}</Heading>
        )}
        {subtitle && (
          <Text variant="caption" style={styles.headerSubtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Right Component (e.g., logout button) */}
      {rightComponent && (
        <View style={[styles.rightComponent, { top: controlTop }]}>
          {rightComponent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  curvedHeader: {
    backgroundColor: BRAND.primary,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    position: 'relative',
  },
  logoContainer: {
    width: 70,
    height: 70,
    backgroundColor: UI.surface,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 45,
    height: 45,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    // Heading handles font styles; keep spacing only
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: UI.surface + 'CC', // 80% opacity
    textAlign: 'center',
  },
  rightComponent: {
    position: 'absolute',
    right: SPACING.lg,
  },
});

export default CurvedHeader;
