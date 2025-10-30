import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing } from '../../constants';

export default function SkeletonLoader({ width = '100%', height = 20, style, animated = true }) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animated, animatedValue]);

  const backgroundColor = animated
    ? animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [Colors.backgroundSecondary, Colors.border],
      })
    : Colors.backgroundSecondary;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ children, loading = true }) {
  if (!loading) return children;

  return (
    <View style={styles.card}>
      <SkeletonLoader height={24} style={{ marginBottom: Spacing.sm }} />
      <SkeletonLoader height={16} width="80%" style={{ marginBottom: Spacing.xs }} />
      <SkeletonLoader height={16} width="60%" style={{ marginBottom: Spacing.sm }} />
      <View style={styles.row}>
        <SkeletonLoader height={12} width="30%" style={{ marginRight: Spacing.sm }} />
        <SkeletonLoader height={12} width="25%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
