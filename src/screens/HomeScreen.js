import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants';
import { SafeScreen, EnhancedCard, StatCard, StatusBadge, CompactCurvedHeader } from '../../components';
import { INSURANCE_CATEGORIES, getCategoryStatusMessage, CATEGORY_STATUS } from '../../data';

export default function HomeScreen() {
  const [currentCampaign, setCurrentCampaign] = useState(0);
  const [currentCategory, setCurrentCategory] = useState(0);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const categoryScrollRef = useRef(null);

  const mockData = {
    sales: 125000,
    production: 85000,
    commission: 15750,
    agentCode: 'IA16332',
    nextPayout: '16th July, 2025'
  };

  // Use centralized insurance categories data
  const insuranceCategories = INSURANCE_CATEGORIES;

  const campaigns = [
    {
      id: 1,
      title: 'Motor Vehicle Insurance',
      description: 'Comprehensive vehicle protection with competitive rates',
      category: 'Vehicle',
      image: 'https://patabima.com/wp-content/uploads/2024/05/CAR.jpeg',
    },
    {
      id: 2,
      title: 'Crop Insurance',
      description: 'Protect your agricultural investments against risks',
      category: 'Agriculture',
      image: 'https://patabima.com/wp-content/uploads/2024/11/crop.avif',
    },
    {
      id: 3,
      title: 'All-Risk Coverage',
      description: 'Complete protection for all your valuable assets',
      category: 'General',
      image: 'https://patabima.com/wp-content/uploads/2024/11/all.avif',
    },
    {
      id: 4,
      title: 'Aviation Insurance',
      description: 'Specialized coverage for aviation industry professionals',
      category: 'Aviation',
      image: 'https://patabima.com/wp-content/uploads/2024/11/aviation.avif',
    },
    {
      id: 5,
      title: 'Credit Risk Protection',
      description: 'Safeguard your business against credit defaults',
      category: 'Credit',
      image: 'https://patabima.com/wp-content/uploads/2024/11/credit_risk.avif',
    }
  ];

  const renewalData = [
    {
      id: 1,
      policyNo: 'POL-001234',
      vehicleReg: 'KCD 123A',
      status: 'Due Soon',
      dueDate: '2025-07-15'
    },
    {
      id: 2,
      policyNo: 'POL-005678',
      vehicleReg: 'KBZ 456B',
      status: 'Overdue',
      dueDate: '2025-06-30'
    },
    {
      id: 3,
      policyNo: 'POL-009876',
      vehicleReg: 'KCA 789C',
      status: 'Due Soon',
      dueDate: '2025-07-20'
    }
  ];

  const claimsData = [
    {
      id: 1,
      category: 'Vehicle',
      policyNo: 'POL-001234',
      status: 'Processed',
      amount: 'KES 45,000'
    },
    {
      id: 2,
      category: 'Medical',
      policyNo: 'POL-002345',
      status: 'Pending',
      amount: 'KES 12,500'
    },
    {
      id: 3,
      category: 'WIBA',
      policyNo: 'POL-003456',
      status: 'Processed',
      amount: 'KES 28,750'
    },
    {
      id: 4,
      category: 'Vehicle',
      policyNo: 'POL-004567',
      status: 'Pending',
      amount: 'KES 67,200'
    }
  ];

  // Auto-scroll effect for categories
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCategory((prev) => {
        const nextIndex = (prev + 1) % insuranceCategories.length;
        if (categoryScrollRef.current) {
          categoryScrollRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3000); // Auto scroll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const renderCampaignCard = ({ item, index }) => (
    <View style={styles.campaignCard}>
      <Image
        source={{ uri: item.image }}
        style={styles.campaignImage}
        resizeMode="cover"
      />
      <View style={styles.campaignOverlay}>
        <View style={styles.campaignContent}>
          <Text style={styles.campaignTitle}>{item.title}</Text>
          <Text style={styles.campaignDescription}>{item.description}</Text>
        </View>
      </View>
    </View>
  );

  // WhatsApp chat handler
  const handleWhatsAppPress = () => {
    console.log('WhatsApp button pressed!');
    Alert.alert(
      'WhatsApp Support',
      'Coming Soon! We\'re working on integrating WhatsApp support for instant customer assistance.',
      [
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  };

  return (
    <SafeScreen>
      <StatusBar style="light" />
      
      {/* Compact Curved Header */}
      <CompactCurvedHeader 
        title="PataBima Agency"
        subtitle="Insurance for Protection"
      />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        
        {/* Spacing after curved header */}
        <View style={styles.headerSpacing} />

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hello, Agent!</Text>
          <Text style={styles.subtitle}>Welcome to PataBima</Text>
        </View>

        {/* Agent Summary Card */}
        <TouchableOpacity 
          style={styles.agentSummaryCard}
          onPress={() => navigation.navigate('MyAccount')}
          activeOpacity={0.8}
        >
          <View style={styles.agentHeader}>
            <View style={styles.agentInfo}>
              <Text style={styles.agentCode}>Agent Code: {mockData.agentCode}</Text>
              <Text style={styles.nextPayout}>Next Payout: {mockData.nextPayout}</Text>
            </View>
            <View style={styles.agentActions}>
              <View style={styles.agentIconContainer}>
                <Text style={styles.agentIcon}>👤</Text>
              </View>
              <Text style={styles.viewAccountText}>View Account →</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>KES {(mockData.commission / 1000).toFixed(0)}K</Text>
              <Text style={styles.summaryLabel}>Commission</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>KES {(mockData.sales / 1000).toFixed(0)}K</Text>
              <Text style={styles.summaryLabel}>Sales</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>KES {(mockData.production / 1000).toFixed(0)}K</Text>
              <Text style={styles.summaryLabel}>Production</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Insurance Categories - Horizontal Slider */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Insurance Categories</Text>
          <FlatList
            ref={categoryScrollRef}
            data={insuranceCategories}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                style={[
                  styles.categoryCard,
                  index === currentCategory && styles.activeCategoryCard
                ]}
                onPress={() => {
                  // Handle category selection based on status
                  if (item.status === CATEGORY_STATUS.ACTIVE && item.screen) {
                    // Navigate to the quotation screen for active categories
                    navigation.navigate(item.screen);
                  } else {
                    // Show appropriate status message for non-active categories
                    const statusMessage = getCategoryStatusMessage(item);
                    const alertTitle = item.status === CATEGORY_STATUS.MAINTENANCE 
                      ? 'Under Maintenance' 
                      : item.status === CATEGORY_STATUS.COMING_SOON 
                        ? 'Coming Soon' 
                        : 'Unavailable';
                    
                    Alert.alert(
                      alertTitle,
                      statusMessage,
                      [
                        { text: 'OK', style: 'default' },
                        { text: 'Get Notified', onPress: () => {
                          Alert.alert(
                            'Notification Set',
                            `You will be notified when ${item.name} insurance is available.`,
                            [{ text: 'OK' }]
                          );
                        }}
                      ]
                    );
                  }
                }}
              >
                <View style={[
                  styles.categoryIconContainer,
                  index === currentCategory && styles.activeCategoryIconContainer
                ]}>
                  {item.image ? (
                    <Image source={item.image} style={styles.categoryImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.categoryIcon}>{item.icon}</Text>
                  )}
                </View>
                <Text style={[
                  styles.categoryName,
                  index === currentCategory && styles.activeCategoryName
                ]}>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesSlider}
            snapToInterval={160}
            decelerationRate="fast"
            snapToAlignment="center"
            pagingEnabled={false}
            getItemLayout={(data, index) => ({
              length: 160,
              offset: 160 * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / 160);
              setCurrentCategory(index);
            }}
          />
        </View>

        {/* Campaigns Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Campaigns</Text>
          <FlatList
            data={campaigns}
            renderItem={renderCampaignCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.campaignsSlider}
            snapToInterval={280}
            decelerationRate="fast"
          />
          {/* Campaign Indicators */}
          <View style={styles.campaignIndicators}>
            {campaigns.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  { backgroundColor: index === currentCampaign ? Colors.primary : Colors.border }
                ]}
              />
            ))}
          </View>
        </View>

        {/* Upcoming Summary */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Upcoming')}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.upcomingSummary}
            onPress={() => navigation.navigate('Upcoming')}
            activeOpacity={0.8}
          >
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>3</Text>
              <Text style={styles.summaryType}>Renewals</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>0</Text>
              <Text style={styles.summaryType}>Extensions</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{claimsData.length}</Text>
              <Text style={styles.summaryType}>Claims</Text>
            </View>
          </TouchableOpacity>
          
          {/* Show latest renewal as preview */}
          {renewalData.length > 0 && (
            <TouchableOpacity 
              style={styles.previewCard}
              onPress={() => navigation.navigate('Upcoming')}
              activeOpacity={0.7}
            >
              <Text style={styles.previewLabel}>Next Due:</Text>
              <View style={styles.previewContent}>
                <Text style={styles.previewPolicy}>{renewalData[0].policyNo}</Text>
                <Text style={styles.previewVehicle}>{renewalData[0].vehicleReg}</Text>
                <View style={[styles.previewStatus, {
                  backgroundColor: renewalData[0].status === 'Overdue' ? Colors.error + '20' : Colors.warning + '20'
                }]}>
                  <Text style={[styles.previewStatusText, {
                    color: renewalData[0].status === 'Overdue' ? Colors.error : Colors.warning
                  }]}>{renewalData[0].status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* Floating WhatsApp Chat Button */}
      <TouchableOpacity
        style={styles.whatsappButton}
        onPress={handleWhatsAppPress}
        activeOpacity={0.8}
      >
        <Ionicons name="logo-whatsapp" size={30} color="#ffffff" />
      </TouchableOpacity>

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
  headerSpacing: {
    height: Spacing.lg,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  greeting: {
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.lg,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoriesSlider: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
  },
  categoryCard: {
    width: 140,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryImage: {
    width: 30,
    height: 30,
    tintColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  categoryName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.md,
    textAlign: 'center',
  },
  campaignCard: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.lg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  welcomeSection: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  agentSummaryCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  agentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  agentCode: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.lg,
  },
  nextPayout: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
    flexWrap: 'wrap',
  },
  agentActions: {
    alignItems: 'center',
    flexShrink: 0,
  },
  agentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  agentIcon: {
    fontSize: 18,
  },
  viewAccountText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    lineHeight: Typography.lineHeight.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.lg,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  campaignsSlider: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
  },
  campaignCard: {
    width: 280,
    height: 180,
    borderRadius: 16,
    marginRight: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  campaignImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  campaignOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  campaignContent: {
    padding: Spacing.lg,
    justifyContent: 'flex-end',
    flex: 1,
  },
  campaignTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginBottom: Spacing.sm,
    lineHeight: Typography.lineHeight.xl,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  campaignDescription: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
    lineHeight: Typography.lineHeight.md,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  campaignButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  campaignIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: Spacing.xs,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    padding: 4,
    marginBottom: Spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.md,
  },
  activeToggleText: {
    color: Colors.background,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    lineHeight: Typography.lineHeight.sm,
  },
  upcomingSummary: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.xxl,
  },
  summaryType: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.md,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  previewCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  previewLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.sm,
  },
  previewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewPolicy: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.md,
  },
  previewVehicle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
  previewStatus: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
  },
  previewStatusText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.lineHeight.xs,
  },
  previewDate: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    lineHeight: Typography.lineHeight.sm,
  },
  activeCategoryCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '08',
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  activeCategoryIconContainer: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
  activeCategoryName: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  whatsappButton: {
    position: 'absolute',
    bottom: 120, // Even higher to be sure it's visible
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF0000', // Bright red for testing visibility
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    zIndex: 9999,
  },
});
