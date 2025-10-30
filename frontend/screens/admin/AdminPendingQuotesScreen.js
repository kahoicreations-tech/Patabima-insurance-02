import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/DjangoAPIService';
import { Colors, Spacing, Typography } from '../../constants';

export default function AdminPendingQuotesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPending = useCallback(async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);
      await api.initialize();
      const data = await api.listPendingAdminQuotes();
      setQuotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load pending quotes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const onRefresh = () => { setRefreshing(true); fetchPending(); };

  const approve = async (quoteNumber) => {
    try {
      await api.approveGenericQuote(quoteNumber);
      Alert.alert('Approved', `Quote ${quoteNumber} approved.`);
      fetchPending();
    } catch (e) { Alert.alert('Error', e.message); }
  };
  const reject = async (quoteNumber) => {
    Alert.alert('Reject Quote', `Are you sure you want to reject ${quoteNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try { await api.rejectGenericQuote(quoteNumber); Alert.alert('Rejected', `Quote ${quoteNumber} rejected.`); fetchPending(); } catch(e){ Alert.alert('Error', e.message);} }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    const pricing = item.pricing_breakdown || {}; 
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.quoteNumber}>{item.quote_number}</Text>
          <Text style={styles.lineTag}>{item.line?.code}</Text>
        </View>
        <Text style={styles.productName}>{item.product?.name}</Text>
        <Text style={styles.status}>Status: {item.status}</Text>
        {pricing.total_premium && <Text style={styles.premium}>Premium: {pricing.total_premium}</Text>}
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => approve(item.quote_number)} style={[styles.actionBtn, styles.approveBtn]}>
            <Text style={styles.actionText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => reject(item.quote_number)} style={[styles.actionBtn, styles.rejectBtn]}>
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}> 
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12 }}>Loading pending quotes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}> 
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Pending Quotes</Text>
        <View style={{ width: 50 }} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.quote_number}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading && (<Text style={{ textAlign:'center', marginTop:40 }}>No pending quotes.</Text>)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.md, paddingVertical:Spacing.sm, borderBottomWidth:1, borderBottomColor:'#eee' },
  backText: { color: Colors.primary, fontSize: Typography.fontSize.md, fontWeight:'500' },
  title: { fontSize: Typography.fontSize.lg, fontWeight:'600', color: Colors.textPrimary },
  error: { color:'red', padding:Spacing.md },
  card: { backgroundColor:'#fafafa', borderRadius:8, padding:12, marginBottom:12, borderWidth:1, borderColor:'#eee' },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:4 },
  quoteNumber: { fontWeight:'700', color:'#111' },
  lineTag: { fontSize:12, backgroundColor:'#D5222B', color:'#fff', paddingHorizontal:6, borderRadius:4, overflow:'hidden' },
  productName: { fontSize:14, fontWeight:'600', marginBottom:4 },
  status: { fontSize:12, color:'#555', marginBottom:4 },
  premium: { fontSize:14, fontWeight:'700', color: Colors.primary, marginBottom:8 },
  actionsRow: { flexDirection:'row' },
  actionBtn: { flex:1, paddingVertical:10, borderRadius:6, alignItems:'center', marginRight:8 },
  approveBtn: { backgroundColor:'#0a8f3a' },
  rejectBtn: { backgroundColor:'#b00020', marginRight:0 },
  actionText: { color:'#fff', fontWeight:'600' }
});
