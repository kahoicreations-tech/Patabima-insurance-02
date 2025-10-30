import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, RefreshControl, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, EnhancedCard, StatusBadge, ActionButton, StatCard } from '../../components';
import DjangoAPIService from '../../services/DjangoAPIService';

export default function ClaimsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [claimsData, setClaimsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const insets = useSafeAreaInsets();

  const mapClaim = (c) => {
    // Normalize backend shape to UI list
    return {
      id: c.id,
      category: c.product === 'MOTOR' ? 'Vehicle' : c.product,
      policyNo: c.policy_number,
      status: c.status || 'Pending',
      amount: c.estimated_amount ? `KES ${Number(c.estimated_amount).toLocaleString()}` : '',
      claimDate: c.date_created || c.loss_date,
      raw: c,
    };
  };

  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      await DjangoAPIService.initialize();
      const res = await DjangoAPIService.getClaims();
      const results = res?.results || res?.data?.results || [];
      setClaimsData(results.map(mapClaim));
    } catch (e) {
      // keep UI resilient, maybe show empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const pendingClaims = claimsData.filter(claim => claim.status === 'Pending');
  const processedClaims = claimsData.filter(claim => claim.status === 'Processed');

  const tabs = [
    { key: 'Pending', label: `Pending (${pendingClaims.length})` },
    { key: 'Processed', label: `Processed (${processedClaims.length})` }
  ];

  const currentData = activeTab === 'Pending' ? pendingClaims : processedClaims;
  const filteredData = useMemo(() => {
    let base = currentData.filter(item => 
      searchQuery === '' || 
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.policyNo?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (fromDate || toDate) {
      base = base.filter(item => {
        const d = new Date(item.claimDate || item.raw?.date_created).setHours(0,0,0,0);
        const from = fromDate ? new Date(fromDate).setHours(0,0,0,0) : null;
        const to = toDate ? new Date(toDate).setHours(23,59,59,999) : null;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    return base;
  }, [currentData, searchQuery, fromDate, toDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClaims();
    setRefreshing(false);
  };

  const getIconForCategory = (category) => {
    switch (category.toLowerCase()) {
      case 'vehicle': return '🚗';
      case 'medical': return '🏥';
      case 'wiba': return '👷';
      default: return '📋';
    }
  };

  const renderClaimCard = ({ item }) => (
    <EnhancedCard style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <View style={styles.claimCategoryContainer}>
          <View style={styles.categoryIconContainer}>
            <Text style={styles.categoryIcon}>{getIconForCategory(item.category)}</Text>
          </View>
          <View style={styles.claimInfo}>
            <Text style={styles.claimCategory}>{item.category}</Text>
            <Text style={styles.policyNumber}>Policy: {item.policyNo}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
      
      <View style={styles.claimDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Claim Date</Text>
            <Text style={styles.detailValue}>{new Date(item.claimDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, { color: Colors.success }]}>{item.amount}</Text>
          </View>
        </View>
        
        {item.status === 'Pending' && (
            <ActionButton
            title="View Details"
            icon="👁️"
            variant="secondary"
            size="small"
            onPress={() => navigation.navigate('ClaimDetails', { claim: item.raw })}
            style={styles.actionButton}
          />
        )}
      </View>
    </EnhancedCard>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Results Found' : `No ${activeTab} Claims`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? `No claims match your search "${searchQuery}"`
          : `There are currently no ${activeTab.toLowerCase()} claims.`
        }
      </Text>
    </View>
  );

  return (
    <SafeScreen>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Claims</Text>
          <Text style={styles.subtitle}>Track and manage your insurance claims</Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <StatCard
              title="Total Claims"
              value={claimsData.length.toString()}
              icon="📋"
              color={Colors.primary}
              style={styles.summaryCard}
            />
            <StatCard
              title="Pending"
              value={pendingClaims.length.toString()}
              icon="⏳"
              color={Colors.warning}
              style={styles.summaryCard}
            />
            <StatCard
              title="Processed"
              value={processedClaims.length.toString()}
              icon="✅"
              color={Colors.success}
              style={styles.summaryCard}
            />
          </View>
        </View>

        {/* Search Bar */}
        <EnhancedCard style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search claims by category or policy..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.sm }}>
            <TouchableOpacity style={[styles.dateChip, { flex: 1 }]} onPress={() => setShowFromPicker(true)}>
              <Text style={styles.dateChipLabel}>From</Text>
              <Text style={styles.dateChipValue}>{fromDate ? new Date(fromDate).toLocaleDateString() : 'Select date'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateChip, { flex: 1 }]} onPress={() => setShowToPicker(true)}>
              <Text style={styles.dateChipLabel}>To</Text>
              <Text style={styles.dateChipValue}>{toDate ? new Date(toDate).toLocaleDateString() : 'Select date'}</Text>
            </TouchableOpacity>
          </View>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate ? new Date(fromDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => {
                if (Platform.OS === 'android') setShowFromPicker(false);
                if (e?.type === 'dismissed') return;
                setFromDate(d);
              }}
            />
          )}
          {showToPicker && (
            <DateTimePicker
              value={toDate ? new Date(toDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => {
                if (Platform.OS === 'android') setShowToPicker(false);
                if (e?.type === 'dismissed') return;
                setToDate(d);
              }}
            />
          )}
        </EnhancedCard>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            renderItem={renderClaimCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  header: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.xxl,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.md,
  },
  summarySection: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    marginBottom: 0,
  },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.md,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  clearIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  dateChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
  },
  dateChipLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateChipValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  claimCard: {
    marginBottom: Spacing.md,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  claimCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  categoryIcon: {
    fontSize: 20,
  },
  claimInfo: {
    flex: 1,
  },
  claimCategory: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.md,
  },
  policyNumber: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  claimDetails: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.xs,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.sm,
  },
  actionButton: {
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.lg,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.md,
  },
});
