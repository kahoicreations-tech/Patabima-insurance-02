/**
 * Commercial Insurer Selection Step Component - MINIMAL TEST VERSION
 */

import React from 'react';
import { View, Text } from 'react-native';

const CommercialInsurerSelectionStep = (props) => {
  console.log('MINIMAL TEST: Component started executing!');
  console.log('MINIMAL TEST: Props received:', Object.keys(props || {}));
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, textAlign: 'center' }}>
        MINIMAL TEST: CommercialInsurerSelectionStep is working!
      </Text>
      <Text style={{ fontSize: 14, textAlign: 'center', marginTop: 10 }}>
        Props received: {Object.keys(props || {}).join(', ')}
      </Text>
    </View>
  );
};

export default CommercialInsurerSelectionStep;
