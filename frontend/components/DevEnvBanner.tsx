import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DjangoAPIService from '../services/DjangoAPIService';
import StoragePurge from '../services/StoragePurge';

const DevEnvBanner: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [envUrl, setEnvUrl] = useState<string | undefined>(undefined);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    try {
      const env = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env : {};
      setEnvUrl(env.EXPO_PUBLIC_API_BASE_URL || env.EXPO_PUBLIC_API_URL);
    } catch {}
    try {
      setBaseUrl(DjangoAPIService.baseUrl);
    } catch {}
  }, []);

  const handlePurge = async () => {
    setClearing(true);
    try {
      await StoragePurge.purgeOnLogout();
    } catch (e) {
      // noop
    } finally {
      setClearing(false);
    }
  };

  if (!__DEV__) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.banner}>
        <Text style={styles.text}>
          API: {envUrl ? `${envUrl}` : '(env not set)'} | Active: {baseUrl || '(unknown)'}
        </Text>
        <TouchableOpacity style={styles.btn} onPress={handlePurge} disabled={clearing}>
          <Text style={styles.btnText}>{clearing ? 'Clearing…' : 'Purge Storage'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 },
  banner: { backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  text: { color: '#fff', fontSize: 12 },
  btn: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#D5222B', borderRadius: 4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});

export default DevEnvBanner;
