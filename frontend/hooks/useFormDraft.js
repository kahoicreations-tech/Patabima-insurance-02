/**
 * Form Draft Management Hook
 * 
 * Provides auto-save functionality for Motor 2 insurance forms
 * to prevent data loss and enable draft recovery.
 * 
 * Features:
 * - Auto-save to AsyncStorage every 2 seconds
 * - Draft recovery on app restart
 * - Multiple drafts with unique IDs
 * - Draft expiry (7 days)
 * - Draft metadata (timestamp, step, category)
 * 
 * @module useFormDraft
 * @version 2.0
 */

import { useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY_PREFIX = 'motor_insurance_draft_';
const DRAFT_LIST_KEY = 'motor_insurance_drafts_list';
const DRAFT_EXPIRY_DAYS = 7;
const AUTO_SAVE_DELAY = 2000; // 2 seconds

/**
 * Custom hook for form draft management
 * 
 * @param {string} draftId - Unique identifier for this draft
 * @param {Object} formData - Form data to save
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoSave - Enable auto-save (default: true)
 * @param {number} options.autoSaveDelay - Auto-save delay in ms (default: 2000)
 * @returns {Object} Draft management functions
 * 
 * @example
 * const { saveDraft, loadDraft, deleteDraft, hasDraft } = useFormDraft(
 *   'motor_quote_12345',
 *   formState,
 *   { autoSave: true }
 * );
 */
export function useFormDraft(draftId, formData, options = {}) {
  const {
    autoSave = true,
    autoSaveDelay = AUTO_SAVE_DELAY
  } = options;

  const lastSavedData = useRef(null);
  const saveTimeoutRef = useRef(null);

  /**
   * Save draft to AsyncStorage
   * 
   * @param {Object} dataToSave - Data to save (optional, uses formData if not provided)
   * @returns {Promise<boolean>} Success status
   */
  const saveDraft = useCallback(async (dataToSave = null) => {
    try {
      const draftKey = `${DRAFT_KEY_PREFIX}${draftId}`;
      const dataToStore = dataToSave || formData;
      
      // Check if data has actually changed
      const currentDataString = JSON.stringify(dataToStore);
      if (lastSavedData.current === currentDataString) {
        console.log('Draft unchanged, skipping save');
        return true;
      }

      const draftData = {
        id: draftId,
        data: dataToStore,
        savedAt: new Date().toISOString(),
        step: dataToStore.currentStep || 0,
        category: dataToStore.category?.name || dataToStore.selectedCategory?.title || 'Unknown',
        subcategory: dataToStore.subcategory?.name || dataToStore.selectedSubcategory?.name || 'Unknown'
      };
      
      await AsyncStorage.setItem(draftKey, JSON.stringify(draftData));
      lastSavedData.current = currentDataString;
      
      // Update drafts list
      await updateDraftsList(draftId, draftData);
      
      console.log(`✓ Draft saved: ${draftKey}`);
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  }, [draftId, formData]);

  /**
   * Load draft from AsyncStorage
   * 
   * @returns {Promise<Object|null>} Draft data or null if not found/expired
   */
  const loadDraft = useCallback(async () => {
    try {
      const draftKey = `${DRAFT_KEY_PREFIX}${draftId}`;
      const draftJson = await AsyncStorage.getItem(draftKey);
      
      if (!draftJson) {
        console.log('No draft found');
        return null;
      }
      
      const draft = JSON.parse(draftJson);
      
      // Check if draft is expired
      const savedAt = new Date(draft.savedAt);
      const now = new Date();
      const daysSinceSave = (now - savedAt) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSave > DRAFT_EXPIRY_DAYS) {
        console.log(`Draft expired (${Math.floor(daysSinceSave)} days old), deleting...`);
        await deleteDraft();
        return null;
      }
      
      console.log(`✓ Draft loaded: ${draftKey} (saved ${Math.floor(daysSinceSave * 24)} hours ago)`);
      return draft.data;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [draftId]);

  /**
   * Delete draft from AsyncStorage
   * 
   * @returns {Promise<boolean>} Success status
   */
  const deleteDraft = useCallback(async () => {
    try {
      const draftKey = `${DRAFT_KEY_PREFIX}${draftId}`;
      await AsyncStorage.removeItem(draftKey);
      
      // Remove from drafts list
      await removeFromDraftsList(draftId);
      
      console.log(`✓ Draft deleted: ${draftKey}`);
      return true;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      return false;
    }
  }, [draftId]);

  /**
   * Check if draft exists
   * 
   * @returns {Promise<boolean>} True if draft exists and is not expired
   */
  const hasDraft = useCallback(async () => {
    try {
      const draft = await loadDraft();
      return draft !== null;
    } catch (error) {
      console.error('Failed to check draft existence:', error);
      return false;
    }
  }, [loadDraft]);

  /**
   * Get draft metadata without loading full data
   * 
   * @returns {Promise<Object|null>} Draft metadata or null
   */
  const getDraftMetadata = useCallback(async () => {
    try {
      const draftKey = `${DRAFT_KEY_PREFIX}${draftId}`;
      const draftJson = await AsyncStorage.getItem(draftKey);
      
      if (!draftJson) return null;
      
      const draft = JSON.parse(draftJson);
      
      return {
        id: draft.id,
        savedAt: draft.savedAt,
        step: draft.step,
        category: draft.category,
        subcategory: draft.subcategory
      };
    } catch (error) {
      console.error('Failed to get draft metadata:', error);
      return null;
    }
  }, [draftId]);

  /**
   * Auto-save effect
   * Automatically saves draft when formData changes (with debounce)
   */
  useEffect(() => {
    if (!autoSave) return;
    if (!formData || Object.keys(formData).length === 0) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, autoSaveDelay);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, autoSave, autoSaveDelay, saveDraft]);

  return {
    saveDraft,
    loadDraft,
    deleteDraft,
    hasDraft,
    getDraftMetadata
  };
}

/**
 * Update the list of all drafts
 * 
 * @param {string} draftId - Draft ID
 * @param {Object} draftData - Draft metadata
 * @private
 */
async function updateDraftsList(draftId, draftData) {
  try {
    const listJson = await AsyncStorage.getItem(DRAFT_LIST_KEY);
    const list = listJson ? JSON.parse(listJson) : {};
    
    list[draftId] = {
      id: draftData.id,
      savedAt: draftData.savedAt,
      step: draftData.step,
      category: draftData.category,
      subcategory: draftData.subcategory
    };
    
    await AsyncStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Failed to update drafts list:', error);
  }
}

/**
 * Remove draft from the list
 * 
 * @param {string} draftId - Draft ID
 * @private
 */
async function removeFromDraftsList(draftId) {
  try {
    const listJson = await AsyncStorage.getItem(DRAFT_LIST_KEY);
    if (!listJson) return;
    
    const list = JSON.parse(listJson);
    delete list[draftId];
    
    await AsyncStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Failed to remove from drafts list:', error);
  }
}

/**
 * Get all drafts
 * 
 * @returns {Promise<Array>} Array of draft metadata
 */
export async function getAllDrafts() {
  try {
    const listJson = await AsyncStorage.getItem(DRAFT_LIST_KEY);
    if (!listJson) return [];
    
    const list = JSON.parse(listJson);
    const drafts = Object.values(list);
    
    // Filter out expired drafts
    const now = new Date();
    const validDrafts = drafts.filter(draft => {
      const savedAt = new Date(draft.savedAt);
      const daysSinceSave = (now - savedAt) / (1000 * 60 * 60 * 24);
      return daysSinceSave <= DRAFT_EXPIRY_DAYS;
    });
    
    // Sort by saved date (newest first)
    validDrafts.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    
    return validDrafts;
  } catch (error) {
    console.error('Failed to get all drafts:', error);
    return [];
  }
}

/**
 * Clean up expired drafts
 * 
 * @returns {Promise<number>} Number of drafts deleted
 */
export async function cleanupExpiredDrafts() {
  try {
    console.log('Cleaning up expired drafts...');
    
    const listJson = await AsyncStorage.getItem(DRAFT_LIST_KEY);
    if (!listJson) return 0;
    
    const list = JSON.parse(listJson);
    const now = new Date();
    let deletedCount = 0;
    
    for (const [draftId, draft] of Object.entries(list)) {
      const savedAt = new Date(draft.savedAt);
      const daysSinceSave = (now - savedAt) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSave > DRAFT_EXPIRY_DAYS) {
        const draftKey = `${DRAFT_KEY_PREFIX}${draftId}`;
        await AsyncStorage.removeItem(draftKey);
        delete list[draftId];
        deletedCount++;
        console.log(`  Deleted expired draft: ${draftId}`);
      }
    }
    
    if (deletedCount > 0) {
      await AsyncStorage.setItem(DRAFT_LIST_KEY, JSON.stringify(list));
    }
    
    console.log(`✓ Cleanup complete: ${deletedCount} drafts deleted`);
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup expired drafts:', error);
    return 0;
  }
}

/**
 * Delete all drafts
 * 
 * @returns {Promise<boolean>} Success status
 */
export async function deleteAllDrafts() {
  try {
    const listJson = await AsyncStorage.getItem(DRAFT_LIST_KEY);
    if (!listJson) return true;
    
    const list = JSON.parse(listJson);
    
    // Delete all draft data
    await Promise.all(
      Object.keys(list).map(draftId => 
        AsyncStorage.removeItem(`${DRAFT_KEY_PREFIX}${draftId}`)
      )
    );
    
    // Clear drafts list
    await AsyncStorage.removeItem(DRAFT_LIST_KEY);
    
    console.log('✓ All drafts deleted');
    return true;
  } catch (error) {
    console.error('Failed to delete all drafts:', error);
    return false;
  }
}

export default useFormDraft;
