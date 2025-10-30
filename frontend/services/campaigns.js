/**
 * Campaigns API Service
 * 
 * Provides methods to fetch active campaigns and track user interactions.
 * Uses DjangoAPIService for automatic token handling and error management.
 */

import djangoAPI from './DjangoAPIService';

export const campaignsAPI = {
  // Normalize image URLs to ensure they are device-reachable
  _normalizeImageUrl: (url) => {
    try {
      if (!url || typeof url !== 'string') return '';
      
      // Absolute URL with external domain (S3, CDN, etc.): return as-is
      if (/^https?:\/\//i.test(url)) {
        const parsed = new URL(url);
        const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
        // Only normalize localhost URLs; leave S3/CDN/external URLs unchanged
        if (localHosts.has(parsed.hostname)) {
          const base = new URL(djangoAPI.baseUrl);
          parsed.protocol = base.protocol;
          parsed.host = base.host; // host includes hostname:port
          return parsed.toString();
        }
        // External URL (S3, etc.): return unchanged
        return url;
      }
      
      // Relative path like /media/... - make absolute against backend
      if (url.startsWith('/')) {
        const base = new URL(djangoAPI.baseUrl);
        return `${base.protocol}//${base.host}${url}`;
      }
      
      // Fallback: treat as relative path
      const base = new URL(djangoAPI.baseUrl);
      return `${base.protocol}//${base.host}/${url.replace(/^\/+/, '')}`;
    } catch (err) {
      console.warn('[CampaignsAPI] URL normalization failed:', url, err);
      return url;
    }
  },
  /**
   * Get active campaigns for the current user.
   * 
   * Campaigns are filtered by user role (agent vs customer) on the backend.
   * Returns max 10 most recent active campaigns.
   * 
   * @returns {Promise<Array>} Array of campaign objects
   */
  getActiveCampaigns: async () => {
    try {
      console.log('[CampaignsAPI] Fetching active campaigns...');
      
      const response = await djangoAPI.makeRequest('/api/v1/public_app/campaigns', {
        method: 'GET',
        _suppressErrorLog: true
      });
      
      const raw = Array.isArray(response) ? response : (response?.results || []);
      // Accept campaigns with or without images - normalize image_url if present
      const campaigns = raw.map(c => ({
        ...c,
        image_url: (typeof c?.image_url === 'string' && c.image_url.length > 0) 
          ? campaignsAPI._normalizeImageUrl(c.image_url)
          : null // Allow null for campaigns without images
      }));
      try {
        const withImages = campaigns.filter(c => c.image_url).length;
        const sample = campaigns.filter(c => c.image_url).slice(0, 3).map(c => c.image_url);
        console.log(`[CampaignsAPI] Fetched ${raw.length} campaigns, ${withImages} with images`);
        if (sample.length) console.log('[CampaignsAPI] Sample image URLs:', sample);
      } catch {}
      return campaigns;
    } catch (error) {
      console.warn('[CampaignsAPI] Failed to fetch campaigns:', error?.message || error);
      // Return empty array on error to prevent UI crashes
      return [];
    }
  },

  /**
   * Track campaign impression (campaign shown to user).
   * 
   * Should be called when campaign becomes 50%+ visible for 500ms.
   * Silently fails to avoid blocking UI.
   * 
   * @param {number} campaignId - Campaign ID
   */
  trackImpression: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/api/v1/public_app/campaigns/${campaignId}/track`, {
        method: 'POST',
        body: JSON.stringify({ interaction_type: 'IMPRESSION' }),
        _suppressErrorLog: true,
        timeoutMs: 2500
      });
      console.log(`[CampaignsAPI] ✓ Tracked impression for campaign ${campaignId}`);
    } catch (error) {
      // Completely silent - analytics should never disrupt UX
      if (djangoAPI._debug) console.warn('[CampaignsAPI] Impression tracking failed:', error?.message);
    }
  },

  /**
   * Track campaign click (user tapped campaign banner).
   * 
   * Should be called when user taps/presses campaign card.
   * Silently fails to avoid blocking UI.
   * 
   * @param {number} campaignId - Campaign ID
   */
  trackClick: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/api/v1/public_app/campaigns/${campaignId}/track`, {
        method: 'POST',
        body: JSON.stringify({ interaction_type: 'CLICK' }),
        _suppressErrorLog: true,
        timeoutMs: 2500
      });
      console.log(`[CampaignsAPI] ✓ Tracked click for campaign ${campaignId}`);
    } catch (error) {
      // Completely silent - analytics should never disrupt UX
      if (djangoAPI._debug) console.warn('[CampaignsAPI] Click tracking failed:', error?.message);
    }
  },

  /**
   * Track campaign conversion (user completed desired action).
   * 
   * Should be called when user completes campaign goal
   * (e.g., submitted quote, purchased policy).
   * 
   * @param {number} campaignId - Campaign ID
   */
  trackConversion: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/api/v1/public_app/campaigns/${campaignId}/track`, {
        method: 'POST',
        body: JSON.stringify({ interaction_type: 'CONVERSION' }),
        _suppressErrorLog: true,
        timeoutMs: 2500
      });
      console.log(`[CampaignsAPI] ✓ Tracked conversion for campaign ${campaignId}`);
    } catch (error) {
      // Completely silent - analytics should never disrupt UX
      if (djangoAPI._debug) console.warn('[CampaignsAPI] Conversion tracking failed:', error?.message);
    }
  },

  /**
   * Track campaign dismissal (user closed/dismissed campaign).
   * 
   * Optional: Use if you have dismiss/close buttons on campaigns.
   * 
   * @param {number} campaignId - Campaign ID
   */
  trackDismiss: async (campaignId) => {
    try {
      await djangoAPI.makeRequest(`/api/v1/public_app/campaigns/${campaignId}/track`, {
        method: 'POST',
        body: JSON.stringify({ interaction_type: 'DISMISS' }),
        _suppressErrorLog: true,
        timeoutMs: 2500
      });
      console.log(`[CampaignsAPI] ✓ Tracked dismiss for campaign ${campaignId}`);
    } catch (error) {
      // Completely silent - analytics should never disrupt UX
      if (djangoAPI._debug) console.warn('[CampaignsAPI] Dismiss tracking failed:', error?.message);
    }
  }
};

export default campaignsAPI;
