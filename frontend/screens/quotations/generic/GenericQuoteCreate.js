import React, { useEffect } from 'react';
import WIBAQuotationScreen from '../wiba/WIBAQuotationScreen';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * Simplified GenericQuoteCreate
 * The generic multi-line quoting flow has been removed; this component now delegates to WIBA.
 * If future lines are reintroduced, this file can become a router based on route.params.lineCode.
 */
export default function GenericQuoteCreate() {
  const route = useRoute();
  const navigation = useNavigation();
  const lineCode = route?.params?.lineCode;

  // If a different line code is passed that we don't support yet, fallback to WIBA for now.
  useEffect(() => { if (lineCode && lineCode !== 'WIBA') { console.log('[GenericQuoteCreate] Unsupported line', lineCode, 'falling back to WIBA'); } }, [lineCode]);

  return <WIBAQuotationScreen navigation={navigation} />;
}
