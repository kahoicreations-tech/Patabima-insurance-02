import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { InteractionManager } from 'react-native';
import djangoAPI from '../services/DjangoAPIService';
import { usersAPI } from '../services/users';
import commissionsAPI from '../services/commissions';
import { useAuth } from './AuthContext';

// Simple in-memory TTL cache durations (ms)
const TTL = {
  user: 5 * 60 * 1000, // 5 min
  quotes: 2 * 60 * 1000, // 2 min
  manualQuotes: 2 * 60 * 1000,
  motorPolicies: 2 * 60 * 1000,
  renewals: 3 * 60 * 1000,
  extensions: 3 * 60 * 1000,
  claims: 3 * 60 * 1000,
  commissions: 5 * 60 * 1000,
};

const AppDataContext = createContext(null);

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
};

export const AppDataProvider = ({ children }) => {
  // Get auth state from AuthContext
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Data state
  const [user, setUser] = useState(null);
  const [legacyQuotes, setLegacyQuotes] = useState([]);
  const [motorPolicies, setMotorPolicies] = useState([]);
  const [manualQuotes, setManualQuotes] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [claims, setClaims] = useState([]);
  const [commissionSummary, setCommissionSummary] = useState(null);
  const [commissionList, setCommissionList] = useState([]);

  // Loading/errors
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Cache timestamps
  const ts = useRef({});

  const isFresh = useCallback((key) => {
    const now = Date.now();
    const last = ts.current[key] || 0;
    return now - last < (TTL[key] || 60000);
  }, []);

  const markFresh = useCallback((key) => {
    ts.current[key] = Date.now();
  }, []);

  // Individual fetchers (idempotent, safe on error)
  const fetchUser = useCallback(async (force = false) => {
    if (!force && isFresh('user') && user) return user;
    try {
      console.log('[AppDataContext] fetchUser: Starting...');
      const data = await usersAPI.getCurrentUser();
      console.log('[AppDataContext] fetchUser: Success');
      setUser(data);
      markFresh('user');
      return data;
    } catch (e) {
      console.error('[AppDataContext] fetchUser: Error', e?.message || e);
      setErrors((prev) => ({ ...prev, user: e }));
      return null;
    }
  }, [isFresh, markFresh, user]);

  const fetchLegacyQuotes = useCallback(async (force = false) => {
    if (!force && isFresh('quotes') && legacyQuotes.length) return legacyQuotes;
    try {
      const res = await djangoAPI.getQuotations({ _suppressErrorLog: true });
      const items = Array.isArray(res) ? res : (res?.quotations || res?.results || []);
      setLegacyQuotes(items);
      markFresh('quotes');
      return items;
    } catch (e) {
      setErrors((prev) => ({ ...prev, quotes: e }));
      return [];
    }
  }, [isFresh, markFresh, legacyQuotes.length]);

  const fetchMotorPolicies = useCallback(async (force = false) => {
    if (!force && isFresh('motorPolicies') && motorPolicies.length) return motorPolicies;
    try {
      const items = await djangoAPI.getMotorPolicies({ _suppressErrorLog: true });
      setMotorPolicies(items || []);
      markFresh('motorPolicies');
      return items || [];
    } catch (e) {
      setErrors((prev) => ({ ...prev, motorPolicies: e }));
      return [];
    }
  }, [isFresh, markFresh, motorPolicies.length]);

  const fetchManualQuotes = useCallback(async (force = false) => {
    if (!force && isFresh('manualQuotes') && manualQuotes.length) return manualQuotes;
    try {
      const items = await djangoAPI.listManualQuotes();
      setManualQuotes(items || []);
      markFresh('manualQuotes');
      return items || [];
    } catch (e) {
      setErrors((prev) => ({ ...prev, manualQuotes: e }));
      return [];
    }
  }, [isFresh, markFresh, manualQuotes.length]);

  const fetchRenewals = useCallback(async (force = false) => {
    if (!force && isFresh('renewals') && renewals.length) return renewals;
    try {
      const items = await djangoAPI.getUpcomingRenewals();
      setRenewals(items || []);
      markFresh('renewals');
      return items || [];
    } catch (e) {
      setErrors((prev) => ({ ...prev, renewals: e }));
      return [];
    }
  }, [isFresh, markFresh, renewals.length]);

  const fetchExtensions = useCallback(async (force = false) => {
    if (!force && isFresh('extensions') && extensions.length) return extensions;
    try {
      const items = await djangoAPI.getUpcomingExtensions();
      console.log('[AppDataContext] Fetched extensions:', items.length, 'items from API');
      console.log('[AppDataContext] Extension IDs:', items.map(e => `${e.id} - ${e.policyNo || e.policy_number}`));
      
      // Check for duplicates by ID and policy number
      const ids = items.map(e => e.id);
      const policyNumbers = items.map(e => e.policyNo || e.policy_number);
      const uniqueIds = [...new Set(ids)];
      const uniquePolicyNumbers = [...new Set(policyNumbers)];
      
      if (ids.length !== uniqueIds.length || policyNumbers.length !== uniquePolicyNumbers.length) {
        console.warn('[AppDataContext] ⚠️  DUPLICATE EXTENSIONS DETECTED!');
        console.warn('[AppDataContext] Total items:', items.length);
        console.warn('[AppDataContext] Unique IDs:', uniqueIds.length);
        console.warn('[AppDataContext] Unique Policy Numbers:', uniquePolicyNumbers.length);
        
        // Deduplicate by policy number (most reliable identifier)
        const deduplicatedItems = items.filter((item, index, self) => 
          index === self.findIndex(t => (t.policyNo || t.policy_number) === (item.policyNo || item.policy_number))
        );
        console.log('[AppDataContext] ✅ Deduplicated to', deduplicatedItems.length, 'unique extensions');
        setExtensions(deduplicatedItems);
        markFresh('extensions');
        return deduplicatedItems;
      }
      
      setExtensions(items || []);
      markFresh('extensions');
      return items || [];
    } catch (e) {
      setErrors((prev) => ({ ...prev, extensions: e }));
      return [];
    }
  }, [isFresh, markFresh, extensions.length]);

  const fetchClaims = useCallback(async (force = false) => {
    if (!force && isFresh('claims') && claims.length) return claims;
    try {
      const json = await djangoAPI.getClaims({ _suppressErrorLog: true });
      const list = Array.isArray(json?.results) ? json.results : (Array.isArray(json?.claims) ? json.claims : (Array.isArray(json) ? json : []));
      setClaims(list);
      markFresh('claims');
      return list;
    } catch (e) {
      // Silently catch auth errors (user not logged in yet)
      const isAuthError = e?.message?.includes('401') || e?.message?.includes('Unauthorized');
      if (!isAuthError) {
        setErrors((prev) => ({ ...prev, claims: e }));
      }
      return [];
    }
  }, [isFresh, markFresh, claims.length]);

  const fetchCommissions = useCallback(async (force = false) => {
    if (!force && isFresh('commissions') && commissionList.length && commissionSummary) return { list: commissionList, summary: commissionSummary };
    try {
      const [summary, list] = await Promise.all([
        commissionsAPI.getSummary(),
        commissionsAPI.getList({ limit: 20 })
      ]);
      setCommissionSummary(summary);
      setCommissionList(list);
      markFresh('commissions');
      return { summary, list };
    } catch (e) {
      setErrors((prev) => ({ ...prev, commissions: e }));
      return { summary: null, list: [] };
    }
  }, [isFresh, markFresh, commissionList.length, commissionSummary]);

  // Bulk prefetch
  const fetchAll = useCallback(async (force = false) => {
    setLoading(true);
    try {
      await djangoAPI.initialize();
      const results = await Promise.allSettled([
        fetchUser(force),
        fetchLegacyQuotes(force),
        fetchMotorPolicies(force),
        fetchManualQuotes(force),
        fetchRenewals(force),
        fetchExtensions(force),
        fetchClaims(force),
        fetchCommissions(force),
      ]);
      return results;
    } finally {
      setLoading(false);
    }
  }, [fetchUser, fetchLegacyQuotes, fetchMotorPolicies, fetchManualQuotes, fetchRenewals, fetchExtensions, fetchClaims, fetchCommissions]);

  // Prefetch on mount (optimize perceived startup):
  // 1) Initialize API and fetch user eagerly for header/profile
  // 2) Defer heavier lists until after initial interactions to avoid jank
  useEffect(() => {
    console.log('[AppDataContext] useEffect: Starting initialization...');
    let cancelled = false;

    (async () => {
      try {
        console.log('[AppDataContext] Initializing Django API...');
        await djangoAPI.initialize();
        console.log('[AppDataContext] Django API initialized');
      } catch (e) {
        console.warn('[AppDataContext] Django API init error:', e);
      }

      if (cancelled) return;

      // Wait for auth check to complete
      if (authLoading) {
        console.log('[AppDataContext] ⏳ Waiting for auth check to complete...');
        return;
      }

      // Only fetch data if user is authenticated
      if (!isAuthenticated) {
        console.log('[AppDataContext] ⚠️ Skipping data fetch - user not authenticated');
        return;
      }

      console.log('[AppDataContext] ✅ User authenticated - fetching data...');
      
      // Fetch user with timeout to prevent hanging
      const fetchWithTimeout = async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout')), 10000)
        );
        
        try {
          await Promise.race([fetchUser(false), timeoutPromise]);
          console.log('[AppDataContext] User fetch complete');
        } catch (err) {
          console.warn('[AppDataContext] User fetch failed or timed out:', err?.message);
        }
      };

      await fetchWithTimeout();

      if (cancelled) return;
      console.log('[AppDataContext] Scheduling deferred data fetch...');
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        console.log('[AppDataContext] Running deferred data fetch...');
        // fire-and-forget; individual fetchers handle errors and freshness
        fetchLegacyQuotes(false);
        fetchMotorPolicies(false);
        fetchManualQuotes(false);
        fetchRenewals(false);
        fetchExtensions(false);
        fetchClaims(false);
        fetchCommissions(false);
      });
    })();

    return () => { 
      console.log('[AppDataContext] useEffect cleanup');
      cancelled = true; 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]); // Re-run when auth state changes

  const value = useMemo(() => ({
    // state
    user,
    legacyQuotes,
    motorPolicies,
    manualQuotes,
    renewals,
    extensions,
    claims,
    commissionSummary,
    commissionList,
    loading,
    errors,
    // operations
    fetchAll,
    fetchUser,
    fetchLegacyQuotes,
    fetchMotorPolicies,
    fetchManualQuotes,
    fetchRenewals,
    fetchExtensions,
    fetchClaims,
    fetchCommissions,
  }), [user, legacyQuotes, motorPolicies, manualQuotes, renewals, extensions, claims, commissionSummary, commissionList, loading, errors, fetchAll, fetchUser, fetchLegacyQuotes, fetchMotorPolicies, fetchManualQuotes, fetchRenewals, fetchExtensions, fetchClaims, fetchCommissions]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataContext;
