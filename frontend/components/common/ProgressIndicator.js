import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography } from '../../constants';

export default function ProgressIndicator({ 
  progress = 0, 
  total = 100, 
  label, 
  color = Colors.primary,
  height = 8,
  animated = true,
  showPercentage = true,
  style 
}) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const percentage = Math.min((progress / total) * 100, 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(percentage);
    }
  }, [progress, total, animated]);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
          )}
        </View>
      )}
      
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.progress,
            {
              backgroundColor: color,
              height,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

export function CircularProgress({ 
  progress = 0, 
  total = 100, 
  size = 80, 
  strokeWidth = 8,
  color = Colors.primary,
  backgroundColor = Colors.lightGray,
  children 
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const percentage = Math.min((progress / total) * 100, 100);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, total]);

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <View style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }
      ]} />
      
      {/* Progress circle overlay would need SVG implementation */}
      {/* For now, showing percentage in center */}
      <View style={styles.circularContent}>
        {children || (
          <Text style={styles.circularText}>{Math.round(percentage)}%</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  
  percentage: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  
  track: {
    backgroundColor: Colors.lightGray,
    borderRadius: 50,
    overflow: 'hidden',
  },
  
  progress: {
    borderRadius: 50,
  },
  
  circularContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  circle: {
    position: 'absolute',
  },
  
  circularContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  circularText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
});
