import React from 'react';
import { SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';

const SafeScreen = ({ children, style, backgroundColor = '#FFFFFF', statusBarStyle = 'light-content', disableTopPadding = false }) => {
  const insets = useSafeAreaInsets();

  const dynamicStyles = {
    // For Android, add top padding to avoid status bar overlap
    paddingTop: disableTopPadding ? 0 : (Platform.OS === 'android' ? StatusBar.currentHeight || insets.top : 0),
    backgroundColor,
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeScreen;
