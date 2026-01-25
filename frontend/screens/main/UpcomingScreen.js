import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../constants';
import { getProductLabel } from '../../constants/insuranceCatalog';
import { SafeScreen, EnhancedCard, StatusBadge, ActionButton, StatCard, CompactCurvedHeader, SkeletonCard } from '../../components';
import djangoAPI from '../../services/DjangoAPIService';
import { useAppData } from '../../contexts/AppDataContext';

export default function UpcomingScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Renewals');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { renewals, extensions, motorPolicies, fetchRenewals, fetchExtensions, fetchMotorPolicies } = useAppData();
  const insets = useSafeAreaInsets();

  // Fetch all data only when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[UpcomingScreen] Screen focused, fetching data...');
      const fetchData = async () => {
        try {
          setIsLoading(true);
          await Promise.all([
            fetchRenewals(true),
            fetchExtensions(true),
            fetchMotorPolicies(true),
          ]);
          console.log('[UpcomingScreen] Data loaded - Extensions count:', extensions?.length || 0);
          console.log('[UpcomingScreen] Extensions data:', JSON.stringify(extensions, null, 2));
        } catch (error) {
          console.error('[UpcomingScreen] Failed to load data:', error);
          Alert.alert('Error', 'Failed to load some data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }, [])
  );

  const tabs = useMemo(() => ([
    { key: 'Renewals', label: `Renewals (${renewals.length})` },
    { key: 'Extensions', label: `Extensions (${extensions.length})` },
  ]), [renewals.length, extensions.length]);

  const getCurrentData = () => {
    switch (activeTab) {
      case 'Renewals': return renewals;
      case 'Extensions': return extensions;
      default: return [];
    }
  };

  const currentData = getCurrentData();
  const filteredData = currentData.filter(item => {
    if (searchQuery === '') return true;
    
    const searchLower = searchQuery.toLowerCase();
    // Renewals and Extensions use normalized backend data
    return item.policyNo?.toLowerCase().includes(searchLower) ||
           item.policy_number?.toLowerCase().includes(searchLower) ||
           item.vehicleReg?.toLowerCase().includes(searchLower) ||
           item.vehicle_reg?.toLowerCase().includes(searchLower);
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchRenewals(true),
        fetchExtensions(true),
        fetchMotorPolicies(true),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Active policy computation (pick ACTIVE policy with nearest expiry)
  const activePolicy = useMemo(() => {
    try {
      const actives = (motorPolicies || []).filter(p => (p.status || '').toUpperCase() === 'ACTIVE');
      if (!actives.length) return null;
      // Sort by cover_end_date ascending (soonest expiry first)
      actives.sort((a, b) => new Date(a.cover_end_date || a.cover_end || 0) - new Date(b.cover_end_date || b.cover_end || 0));
      return actives[0];
    } catch (e) {
      return null;
    }
  }, [motorPolicies]);

  // Helpers for derived fields
  const getDaysLeftColor = (days) => {
    if (days == null) return Colors.textSecondary;
    if (days <= 7) return '#DC2626'; // red
    if (days <= 30) return '#F59E0B'; // orange
    return '#10B981'; // green
  };

  const stripExtendibleSuffix = (name) => {
    if (!name) return name;
    return String(name).replace(/\s*\(Extendible\)\s*$/i, '');
  };

  const computeExtendibleInfo = (policy) => {
    try {
      const pd = policy?.product_details || {};
      const isExt = pd.is_extendible || policy?.isExtendible;
      if (!isExt) return null;
      const cfg = pd.extendible_config || pd.extendibleConfig;
      if (!cfg) return { isExtendible: true };
      const start = new Date(policy.cover_start_date || policy.cover_start || policy.coverStartDate || new Date());
      const initialDays = Number(cfg.initial_period_days || cfg.initialPeriodDays || 30);
      const deadlineDays = Number(cfg.extension_deadline_days || cfg.balanceDeadlineDays || cfg.grace_period_days || 60);
      const initialEnd = new Date(start.getTime() + initialDays * 24 * 60 * 60 * 1000);
      const balanceDeadline = new Date(initialEnd.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
      const today = new Date();
      const daysToInitialEnd = Math.ceil((initialEnd - today) / (1000 * 60 * 60 * 24));
      const daysToBalanceDeadline = Math.ceil((balanceDeadline - today) / (1000 * 60 * 60 * 24));
      return {
        isExtendible: true,
        initialEnd,
        balanceDeadline,
        daysToInitialEnd,
        daysToBalanceDeadline,
        initialAmount: cfg.initial_amount || cfg.initialAmount,
        balanceAmount: cfg.balance_amount || cfg.balanceAmount,
      };
    } catch (e) {
      return null;
    }
  };

  const renewalSections = useMemo(() => {
    if (activeTab !== 'Renewals') {
      return { expired: [], upcoming: [] };
    }
    const expired = [];
    const upcoming = [];
    for (const item of filteredData) {
      // Logic for expired vs upcoming
      // If daysLeft is negative or item is marked overdue
      if ((item.daysLeft !== undefined && item.daysLeft < 0) || item.urgency === 'OVERDUE') {
        expired.push(item);
      } else {
        upcoming.push(item);
      }
    }
    return { expired, upcoming };
  }, [activeTab, filteredData]);

  const renderRenewalCard = ({ item }) => {
    const daysLeft = item.daysLeft || 0;
    const pillColor = daysLeft <= 7 ? '#DC2626' : daysLeft <= 30 ? '#F59E0B' : '#10B981';

    return (
      <EnhancedCard style={styles.itemCard}>
        {/* Header Section */}
        <View style={styles.modernCardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
          </View>
          
          <View style={styles.headerContent}>
            <Text style={styles.vehicleTitle}>{item.vehicleReg}</Text>
            <Text style={styles.policyTypeLabel}>Policy Type: {item.productName || 'Motor Private'}</Text>
          </View>

          <View style={[styles.daysPill, { backgroundColor: pillColor }]}>
            <Text style={styles.daysPillText}>{daysLeft} Days</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details Section */}
        <View style={styles.dataRows}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Insurance Provider</Text>
            <Text style={styles.dataValue}>{item.underwriter || 'N/A'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Total Premium</Text>
            <Text style={styles.dataValue}>Ksh. {Number(item.currentPremium || 0).toLocaleString()} (net)</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Expiry Date</Text>
            <Text style={styles.dataValue}>{new Date(item.dueDate).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.renewButtonOutline}
          onPress={() => {
            Alert.alert(
              'Renew Policy',
              `Start renewal process for policy ${item.policyNo}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Renew',
                  onPress: () => {
                    navigation.navigate('Motor2', {
                      mode: 'renewal',
                      policyNumber: item.policyNo,
                      policyData: item
                    });
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.renewButtonText}>Renew Policy</Text>
        </TouchableOpacity>
      </EnhancedCard>
    );
  };

  // Helper function to calculate late fee based on days since expiry
  const calculateLateFee = (daysSinceExpiry) => {
    if (daysSinceExpiry <= 30) return 0; // No fee within 30 days
    if (daysSinceExpiry <= 60) return 5; // 5% fee 31-60 days
    if (daysSinceExpiry <= 90) return 10; // 10% fee 61-90 days
    return 15; // 15% fee after 90 days
  };

  const renderExtensionCard = ({ item }) => {
    const initialAmount = Number(item.initialAmount || item.initial_amount || 0);
    const balanceAmount = Number(item.balanceAmount || item.balance_amount || 0);
    const totalAnnualPremium = Number(item.totalAnnualPremium || (initialAmount + balanceAmount) || 0);
    const paidAmount = Number(item.paidAmount || item.paid_amount || initialAmount || 0);
    const certificatesIssued = item.certificatesIssued ?? item.certificates_issued;

    const rawPolicyType = item.coverType || item.productType || item.product_type || item.productName || item.product_name;
    const policyTypeLabel = stripExtendibleSuffix(getProductLabel(rawPolicyType) || rawPolicyType || '');

    const daysChip = (() => {
      const d1 = Number(item.daysToInitialEnd ?? item.days_to_initial_end);
      const d2 = Number(item.daysToBalanceDeadline ?? item.days_to_balance_deadline);
      if (!Number.isNaN(d1) && d1 > 0) return d1;
      if (!Number.isNaN(d2) && d2 >= 0) return d2;
      return 0;
    })();

    const expiryDate = item.cover_end || item.dueDate || item.expires_at;

    const canExtend = item.canExtend ?? item.can_extend;
    const ctaLabel = item.ctaLabel || item.cta_label || (canExtend === false ? 'Pending Valuation' : 'Extend Policy');

    return (
      <EnhancedCard style={styles.itemCard}>
        {/* Header Section */}
        <View style={styles.modernCardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="documents-outline" size={24} color={Colors.primary} />
          </View>
          
          <View style={styles.headerContent}>
            <Text style={styles.vehicleTitle}>{item.vehicleReg || item.vehicle_reg || 'N/A'}</Text>
            <Text style={styles.policyTypeLabel}>{policyTypeLabel || 'Motor Commercial'}</Text>
          </View>

          <View style={[styles.daysPill, { backgroundColor: '#10B981' }]}>
            <Text style={styles.daysPillText}>{daysChip} Days</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details Section */}
        <View style={styles.dataRows}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Insurance Provider</Text>
            <Text style={styles.dataValue}>{item.underwriterName || item.underwriter_name || 'N/A'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Total Premium</Text>
            <Text style={styles.dataValue}>Ksh. {Math.round(totalAnnualPremium).toLocaleString()} (gross)</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Certificates Issued</Text>
            <Text style={styles.dataValue}>{certificatesIssued ?? '0'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Premium Balance</Text>
            <Text style={styles.dataValue}>Ksh. {Math.round(balanceAmount).toLocaleString()}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Total Paid</Text>
            <Text style={styles.dataValue}>Ksh. {Math.round(paidAmount).toLocaleString()}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Expiry Date</Text>
            <Text style={styles.dataValue}>{expiryDate ? new Date(expiryDate).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.renewButtonOutline}
          disabled={canExtend === false}
          onPress={() => {
            navigation.navigate('Extension', { policy: item });
          }}
        >
          <Text style={styles.renewButtonText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </EnhancedCard>
    );
  };

  const renderCard = ({ item }) => {
    if (activeTab === 'Extensions') {
      return renderExtensionCard({ item });
    }
    return renderRenewalCard({ item });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{activeTab === 'Renewals' ? '📅' : '📄'}</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Results Found' : `No Upcoming ${activeTab}`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? `No ${activeTab.toLowerCase()} match your search "${searchQuery}"`
          : `There are currently no upcoming ${activeTab.toLowerCase()}.`
        }
      </Text>
    </View>
  );

  const extensionSections = useMemo(() => {
    if (activeTab !== 'Extensions') {
      return { overdue: [], upcoming: [] };
    }
    const overdue = [];
    const upcoming = [];
    for (const item of filteredData) {
      const daysToBalanceDeadline = Number(item.daysToBalanceDeadline ?? item.days_to_balance_deadline);
      if (!Number.isNaN(daysToBalanceDeadline) && daysToBalanceDeadline < 0) {
        overdue.push(item);
      } else {
        upcoming.push(item);
      }
    }
    return { overdue, upcoming };
  }, [activeTab, filteredData]);

  return (
    <SafeScreen disableTopPadding>
      <StatusBar style="light" />
      
      {/* Compact Curved Header */}
      <CompactCurvedHeader 
        title="Upcoming"
        subtitle="Manage renewals and extensions"
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* Spacing after curved header */}
        <View style={styles.headerSpacing} />

        {/* Summary Overview */}
        <View style={styles.summarySection}>
          <EnhancedCard style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewIcon}>
                <Text style={styles.overviewIconText}>📊</Text>
              </View>
              <View style={styles.overviewHeaderInfo}>
                <Text style={styles.overviewTitle}>Overview</Text>
                <Text style={styles.overviewSubtitle}>Total activities summary</Text>
              </View>
            </View>
            
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{renewals.length}</Text>
                <Text style={styles.statLabel}>Renewals</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{extensions.length}</Text>
                <Text style={styles.statLabel}>Extensions</Text>
              </View>
            </View>
          </EnhancedCard>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab.toLowerCase()}...`}
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
        </View>

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
        {isLoading ? (
          <View>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : activeTab === 'Extensions' ? (
          <View>
            <Text style={styles.sectionHeader}>Overdue ({extensionSections.overdue.length})</Text>
            {extensionSections.overdue.length > 0 ? (
              <FlatList
                data={extensionSections.overdue}
                renderItem={renderCard}
                keyExtractor={(item) => `Extensions-overdue-${item.id || item.policyNo || item.policy_number}`}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : null}

            <Text style={[styles.sectionHeader, { marginTop: Spacing.md }]}>Upcoming ({extensionSections.upcoming.length})</Text>
            {extensionSections.upcoming.length > 0 ? (
              <FlatList
                data={extensionSections.upcoming}
                renderItem={renderCard}
                keyExtractor={(item) => `Extensions-upcoming-${item.id || item.policyNo || item.policy_number}`}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              renderEmptyState()
            )}
          </View>
        ) : activeTab === 'Renewals' ? (
          <View>
            <Text style={styles.sectionHeader}>Expired ({renewalSections.expired.length})</Text>
            {renewalSections.expired.length > 0 ? (
              <FlatList
                data={renewalSections.expired}
                renderItem={renderCard}
                keyExtractor={(item) => `Renewals-expired-${item.id || item.policyNo || item.policy_number}`}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : null}

            <Text style={[styles.sectionHeader, { marginTop: Spacing.md }]}>Upcoming ({renewalSections.upcoming.length})</Text>
            {renewalSections.upcoming.length > 0 ? (
              <FlatList
                data={renewalSections.upcoming}
                renderItem={renderCard}
                keyExtractor={(item) => `Renewals-upcoming-${item.id || item.policyNo || item.policy_number}`}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
                // Only show empty state if BOTH sections are empty
                renewalSections.expired.length === 0 ? renderEmptyState() : null
            )}
          </View>
        ) : filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            renderItem={renderCard}
            keyExtractor={(item) => `${activeTab}-${item.id || item.policyNo || item.policy_number}-${item.policyNo || item.policy_number}`}
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
  headerSpacing: {
    height: Spacing.lg,
  },
  summarySection: {
    marginBottom: Spacing.lg,
  },
  activePolicyCard: {
    padding: Spacing.md,
  },
  overviewCard: {
    padding: Spacing.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  overviewIconText: {
    fontSize: 24,
  },
  overviewHeaderInfo: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.lg,
  },
  overviewSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.xl,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  searchContainer: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    height: 40,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    opacity: 0.5,
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
  itemCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  policyNo: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.md,
  },
  vehicleReg: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  cardDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    marginBottom: Spacing.xs,
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
    minWidth: 120,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  extendibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  extendibleBannerInfo: {
    backgroundColor: Colors.primaryLight,
  },
  extendibleBannerUrgent: {
    backgroundColor: '#FEE2E2', // light red
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  extendibleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.sm,
  },
  extendibleSubtext: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timelineSection: {
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  timelineMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneItem: {
    flex: 1,
    alignItems: 'center',
  },
  milestoneLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  milestoneDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  milestoneDays: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
  milestoneDivider: {
    width: 2,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  extensionInfoUrgent: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  detailSubtext: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  productType: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  totalPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    // Modern elevation
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  transactionSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  extensionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    // Modern elevation
    elevation: 1,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  extensionInfoUrgent: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: Colors.error,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: Colors.error,
    shadowOpacity: 0.15,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.sm,
  },
  urgentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
    lineHeight: Typography.lineHeight.sm,
  },
  extensionReason: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  reasonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: Typography.lineHeight.sm,
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
  sectionHeader: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  extensionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  extensionReg: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  extensionPolicyType: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  daysPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  daysPillText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  extensionDetails: {
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  extensionDetailLine: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  
  // Modern Card Styles
  modernCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  policyTypeLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.sm,
  },
  dataRows: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  dataLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
  },
  dataValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
  },
  renewButtonOutline: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  renewButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
});

