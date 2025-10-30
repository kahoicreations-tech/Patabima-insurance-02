// Quote Storage Service for PataBima App
// Handles saving, retrieving, and managing insurance quotes

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  QUOTES: '@PataBima:quotes',
  DRAFT_QUOTES: '@PataBima:draft_quotes',
  QUOTE_COUNTER: '@PataBima:quote_counter'
};

export class QuoteStorageService {
  
  // Generate unique quote ID
  static async generateQuoteId() {
    try {
      const counterStr = await AsyncStorage.getItem(STORAGE_KEYS.QUOTE_COUNTER);
      const counter = counterStr ? parseInt(counterStr) + 1 : 1000;
      await AsyncStorage.setItem(STORAGE_KEYS.QUOTE_COUNTER, counter.toString());
      return `PB${counter}`;
    } catch (error) {
      console.error('Error generating quote ID:', error);
      return `PB${Date.now()}`;
    }
  }

  // Save a completed quote
  static async saveQuote(quoteData) {
    try {
      const quoteId = await this.generateQuoteId();
      const quote = {
        id: quoteId,
        ...quoteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        version: 1
      };

      const existingQuotes = await this.getAllQuotes();
      const updatedQuotes = [...existingQuotes, quote];
      
      await AsyncStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(updatedQuotes));
      return quote;
    } catch (error) {
      console.error('Error saving quote:', error);
      throw error;
    }
  }

  // Save draft quote (auto-save functionality)
  static async saveDraftQuote(insuranceType, formData) {
    try {
      const draftKey = `${insuranceType}_draft`;
      const existingDrafts = await this.getAllDraftQuotes();
      
      const draftQuote = {
        id: draftKey,
        insuranceType,
        formData,
        savedAt: new Date().toISOString()
      };

      const updatedDrafts = {
        ...existingDrafts,
        [draftKey]: draftQuote
      };

      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_QUOTES, JSON.stringify(updatedDrafts));
      return draftQuote;
    } catch (error) {
      console.error('Error saving draft quote:', error);
      throw error;
    }
  }

  // Get all completed quotes
  static async getAllQuotes() {
    try {
      const quotesStr = await AsyncStorage.getItem(STORAGE_KEYS.QUOTES);
      return quotesStr ? JSON.parse(quotesStr) : [];
    } catch (error) {
      console.error('Error getting quotes:', error);
      return [];
    }
  }

  // Get all draft quotes
  static async getAllDraftQuotes() {
    try {
      const draftsStr = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_QUOTES);
      return draftsStr ? JSON.parse(draftsStr) : {};
    } catch (error) {
      console.error('Error getting draft quotes:', error);
      return {};
    }
  }

  // Get specific draft quote
  static async getDraftQuote(insuranceType) {
    try {
      const drafts = await this.getAllDraftQuotes();
      return drafts[`${insuranceType}_draft`] || null;
    } catch (error) {
      console.error('Error getting draft quote:', error);
      return null;
    }
  }

  // Delete draft quote
  static async deleteDraftQuote(insuranceType) {
    try {
      const drafts = await this.getAllDraftQuotes();
      delete drafts[`${insuranceType}_draft`];
      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_QUOTES, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error deleting draft quote:', error);
    }
  }

  // Update quote status
  static async updateQuoteStatus(quoteId, status) {
    try {
      const quotes = await this.getAllQuotes();
      const updatedQuotes = quotes.map(quote => 
        quote.id === quoteId 
          ? { ...quote, status, updatedAt: new Date().toISOString() }
          : quote
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(updatedQuotes));
      return updatedQuotes.find(q => q.id === quoteId);
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw error;
    }
  }

  // Get quotes by insurance type
  static async getQuotesByType(insuranceType) {
    try {
      const allQuotes = await this.getAllQuotes();
      return allQuotes.filter(quote => quote.insuranceType === insuranceType);
    } catch (error) {
      console.error('Error getting quotes by type:', error);
      return [];
    }
  }

  // Get quotes by status
  static async getQuotesByStatus(status) {
    try {
      const allQuotes = await this.getAllQuotes();
      return allQuotes.filter(quote => quote.status === status);
    } catch (error) {
      console.error('Error getting quotes by status:', error);
      return [];
    }
  }

  // Search quotes
  static async searchQuotes(searchTerm) {
    try {
      const allQuotes = await this.getAllQuotes();
      const term = searchTerm.toLowerCase();
      
      return allQuotes.filter(quote => 
        quote.id.toLowerCase().includes(term) ||
        quote.insuranceType.toLowerCase().includes(term) ||
        quote.customerName?.toLowerCase().includes(term) ||
        quote.companyName?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching quotes:', error);
      return [];
    }
  }

  // Export quotes for backup
  static async exportQuotes() {
    try {
      const quotes = await this.getAllQuotes();
      const drafts = await this.getAllDraftQuotes();
      
      return {
        quotes,
        drafts,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting quotes:', error);
      throw error;
    }
  }

  // Clear all data (for debugging/reset)
  static async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.QUOTES,
        STORAGE_KEYS.DRAFT_QUOTES,
        STORAGE_KEYS.QUOTE_COUNTER
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export default QuoteStorageService;
