import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { SafeScreen, EnhancedCard, CompactCurvedHeader, LoadingSpinner } from '../../components';
import { Colors, Spacing, Typography } from '../../constants';
import DjangoAPIService from '../../services/DjangoAPIService';

export default function NotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const api = DjangoAPIService.getInstance();
      const res = await api.getNotifications();
      const list = Array.isArray(res?.notifications) ? res.notifications : Array.isArray(res) ? res : [];
      setItems(list);
    } catch (e) {
      console.error('[NotificationsScreen] Failed to load:', e);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const openAttachment = useCallback(async (url, fileName, notification) => {
    const certNumber = notification?.certificate_number;
    const policyNumber = notification?.policy_number;
    const certStatus = notification?.status;
    const errorMessage = notification?.error_message;
    const vehicleReg = notification?.vehicle_registration;
    
    if (!url) {
      // Use DMVIC status to show appropriate message
      if (certStatus === 'FAILED') {
        Toast.show({
          type: 'error',
          text1: 'DMVIC Certificate Failed',
          text2: errorMessage || `Certificate issuance failed for policy ${policyNumber || 'N/A'}`,
          position: 'bottom',
          visibilityTime: 5000,
        });
      } else if (certStatus === 'CANCELLED') {
        Toast.show({
          type: 'error',
          text1: 'Certificate Cancelled',
          text2: errorMessage || `Certificate ${certNumber || vehicleReg || ''} was cancelled`,
          position: 'bottom',
        });
      } else if (certStatus === 'PENDING' || certStatus === 'PROCESSING') {
        Toast.show({
          type: 'info',
          text1: 'Certificate Processing',
          text2: `Certificate for ${vehicleReg || policyNumber || 'vehicle'} is being processed`,
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Certificate Not Available',
          text2: `DMVIC certificate not ready for download`,
          position: 'bottom',
        });
      }
      return;
    }
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Toast.show({
          type: 'error',
          text1: 'Download Error',
          text2: `Cannot open certificate for ${vehicleReg || certNumber || 'vehicle'} on this device`,
          position: 'bottom',
        });
        return;
      }
      await Linking.openURL(url);
      Toast.show({
        type: 'success',
        text1: 'Certificate Ready',
        text2: `Downloading certificate for ${vehicleReg || certNumber}`,
        position: 'bottom',
      });
    } catch (e) {
      console.error('[NotificationsScreen] openAttachment error:', e);
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: errorMessage || `Failed to download certificate for ${vehicleReg || policyNumber || 'vehicle'}`,
        position: 'bottom',
        visibilityTime: 5000,
      });
    }
  }, []);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // seconds
    
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return `${Math.floor(diff / 604800)}w`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const extractVehicleReg = (body) => {
    // Extract vehicle registration from message
    const match = body?.match(/vehicle\s+([A-Z0-9]+)/i);
    return match ? match[1] : null;
  };

  const renderItem = useCallback(
    ({ item }) => {
      const title = item?.title || 'Notification';
      const body = item?.body || item?.message || '';
      const pdfUrl = item?.pdf_url || item?.pdfUrl;
      const timestamp = item?.created_at || item?.createdAt || item?.timestamp;
      const timeAgo = formatTimeAgo(timestamp);
      const certNumber = item?.certificate_number;
      const policyNumber = item?.policy_number;
      const certStatus = item?.status;
      
      // Extract vehicle registration from body
      const vehicleReg = extractVehicleReg(body);
      
      // Generate PDF filename from cert number or vehicle reg
      const pdfFileName = certNumber ? `${certNumber}.pdf` : vehicleReg ? `${vehicleReg}.pdf` : 'certificate.pdf';
      
      // File size (you may want to get this from the API)
      const fileSize = item?.file_size || item?.fileSize || 1200000; // Default 1.2 MB
      const fileSizeText = formatFileSize(fileSize);

      return (
        <TouchableOpacity 
          style={styles.notificationCard}
          onPress={() => pdfUrl && openAttachment(pdfUrl, pdfFileName, item)}
          activeOpacity={0.7}
        >
          {/* Left: Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>OB</Text>
            </View>
          </View>

          {/* Right: Content */}
          <View style={styles.contentContainer}>
            {/* Title and Time */}
            <View style={styles.headerRow}>
              <Text style={styles.notificationTitle}>{title}</Text>
              {timeAgo && <Text style={styles.timeAgo}>{timeAgo}</Text>}
            </View>

            {/* Description */}
            <Text style={styles.notificationBody} numberOfLines={3}>
              {body}
            </Text>

            {/* PDF Attachment */}
            {pdfUrl && (
              <View style={styles.attachmentContainer}>
                <Ionicons name="document-text" size={20} color="#E63946" />
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName}>{pdfFileName}</Text>
                  <Text style={styles.attachmentSize}>{fileSizeText}</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [openAttachment]
  );

  const keyExtractor = useCallback((item, idx) => String(item?.id || idx), []);

  const emptyState = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>No Notifications</Text>
        <Text style={styles.emptySubtitle}>You’ll see certificate updates here.</Text>
      </View>
    );
  }, [loading]);

  return (
    <SafeScreen disableTopPadding>
      <StatusBar style="light" />
      <CompactCurvedHeader title="Notifications" subtitle="Updates and certificates" />

      {loading ? (
        <LoadingSpinner text="Loading notifications…" />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={emptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  notificationBody: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: 4,
  },
  attachmentInfo: {
    marginLeft: Spacing.sm,
  },
  attachmentName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: '#E63946',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
