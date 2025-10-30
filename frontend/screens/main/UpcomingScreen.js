import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, RefreshControl, Alert } from 'react-native';
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
  const [expandedExtensions, setExpandedExtensions] = useState({}); // Track which extensions are expanded
  const { renewals, extensions, claims, motorPolicies, fetchRenewals, fetchExtensions, fetchClaims, fetchMotorPolicies } = useAppData();
  const insets = useSafeAreaInsets();

  // Normalize claim records from backend to UI shape
  const mapClaim = useCallback((c) => ({
    id: c.id,
    claimNo: c.id,
    category: c.product || 'MOTOR',
    policyNo: c.policy_number,
    vehicleReg: c.vehicle_reg || '',
    status: c.status || 'SUBMITTED',
    amount: c.estimated_amount ? `KES ${Number(c.estimated_amount).toLocaleString()}` : undefined,
    claimDate: c.loss_date,
    submissionDate: c.date_created,
    description: c.loss_description,
    documents: Array.isArray(c.documents) ? c.documents.map(d => d.file_name) : [],
  }), []);

  // Map claims for UI shape
  const mapAndSetClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchClaims();
      // Claims in context are raw; map locally for UI
      return (list || []).map(mapClaim);
    } catch (e) {
      console.error('Failed to load claims:', e);
      Alert.alert('Error', 'Failed to load claims. Please try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [fetchClaims, mapClaim]);

  // Fetch all data only when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[UpcomingScreen] Screen focused, fetching data...');
      const fetchData = async () => {
        try {
          setIsLoading(true);
          await Promise.all([
            fetchRenewals(),
            fetchExtensions(),
            fetchClaims(),
            fetchMotorPolicies(),
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
    { key: 'Claims', label: `Claims (${claims.length})` }
  ]), [renewals.length, extensions.length, claims.length]);

  const getCurrentData = () => {
    switch (activeTab) {
      case 'Renewals': return renewals;
      case 'Extensions': return extensions;
      case 'Claims': return claims;
      default: return [];
    }
  };

  const currentData = getCurrentData();
  const filteredData = currentData.filter(item => {
    if (searchQuery === '') return true;
    
    const searchLower = searchQuery.toLowerCase();
    if (activeTab === 'Claims') {
      return item.category?.toLowerCase().includes(searchLower) ||
             item.policyNo?.toLowerCase().includes(searchLower);
    } else {
      // Renewals and Extensions use normalized backend data
      return item.policyNo?.toLowerCase().includes(searchLower) ||
             item.policy_number?.toLowerCase().includes(searchLower) ||
             item.vehicleReg?.toLowerCase().includes(searchLower) ||
             item.vehicle_reg?.toLowerCase().includes(searchLower);
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchRenewals(),
        fetchExtensions(),
        fetchClaims(),
        fetchMotorPolicies(),
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

  const renderRenewalCard = ({ item }) => (
    <EnhancedCard style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.policyNo}>Policy: {item.policyNo}</Text>
          <Text style={styles.vehicleReg}>Vehicle: {item.vehicleReg}</Text>
        </View>
        <StatusBadge 
          status={item.status} 
          color={item.badgeColor || (item.urgency === 'OVERDUE' ? '#DC2626' : item.urgency === 'URGENT' ? '#F59E0B' : '#3B82F6')} 
        />
      </View>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>{new Date(item.dueDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Days Left</Text>
            <Text style={[
              styles.detailValue,
              { color: item.daysLeft <= 7 ? '#DC2626' : item.daysLeft <= 30 ? '#F59E0B' : '#10B981' }
            ]}>
              {item.daysLeft || 0} days
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Premium</Text>
            <Text style={styles.detailValue}>KES {Number(item.currentPremium || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Underwriter</Text>
            <Text style={styles.detailValue}>{item.underwriter || 'N/A'}</Text>
          </View>
        </View>
        
        <ActionButton
          title="Renew Now"
          icon="🔄"
          size="small"
          variant={item.urgency === 'OVERDUE' || item.urgency === 'URGENT' ? 'primary' : 'secondary'}
          onPress={() => {
            // Navigate to Motor 2 flow with renewal data
            Alert.alert(
              'Renew Policy',
              `Start renewal process for policy ${item.policyNo}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Renew',
                  onPress: () => {
                    // TODO: Navigate to Motor2Flow with prefilled renewal data
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
          style={styles.actionButton}
        />
      </View>
    </EnhancedCard>
  );

  // Helper function to calculate late fee based on days since expiry
  const calculateLateFee = (daysSinceExpiry) => {
    if (daysSinceExpiry <= 30) return 0; // No fee within 30 days
    if (daysSinceExpiry <= 60) return 5; // 5% fee 31-60 days
    if (daysSinceExpiry <= 90) return 10; // 10% fee 61-90 days
    return 15; // 15% fee after 90 days
  };

  const renderExtensionCard = ({ item }) => {
    // For active extendible policies from backend, show extension timeline
    const today = new Date();
    const isExpanded = expandedExtensions[item.id] || false;
    
    // Backend provides these fields from the extension endpoint
    const initialEnd = new Date(item.initialPeriodEnd || item.initial_period_end);
    const balanceDeadline = new Date(item.balanceDeadline || item.balance_deadline);
    const daysToInitialEnd = item.daysToInitialEnd || Math.ceil((initialEnd - today) / (1000 * 60 * 60 * 24));
    const daysToBalanceDeadline = item.daysToBalanceDeadline || Math.ceil((balanceDeadline - today) / (1000 * 60 * 60 * 24));
    const isUrgent = daysToBalanceDeadline <= 7;
    
    const initialAmount = item.initialAmount || item.initial_amount || 0;
    const balanceAmount = item.balanceAmount || item.balance_amount || 0;
    const totalAnnualPremium = initialAmount + balanceAmount;
    
    // Format product name for display
    const rawProductName = item.productName || item.product_name || 'EXTENDIBLE';
    const formattedProductName = getProductLabel(rawProductName) || rawProductName.replace(/_/g, ' ');
    const displayProductName = `${formattedProductName} (Extendible)`;
    
    return (
      <EnhancedCard style={styles.itemCard}>
        {/* Collapsible Header */}
        <TouchableOpacity 
          onPress={() => setExpandedExtensions(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.policyNo}>Policy: {item.policyNo || item.policy_number}</Text>
              <Text style={styles.vehicleReg}>Vehicle: {item.vehicleReg || item.vehicle_reg}</Text>
              <Text style={styles.productType}>{displayProductName}</Text>
              {!isExpanded && (
                <Text style={[styles.detailSubtext, { color: isUrgent ? Colors.error : Colors.warning, marginTop: 4 }]}>
                  Balance due in {daysToBalanceDeadline} days • KSh {balanceAmount.toLocaleString()}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <StatusBadge 
                status={item.status} 
                color={item.badgeColor} 
              />
              <Text style={{ fontSize: 20, marginTop: 8 }}>{isExpanded ? '▼' : '▶'}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.cardDetails}>
            {/* Extension Timeline Progress */}
            <View style={styles.timelineSection}>
              <Text style={styles.timelineTitle}>Extension Timeline</Text>
              
              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, ((item.initial_period_days || 30) + (item.grace_total_days || 60) - daysToBalanceDeadline) / ((item.initial_period_days || 30) + (item.grace_total_days || 60)) * 100))}%` }]} />
              </View>
              
              {/* Timeline milestones */}
              <View style={styles.timelineMilestones}>
                <View style={styles.milestoneItem}>
                  <Text style={styles.milestoneLabel}>Initial Period</Text>
                  <Text style={styles.milestoneDate}>{initialEnd.toLocaleDateString()}</Text>
                  <Text style={[styles.milestoneDays, { color: daysToInitialEnd <= 0 ? Colors.textSecondary : Colors.primary }]}>
                    {daysToInitialEnd > 0 ? `${daysToInitialEnd} days` : 'Ended'}
                  </Text>
                </View>
                
                <View style={styles.milestoneDivider} />
                
                <View style={styles.milestoneItem}>
                  <Text style={styles.milestoneLabel}>Balance Deadline</Text>
                  <Text style={styles.milestoneDate}>{balanceDeadline.toLocaleDateString()}</Text>
                  <Text style={[styles.milestoneDays, { color: isUrgent ? Colors.error : Colors.warning }]}>
                    {daysToBalanceDeadline} days
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Payment Information */}
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Initial Paid</Text>
                <Text style={[styles.detailValue, { color: Colors.success }]}>
                  KSh {initialAmount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Balance Due</Text>
                <Text style={[styles.detailValue, { color: isUrgent ? Colors.error : Colors.warning }]}>
                  KSh {balanceAmount.toLocaleString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.totalPaymentRow}>
              <Text style={styles.totalLabel}>Total Annual Premium</Text>
              <Text style={styles.totalAmount}>KSh {totalAnnualPremium.toLocaleString()}</Text>
            </View>
            
            {/* Transaction & Underwriter Details */}
            {(item.transactionId || item.transaction_id || item.underwriterName || item.underwriter_name) && (
              <View style={styles.transactionSection}>
                {(item.underwriterName || item.underwriter_name) && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Insurer</Text>
                      <Text style={styles.detailValue}>
                        {item.underwriterName || item.underwriter_name}
                      </Text>
                    </View>
                  </View>
                )}
                {(item.transactionId || item.transaction_id) && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Transaction ID</Text>
                      <Text style={[styles.detailValue, { fontSize: 11 }]}>
                        {item.transactionId || item.transaction_id}
                      </Text>
                    </View>
                    {(item.paidAmount || item.paid_amount) && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Paid</Text>
                        <Text style={[styles.detailValue, { color: Colors.success }]}>
                          KSh {(item.paidAmount || item.paid_amount).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
            
            {/* Extension Info */}
            <View style={[styles.extensionInfo, isUrgent && styles.extensionInfoUrgent]}>
              <Text style={styles.infoIcon}>{isUrgent ? '⚠️' : 'ℹ️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoText}>
                  {daysToInitialEnd > 0 
                    ? `Initial coverage active. Balance payment extends coverage for the full year.`
                    : `Initial period ended. Pay balance within ${daysToBalanceDeadline} days to complete annual coverage.`
                  }
                </Text>
                {isUrgent && (
                  <Text style={[styles.infoText, { color: Colors.error, marginTop: 4 }]}>
                    Urgent: Balance deadline approaching!
                  </Text>
                )}
              </View>
            </View>
            
            {/* Action Button */}
            <ActionButton
              title={`Pay Balance (KSh ${Math.round(balanceAmount).toLocaleString()})`}
              icon="💰"
              size="medium"
              variant={isUrgent ? 'primary' : 'secondary'}
              onPress={() => {
                // Navigate to extension payment screen
                navigation.navigate('ExtensionPayment', {
                  policyId: item.id,
                  policyNumber: item.policyNo || item.policy_number,
                  balanceAmount,
                  lateFeePercentage: 0,
                  totalAmount: Math.round(balanceAmount),
                  vehicleReg: item.vehicleReg || item.vehicle_reg,
                  productName: item.productName || item.product_name,
                  extensionDays: item.grace_total_days,
                  coverEndDate: item.cover_end,
                  isActiveExtension: true,
                });
              }}
              style={styles.actionButton}
            />
          </View>
        )}
      </EnhancedCard>
    );
  };

  const renderClaimCard = ({ item }) => (
    <EnhancedCard style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.policyNo}>{item.category}</Text>
          <Text style={styles.vehicleReg}>Policy: {item.policyNo}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
      
      <View style={styles.cardDetails}>
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
        
        <ActionButton
          title={item.status === 'Pending' ? 'View & Track' : 'View Details'}
          icon="👁️"
          variant={item.status === 'Pending' ? 'primary' : 'secondary'}
          size="small"
          onPress={() => {
            console.log('Viewing details for claim:', item.claimNo);
            navigation.navigate('ClaimDetails', { claim: item });
          }}
          style={styles.actionButton}
        />
      </View>
    </EnhancedCard>
  );

  const renderCard = ({ item }) => {
    if (activeTab === 'Claims') {
      return renderClaimCard({ item });
    }
    if (activeTab === 'Extensions') {
      return renderExtensionCard({ item });
    }
    return renderRenewalCard({ item });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'Renewals' ? '📅' : activeTab === 'Claims' ? '📋' : '📄'}
      </Text>
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

  return (
    <SafeScreen disableTopPadding>
      <StatusBar style="light" />
      
      {/* Compact Curved Header */}
      <CompactCurvedHeader 
        title="Upcoming & Claims"
        subtitle="Manage renewals and track claims"
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
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{claims.length}</Text>
                <Text style={styles.statLabel}>Claims</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: Colors.warning }]}>
                  {claims.filter(c => (c.status || '').toUpperCase() === 'PENDING').length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
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

        {/* Submit New Claim Button - Only show when Claims tab is active */}
        {activeTab === 'Claims' && (
          <View style={styles.submitClaimSection}>
            <ActionButton
              title="Submit New Claim"
              icon="📝"
              onPress={() => navigation.navigate('ClaimsSubmission')}
              style={styles.submitClaimButton}
            />
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
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
  submitClaimSection: {
    marginBottom: Spacing.md,
  },
  submitClaimButton: {
    marginHorizontal: 0,
  },
});

