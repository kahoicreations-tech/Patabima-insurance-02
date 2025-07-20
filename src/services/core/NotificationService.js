// Push Notification Service for PataBima App
// Handles scheduling and managing reminders for quotes and renewals

import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Check if we're running in Expo Go on Android with SDK 53+
// This combination has issues with expo-notifications
const isExpoGo = Constants.appOwnership === 'expo';
const isAndroid = Platform.OS === 'android';
const isUnsupportedEnvironment = isExpoGo && isAndroid;

// Only import notifications if not in unsupported environment
let Notifications;
try {
  if (Platform.OS !== 'web' && !isUnsupportedEnvironment) {
    Notifications = require('expo-notifications');
    
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (error) {
  console.log('expo-notifications not available or not supported in this environment');
}

export class NotificationService {
  
  static STORAGE_KEYS = {
    NOTIFICATION_TOKEN: '@PataBima:notification_token',
    SCHEDULED_NOTIFICATIONS: '@PataBima:scheduled_notifications',
    NOTIFICATION_SETTINGS: '@PataBima:notification_settings'
  };

  // Initialize notification service
  static async initialize() {
    try {
      await this.requestPermissions();
      const token = await this.registerForPushNotifications();
      
      if (token) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.NOTIFICATION_TOKEN, token);
        console.log('Notification token:', token);
      }
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      return token;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  // Request notification permissions
  static async requestPermissions() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Notification Permission',
            'Please enable notifications to receive important reminders about your insurance quotes and renewals.',
            [{ text: 'OK' }]
          );
          return false;
        }
        
        return true;
      } else {
        Alert.alert('Error', 'Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Register for push notifications
  static async registerForPushNotifications() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'PataBima Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D5222B',
        });
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Set up notification listeners
  static setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle user tapping notification
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle notification tap/response
  static handleNotificationResponse(response) {
    const data = response.notification.request.content.data;
    
    switch (data.type) {
      case 'quote_reminder':
        // Navigate to specific quote
        console.log('Navigate to quote:', data.quoteId);
        break;
      case 'renewal_reminder':
        // Navigate to renewals screen
        console.log('Navigate to renewals');
        break;
      case 'payment_reminder':
        // Navigate to payment screen
        console.log('Navigate to payment:', data.quoteId);
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  // Schedule quote follow-up reminder
  static async scheduleQuoteReminder(quote, reminderType = 'followup', delayHours = 24) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 PataBima Quote Reminder',
          body: this.getQuoteReminderMessage(quote, reminderType),
          data: {
            type: 'quote_reminder',
            quoteId: quote.id,
            reminderType: reminderType
          },
          sound: true,
        },
        trigger: {
          seconds: delayHours * 3600, // Convert hours to seconds
        },
      });

      // Store scheduled notification
      await this.storeScheduledNotification(notificationId, {
        type: 'quote_reminder',
        quoteId: quote.id,
        reminderType: reminderType,
        scheduledAt: new Date().toISOString(),
        triggerAt: new Date(Date.now() + delayHours * 3600 * 1000).toISOString()
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling quote reminder:', error);
      return null;
    }
  }

  // Schedule payment reminder
  static async schedulePaymentReminder(quote, daysBeforeExpiry = 3) {
    try {
      const expiryDate = new Date(quote.createdAt);
      expiryDate.setDate(expiryDate.getDate() + 30); // Quote expires in 30 days
      
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - daysBeforeExpiry);

      if (reminderDate <= new Date()) {
        console.log('Payment reminder date has passed');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💳 Payment Reminder',
          body: `Your quote ${quote.id} expires in ${daysBeforeExpiry} days. Complete payment to activate your insurance coverage.`,
          data: {
            type: 'payment_reminder',
            quoteId: quote.id,
            expiryDate: expiryDate.toISOString()
          },
          sound: true,
        },
        trigger: {
          date: reminderDate,
        },
      });

      await this.storeScheduledNotification(notificationId, {
        type: 'payment_reminder',
        quoteId: quote.id,
        scheduledAt: new Date().toISOString(),
        triggerAt: reminderDate.toISOString(),
        expiryDate: expiryDate.toISOString()
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling payment reminder:', error);
      return null;
    }
  }

  // Schedule renewal reminder
  static async scheduleRenewalReminder(policy, daysBeforeExpiry = 30) {
    try {
      const renewalDate = new Date(policy.expiryDate);
      renewalDate.setDate(renewalDate.getDate() - daysBeforeExpiry);

      if (renewalDate <= new Date()) {
        console.log('Renewal reminder date has passed');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔄 Renewal Reminder',
          body: `Your ${policy.insuranceType} insurance policy expires in ${daysBeforeExpiry} days. Contact your agent to renew.`,
          data: {
            type: 'renewal_reminder',
            policyId: policy.id,
            expiryDate: policy.expiryDate
          },
          sound: true,
        },
        trigger: {
          date: renewalDate,
        },
      });

      await this.storeScheduledNotification(notificationId, {
        type: 'renewal_reminder',
        policyId: policy.id,
        scheduledAt: new Date().toISOString(),
        triggerAt: renewalDate.toISOString(),
        expiryDate: policy.expiryDate
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling renewal reminder:', error);
      return null;
    }
  }

  // Send immediate notification
  static async sendImmediateNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  // Cancel scheduled notification
  static async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeStoredNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Cancel all notifications for a quote
  static async cancelQuoteNotifications(quoteId) {
    try {
      const scheduledNotifications = await this.getScheduledNotifications();
      const quoteNotifications = scheduledNotifications.filter(
        n => n.data.quoteId === quoteId || n.data.policyId === quoteId
      );

      for (const notification of quoteNotifications) {
        await this.cancelNotification(notification.id);
      }
    } catch (error) {
      console.error('Error canceling quote notifications:', error);
    }
  }

  // Get quote reminder message based on type
  static getQuoteReminderMessage(quote, reminderType) {
    const customerName = quote.customerName || quote.companyName || 'Customer';
    const insuranceType = quote.insuranceType.charAt(0).toUpperCase() + quote.insuranceType.slice(1);
    
    switch (reminderType) {
      case 'followup':
        return `Follow up with ${customerName} about their ${insuranceType} insurance quote (${quote.id}).`;
      case 'documents':
        return `Reminder: Collect required documents for ${customerName}'s ${insuranceType} quote (${quote.id}).`;
      case 'expiry':
        return `Quote ${quote.id} for ${customerName} expires soon. Contact them to proceed with payment.`;
      default:
        return `Reminder about ${insuranceType} quote ${quote.id} for ${customerName}.`;
    }
  }

  // Store scheduled notification info
  static async storeScheduledNotification(notificationId, notificationData) {
    try {
      const stored = await this.getScheduledNotifications();
      const updated = [...stored, { id: notificationId, ...notificationData }];
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, 
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error storing scheduled notification:', error);
    }
  }

  // Get all scheduled notifications
  static async getScheduledNotifications() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Remove stored notification
  static async removeStoredNotification(notificationId) {
    try {
      const stored = await this.getScheduledNotifications();
      const updated = stored.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, 
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error removing stored notification:', error);
    }
  }

  // Get notification settings
  static async getNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem(this.STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return settings ? JSON.parse(settings) : {
        quoteReminders: true,
        paymentReminders: true,
        renewalReminders: true,
        marketingNotifications: false,
        reminderFrequency: 'daily' // daily, weekly, custom
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {};
    }
  }

  // Update notification settings
  static async updateNotificationSettings(newSettings) {
    try {
      const currentSettings = await this.getNotificationSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(updatedSettings)
      );
      return updatedSettings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Auto-schedule reminders for a new quote
  static async scheduleQuoteWorkflow(quote) {
    try {
      const settings = await this.getNotificationSettings();
      
      if (!settings.quoteReminders) return;

      // Schedule follow-up reminder (24 hours)
      await this.scheduleQuoteReminder(quote, 'followup', 24);
      
      // Schedule document reminder (3 days)
      await this.scheduleQuoteReminder(quote, 'documents', 72);
      
      // Schedule payment reminder (based on quote expiry)
      if (settings.paymentReminders) {
        await this.schedulePaymentReminder(quote, 3);
      }
      
      console.log(`Scheduled reminder workflow for quote ${quote.id}`);
    } catch (error) {
      console.error('Error scheduling quote workflow:', error);
    }
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const stored = await this.getScheduledNotifications();
      const now = new Date();
      
      const active = stored.filter(notification => {
        const triggerDate = new Date(notification.triggerAt);
        return triggerDate > now;
      });
      
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SCHEDULED_NOTIFICATIONS,
        JSON.stringify(active)
      );
      
      console.log(`Cleaned up ${stored.length - active.length} expired notifications`);
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
    }
  }
}

export default NotificationService;
