import AsyncStorage from '@react-native-async-storage/async-storage';
import motorCategoryCache from './MotorCategoryCache';
import enhancedTORService from './EnhancedTORService';

/**
 * Centralized storage purge utility
 * - Clears drafts, caches, and transient session data
 * - Used on logout and after successful motor policy submission
 */
const StoragePurge = {
  /**
   * Remove keys matching any of the provided exact keys or prefixes
   */
  async removeByKeysAndPrefixes({ keys = [], prefixes = [] } = {}) {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const toRemove = new Set();

      // Exact keys
      keys.forEach(k => toRemove.add(k));

      // Prefix matches
      prefixes.forEach(pref => {
        for (const k of allKeys) {
          if (k.startsWith(pref)) toRemove.add(k);
        }
      });

      if (toRemove.size) {
        await AsyncStorage.multiRemove(Array.from(toRemove));
      }
      return toRemove.size;
    } catch (e) {
      console.warn('[StoragePurge] removeByKeysAndPrefixes failed:', e?.message || e);
      return 0;
    }
  },

  /**
   * Full purge on logout: remove all app user/session data (safe to keep fonts/images)
   */
  async purgeOnLogout() {
    try {
      // Known exact keys used throughout the app
      const exactKeys = [
        // Legacy tokens (secure tokens cleared elsewhere)
        'auth_token', 'refresh_token', 'accessToken', 'refreshToken', 'userRole',
        // Session/user
        '@PataBima:userData', '@PataBima:sessionToken', '@PataBima:sessionExpiry', '@PataBima:userId',
        'agent_data',
        // Motor flow state + caches
        'motor_insurance_flow_state',
  'motor_insurance_drafts_list',
        'motor_categories', // legacy
        'motor_categories_cache', 'motor_subcategories_cache', 'motor_cache_timestamp',
        'cache_underwriters', 'cache_last_premium',
        // Non-motor drafts
        'wiba_draft', 'professional_indemnity_draft', 'domestic_package_draft',
        // Misc app settings that may be user/environment specific
        'api_base_url',
        // Quotations tombstones
        'quotation_deleted_tombstones_v1',
        // Submission guard
        'policy_submission_guard'
      ];

      // Key prefixes used across the app
      const prefixes = [
        'motor_insurance_draft_',
        'motor_subcategories_', // per-category cache
        'vehicle_verification_',
      ];

      // Remove via pattern scan
      const removedCount = await this.removeByKeysAndPrefixes({ keys: exactKeys, prefixes });

      // Clear service-owned caches (they also use AsyncStorage internally)
      try { await motorCategoryCache.clearCache(); } catch {}
      try { await enhancedTORService.clearCache(); } catch {}

      console.log(`[StoragePurge] purgeOnLogout cleared ${removedCount}+ keys/caches`);
      return true;
    } catch (e) {
      console.warn('[StoragePurge] purgeOnLogout failed:', e?.message || e);
      return false;
    }
  },

  /**
   * Targeted purge after successful policy submission
   * - Clears motor flow/drafts/caches to avoid duplication and cross-account bleed
   */
  async purgeAfterPolicySubmission({ vehicleRegistration } = {}) {
    try {
      const exactKeys = [
        'motor_insurance_flow_state',
        'cache_underwriters', 'cache_last_premium',
      ];
      const prefixes = [
        'motor_insurance_draft_',
      ];

      // Optionally clear vehicle-specific verification cache
      if (vehicleRegistration) {
        exactKeys.push(`vehicle_verification_${vehicleRegistration}`);
      }

      const removedCount = await this.removeByKeysAndPrefixes({ keys: exactKeys, prefixes });

      console.log(`[StoragePurge] purgeAfterPolicySubmission cleared ${removedCount} items`);
      return true;
    } catch (e) {
      console.warn('[StoragePurge] purgeAfterPolicySubmission failed:', e?.message || e);
      return false;
    }
  },
};

export default StoragePurge;
