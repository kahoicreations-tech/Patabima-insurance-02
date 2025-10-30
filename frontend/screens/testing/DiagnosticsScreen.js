import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import djangoAPI from '../../services/DjangoAPIService';

export default function DiagnosticsScreen() {
  const [info, setInfo] = useState({ baseUrl: '', hasToken: false, hasRefresh: false, hasAgent: false, pings: {} });

  const refresh = async () => {
    await djangoAPI.initialize();
    const baseUrl = djangoAPI.baseUrl;
    const token = await AsyncStorage.getItem('auth_token');
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    const agent = await AsyncStorage.getItem('agent_data');
    setInfo(prev => ({ ...prev, baseUrl, hasToken: !!token, hasRefresh: !!refreshToken, hasAgent: !!agent }));
  };

  const ping = async () => {
    const res = {};
    try { res.cover = await djangoAPI.getCoverOptions(); } catch (e) { res.cover = e?.message || 'fail'; }
    try { res.unders = await djangoAPI.getUnderwriters(); } catch (e) { res.unders = e?.message || 'fail'; }
    setInfo(prev => ({ ...prev, pings: res }));
  };

  useEffect(() => { refresh(); }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Diagnostics</Text>
      <Text>Base URL: {info.baseUrl}</Text>
      <Text>Has Token: {String(info.hasToken)}</Text>
      <Text>Has Refresh: {String(info.hasRefresh)}</Text>
      <Text>Has Agent Data: {String(info.hasAgent)}</Text>
      <View style={{ height: 16 }} />
      <TouchableOpacity style={styles.button} onPress={refresh}><Text style={styles.btntxt}>Refresh</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={ping}><Text style={styles.btntxt}>Ping Endpoints</Text></TouchableOpacity>
      <View style={{ height: 16 }} />
      <Text>Ping Results: {JSON.stringify(info.pings)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontWeight: '700', fontSize: 18, marginBottom: 12 },
  button: { padding: 12, backgroundColor: '#D5222B', borderRadius: 8, marginVertical: 6, alignItems: 'center' },
  btntxt: { color: '#fff' },
});
