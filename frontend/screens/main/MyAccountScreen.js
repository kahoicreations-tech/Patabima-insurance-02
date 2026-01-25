import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, RefreshControl, Modal, TextInput, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Typography } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/users';
import { commissionsAPI } from '../../services/commissions';
import djangoAPI from '../../services/DjangoAPIService';
import { SafeScreen, EnhancedCard, StatCard, ActionButton, StatusBadge, CompactCurvedHeader, LoadingSpinner } from '../../components';

export default function MyAccountScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    paidQuotes: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    conversionRate: 0
  });
  const [commissionSummary, setCommissionSummary] = useState(null);
  const [commissionList, setCommissionList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Load user profile from Django
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async (opts = {}) => {
    try {
      if (!opts.silent) setLoading(true);
      
      const profile = await usersAPI.getCurrentUser();
      setUserProfile(profile);
      
      // Load commissions summary + history
      try {
        const summary = await commissionsAPI.getSummary({});
        setCommissionSummary(summary);
        const list = await commissionsAPI.getList({ limit: 20 });
        setCommissionList(list);
        
        // Load quotations count - use djangoAPI directly to avoid circular imports
        const quotationsResponse = await djangoAPI.makeRequest('/api/motor3/quotations/', { 
          method: 'GET' 
        });
        const totalQuotations = quotationsResponse?.count || 0;
        
        // Count paid quotations (status = PAID or CONVERTED)
        const paidQuotationsResponse = await djangoAPI.makeRequest('/api/motor3/quotations/?status=PAID', { 
          method: 'GET' 
        });
        const convertedQuotationsResponse = await djangoAPI.makeRequest('/api/motor3/quotations/?status=CONVERTED', { 
          method: 'GET' 
        });
        const paidQuotations = (paidQuotationsResponse?.count || 0) + (convertedQuotationsResponse?.count || 0);
        
        // Calculate production from quotation premiums (immediate feedback)
        const allQuotations = quotationsResponse?.results || [];
        const totalProduction = allQuotations.reduce((sum, q) => {
          const status = (q.status || '').toUpperCase();
          if (status === 'CONVERTED' || status === 'PAID') {
            // Try multiple paths to find premium amount
            const payload = q.normalized_payload || q.payload || {};
            const premiumBreakdown = payload.premium_breakdown || payload.premiumBreakdown || {};
            const premium = premiumBreakdown.total_premium || premiumBreakdown.totalPremium || 
                           premiumBreakdown.total || premiumBreakdown.totalPayable || 0;
            return sum + Number(premium || 0);
          }
          return sum;
        }, 0);
        
        setStats((s) => {
          const totalEarnings = totalProduction; // Show production from quotations
          const monthlyEarnings = Number(summary?.month_total || 0);
          const conversionRate = totalQuotations > 0 ? (paidQuotations / totalQuotations) * 100 : 0;
          return {
            ...s,
            totalEarnings,
            monthlyEarnings,
            totalQuotes: totalQuotations,
            paidQuotes: paidQuotations,
            conversionRate,
          };
        });
      } catch (e) {
        // Silent catch for commission stats if unavailable
      }
    } catch (error) {
      if (!opts.silent) {
         // Error handling simplified
      }
    } finally {
      if (!opts.silent) setLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserProfile({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => await logout() }
      ]
    );
  };

  const handleShare = async () => {
    try {
      const agentName = userProfile?.full_names || 'Agent';
      const agentCode = userProfile?.agent_code || 'N/A';
      const message = `🏆 PataBima Agent Performance\n\n👨‍💼 Agent: ${agentName}\n🆔 Code: ${agentCode}\n\n📊 Statistics:\n• Total Quotes: ${stats.totalQuotes}\n• Conversion Rate: ${stats.conversionRate.toFixed(1)}%\n• Total Earnings: KES ${stats.totalEarnings.toLocaleString()}\n\n💪 Growing with PataBima Insurance!`;
      
      await Share.share({
        message: message,
        title: 'PataBima Agent Performance'
      });
    } catch (error) {
     // Ignore
    }
  };

  // Get first name from full name
  const getFirstName = (fullName) => {
    if (!fullName) return 'Agent';
    return fullName.split(' ')[0];
  };

  // Last login formatted display
  const getLastLoginDisplay = () => {
    const raw = userProfile?.last_login || userProfile?.lastLogin;
    if (!raw) return null;
    try {
      return new Date(raw).toLocaleString();
    } catch {
      return null;
    }
  };

  const getDisplayIraNumber = () => {
    const raw = userProfile?.ira_number;
    if (!raw) return null;
    const v = String(raw).trim();
    if (!v || v.toUpperCase().startsWith('PENDING-')) return null;
    return v;
  };

  const isAgentAccount = () => {
    if (userProfile?.role) return userProfile.role === 'AGENT';
    return Boolean(userProfile?.agent_code);
  };

  const handleSendVerificationCode = async () => {
    try {
      setSendingCode(true);
      const response = await djangoAPI.makeRequest('/api/insurance/auth/email/send-verification/', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (response.success) {
        setShowVerificationModal(true);
        Toast.show({
          type: 'success',
          text1: 'Verification Code Sent',
          text2: `Check your email: ${user?.email}`,
          position: 'top',
        });
      } else {
        Alert.alert('Error', response.error || 'Failed to send verification code');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit verification code');
      return;
    }
    
    try {
      setVerifying(true);
      const response = await djangoAPI.makeRequest('/api/insurance/auth/email/verify-code/', {
        method: 'POST',
        body: JSON.stringify({ code: verificationCode }),
      });
      
      if (response.success) {
        setShowVerificationModal(false);
        setVerificationCode('');
        Toast.show({
          type: 'success',
          text1: '✓ Email Verified',
          text2: 'Your email has been successfully verified',
          position: 'top',
        });
        // Reload profile to reflect verified status
        await loadUserProfile({ silent: true });
      } else {
        Alert.alert('Verification Failed', response.error || 'Invalid or expired code');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeScreen disableTopPadding>
      <StatusBar style="light" />
      
      {/* Compact Curved Header */}
      <CompactCurvedHeader 
        title="Your Profile"
        subtitle="Profile & Settings"
        rightComponent={
          <TouchableOpacity 
            style={styles.headerLogoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.headerLogoutText}>Logout</Text>
          </TouchableOpacity>
        }
      />
      
      {loading ? (
        <LoadingSpinner text="Loading profile..." />
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
        
        {/* Spacing after curved header */}
        <View style={styles.headerSpacing} />

        {/* Profile Section */}
        <EnhancedCard style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.profileLeftCol}>
              <View style={styles.profileIconContainer}>
                <Text style={styles.profileIcon}>👤</Text>
              </View>
              <Text style={styles.agentName}>
                {userProfile?.full_names || 'Loading...'}
              </Text>
            </View>
            <View style={styles.profileRightCol}>
              <View style={styles.agentCodeContainer}>
                <Text style={styles.agentCodeLabel}>Sales Agent Code</Text>
                <View style={styles.agentCodeBadge}>
                  <Text style={styles.agentCode}>
                    {userProfile?.agent_code || 'N/A'}
                  </Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Text style={styles.copyIcon}>📋</Text>
                  </TouchableOpacity>
                </View>
                {getLastLoginDisplay() ? (
                  <Text style={styles.lastLoginText}>Last login: {getLastLoginDisplay()}</Text>
                ) : null}
              </View>
            </View>
          </View>
          
          {/* IRA Number and Email Verification Section */}
          <View style={styles.verificationSection}>
            {/* IRA Number */}
            {isAgentAccount() && (
              <View style={styles.verificationRow}>
                <Text style={styles.verificationLabel}>IRA Number</Text>
                <View style={styles.verificationValueRow}>
                  {getDisplayIraNumber() ? (
                    <Text style={styles.verificationValue}>{getDisplayIraNumber()}</Text>
                  ) : (
                    <Text style={styles.verificationValue}>Not provided</Text>
                  )}
                  {getDisplayIraNumber() && userProfile.ira_verified ? (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>⚠ Pending</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {/* Email Verification Status */}
            {userProfile?.email && (
              <View style={styles.verificationRow}>
                <Text style={styles.verificationLabel}>Email Address</Text>
                <View style={styles.verificationValueRow}>
                  <Text style={styles.verificationValue}>{user?.email}</Text>
                  {userProfile.is_email_verified ? (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.verifyEmailButton}
                      onPress={handleSendVerificationCode}
                      disabled={sendingCode}
                    >
                      {sendingCode ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.verifyEmailText}>Verify Email</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
          
          {/* Full-width meta row for version and updates */}
          <View style={styles.buildContainer}>
            <Text style={styles.buildText}>App Version 1.0.0</Text>
            <TouchableOpacity style={styles.updateButton}>
              <Text style={styles.updateText}>Check Updates</Text>
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
        </EnhancedCard>

        {/* Earnings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Earnings</Text>
          
          <EnhancedCard style={styles.commissionCard}>
            <View style={styles.commissionHeader}>
              <Text style={styles.commissionLabel}>Upcoming Commission</Text>
              <View style={styles.commissionIconContainer}>
                <Text style={styles.commissionIcon}>💰</Text>
              </View>
            </View>
            <Text style={styles.commissionAmount}>KES {Number(commissionSummary?.pending_commission || 0).toLocaleString()}</Text>
            <Text style={styles.payoutText}>
              Pending commission across unpaid transactions
            </Text>
            
            <TouchableOpacity style={styles.viewEarningsButton}>
              <Text style={styles.viewEarningsText}>View Earnings</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
          </EnhancedCard>
        </View>

        {/* Activity Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Activity</Text>
          
          <EnhancedCard style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>📊</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Sales</Text>
                <Text style={styles.statValue}>{stats.totalQuotes} Policies</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statRow}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>💼</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Production</Text>
                <Text style={styles.statValue}>KES {Number(stats.totalEarnings || 0).toLocaleString()}</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statRow}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>💵</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Commission</Text>
                <Text style={styles.statValue}>KES {Number(commissionSummary?.paid_commission || 0).toLocaleString()}</Text>
              </View>
            </View>
          </EnhancedCard>
        </View>

        {/* Commission History */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Commission History</Text>
          <EnhancedCard style={styles.historyCard}>
            {(!commissionList || commissionList.length === 0) ? (
              <View style={styles.emptyHistory}>
                <View style={styles.emptyIconContainer}>
                  <Text style={styles.emptyIcon}>📈</Text>
                </View>
                <Text style={styles.emptyHistoryText}>No commission history available</Text>
                <Text style={styles.emptyHistorySubtext}>Your commission history will appear here once you start earning</Text>
              </View>
            ) : (
              <View>
                {commissionList.slice(0, 5).map((item, idx) => (
                  <View key={item.id || idx} style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyPolicy}>{item.policy_number || 'Policy'}</Text>
                      <Text style={styles.historyDate}>{new Date(item.date_created).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>KES {Number(item.commission_amount || 0).toLocaleString()}</Text>
                      <StatusBadge status={item.payment_status} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </EnhancedCard>
        </View>

        {/* Performance Overview */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{stats.totalQuotes}</Text>
              <Text style={styles.performanceLabel}>Total Quotes</Text>
            </View>
            
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{stats.paidQuotes}</Text>
              <Text style={styles.performanceLabel}>Paid Policies</Text>
            </View>
            
            <View style={styles.performanceCard}>
              <Text style={[styles.performanceValue, { color: Colors.success }]}>
                {stats.conversionRate.toFixed(1)}%
              </Text>
              <Text style={styles.performanceLabel}>Conversion Rate</Text>
            </View>
            
            <View style={styles.performanceCard}>
              <Text style={[styles.performanceValue, { color: Colors.primary }]}>
                KES {stats.totalEarnings.toLocaleString()}
              </Text>
              <Text style={styles.performanceLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* Monthly Performance */}
        <View style={styles.monthlySection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.monthlyCard}>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyLabel}>Earnings</Text>
              <Text style={styles.monthlyValue}>
                KES {stats.monthlyEarnings.toLocaleString()}
              </Text>
            </View>
            <View style={styles.monthlyItem}>
              <Text style={styles.monthlyLabel}>Next Payout</Text>
              <Text style={styles.monthlyValue}>TBD</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
            <Text style={styles.actionIcon}>📤</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Share Performance</Text>
              <Text style={styles.actionSubtitle}>Share your agent statistics</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          

        </View>

      </ScrollView>
      )}
      
      {/* Email Verification Modal */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Your Email</Text>
            <Text style={styles.modalSubtitle}>
              We sent a 6-digit code to{' \n'}
              <Text style={styles.modalEmail}>{user?.email}</Text>
            </Text>
            
            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              value={verificationCode}
              onChangeText={setVerificationCode}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowVerificationModal(false);
                  setVerificationCode('');
                }}
                disabled={verifying}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton]}
                onPress={handleVerifyCode}
                disabled={verifying || verificationCode.length !== 6}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendVerificationCode}
              disabled={sendingCode}
            >
              <Text style={styles.resendButtonText}>
                {sendingCode ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  headerSpacing: {
    height: Spacing.xl,
  },
  headerLogoutButton: {
    backgroundColor: Colors.background + '20',
    borderWidth: 1,
    borderColor: Colors.background + '40',
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  headerLogoutText: {
    color: Colors.background,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.lineHeight.sm,
  },
  sectionContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.lg,
  },
  profileCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileLeftCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 1,
    paddingRight: Spacing.md,
  },
  profileRightCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  profileTextCol: {
    flex: 1,
    paddingLeft: Spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyLeft: { flex: 1 },
  historyRight: { alignItems: 'flex-end' },
  historyPolicy: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  historyDate: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.success,
  },
  profileIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 28,
  },
  agentName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.xl,
  },
  agentDescription: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.md,
    textAlign: 'left',
  },
  agentCodeContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  agentCodeLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.md,
  },
  agentCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '12',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 10,
  },
  lastLoginText: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  agentCode: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginRight: Spacing.xs,
    lineHeight: Typography.lineHeight.md,
  },
  copyButton: {
    padding: Spacing.xs,
  },
  copyIcon: {
    fontSize: Typography.fontSize.sm,
  },
  buildContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  buildText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginRight: Spacing.md,
    lineHeight: Typography.lineHeight.md,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
  },
  updateText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    marginRight: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  refreshIcon: {
    fontSize: Typography.fontSize.sm,
  },
  commissionCard: {
    marginBottom: 0,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  commissionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commissionIcon: {
    fontSize: 20,
  },
  commissionLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.md,
  },
  commissionAmount: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.xl,
  },
  payoutText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeight.sm,
  },
  viewEarningsButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewEarningsText: {
    color: Colors.background,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    lineHeight: Typography.lineHeight.md,
    marginRight: Spacing.sm,
  },
  arrowIcon: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  statsCard: {
    marginBottom: 0,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statIcon: {
    fontSize: 20,
  },
  statInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.lg,
  },
  historyCard: {
    marginBottom: 0,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyHistoryText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.md,
    marginBottom: Spacing.xs,
  },
  emptyHistorySubtext: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.xs,
  },
  performanceSection: {
    marginBottom: Spacing.lg,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceCard: {
    width: '48%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  performanceLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Email verification button and modal styles
  verifyEmailButton: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyEmailText: {
    color: '#fff',
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeight.md,
  },
  modalEmail: {
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
  },
  codeInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textDecorationLine: 'underline',
  },
  monthlySection: {
    marginBottom: Spacing.lg,
  },
  monthlyCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  monthlyLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  monthlyValue: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  actionsSection: {
    marginBottom: Spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  actionArrow: {
    fontSize: 20,
    color: Colors.textLight,
  },
  // IRA and Email Verification Section Styles
  verificationSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border || '#E5E7EB',
  },
  verificationRow: {
    marginBottom: Spacing.sm,
  },
  verificationLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs / 2,
  },
  verificationValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificationValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  verifiedBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#10B981',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pendingBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#D97706',
  },
  unverifiedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  unverifiedBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
  },
});
