import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, UI, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../theme';
import Heading from './Heading';
import Text from './TextDS';

const CompactCurvedHeader = ({ 
  title, 
  subtitle, 
  rightComponent,
  backgroundColor = BRAND.primary,
  height, // optional explicit pixel height; otherwise computed from ratio
  heightRatio = 0.22, // default: 22% of screen width
  onBackPress,
  showBackButton = false,
  showLogo = false,
  logoSource
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Compute base height from ratio of screen width if not provided explicitly
  const computedBase = Math.round(screenWidth * (Number(heightRatio) || 0.22));
  // Clamp to reasonable bounds for phones/tablets
  const clampedBase = Math.max(84, Math.min(140, computedBase));
  const baseHeight = typeof height === 'number' && Number.isFinite(height) ? height : clampedBase;

  // Use safe-area top directly for robust punch-hole/notch clearance
  const headerTopPadding = insets.top + SPACING.md;
  const controlTop = SPACING.md + Math.max(0, insets.top * 0.3);
  // Anchor controls slightly below the padded header top so they don't collide with the notch/punch-hole
  const controlTopAbsolute = Math.max(SPACING.sm, headerTopPadding - SPACING.sm);
  const notchReserve = Math.max(20, Math.min(insets.top, 28));
  const effectiveHeight = baseHeight + notchReserve; // small reserve; keep header compact

  return (
    <>
      {/* Status bar area background */}
      <View style={[
        styles.statusBarBg,
        { 
          backgroundColor,
          height: insets.top 
        }
      ]} />
      
      {/* Main curved header */}
      <View style={[
        styles.curvedHeader, 
        { 
          backgroundColor,
          height: effectiveHeight,
          paddingTop: headerTopPadding,
        }
      ]}>
        {/* Back Button */}
        {showBackButton && onBackPress && (
          <TouchableOpacity 
            style={[styles.backButton, { top: controlTopAbsolute }]}
            onPress={onBackPress}
          >
            <Text variant="bodyBold" style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        
        {/* Header Content */}
        <View style={styles.headerContent}>
          {showLogo && logoSource ? (
            <View style={styles.logoContainer}>
              <View style={styles.logoBg}>
                <Image 
                  source={logoSource} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.textContainer}>
                {title && (
                  <Heading level={2} color={UI.surface} style={styles.headerTitle}>{title}</Heading>
                )}
                {subtitle && (
                  <Text variant="caption" style={styles.headerSubtitle}>{subtitle}</Text>
                )}
              </View>
            </View>
          ) : (
            <>
              {title && (
                <Heading level={2} color={UI.surface} style={styles.headerTitle}>{title}</Heading>
              )}
              {subtitle && (
                <Text variant="caption" style={styles.headerSubtitle}>{subtitle}</Text>
              )}
            </>
          )}
        </View>

        {/* Right Component (e.g., logout button) */}
        {(rightComponent !== undefined && rightComponent !== null) && (
          <View style={[styles.rightComponent, { top: controlTopAbsolute }] }>
            {typeof rightComponent === 'string' ? (
              <Text variant="bodyBold" style={styles.rightComponentText}>{rightComponent}</Text>
            ) : (
              rightComponent
            )}
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  statusBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  curvedHeader: {
    backgroundColor: BRAND.primary,
  paddingBottom: SPACING.md,
    paddingTop: 0, // default; overridden per device using insets
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  position: 'relative',
  overflow: 'visible', // avoid any accidental clipping on punch-hole devices
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    // Heading handles fontFamily/weight/lineHeight; we keep spacing tweaks
    marginBottom: 2,
    textAlign: 'center',
    fontSize: 22, // Increased from default to make bigger than logo
  },
  headerSubtitle: {
    color: UI.surface + 'CC',
    textAlign: 'center',
    opacity: 0.9,
    fontSize: 13, // Increased from default
  },
  rightComponent: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    zIndex: 2,
  },
  rightComponentText: {
    color: UI.surface,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    top: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.h1,
    color: UI.surface,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBg: {
    backgroundColor: UI.surface,
    width: 50,
    height: 50,
    borderRadius: 25, // Adjusted for circular
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
    // subtle shadow for better separation on colored backgrounds
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  logo: {
    width: 38, // Made smaller than before
    height: 38, // Made smaller than before
  },
  textContainer: {
    alignItems: 'flex-start',
  },
});

export default CompactCurvedHeader;
