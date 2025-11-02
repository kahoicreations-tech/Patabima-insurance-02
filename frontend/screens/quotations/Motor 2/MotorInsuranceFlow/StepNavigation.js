import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Compact progress indicator + navigation row
export default function StepNavigation({
  steps = [],
  current = 0,
  onNext,
  onBack,
  canNext = true,
  showBackOnFirstStep = false,
  isFirstStep = false,
  onHome,
  validationMessage,
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.wrapper}>
      <View style={styles.progressRow}>
        {steps.map((step, idx) => {
          const isActive = idx === current;
          const label = step === 'Category' ? 'Vehicle Type' : step;
          return (
            <View key={`${step}-${idx}`} style={isActive ? styles.activeStep : styles.dotSmall}>
              <Text style={isActive ? styles.activeIndex : styles.dotIndex}>{idx + 1}</Text>
              {isActive && <Text style={styles.activeLabel}>{label}</Text>}
            </View>
          );
        })}
      </View>

      <View style={[styles.navRow, { paddingBottom: insets.bottom + 8 }]}>
        {!isFirstStep ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75}>
            <Ionicons name="chevron-back" size={20} color="#495057" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          showBackOnFirstStep && (
            <TouchableOpacity style={styles.backButton} onPress={onHome} activeOpacity={0.75}>
              <Ionicons name="home-outline" size={20} color="#495057" />
              <Text style={styles.backText}>Home</Text>
            </TouchableOpacity>
          )
        )}

        <View style={{ flex: 1 }} />

        {!isFirstStep && (
          <TouchableOpacity
            style={[styles.nextButton, !canNext && styles.nextDisabled]}
            onPress={onNext}
            disabled={!canNext}
            activeOpacity={0.75}
          >
            <Text style={styles.nextText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {!!validationMessage && (
        <Text style={styles.validation}>{validationMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  dotSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  dotIndex: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  activeStep: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  activeIndex: { color: '#fff', fontWeight: '700' },
  activeLabel: { color: '#fff', fontWeight: '600' },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 8 },
  backText: { color: '#374151', fontWeight: '600' },
  nextButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#111827', borderRadius: 8 },
  nextDisabled: { opacity: 0.5 },
  nextText: { color: '#fff', fontWeight: '700' },
  validation: { color: '#DC2626', paddingHorizontal: 12, paddingTop: 4 },
});
