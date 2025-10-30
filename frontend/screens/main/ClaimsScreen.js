import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal } from 'react-native';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, EnhancedCard, StatusBadge, CompactCurvedHeader } from '../../components';

export default function ClaimsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('claimDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const insets = useSafeAreaInsets();

  // Enhanced claims data with more fields for better filtering and sorting
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const claimsData = [
    {
      id: 1,
      claimNo: 'CLM-001234',
      category: 'Vehicle',
      policyNo: 'POL-001234',
      vehicleReg: 'KCD 123A',
      status: 'Processed',
      amount: 'KES 45,000',
      numericAmount: 45000,
      claimDate: '2025-06-28',
      submissionDate: '2025-06-28',
      priority: 'Medium',
      estimatedDays: 0,
      agentCommission: 2250
    },
    {
      id: 2,
      claimNo: 'CLM-002345',
      category: 'Medical',
      policyNo: 'POL-002345',
      status: 'Pending',
      amount: 'KES 12,500',
      numericAmount: 12500,
      claimDate: '2025-07-01',
      submissionDate: '2025-07-01',
      priority: 'High',
      estimatedDays: 3,
      agentCommission: 625
    },
    {
      id: 3,
      claimNo: 'CLM-003456',
      category: 'WIBA',
      policyNo: 'POL-003456',
      status: 'Processed',
      amount: 'KES 28,750',
      numericAmount: 28750,
      claimDate: '2025-06-25',
      submissionDate: '2025-06-25',
      priority: 'Medium',
      estimatedDays: 0,
      agentCommission: 1437
    },
    {
      id: 4,
      claimNo: 'CLM-004567',
      category: 'Vehicle',
      policyNo: 'POL-004567',
      vehicleReg: 'KBZ 456B',
      status: 'Pending',
      amount: 'KES 67,200',
      numericAmount: 67200,
      claimDate: '2025-07-03',
      submissionDate: '2025-07-03',
      priority: 'High',
      estimatedDays: 5,
      agentCommission: 3360
    },
    {
      id: 5,
      claimNo: 'CLM-005678',
      category: 'Travel',
      policyNo: 'POL-005678',
      status: 'Under Review',
      amount: 'KES 15,000',
      numericAmount: 15000,
      claimDate: '2025-07-05',
      submissionDate: '2025-07-05',
      priority: 'Low',
      estimatedDays: 7,
      agentCommission: 750
    },
    {
      id: 6,
      claimNo: 'CLM-006789',
      category: 'Medical',
      policyNo: 'POL-006789',
      status: 'Rejected',
      amount: 'KES 8,500',
      numericAmount: 8500,
      claimDate: '2025-06-20',
      submissionDate: '2025-06-20',
      priority: 'Low',
      estimatedDays: 0,
      agentCommission: 0
    }
  ];

  // Filter categories
  const categories = ['All', 'Vehicle', 'Medical', 'WIBA', 'Travel', 'Personal Accident'];
  
  // Sort options
  const sortOptions = [
    { key: 'claimDate', label: 'Claim Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' }
  ];

  // Enhanced filtering and sorting logic
  const filteredAndSortedData = useMemo(() => {
    let filtered = claimsData;

    // Filter by status (tab)
    if (activeTab === 'Pending') {
      filtered = filtered.filter(claim => ['Pending', 'Under Review'].includes(claim.status));
    } else if (activeTab === 'Processed') {
      filtered = filtered.filter(claim => ['Processed', 'Rejected'].includes(claim.status));
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(claim => claim.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.claimNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.policyNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicleReg?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }


    // Filter by date range (claimDate)
    if (fromDate || toDate) {
      filtered = filtered.filter(item => {
        const d = new Date(item.claimDate).setHours(0,0,0,0);
        const from = fromDate ? new Date(fromDate).setHours(0,0,0,0) : null;
        const to = toDate ? new Date(toDate).setHours(23,59,59,999) : null;
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }
    // Sort the filtered data
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'claimDate':
          aValue = new Date(a.claimDate);
          bValue = new Date(b.claimDate);
          break;
        case 'amount':
          aValue = a.numericAmount;
          bValue = b.numericAmount;
          break;
        case 'priority':
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.claimDate;
          bValue = b.claimDate;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [activeTab, selectedCategory, searchQuery, sortBy, sortOrder]);

  const pendingCount = claimsData.filter(claim => ['Pending', 'Under Review'].includes(claim.status)).length;
  const processedCount = claimsData.filter(claim => ['Processed', 'Rejected'].includes(claim.status)).length;

  const tabs = [
    { key: 'Pending', label: `Pending (${pendingCount})` },
    { key: 'Processed', label: `Processed (${processedCount})` }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return Colors.error;
      case 'Medium': return Colors.warning;
      case 'Low': return Colors.info;
      default: return Colors.textSecondary;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return Colors.warning;
      case 'Under Review': return Colors.info;
      case 'Processed': return Colors.success;
      case 'Rejected': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSortBy('claimDate');
    setSortOrder('desc');
    setSearchQuery('');
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Category</Text>
            <View style={styles.filterOptions}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterOption,
                    selectedCategory === category && styles.filterOptionActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedCategory === category && styles.filterOptionTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    sortBy === option.key && styles.filterOptionActive
                  ]}
                  onPress={() => setSortBy(option.key)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    sortBy === option.key && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Order */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Order</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOrder === 'desc' && styles.filterOptionActive
                ]}
                onPress={() => setSortOrder('desc')}
              >
                <Text style={[
                  styles.filterOptionText,
                  sortOrder === 'desc' && styles.filterOptionTextActive
                ]}>
                  Descending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  sortOrder === 'asc' && styles.filterOptionActive
                ]}
                onPress={() => setSortOrder('asc')}
              >
                <Text style={[
                  styles.filterOptionText,
                  sortOrder === 'asc' && styles.filterOptionTextActive
                ]}>
                  Ascending
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Claim Date Range</Text>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowFromPicker(true)}
              >
                <Text style={styles.dateInputLabel}>From</Text>
                <Text style={styles.dateInputValue}>{fromDate ? new Date(fromDate).toLocaleDateString() : 'Select date'}</Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowToPicker(true)}
              >
                <Text style={styles.dateInputLabel}>To</Text>
                <Text style={styles.dateInputValue}>{toDate ? new Date(toDate).toLocaleDateString() : 'Select date'}</Text>
              </TouchableOpacity>
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
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => { resetFilters(); setFromDate(null); setToDate(null); }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderClaimCard = ({ item }) => (
    <EnhancedCard style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <View style={styles.claimHeaderLeft}>
          <Text style={styles.claimNo}>{item.claimNo}</Text>
          <Text style={styles.claimCategory}>{item.category}</Text>
        </View>
        <View style={styles.claimHeaderRight}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority}
            </Text>
          </View>
          <StatusBadge 
            status={item.status} 
            size="small" 
            color={getStatusColor(item.status)}
          />
        </View>
      </View>

      <View style={styles.claimDetails}>
        <View style={styles.claimDetailRow}>
          <Text style={styles.claimDetailLabel}>Policy:</Text>
          <Text style={styles.claimDetailValue}>{item.policyNo}</Text>
        </View>
        {item.vehicleReg && (
          <View style={styles.claimDetailRow}>
            <Text style={styles.claimDetailLabel}>Vehicle:</Text>
            <Text style={styles.claimDetailValue}>{item.vehicleReg}</Text>
          </View>
        )}
        <View style={styles.claimDetailRow}>
          <Text style={styles.claimDetailLabel}>Claim Date:</Text>
          <Text style={styles.claimDetailValue}>{new Date(item.claimDate).toLocaleDateString()}</Text>
        </View>
        {item.estimatedDays > 0 && (
          <View style={styles.claimDetailRow}>
            <Text style={styles.claimDetailLabel}>Est. Days:</Text>
            <Text style={[styles.claimDetailValue, { color: Colors.warning }]}>{item.estimatedDays} days</Text>
          </View>
        )}
      </View>

      <View style={styles.claimFooter}>
        <View style={styles.claimAmountSection}>
          <Text style={styles.claimAmount}>{item.amount}</Text>
          {item.agentCommission > 0 && (
            <Text style={styles.commissionText}>Commission: KES {item.agentCommission.toLocaleString()}</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => navigation.navigate('ClaimDetails', { claim: item })}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </EnhancedCard>
  );

  return (
    <SafeScreen disableTopPadding>
      <StatusBar style="light" />
      
      <CompactCurvedHeader 
        title="Claims Management"
        subtitle="Track your insurance claims"
        showBackButton={false}
      />
      
      <View style={[styles.container, { paddingTop: 0 }]}>
        {/* Submit New Claim Button */}
        <TouchableOpacity 
          style={styles.submitClaimButton}
          onPress={() => navigation.navigate('ClaimsSubmission')}
          activeOpacity={0.8}
        >
          <Text style={styles.submitClaimIcon}>📝</Text>
          <Text style={styles.submitClaimText}>Submit New Claim</Text>
        </TouchableOpacity>

        {/* Search and Filter Bar */}
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search claims..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {(selectedCategory !== 'All' || sortBy !== 'claimDate') && (
          <View style={styles.activeFiltersContainer}>
            {selectedCategory !== 'All' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>{selectedCategory}</Text>
                <TouchableOpacity onPress={() => setSelectedCategory('All')}>
                  <Text style={styles.activeFilterClose}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {sortBy !== 'claimDate' && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>
                  {sortOptions.find(opt => opt.key === sortBy)?.label} ({sortOrder})
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={resetFilters} style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

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

        {/* Claims Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{filteredAndSortedData.length}</Text>
            <Text style={styles.summaryLabel}>Results</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              KES {filteredAndSortedData.reduce((sum, item) => sum + item.numericAmount, 0).toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Value</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              KES {filteredAndSortedData.reduce((sum, item) => sum + item.agentCommission, 0).toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Commission</Text>
          </View>
        </View>

        {/* Content */}
        {filteredAndSortedData.length > 0 ? (
          <FlatList
            data={filteredAndSortedData}
            renderItem={renderClaimCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContainer,
              { paddingBottom: insets.bottom + 100 }
            ]}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIcon}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>📋</Text>
              </View>
            </View>
            
            <Text style={styles.emptyStateTitle}>
              {searchQuery || selectedCategory !== 'All' ? 'No Results Found' : `No ${activeTab} Claims`}
            </Text>
            
            <Text style={styles.emptyStateMessage}>
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search or filters'
                : `There are currently no ${activeTab.toLowerCase()} claims.`
              }
            </Text>

            {(searchQuery || selectedCategory !== 'All') && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={resetFilters}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {renderFilterModal()}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50,
  },
  submitClaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  submitClaimIcon: {
    fontSize: Typography.fontSize.lg,
    marginRight: Spacing.sm,
  },
  submitClaimText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.backgroundCard,
    lineHeight: Typography.lineHeight.md,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.sm,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  filterButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: Typography.fontSize.md,
    color: Colors.background,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  activeFilterText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  activeFilterClose: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  clearFiltersButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    backgroundColor: Colors.error + '20',
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    marginRight: Spacing.xs,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    marginRight: 0,
    marginLeft: Spacing.xs,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  activeTabText: {
    color: Colors.background,
    fontFamily: Typography.fontFamily.semiBold,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs / 2,
    lineHeight: Typography.lineHeight.md,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.xs,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
  },
  claimCard: {
    marginBottom: Spacing.md,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  claimHeaderLeft: {
    flex: 1,
  },
  claimHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimNo: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
    lineHeight: Typography.lineHeight.md,
  },
  claimCategory: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    marginRight: Spacing.xs,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.lineHeight.xs,
  },
  claimDetails: {
    marginBottom: Spacing.md,
  },
  claimDetailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs / 2,
  },
  claimDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    width: 80,
    lineHeight: Typography.lineHeight.sm,
  },
  claimDetailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: Typography.lineHeight.sm,
  },
  claimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimAmountSection: {
    flex: 1,
  },
  claimAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs / 2,
    lineHeight: Typography.lineHeight.lg,
  },
  commissionText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success,
    lineHeight: Typography.lineHeight.xs,
  },
  viewButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
  },
  viewButtonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    lineHeight: Typography.lineHeight.sm,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateIcon: {
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 40,
    color: Colors.primary,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.xl,
  },
  emptyStateMessage: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.md,
    marginBottom: Spacing.lg,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.lg,
  },
  modalClose: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.bold,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.md,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterOptionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.sm,
  },
  filterOptionTextActive: {
    color: Colors.background,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  resetButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.md,
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  applyButtonText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.background,
    lineHeight: Typography.lineHeight.md,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
  },
  dateInputLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateInputValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
});
