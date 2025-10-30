/**
 * Django Test Screen
 * 
 * Screen to test Django backend communication
 */

import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import DjangoConnectionTest from '../../components/testing/DjangoConnectionTest';

const DjangoTestScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <DjangoConnectionTest />
    </SafeAreaView>
  );
};

export default DjangoTestScreen;