/**
 * Django Backend Integration Service
 * 
 * Handles all API communication with the Django backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';
import SecureTokenStorage from './SecureTokenStorage';

// Django backend configuration - Updated to match actual backend
const API_CONFIG = {
  // Check environment variables first, then fall back to conditional defaults
  BASE_URL: (typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL)) 
    ? (process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL)
    : (__DEV__ ? 'http://127.0.0.1:8000' : 'http://ec2-34-203-241-81.compute-1.amazonaws.com'),
  API_VERSION: 'api/v1',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/v1/public_app/auth/login',
      AUTH_LOGIN: '/api/v1/public_app/auth/auth_login',
      SIGNUP: '/api/v1/public_app/auth/signup',
      VALIDATE_PHONE: '/api/v1/public_app/auth/validate_phone',
      RESET_PASSWORD: '/api/v1/public_app/auth/reset_password_self',
      REFRESH_TOKEN: '/api/v1/public_app/auth/token/refresh', // Standard JWT refresh endpoint
    },
    USER: {
      GET_USER: '/api/v1/public_app/user/get_user',
      GET_CURRENT_USER: '/api/v1/public_app/user/get_current_user',
    },
    // Insurance endpoints - Using working endpoints from URL config
    INSURANCE: {
      // Motor quotation flows (match backend ViewSet actions with correct DRF paths)
      SUBMIT_MOTOR: '/api/v1/public_app/insurance/submit_motor_quotation',
      GET_QUOTATIONS: '/api/v1/public_app/insurance/get_quotations',
      GET_QUOTATION_DETAIL: '/api/v1/public_app/insurance/get_quotation_detail',
      CALCULATE_PREMIUM: '/api/v1/public_app/insurance/calculate_motor_premium',
      GET_UNDERWRITERS: '/api/v1/public_app/insurance/get_underwriters',
      // Motor categories (working from logs)
      MOTOR_CATEGORIES: '/api/v1/public_app/insurance/motor_categories',
      // Compare pricing
      COMPARE_MOTOR_PRICING: '/api/v1/public_app/insurance/compare_motor_pricing',
    },
    CONFIG: {
      COVER_OPTIONS: '/api/v1/public_app/config/cover_options',
      UNDERWRITERS: '/api/v1/public_app/config/underwriters',
    },
    INTEGRATIONS: {
      VEHICLE_CHECK: '/api/v1/public_app/integrations/vehicle_check',
    },
    DOCUMENTS: {
      UPLOAD: '/api/v1/public_app/documents/upload',
    },
    PAYMENTS: {
      INITIATE: '/api/v1/public_app/payments/initiate',
      STATUS: '/api/v1/public_app/payments/status',
      WEBHOOK: '/api/v1/public_app/payments/webhook',
    },
    // Policies - Combined Motor 2 and legacy endpoints
    POLICIES: {
      // Motor 2 Policy Management
      CREATE_MOTOR_POLICY: '/api/v1/policies/motor/create/',
      GET_MOTOR_POLICIES: '/api/v1/policies/motor/',
      GET_MOTOR_POLICY: '/api/v1/policies/motor', // + /{policy_number}/ (slash added in code)
      // Motor 2 Renewal Endpoints
      GET_UPCOMING_RENEWALS: '/api/v1/policies/motor/upcoming-renewals/',
      CHECK_RENEWAL_ELIGIBILITY: '/api/v1/policies/motor', // + /{policy_number}/renewal-eligibility/
      RENEW_MOTOR_POLICY: '/api/v1/policies/motor', // + /{policy_number}/renew/
      // Motor 2 Extension Endpoints
      GET_UPCOMING_EXTENSIONS: '/api/v1/policies/motor/upcoming-extensions/',
      CHECK_EXTENSION_ELIGIBILITY: '/api/v1/policies/motor', // + /{policy_number}/extension-eligibility/
      EXTEND_MOTOR_POLICY: '/api/v1/policies/motor', // + /{policy_number}/extend/
      // Legacy policy operations
      ISSUE: '/api/v1/public_app/policies/issue',
    },
    NOTIFICATIONS: {
      LIST: '/api/v1/public_app/notifications/list',
    },
    CLAIMS: {
      PRESIGN: '/api/insurance/claims/presign',
      SUBMIT: '/api/insurance/claims/submit',
      LIST: '/api/insurance/claims',
      DETAIL: '/api/insurance/claims', // + /{id}
    },
    MULTILINE: {
      // Updated to unified public_app base (backend exposes these under /api/v1/public_app/*)
      LINES: '/api/v1/public_app/lines',
      LINE_PRODUCTS: (code) => `/api/v1/public_app/lines/${code}/products`,
      PRODUCT_FORM_SCHEMA: (id) => `/api/v1/public_app/products/${id}/form-schema`,
      CREATE_QUOTE: '/api/v1/public_app/quotes/create',
      QUOTES_BASE: '/api/v1/public_app/quotes',
      QUOTE_UPDATE_INPUTS: (qn) => `/api/v1/public_app/quotes/${qn}/update-inputs`,
      QUOTE_CALCULATE: (qn) => `/api/v1/public_app/quotes/${qn}/calculate`,
      QUOTE_SUBMIT: (qn) => `/api/v1/public_app/quotes/${qn}/submit`,
      QUOTE_CONVERT: (qn) => `/api/v1/public_app/quotes/${qn}/convert`,
      QUOTE_APPROVE: (qn) => `/api/v1/public_app/quotes/${qn}/approve`,
      QUOTE_REJECT: (qn) => `/api/v1/public_app/quotes/${qn}/reject`,
      QUOTES_PENDING_ADMIN: '/api/v1/public_app/quotes/admin/pending'
    },
    MANUAL: {
      SUBMIT: '/api/v1/public_app/insurance/submit_manual_quote'
    },
    MANUAL_QUOTES: {
      CREATE: '/api/v1/public_app/manual_quotes',
      LIST: '/api/v1/public_app/manual_quotes',
      DETAIL: (reference) => `/api/v1/public_app/manual_quotes/${reference}`,
      ADMIN_LIST: '/api/v1/public_app/admin/manual_quotes',
      ADMIN_DETAIL: (reference) => `/api/v1/public_app/admin/manual_quotes/${reference}`,
      ADMIN_UPDATE: (reference) => `/api/v1/public_app/admin/manual_quotes/${reference}`
    }
  }
};

class DjangoAPIService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.token = null;
    this.refreshToken = null;
    this.agentData = null;
    // When a refresh attempt hard-fails we freeze protected calls until user re-auths
    this._authLocked = false;
    // Track last used endpoints per logical operation for debugging
    this._lastUsedEndpoints = {};
    // Minimize console noise by default; toggle via enableDebug/disableDebug
    this._debug = false;
    // Session monitoring
    this._monitoringInterval = null;
    this._refreshInProgress = false;
    this._queuedRequests = [];
  // De-duplicate identical in-flight requests (method+url+body)
  this._inflight = new Map();
    this._onSessionExpired = null;
    this._onTokenRefreshed = null;
    // Feature-flag: generic (multiline) quotes endpoints under /public_app/quotes
    // Default disabled to avoid 404 spam when backend doesn't expose these routes.
    // Opt-in by setting expoConfig.extra.ENABLE_GENERIC_QUOTES = true in app config.
    this._supportsGenericQuotes = !!(Constants && Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.ENABLE_GENERIC_QUOTES);
    // Lightweight in-memory cache to reduce repeated network calls (TTL-based)
    this._cache = new Map();
  }

  // Debug controls
  enableDebug() { this._debug = true; }
  disableDebug() { this._debug = false; }
  setDebug(v) { this._debug = !!v; }

  // Cache management
  clearCache(pattern = null) {
    if (!pattern) {
      // Clear all cache
      this._cache.clear();
      if (this._debug) console.log('[DjangoAPIService] All cache cleared');
      return;
    }
    
    // Clear cache matching pattern (e.g., 'field_req_', 'motor_cat_', etc.)
    let cleared = 0;
    for (const key of this._cache.keys()) {
      if (key.includes(pattern)) {
        this._cache.delete(key);
        cleared++;
      }
    }
    if (this._debug) console.log(`[DjangoAPIService] Cleared ${cleared} cache entries matching '${pattern}'`);
  }

  clearMotor2Cache() {
    // Clear all Motor2-related cached data
    this.clearCache('field_req_');
    this.clearCache('motor_cat_');
    this.clearCache('motor_subcat_');
    if (this._debug) console.log('[DjangoAPIService] Motor2 cache cleared');
  }

  // Session monitoring controls
  startSessionMonitoring() {
    if (this._monitoringInterval) {
      return; // Already monitoring
    }

    if (this._debug) console.log('[DjangoAPIService] Starting session monitoring');
    
    this._monitoringInterval = setInterval(async () => {
      try {
        const isExpiringSoon = await SecureTokenStorage.isTokenExpiringSoon();
        
        if (isExpiringSoon && !this._refreshInProgress) {
          if (this._debug) console.log('[DjangoAPIService] Token expiring soon, refreshing proactively');
          await this.refreshTokenFlow();
        }
      } catch (error) {
        if (this._debug) console.error('[DjangoAPIService] Session monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  stopSessionMonitoring() {
    if (this._monitoringInterval) {
      if (this._debug) console.log('[DjangoAPIService] Stopping session monitoring');
      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;
    }
  }

  // Session event callbacks
  setOnSessionExpired(callback) {
    this._onSessionExpired = callback;
  }

  setOnTokenRefreshed(callback) {
    this._onTokenRefreshed = callback;
  }

  // Backward compatibility: axios-like authenticated request wrapper
  // Usage compatibility: makeAuthenticatedRequest(url, method = 'GET', body = null)
  async makeAuthenticatedRequest(url, method = 'GET', body = null, extraOptions = {}) {
    try {
      const isAbsolute = /^https?:/i.test(url);

      // For relative URLs, leverage existing token/refresh logic
      if (!isAbsolute) {
        const options = { method, ...(extraOptions || {}) };
        if (body !== null && body !== undefined) {
          options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        const json = await this.makeRequest(url, options);
        return { data: json };
      }

      // Absolute URLs: perform a direct authenticated fetch
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (this.token) {
        defaultHeaders['Authorization'] = `Bearer ${this.token}`;
      }

      const requestOptions = {
        method,
        headers: defaultHeaders,
      };

      if (body !== null && body !== undefined) {
        requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      const json = await response.json();
      if (!response.ok) {
        const err = new Error(`HTTP ${response.status}${json?.message ? `: ${json.message}` : ''}`);
        err.response = { status: response.status, data: json };
        throw err;
      }
      return { data: json };
    } catch (error) {
      throw error;
    }
  }

  // Allow dynamic base URL updates for React Native network compatibility
  updateBaseUrl(newBaseUrl) {
    this.baseUrl = newBaseUrl;
    if (this._debug) console.log(`[DjangoAPIService] Base URL updated to: ${newBaseUrl}`);
  }

  // Initialize service with authentication
  async initialize() {
    try {
      // Prefer explicit env/config when provided
      const envObj = (typeof process !== 'undefined' && process.env) ? process.env : {};
      const envUrl = envObj.EXPO_PUBLIC_API_BASE_URL || envObj.EXPO_PUBLIC_API_URL || (Constants?.expoConfig?.extra?.apiUrl || null);
      // Read any previously stored URL once (needed later for localhost fix decision)
      let storedUrl = await AsyncStorage.getItem('api_base_url');

      // IMPORTANT: Always prefer env URL over stored URL
      // If env URL exists, clear any old stored URL to prevent conflicts
      if (envUrl) {
        this.updateBaseUrl(envUrl);
        if (storedUrl) {
          await AsyncStorage.removeItem('api_base_url'); // Clear old stored URL
          storedUrl = null;
        }
        if (this._debug) console.log('[DjangoAPIService] Using env URL (cleared storage if existed):', envUrl);
      } else if (storedUrl) {
        // Only use stored URL if no env URL provided
        this.updateBaseUrl(storedUrl);
        if (this._debug) console.log('[DjangoAPIService] Using stored URL:', storedUrl);
      }

      // Use SecureTokenStorage for token management
      const token = await SecureTokenStorage.getAccessToken();
      const refresh = await SecureTokenStorage.getRefreshToken();
      const agentData = await AsyncStorage.getItem('agent_data');
      
      if (this._debug) {
        console.log('[DjangoAPIService] Token found:', token ? 'YES' : 'NO');
        console.log('[DjangoAPIService] Refresh token found:', refresh ? 'YES' : 'NO');
        console.log('[DjangoAPIService] Agent data found:', agentData ? 'YES' : 'NO');
      }
      
      if (token) {
        this.token = token;
        if (this._debug) console.log('[DjangoAPIService] Token loaded:', token.substring(0, 20) + '...');
      }
      if (refresh) {
        this.refreshToken = refresh;
      }
      if (agentData) {
        this.agentData = JSON.parse(agentData);
      }
      
      // ONLY fix localhost/127.0.0.1 URLs if NO explicit env URL was provided
      // This prevents overriding EC2 or production URLs
      if (!envUrl && !storedUrl) {
        try {
          const scriptURL = NativeModules?.SourceCode?.scriptURL;
          const m = scriptURL && scriptURL.match(/^https?:\/\/([^:]+):\d+/);
          const host = m && m[1];
          if (Platform.OS === 'android') {
            if (this.baseUrl.includes('127.0.0.1') || this.baseUrl.includes('localhost')) {
              // Use Android emulator loopback for local Django (port 8000)
              this.updateBaseUrl('http://10.0.2.2:8000');
              if (this._debug) console.log('[DjangoAPIService] Android: Using emulator localhost');
            } else if (host && !['127.0.0.1', 'localhost', '10.0.2.2'].includes(host)) {
              // Prefer Metro LAN host if available (assumes backend on 8000)
              this.updateBaseUrl(`http://${host}:8000`);
              if (this._debug) console.log('[DjangoAPIService] Android: Using LAN host:', host);
            }
          } else if (host && (this.baseUrl.includes('127.0.0.1') || this.baseUrl.includes('localhost'))) {
            // iOS simulator / web preview via LAN
            this.updateBaseUrl(`http://${host}:8000`);
            if (this._debug) console.log('[DjangoAPIService] iOS: Using LAN host:', host);
          }
        } catch {}
      }

      // Start session monitoring if we have tokens
      if (token && refresh) {
        this.startSessionMonitoring();
      }

      if (this._debug) console.log('Django API Service initialized. Base URL:', this.baseUrl);
      return true;
    } catch (error) {
      console.error('Failed to initialize Django API Service:', error);
      return false;
    }
  }

  // Generic API request handler
  async makeRequest(endpoint, options = {}) {
    if (this._authLocked && !options._allowWhenLocked) {
      throw new Error('Authentication locked. Please login again.');
    }
    
    // If token is missing but not explicitly locked, try to load it from storage
    if (!this.token && !this._authLocked && !options._tokenLoadAttempted) {
      if (this._debug) console.log('[DjangoAPIService] Token missing, attempting to load from storage...');
      try {
        const token = await SecureTokenStorage.getAccessToken();
        if (token) {
          this.token = token;
          if (this._debug) console.log('[DjangoAPIService] Token loaded from storage');
          // Retry the request with the token loaded
          return this.makeRequest(endpoint, { ...options, _tokenLoadAttempted: true });
        }
      } catch (error) {
        console.warn('[DjangoAPIService] Failed to load token from storage:', error);
      }
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
      if (this._debug) console.log('[DjangoAPIService] Adding Authorization header with token');
    } else {
      if (this._debug) console.log('[DjangoAPIService] No token available - request will be unauthenticated');
    }

    const requestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const retryCount = options._retryCount || 0;
    if ('_retryCount' in requestOptions) {
      delete requestOptions._retryCount;
    }

    try {
      if (this._debug) {
        console.log(`Making request to: ${url}`);
        if (requestOptions.body) {
          try { console.log(`Request body:`, JSON.parse(requestOptions.body)); } catch {}
        }
      }
      
  // Add timeout and support external AbortSignal to prevent hanging requests
  const internalController = new AbortController();
  const timeoutMs = typeof requestOptions.timeoutMs === 'number' ? requestOptions.timeoutMs : (typeof requestOptions._timeoutMs === 'number' ? requestOptions._timeoutMs : 30000);
  if ('timeoutMs' in requestOptions) delete requestOptions.timeoutMs;
  if ('_timeoutMs' in requestOptions) delete requestOptions._timeoutMs;
  const timeoutId = setTimeout(() => internalController.abort(), timeoutMs); // default 30s for EC2, override per-call
  const composedSignal = (() => {
    const ext = requestOptions.signal;
    if (!ext) return internalController.signal;
    if (ext.aborted) {
      internalController.abort();
      return internalController.signal;
    }
    const onAbort = () => internalController.abort();
    ext.addEventListener('abort', onAbort, { once: true });
    return internalController.signal;
  })();

      const { signal, ...restOpts } = requestOptions;
      // Coalesce identical requests
      const method = (requestOptions.method || 'GET').toUpperCase();
      const bodyKey = requestOptions.body || '';
      const reqKey = `${method} ${url} ${bodyKey}`;
      if (this._inflight.has(reqKey)) {
        if (this._debug) console.log('[DjangoAPIService] Reusing in-flight request:', reqKey);
        const existing = this._inflight.get(reqKey);
        const data = await existing; // await the same promise
        return data; // short-circuit to unified response handling below
      }

      const fetchPromise = fetch(url, {
        ...restOpts,
        signal: composedSignal,
      });
      this._inflight.set(reqKey, fetchPromise.then(async (r) => {
        try { return r.clone(); } catch { return r; }
      }).finally(() => {
        // Clean up when settled
        this._inflight.delete(reqKey);
      }));
      const response = await fetchPromise;
      
  clearTimeout(timeoutId);
  if (this._debug) console.log(`Response received from: ${url} - Status: ${response.status}`);
      
      // Handle authentication errors
      if (response.status === 401 && !options._authRetry) {
        // Only attempt refresh when we actually have a refresh token
        if (this.refreshToken) {
          if (this._debug) console.warn('[DjangoAPIService] Received 401. Attempting token refresh...');
          const refreshed = await this.refreshTokenFlow();
          if (refreshed) {
            if (this._debug) console.log('[DjangoAPIService] Token refreshed. Retrying original request.');
            // The recursive call will use the new `this.token`
            return this.makeRequest(endpoint, { ...options, _authRetry: true });
          }
          // If refresh fails with a present refresh token, clear state and lock
          await this.handleAuthError();
          this._authLocked = true;
          throw new Error('Authentication required and token refresh failed. Session locked.');
        }
        // No refresh token available (e.g., before login) → do not lock globally; just propagate 401
        const err = new Error('HTTP 401');
        err.status = 401;
        err.endpoint = endpoint;
        throw err;
      }

      let responseData = null;
      try {
        responseData = await response.json();
      } catch (_) {
        responseData = null;
      }
      
      if (!response.ok) {
        // Log detailed error information for debugging
        if (!options._suppressErrorLog) {
          console.error(`API Error ${response.status}:`, responseData);
        } else {
          if (this._debug) console.warn(`[Suppressed] API Error ${response.status} for ${endpoint}`);
        }
        
        // Create descriptive error message
        let errorMessage = `HTTP ${response.status}`;
        if (responseData?.message) errorMessage += `: ${responseData.message}`;
        if (responseData?.errors) errorMessage += `\nValidation errors: ${JSON.stringify(responseData.errors)}`;
        if (responseData?.detail) errorMessage += `\nDetail: ${responseData.detail}`;
        // Attach richer context to error for callers (status + raw payload)
        const err = new Error(errorMessage);
        err.status = response.status;
        err.payload = responseData;
        err.endpoint = endpoint;
        try {
          if (!options._suppressErrorLog && this._debug) {
            console.log('[DjangoAPIService] Error context:', { endpoint, status: response.status, responseData });
          }
          // Special extra log for multiline quote creation to aid diagnostics
          if (endpoint.includes('/quotes/create')) {
            console.warn('[MultilineQuoteCreate] Failed create quote request. Incoming options:', {
              body: (() => { try { return requestOptions.body && JSON.parse(requestOptions.body); } catch { return requestOptions.body; } })(),
              status: response.status,
              responseData
            });
          }
        } catch {}
        throw err;
      }

      return responseData ?? {};
    } catch (error) {
      if (!options._suppressErrorLog) {
        console.error(`API Request failed for ${endpoint}:`, error);
      } else {
        if (this._debug) console.warn(`[Suppressed] API Request failed for ${endpoint}: ${error?.message || error}`);
      }
      
      // Handle timeout/abort errors
      if (error.name === 'AbortError') {
        if (!options._suppressErrorLog) {
          console.error(`[DjangoAPIService] Request timed out for ${endpoint}`);
        } else if (this._debug) {
          console.warn(`[Suppressed Timeout] ${endpoint}`);
        }
        throw new Error('Request timed out. Please check your network connection.');
      }

      // Network failure fallback: try LAN host then emulator host once
      if (
        typeof error?.message === 'string' &&
        error.message.includes('Network request failed') &&
        retryCount === 0
      ) {
        try {
          const scriptURL = NativeModules?.SourceCode?.scriptURL;
          const m = scriptURL && scriptURL.match(/^https?:\/\/([^:]+):\d+/);
          const host = m && m[1];
          const candidates = [];
          if (host && !['127.0.0.1', 'localhost'].includes(host)) {
            candidates.push(`http://${host}:8000`);
          }
          candidates.push('http://10.0.2.2:8000');
          candidates.push('http://127.0.0.1:8000');

          const nextBase = candidates.find(b => b !== this.baseUrl);
          if (nextBase) {
            if (this._debug) console.warn(`[DjangoAPIService] Network failed on ${this.baseUrl}. Retrying via ${nextBase} ...`);
            this.updateBaseUrl(nextBase);
            return this.makeRequest(endpoint, { ...options, _retryCount: 1 });
          }
        } catch {}
      }

      throw error;
    }
  }

  // ==============================
  // Claims API
  // ==============================
  async presignClaimDocument({ fileName, contentType, docType }) {
    const payload = { fileName, contentType, docType };
    const json = await this.makeRequest(API_CONFIG.ENDPOINTS.CLAIMS.PRESIGN, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return json;
  }

  async submitClaim({ policy_number, product = 'MOTOR', loss_date, loss_location, loss_description, documents = [] }) {
    const payload = { policy_number, product, loss_date, loss_location, loss_description, documents };
    const json = await this.makeRequest(API_CONFIG.ENDPOINTS.CLAIMS.SUBMIT, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return json;
  }

  async getClaims(options = {}) {
    try {
      return await this.makeRequest(API_CONFIG.ENDPOINTS.CLAIMS.LIST, { method: 'GET', ...options });
    } catch (error) {
      // Return empty array for auth errors instead of throwing
      const isAuthError = error?.status === 401 || error?.status === 403 ||
                         error?.message?.includes('401') || error?.message?.includes('403');
      if (isAuthError) {
        if (!options?._suppressErrorLog) {
          console.log('[DjangoAPIService] Claims require authentication - user not logged in');
        }
        return { claims: [] };
      }
      throw error;
    }
  }

  async getClaim(id, options = {}) {
    try {
      return await this.makeRequest(`${API_CONFIG.ENDPOINTS.CLAIMS.DETAIL}/${id}`, { method: 'GET', ...options });
    } catch (error) {
      const isAuthError = error?.status === 401 || error?.status === 403 ||
                         error?.message?.includes('401') || error?.message?.includes('403');
      if (isAuthError && options?._suppressErrorLog) {
        return null;
      }
      throw error;
    }
  }

  // Record and read the last used endpoint for a given operation key
  _setLastUsedEndpoint(key, endpoint) {
    try {
      if (key) this._lastUsedEndpoints[key] = endpoint;
    } catch {}
  }
  getLastUsedEndpoint(key) {
    try {
      return this._lastUsedEndpoints?.[key] || null;
    } catch {
      return null;
    }
  }

  // Try multiple endpoints and return the first successful response
  async tryEndpoints(endpoints = [], options = {}) {
    let lastErr = null;
    if (this._debug) {
      try { console.log('[DjangoAPIService] Probing endpoints:', endpoints); } catch {}
    }
    for (const ep of endpoints) {
      try {
        // Always suppress error logs while probing
        const data = await this.makeRequest(ep, { ...options, _suppressErrorLog: true });
        if (this._debug) { try { console.log('[DjangoAPIService] Using endpoint:', ep); } catch {} }
        // Persist the endpoint selected for this probe group if a trace key is provided
        if (options && options._traceKey) this._setLastUsedEndpoint(options._traceKey, ep);
        return data;
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || '');
        // If caller requests to stop on 401, rethrow immediately to avoid falling back to public endpoints
        if (options && options._breakOn401 && msg.includes('HTTP 401')) {
          throw e;
        }
        // Continue on 404/Not Found and 301/302 redirects; break on 401 only if not probing auth-free endpoints
        if (msg.includes('HTTP 404') || msg.includes('HTTP 301') || msg.includes('HTTP 302')) {
          continue;
        }
        // For other errors, continue trying next candidate as well (keeps discovery resilient)
        continue;
      }
    }
    if (lastErr) throw lastErr;
    throw new Error('No candidate endpoints succeeded');
  }

  // Convenience motor helpers
  async getMotorCategories(options = {}) {
    // Prefer new dedicated motor endpoints exposed by backend
    const candidates = [
      // Canonical endpoints (motor2 preferred, fallback to legacy motor)
      '/api/v1/motor2/categories/',
      '/api/v1/motor/categories/',
    ];
    // Cache categories for 10 minutes to reduce network churn
    const cacheKey = 'motor_categories:all';
    try {
      const cached = this._cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        if (this._debug) console.log('[DjangoAPIService] getMotorCategories cache hit');
        return cached.data;
      }
    } catch {}
    const data = await this.tryEndpoints(candidates, { ...options, _traceKey: 'motor_categories' });
    try { this._cache.set(cacheKey, { data, expires: Date.now() + 10 * 60 * 1000 }); } catch {}
    return data;
  }

  // Get subcategories for a category from new motor endpoints
  async getSubcategories(categoryCode, options = {}) {
    if (!categoryCode) throw new Error('categoryCode is required');
    const qs = `?category=${encodeURIComponent(categoryCode)}`;
    const cacheKey = `motor_subcategories:${categoryCode.toUpperCase()}`;
    // Serve from cache for 10 minutes if available
    try {
      const cached = this._cache.get(cacheKey);
      if (cached && cached.expires > Date.now() && Array.isArray(cached.data)) {
        if (this._debug) console.log('[DjangoAPIService] getSubcategories cache hit:', categoryCode);
        return cached.data;
      }
    } catch {}
    const candidates = [
      // Prefer motor2 endpoint first, then legacy motor
      `/api/v1/motor2/subcategories/${qs}`,
      `/api/v1/motor/subcategories/${qs}`,
    ];
    const res = await this.tryEndpoints(candidates, { ...options, _traceKey: 'motor_subcategories' });
    // Normalize shapes: either array or { subcategories: [...] }
    let out = [];
    if (Array.isArray(res)) out = res;
    else if (Array.isArray(res?.subcategories)) out = res.subcategories;
    else if (Array.isArray(res?.results)) out = res.results;
    // Cache successful result
    try { this._cache.set(cacheKey, { data: out, expires: Date.now() + 10 * 60 * 1000 }); } catch {}
    return out;
  }

  // Get cover types for a category from new motor endpoints
  // getCoverTypes method removed - deprecated in favor of subcategory-only approach

  // Get full field requirements for a category + subcategory
  // Accepts either:
  // - getFieldRequirements('PRIVATE', 'PRIVATE_THIRD_PARTY')
  // - getFieldRequirements('PRIVATE', { subcategory_code: 'PRIVATE_THIRD_PARTY' })
  async getFieldRequirements(categoryCode, codeOrObj, options = {}) {
    if (!categoryCode || !codeOrObj) throw new Error('categoryCode and identifier are required');

    let subcategoryCode = null;

    if (typeof codeOrObj === 'object' && codeOrObj !== null) {
      subcategoryCode = codeOrObj.subcategory_code || codeOrObj.subcategoryCode || null;
    } else {
      subcategoryCode = String(codeOrObj);
    }

    // Allow options to override if explicitly provided
    if (options && options.subcategory_code && !subcategoryCode) subcategoryCode = String(options.subcategory_code);

    // Smart caching for field requirements (15 min TTL)
    const cacheKey = `field_req_${categoryCode}_${subcategoryCode || 'all'}`;
    if (!options._skipCache) {
      const cached = this._cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        if (this._debug) console.log(`[DjangoAPIService] Using cached field requirements for ${categoryCode}/${subcategoryCode}`);
        return cached.data;
      }
    }

    const params = [
      `category=${encodeURIComponent(categoryCode)}`,
    ];
    if (subcategoryCode) params.push(`subcategory=${encodeURIComponent(subcategoryCode)}`);
    const qs = `?${params.join('&')}`;

    const candidates = [
      `/api/v1/motor/field-requirements/${qs}`,
      `/api/v1/motor/field-requirements/${qs.replace(/^\?/, '')}`,
    ];
    
    const data = await this.tryEndpoints(candidates, { ...options, _traceKey: 'motor_field_requirements' });
    
    // Cache the field requirements for 15 minutes
    try { 
      this._cache.set(cacheKey, { data, expires: Date.now() + 15 * 60 * 1000 }); 
      if (this._debug) console.log(`[DjangoAPIService] Cached field requirements for ${categoryCode}/${subcategoryCode}`);
    } catch {}
    
    return data;
  }
  async getMotorPricing(params, options = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.makeRequest(`/api/v1/public_app/insurance/motor_pricing?${qs}`, options);
  }
  async calculateMotorPremium(payload, options = {}) {
    const bodyOptions = { method: 'POST', body: JSON.stringify(payload), ...options };
    const candidates = [
      // Public app calculate endpoints (working)
      '/api/v1/public_app/insurance/calculate_motor_premium',
      '/api/v1/public_app/insurance/calculate_motor_premium/',
      // Backward-compatible alias
      '/api/v1/public_app/insurance/calculate_premium',
      '/api/v1/public_app/insurance/calculate_premium/',
    ];

    let lastErr = null;
    for (const ep of candidates) {
      try {
        // Suppress 404 spam while probing
        if (this._debug) console.log('[DjangoAPIService] calculateMotorPremium candidates:', candidates);
        const res = await this.makeRequest(ep, { ...bodyOptions, _suppressErrorLog: true });
        if (this._debug) console.log('[DjangoAPIService] calculateMotorPremium using:', ep);
        this._setLastUsedEndpoint('calculateMotorPremium', ep);
        return res;
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || '');
        // Continue on 404/Not Found; break on validation errors or 401 to bubble back to caller
        if (msg.includes('HTTP 404')) continue;
        // Still continue for other errors to try next candidate
        continue;
      }
    }
    if (lastErr) throw lastErr;
    throw new Error('Premium calculation endpoint not found');
  }

  // Compare motor pricing across multiple underwriters
  async compareMotorPricing(payload, options = {}) {
    const bodyOptions = { method: 'POST', body: JSON.stringify(payload), ...options };
    const candidates = [
      // Public app compare endpoints (working)
      '/api/v1/public_app/insurance/compare_motor_pricing',
      '/api/v1/public_app/insurance/compare_motor_pricing/',
    ];
    let lastErr = null;
    for (const ep of candidates) {
      try {
        if (this._debug) console.log('[DjangoAPIService] compareMotorPricing candidates:', candidates);
        const res = await this.makeRequest(ep, { ...bodyOptions, _suppressErrorLog: true });
        if (this._debug) console.log('[DjangoAPIService] compareMotorPricing using:', ep);
        this._setLastUsedEndpoint('compareMotorPricing', ep);
        return res;
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || '');
        if (msg.includes('HTTP 404')) continue;
        continue;
      }
    }
    if (lastErr) throw lastErr;
    throw new Error('Compare pricing endpoint not found');
  }

  // Handle token refresh flow
  async refreshTokenFlow() {
    if (!this.refreshToken) {
      console.log('[DjangoAPIService] No refresh token available for refresh flow.');
      return false;
    }

    // If already refreshing, wait for the current refresh to complete
    if (this._refreshInProgress) {
      if (this._debug) console.log('[DjangoAPIService] Refresh already in progress, waiting...');
      return new Promise((resolve) => {
        this._queuedRequests.push(resolve);
      });
    }

    this._refreshInProgress = true;

    try {
      if (this._debug) console.log('[DjangoAPIService] Attempting to refresh access token.');
      const url = `${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[DjangoAPIService] Token refresh failed:', responseData);
        this._refreshInProgress = false;
        
        // Notify queued requests of failure
        this._queuedRequests.forEach(resolve => resolve(false));
        this._queuedRequests = [];
        
        // Notify session expired callback
        if (this._onSessionExpired) {
          this._onSessionExpired();
        }
        
        return false;
      }

      if (this._debug) console.log('[DjangoAPIService] Token refreshed successfully.');
      
      // Update tokens in memory and secure storage
      this.token = responseData.access;
      await SecureTokenStorage.storeTokens(
        responseData.access,
        this.refreshToken, // Keep existing refresh token
        this.agentData
      );
      
      // Also store in AsyncStorage for backward compatibility
      await AsyncStorage.setItem('auth_token', responseData.access);
      await AsyncStorage.setItem('accessToken', responseData.access);
      
      this._refreshInProgress = false;
      
      // Notify queued requests of success
      this._queuedRequests.forEach(resolve => resolve(true));
      this._queuedRequests = [];
      
      // Notify token refreshed callback
      if (this._onTokenRefreshed) {
        this._onTokenRefreshed();
      }
      
      return true;
    } catch (error) {
      console.error('[DjangoAPIService] Token refresh request failed:', error);
      this._refreshInProgress = false;
      
      // Notify queued requests of failure
      this._queuedRequests.forEach(resolve => resolve(false));
      this._queuedRequests = [];
      
      return false;
    }
  }

  // Django Authentication methods - Updated to match actual backend
  async login(phonenumber, password) {
    try {
      // Step 1: Initial login to get OTP
      const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          phonenumber: phonenumber, // 9 digits without leading 0
          password: password,
        }),
        _allowWhenLocked: true,
      });

      return {
        success: true,
        message: response.detail,
        otpCode: response.otp_code, // For development - contains the OTP code
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async authenticateWithOTP(phonenumber, password, otpCode) {
    try {
      // Step 2: Complete authentication with OTP
      const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          phonenumber: phonenumber,
          password: password,
          code: otpCode,
        }),
        _allowWhenLocked: true,
      });

      if (response.access) {
        this.token = response.access;
        this.refreshToken = response.refresh;
        // Clear any auth lock after successful re-auth
        this._authLocked = false;
        
        // Get user profile first
        await this.getCurrentUser();
        
        // Store tokens securely with user data
        await SecureTokenStorage.storeTokens(
          response.access,
          response.refresh,
          this.agentData
        );
        
        // Also store in AsyncStorage for backward compatibility
        await AsyncStorage.setItem('auth_token', response.access);
        await AsyncStorage.setItem('accessToken', response.access);
        await AsyncStorage.setItem('refresh_token', response.refresh);
        await AsyncStorage.setItem('refreshToken', response.refresh);
        
        // Start session monitoring
        this.startSessionMonitoring();
      }

      return {
        success: true,
        userRole: response.user_role,
        expiresAt: response.expires_at,
      };
    } catch (error) {
      console.error('OTP Authentication failed:', error);
      throw error;
    }
  }

  async signup(userData) {
    try {
      const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        body: JSON.stringify({
          phonenumber: userData.phonenumber,
          full_names: userData.fullNames,
          email: userData.email,
          user_role: userData.userRole, // 'AGENT' or 'CUSTOMER'
          password: userData.password,
          confirm_password: userData.confirmPassword,
        }),
      });

      return {
        success: true,
        message: response.detail,
        userId: response.user_id,
      };
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  }

  async validatePhone(phonenumber) {
    try {
      const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.VALIDATE_PHONE, {
        method: 'POST',
        body: JSON.stringify({
          phonenumber: phonenumber,
        }),
      });

      return {
        success: true,
        message: response.detail,
      };
    } catch (error) {
      console.error('Phone validation failed:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.makeRequest(API_CONFIG.ENDPOINTS.USER.GET_CURRENT_USER, { _allowWhenLocked: true });
      this.agentData = response;
      await AsyncStorage.setItem('agent_data', JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }

  async resetPassword(oldPassword, newPassword, confirmPassword) {
    try {
      const response = await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({
          old_password: oldPassword,
          password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      return {
        success: true,
        message: response.detail,
      };
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  async handleAuthError() {
    // Stop session monitoring
    this.stopSessionMonitoring();
    
    // Clear tokens from memory
    this.token = null;
    this.refreshToken = null;
    this.agentData = null;
    
    // Clear from secure storage
    await SecureTokenStorage.clearAll();
    
    // Also clear from AsyncStorage for backward compatibility
    await AsyncStorage.multiRemove(['auth_token','accessToken','refresh_token','refreshToken','agent_data']);
    
    // Notify session expired callback
    if (this._onSessionExpired) {
      this._onSessionExpired();
    }
  }

  // Insurance form submission - Updated for Django backend
  async submitMotorInsuranceForm(formData, serviceData = {}) {
    try {
      const submissionPayload = {
        // Vehicle Information
        vehicle_make: formData.vehicle_make,
        vehicle_model: formData.vehicle_model,
        vehicle_year: parseInt(formData.vehicle_year),
        vehicle_registration: formData.vehicle_registration,
        chassis_number: formData.chassis_number || '',
        engine_number: formData.engine_number || '',
        subcategory: formData.subcategory || formData.subcategory_code,
        
        // Owner Information
        owner_name: formData.owner_name,
        owner_id_number: formData.owner_id_number,
        owner_kra_pin: formData.owner_kra_pin || '',
        owner_phone: formData.owner_phone,
        owner_email: formData.owner_email || '',
        
        // Policy Dates
        cover_start_date: formData.cover_start_date,
        cover_end_date: formData.cover_end_date,
        
        // Additional Information
        vehicle_usage: formData.vehicle_usage || '',
        vehicle_color: formData.vehicle_color || '',
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
        financial_interest: formData.financial_interest || 'NO',
        underwriter_id: formData.underwriter_id || '',
        underwriter_name: formData.underwriter_name || '',
        underwriter_price: formData.underwriter_price || null,
      };

      // Remove null fields to avoid backend "may not be null" validation errors
      if (submissionPayload.seating_capacity === null) {
        delete submissionPayload.seating_capacity;
      }

      // Conditionally include service data only when present
      if (serviceData && serviceData.dmvic) {
        submissionPayload.dmvic_data = serviceData.dmvic;
      }
      if (serviceData && serviceData.textract) {
        submissionPayload.textract_data = serviceData.textract;
      }

      const candidates = [
        API_CONFIG.ENDPOINTS.INSURANCE.SUBMIT_MOTOR,
        '/api/insurance/submit_motor_quotation',
        '/api/insurance/submit_motor_quotation/',
      ];
      const response = await this.tryEndpoints(candidates, {
        method: 'POST',
        body: JSON.stringify(submissionPayload),
      });

      if (this._debug) console.log('Motor insurance form submitted successfully:', response);
      return response;
    } catch (error) {
      console.error('Motor insurance form submission failed:', error);
      throw error;
    }
  }

  // Get agent's quotations
  async getQuotations(options = {}) {
    try {
      // Try multiple known routes: public_app and direct insurance app
      const candidates = [
        API_CONFIG.ENDPOINTS.INSURANCE.GET_QUOTATIONS,
        '/api/insurance/get_quotations',
        '/api/insurance/get_quotations/',
      ];
      const response = await this.tryEndpoints(candidates, options);
      return response;
    } catch (error) {
      // Check if it's an authentication error - return empty array instead of throwing
      const isAuthError = error?.status === 401 || error?.status === 403 ||
                         error?.message?.includes('401') || error?.message?.includes('403') ||
                         error?.message?.includes('Unauthorized');
      
      if (isAuthError) {
        if (!options?._suppressErrorLog) {
          console.log('[DjangoAPIService] Quotations require authentication - user not logged in');
        }
        return { quotations: [] }; // Return empty quotations instead of throwing
      }
      
      // For other errors, log and throw
      if (!options?._suppressErrorLog) {
        console.error('Failed to fetch quotations:', error.message);
      }
      throw error;
    }
  }

  // Get detailed quotation information
  async getQuotationDetail(quotationId) {
    try {
      const candidates = [
        `${API_CONFIG.ENDPOINTS.INSURANCE.GET_QUOTATION_DETAIL}?quotation_id=${quotationId}`,
        `/api/insurance/get_quotation_detail?quotation_id=${quotationId}`,
        `/api/insurance/get_quotation_detail/?quotation_id=${quotationId}`,
      ];
      const response = await this.tryEndpoints(candidates);
      return response;
    } catch (error) {
      console.error('Failed to fetch quotation detail:', error);
      throw error;
    }
  }

  // Calculate premium
  async calculatePremium(vehicleData) {
    try {
      // Require at least make + year; proceed even if unauth (backend may allow public). If hard 401, bubble up.
      const response = await this.makeRequest(API_CONFIG.ENDPOINTS.INSURANCE.CALCULATE_PREMIUM, {
        method: 'POST',
        body: JSON.stringify({
          vehicle_year: parseInt(vehicleData.vehicle_year),
          vehicle_make: vehicleData.vehicle_make,
          subcategory: vehicleData.subcategory || vehicleData.subcategory_code,
        }),
      });
      return response;
    } catch (error) {
      console.error('Failed to calculate premium:', error);
      throw error;
    }
  }

  // Get available underwriters from insurance app
  // Accepts either a string (insuranceType) or an object with optional filters
  // Example: getUnderwriters({ category_code: 'PRIVATE', subcategory_code: 'PRIVATE_TP' })
  async getUnderwriters(params = 'motor') {
    // Build filters and query string outside try to be available in catch
    const filters = (params && typeof params === 'object') ? params : {};
    const queryKVs = Object.entries(filters)
      .filter(([k, v]) => v !== undefined && v !== null && String(v).length > 0)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    const querySuffix = queryKVs.length ? queryKVs.join('&') : '';
    // Cache key per filter set
    const cacheKey = `underwriters:${querySuffix || 'all'}`;
    // Serve from cache if valid
    try {
      const cached = this._cache.get(cacheKey);
      if (cached && cached.expires > Date.now() && Array.isArray(cached.data)) {
        if (this._debug) console.log('[DjangoAPIService] getUnderwriters cache hit:', cacheKey);
        return cached.data;
      }
    } catch {}
    try {
      if (this._debug) console.log('[DjangoAPIService] Fetching underwriters');
      // Use only canonical public endpoints exposed by backend
      const baseCandidates = [
        '/api/v1/public_app/insurance/get_underwriters',
        '/api/v1/public_app/insurance/get_underwriters/',
      ];
      const candidates = querySuffix
        ? baseCandidates.map((ep) => `${ep}?${querySuffix}`)
        : baseCandidates;
      if (this._debug) {
        console.log(
          `[DjangoAPIService] Underwriters candidates (auth=${this.token ? 'YES' : 'NO'}):`,
          candidates
        );
      }
      const response = await this.tryEndpoints(candidates, { 
        _suppressErrorLog: true, 
        _traceKey: 'underwriters', 
        _breakOn401: true,
        timeoutMs: 40000 // Longer timeout for underwriters on EC2 (40s)
      });

      // Normalize various possible response shapes
      // Possible shapes:
      // - [ {code,name,...}, ... ]
      // - { results: [...], count, next, prev }
      // - { data: [...] }
      // - { underwriters: [...] }
      // - { data: { underwriters: [...] } }
      let providers = null;
      if (Array.isArray(response)) {
        providers = response;
      } else if (Array.isArray(response?.results)) {
        providers = response.results;
      } else if (Array.isArray(response?.data)) {
        providers = response.data;
      } else if (Array.isArray(response?.underwriters)) {
        providers = response.underwriters;
      } else if (Array.isArray(response?.data?.underwriters)) {
        providers = response.data.underwriters;
      }

      const size = Array.isArray(providers) ? providers.length : 0;
      if (this._debug) console.log('[DjangoAPIService] Got providers response, normalized size:', size);
      if (!Array.isArray(providers)) return [];
      const normalized = providers.map((p, idx) => {
        const name = p.name || p.company_name || p.title || `Underwriter ${idx + 1}`;
        const code = p.code || p.company_code || p.underwriter_code || (name ? String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_') : `UW_${idx + 1}`);
        return { ...p, name, code };
      });
      // Store in cache for 5 minutes
      try { this._cache.set(cacheKey, { data: normalized, expires: Date.now() + 5 * 60 * 1000 }); } catch {}
      if (this._debug) { try { console.log('[DjangoAPIService] Returning underwriters:', normalized); } catch {} }
      return normalized;
    } catch (error) {
      console.error('Failed to fetch underwriters from insurance app:', error);
      const msg = String(error?.message || '');
      // If not authenticated, allow a final public/config fallback; when authenticated, do NOT fall back to public
      if (!this.token && (msg.includes('Authentication required') || msg.includes('HTTP 401') || msg.includes('404'))) {
        try {
          if (this._debug) console.log('[DjangoAPIService] Falling back to config underwriters endpoint');
          const qs = querySuffix ? `${API_CONFIG.ENDPOINTS.CONFIG.UNDERWRITERS}?${querySuffix}` : API_CONFIG.ENDPOINTS.CONFIG.UNDERWRITERS;
          const fallback = await this.makeRequest(qs);
          const out = fallback?.underwriters || fallback || [];
          try { this._cache.set(cacheKey, { data: out, expires: Date.now() + 5 * 60 * 1000 }); } catch {}
          return out;
        } catch (e2) {
          console.error('Fallback underwriters fetch failed:', e2);
        }
      }
      throw error;
    }
  }

  // ---------------- Manual (Non-Motor) Simplified Quotations ----------------
  /**
   * Submit a simplified non-motor quotation (Travel, Personal Accident, Last Expense, etc.)
   * Data is stored server-side for admin manual processing. Returns a reference id.
   * @param {string} lineKey - Identifier e.g. 'TRAVEL' | 'PERSONAL_ACCIDENT' | 'LAST_EXPENSE'
   * @param {object} formData - Raw form payload (already validated client-side)
   * @returns {Promise<object>} server response with reference and status
   */
  async submitManualQuote(lineKey, formData) {
    if (!lineKey) throw new Error('lineKey required');
    try {
      const body = {
        line_key: lineKey,
        payload: formData,
        preferred_underwriters: formData?.preferredUnderwriters || formData?.preferred_underwriters || [],
        notes: formData?.notes || '',
        app_version: Constants?.expoConfig?.version || '1.0.0'
      };
      // Use the correct endpoint - manual_quotes ViewSet
      const res = await this.makeRequest(API_CONFIG.ENDPOINTS.MANUAL_QUOTES.CREATE, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return res;
    } catch (error) {
      console.error('[DjangoAPIService] submitManualQuote failed', error);
      throw error;
    }
  }

  // Config: cover options
  async getCoverOptions() {
    try {
      // Optional endpoint: suppress error logs at request level
      return await this.makeRequest(API_CONFIG.ENDPOINTS.CONFIG.COVER_OPTIONS, { _suppressErrorLog: true });
    } catch (error) {
      // Swallow 404 and other errors silently since cover options are optional
      const msg = String(error?.message || '');
      if (this._debug) console.warn('[DjangoAPIService] getCoverOptions failed:', msg);
      return null;
    }
  }

  // Insurance: get add-ons (public) with optional underwriter override
  async getAddons({ category, subcategory_code, underwriter_code } = {}) {
    try {
      const params = [];
      if (category) params.push(`category=${encodeURIComponent(category)}`);
      if (subcategory_code) params.push(`subcategory_code=${encodeURIComponent(subcategory_code)}`);
      if (underwriter_code) params.push(`underwriter_code=${encodeURIComponent(underwriter_code)}`);
      const qs = params.length ? `?${params.join('&')}` : '';
      // Prefer new backend endpoint shipped in this repo
      const candidates = [
        `/api/v1/public_app/insurance/addons${qs}`,
        `/api/v1/public_app/insurance/addons/${qs}`,
      ];
      const res = await this.tryEndpoints(candidates, { _suppressErrorLog: true, _traceKey: 'addons' });
      // Normalize shapes
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.addons)) return res.addons;
      if (Array.isArray(res?.results)) return res.results;
      if (Array.isArray(res?.data?.addons)) return res.data.addons;
      return [];
    } catch (err) {
      // Fallback quietly to legacy cover options behavior
      const legacy = await this.getCoverOptions();
      if (!legacy) return [];
      if (Array.isArray(legacy?.addons)) return legacy.addons;
      if (Array.isArray(legacy)) return legacy;
      if (Array.isArray(legacy?.results)) return legacy.results;
      if (Array.isArray(legacy?.data?.addons)) return legacy.data.addons;
      return [];
    }
  }

  // Integrations: vehicle check (DMVIC + existing cover)
  async vehicleCheck({ vehicle_registration, vehicle_make, vehicle_model, vehicle_year }) {
    try {
      // Skip if no reg yet
      if (!vehicle_registration || vehicle_registration.length < 3) return null;
      return await this.makeRequest(API_CONFIG.ENDPOINTS.INTEGRATIONS.VEHICLE_CHECK, {
        method: 'POST',
        body: JSON.stringify({ vehicle_registration, vehicle_make, vehicle_model, vehicle_year: parseInt(vehicle_year) }),
      });
    } catch (error) {
      console.error('Vehicle check failed:', error);
      throw error;
    }
  }

  // Documents: upload (returns OCR in backend mock)
  async uploadDocument(payload) {
    try {
      return await this.makeRequest(API_CONFIG.ENDPOINTS.DOCUMENTS.UPLOAD, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  // Payments: initiate and status
  async initiatePayment({ amount, method = 'MPESA', phone }) {
    try {
      const body = { amount, method };
      if (phone) body.phone = phone;
      return await this.makeRequest(API_CONFIG.ENDPOINTS.PAYMENTS.INITIATE, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Payment initiation failed:', error);
      throw error;
    }
  }

  async getPaymentStatus(reference) {
    try {
      const endpoint = `${API_CONFIG.ENDPOINTS.PAYMENTS.STATUS}?reference=${encodeURIComponent(reference)}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      console.error('Get payment status failed:', error);
      throw error;
    }
  }

  // Policies: issue
  async issuePolicy(quotation_id) {
    try {
      return await this.makeRequest(API_CONFIG.ENDPOINTS.POLICIES.ISSUE, {
        method: 'POST',
        body: JSON.stringify({ quotation_id }),
      });
    } catch (error) {
      console.error('Policy issuance failed:', error);
      throw error;
    }
  }

  // Notifications: list
  async getNotifications() {
    try {
      return await this.makeRequest(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST);
    } catch (error) {
      console.error('Fetch notifications failed:', error);
      throw error;
    }
  }

  // ========================================
  // Motor 2 Policy Management
  // ========================================

  /**
   * Get all motor policies for the authenticated user
   * @param {Object} options - Optional filters like status
   * @returns {Promise<Array>} List of motor policies
   */
  async getMotorPolicies(options = {}) {
    try {
      const { status, signal, _suppressErrorLog } = options;
      let url = API_CONFIG.ENDPOINTS.POLICIES.GET_MOTOR_POLICIES;
      
      // Add query parameters if provided
      if (status) {
        url += `?status=${encodeURIComponent(status)}`;
      }

      const { data } = await this.makeAuthenticatedRequest(url, 'GET', null, { signal });
      
      // Backend returns { success, count, policies }
      if (data?.success && Array.isArray(data.policies)) {
        return data.policies;
      }
      
      return [];
    } catch (error) {
      // Check if it's an authentication error (401/403) - return empty array instead of throwing
      const isAuthError = error?.status === 401 || error?.status === 403 ||
                         error?.message?.includes('401') || error?.message?.includes('403') ||
                         error?.message?.includes('Unauthorized');
      
      if (isAuthError) {
        if (!_suppressErrorLog) {
          console.log('[DjangoAPIService] Motor policies require authentication - user not logged in');
        }
        return []; // Return empty array instead of throwing
      }
      
      // For other errors, log and throw
      if (!_suppressErrorLog) {
        console.error('Failed to fetch motor policies:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get a specific motor policy by policy number
   * @param {string} policyNumber - The policy number
   * @returns {Promise<Object>} Policy details
   */
  async getMotorPolicy(policyNumber) {
    try {
      const url = `${API_CONFIG.ENDPOINTS.POLICIES.GET_MOTOR_POLICY}/${policyNumber}`;
  const { data } = await this.makeAuthenticatedRequest(url, 'GET');
      
      // Backend returns { success, policy }
      if (data?.success && data.policy) {
        return data.policy;
      }
      
      throw new Error('Policy not found');
    } catch (error) {
      console.error(`Failed to fetch motor policy ${policyNumber}:`, error);
      throw error;
    }
  }

  /**
   * Create a new motor policy (called from PolicySubmission component)
   * @param {Object} policyData - Complete policy data
   * @returns {Promise<Object>} Created policy info with policy number
   */
  async createMotorPolicy(policyData) {
    try {
      // Compute a stable idempotency key to avoid duplicate policy creation on retries
      const reg = policyData?.vehicleDetails?.registration || policyData?.vehicle_details?.registration || '';
      const cover = policyData?.productDetails?.coverageType || policyData?.product_details?.coverageType || '';
      const quote = String(policyData?.quoteId || policyData?.quote_id || '');
      const basis = `${reg}|${cover}|${quote}`;
      let hash = 0;
      for (let i = 0; i < basis.length; i++) {
        hash = ((hash << 5) - hash) + basis.charCodeAt(i);
        hash |= 0; // Convert to 32bit int
      }
      const idemKey = `pb-idem-${Math.abs(hash).toString(36)}`;

      const { data } = await this.makeAuthenticatedRequest(
        API_CONFIG.ENDPOINTS.POLICIES.CREATE_MOTOR_POLICY,
        'POST',
        policyData,
        { headers: { 'X-Idempotency-Key': idemKey } }
      );
      
      // Backend returns { success, policyNumber, policyId, pdfUrl, message, status, submittedAt }
      if (data?.success) {
        return data;
      }
      
      throw new Error(data?.message || 'Failed to create policy');
    } catch (error) {
      console.error('Failed to create motor policy:', error);
      throw error;
    }
  }

  // Motor 2 Renewal Methods

  /**
   * Get upcoming renewals for Motor 2 policies
   * @returns {Promise<Array>} List of policies eligible for renewal
   */
  async getUpcomingRenewals() {
    try {
      const { data } = await this.makeAuthenticatedRequest(
        API_CONFIG.ENDPOINTS.POLICIES.GET_UPCOMING_RENEWALS,
        'GET'
      );
      
      if (data?.success) {
        return data.renewals || [];
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch upcoming renewals:', error);
      return [];
    }
  }

  /**
   * Check if a policy is eligible for renewal
   * @param {string} policyNumber - Policy number to check
   * @returns {Promise<Object>}
   */
  async checkRenewalEligibility(policyNumber) {
    try {
      const url = `${API_CONFIG.ENDPOINTS.POLICIES.CHECK_RENEWAL_ELIGIBILITY}/${policyNumber}/renewal-eligibility/`;
  const { data } = await this.makeAuthenticatedRequest(url, 'GET');
      
      // Backend returns { success, eligible, message }
      if (data?.success) {
        return {
          eligible: data.eligible,
          message: data.message || (data.eligible ? 'Eligible for renewal' : 'Not eligible for renewal'),
        };
      }
      
      return {
        eligible: false,
        message: 'Unknown renewal eligibility',
      };
    } catch (error) {
      console.error('Failed to check renewal eligibility:', error);
      return {
        eligible: false,
        message: 'Error checking eligibility',
      };
    }
  }

  /**
   * Renew a Motor 2 policy
   * @param {string} policyNumber - Policy number to renew
   * @returns {Promise<Object>} Renewal confirmation details
   */
  async renewMotorPolicy(policyNumber) {
    try {
      const url = `${API_CONFIG.ENDPOINTS.POLICIES.RENEW_MOTOR_POLICY}/${policyNumber}/renew/`;
  const { data } = await this.makeAuthenticatedRequest(url, 'POST');
      
      // Backend returns { success, policyNumber, message }
      if (data?.success) {
        return data;
      }
      
      throw new Error(data?.message || 'Failed to renew policy');
    } catch (error) {
      console.error('Failed to renew motor policy:', error);
      throw error;
    }
  }

  // Motor 2 Extension Methods

  /**
   * Get upcoming extensions for Motor 2 policies
   * @returns {Promise<Array>} List of policies eligible for extension
   */
  async getUpcomingExtensions() {
    try {
      const { data } = await this.makeAuthenticatedRequest(
        API_CONFIG.ENDPOINTS.POLICIES.GET_UPCOMING_EXTENSIONS,
        'GET'
      );
      
      if (data?.success) {
        return data.extensions || [];
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch upcoming extensions:', error);
      return [];
    }
  }

  /**
   * Check if a policy is eligible for extension
   * @param {string} policyNumber - Policy number to check
   * @returns {Promise<Object>}
   */
  async checkExtensionEligibility(policyNumber) {
    try {
      const url = `${API_CONFIG.ENDPOINTS.POLICIES.CHECK_EXTENSION_ELIGIBILITY}/${policyNumber}/extension-eligibility/`;
  const { data } = await this.makeAuthenticatedRequest(url, 'GET');
      
      // Backend returns { success, eligible, message }
      if (data?.success) {
        return {
          eligible: data.eligible,
          message: data.message || (data.eligible ? 'Eligible for extension' : 'Not eligible for extension'),
        };
      }
      
      return {
        eligible: false,
        message: 'Unknown extension eligibility',
      };
    } catch (error) {
      console.error('Failed to check extension eligibility:', error);
      return {
        eligible: false,
        message: 'Error checking eligibility',
      };
    }
  }

  /**
   * Extend a Motor 2 policy
   * @param {string} policyNumber - Policy number to extend
   * @param {Object} extensionData - Extension parameters (months, paymentDetails)
   * @returns {Promise<Object>} Extension quote with pricing breakdown
   */
  async extendMotorPolicy(policyNumber, extensionData = {}) {
    try {
      const url = `/api/v1/policies/motor/${policyNumber}/extend/`;
      const { data } = await this.makeAuthenticatedRequest(url, 'POST', extensionData);
      
      // Backend returns { success, extensionQuote, currentExpiryDate, newExpiryDate, message }
      if (data?.success) {
        return data;
      }
      
      throw new Error(data?.error || data?.message || 'Failed to generate extension quote');
    } catch (error) {
      console.error('Failed to extend motor policy:', error);
      throw error;
    }
  }

  /**
   * Renew a Motor 2 policy
   * @param {string} policyNumber - Policy number to renew
   * @param {Object} renewalData - Renewal parameters (clientDetails, vehicleDetails, etc.)
   * @returns {Promise<Object>} Renewal confirmation with new policy number
   */
  async renewMotorPolicy(policyNumber, renewalData = {}) {
    try {
      const url = `/api/v1/policies/motor/${policyNumber}/renew/`;
      const { data } = await this.makeAuthenticatedRequest(url, 'POST', renewalData);
      
      // Backend returns { success, renewedPolicyNumber, renewedPolicyId, originalPolicyNumber, message }
      if (data?.success) {
        return data;
      }
      
      throw new Error(data?.error || data?.message || 'Failed to renew policy');
    } catch (error) {
      console.error('Failed to renew motor policy:', error);
      throw error;
    }
  }

  // Multiline quote lifecycle methods
  async fetchLines() { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.LINES, { method: 'GET' }); }
  async fetchLineProducts(lineCode) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.LINE_PRODUCTS(lineCode), { method: 'GET' }); }
  async fetchProductFormSchema(productId) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.PRODUCT_FORM_SCHEMA(productId), { method: 'GET' }); }
  async createGenericQuote(payload) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.CREATE_QUOTE, { method: 'POST', body: JSON.stringify(payload) }); }
  async updateGenericQuoteInputs(quoteNumber, formData) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.QUOTE_UPDATE_INPUTS(quoteNumber), { method: 'POST', body: JSON.stringify({ form_data: formData }) }); }
  async calculateGenericQuote(quoteNumber) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.QUOTE_CALCULATE(quoteNumber), { method: 'POST' }); }
  async submitGenericQuote(quoteNumber) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.QUOTE_SUBMIT(quoteNumber), { method: 'POST' }); }
  async convertGenericQuote(quoteNumber) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.QUOTE_CONVERT(quoteNumber), { method: 'POST' }); }
  async approveGenericQuote(quoteNumber) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.QUOTE_APPROVE(quoteNumber), { method: 'POST' }); }
  async rejectGenericQuote(quoteNumber) { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.QUOTE_REJECT(quoteNumber), { method: 'POST' }); }
  async listPendingAdminQuotes() { return this.makeRequest(API_CONFIG.ENDPOINTS.MULTILINE.QUOTES_PENDING_ADMIN, { method: 'GET' }); }

  // Manual Quote API methods for medical insurance and other manual pricing lines
  async createMedicalQuote(formData) {
    const payload = {
      line_key: 'MEDICAL',
      payload: formData,
      preferred_underwriters: formData.preferredUnderwriters || []
    };
    return this.makeRequest(API_CONFIG.ENDPOINTS.MANUAL_QUOTES.CREATE, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    });
  }

  async getMedicalQuote(reference) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.MANUAL_QUOTES.DETAIL(reference), { 
      method: 'GET' 
    });
  }

  async listMedicalQuotes() {
    const params = new URLSearchParams({ line_key: 'MEDICAL' });
    const res = await this.makeRequest(`${API_CONFIG.ENDPOINTS.MANUAL_QUOTES.LIST}?${params}`, { 
      method: 'GET', _suppressErrorLog: true
    });
    // Normalize to array regardless of pagination
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.quotes)) return res.quotes;
    return [];
  }

  async listManualQuotes(lineKey = null) {
    const params = new URLSearchParams();
    if (lineKey) params.append('line_key', lineKey);
    const url = `${API_CONFIG.ENDPOINTS.MANUAL_QUOTES.LIST}${params.toString() ? '?' + params : ''}`;
    const res = await this.makeRequest(url, { method: 'GET', _suppressErrorLog: true });
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.quotes)) return res.quotes;
    return [];
  }

  // Admin manual quote methods (for staff/admin users)
  async adminListManualQuotes(filters = {}) {
    const params = new URLSearchParams();
    if (filters.line_key) params.append('line_key', filters.line_key);
    if (filters.status) params.append('status', filters.status);
    if (filters.agent_code) params.append('agent_code', filters.agent_code);
    const url = `${API_CONFIG.ENDPOINTS.MANUAL_QUOTES.ADMIN_LIST}${params.toString() ? '?' + params : ''}`;
    return this.makeRequest(url, { method: 'GET' });
  }

  async adminUpdateManualQuote(reference, updateData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.MANUAL_QUOTES.ADMIN_UPDATE(reference), {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  }

  async getManualQuoteDetail(reference) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.MANUAL_QUOTES.DETAIL(reference), {
      method: 'GET'
    });
  }

  async updateManualQuotePricing(reference, pricingData) {
    return this.adminUpdateManualQuote(reference, pricingData);
  }

  // Fetch single generic quote detail (best-effort; some backends may expose detail at /quotes/{qn})
  async getGenericQuote(quoteNumber) {
    const candidates = [
      `/api/v1/public_app/quotes/${quoteNumber}`,
      `/api/v1/public_app/quotes/${quoteNumber}/`,
    ];
    for (const ep of candidates) {
      try {
        return await this.makeRequest(ep, { method: 'GET' });
      } catch (e) {
        if (this._debug) console.warn('[getGenericQuote] attempt failed', ep, e?.message);
      }
    }
    throw new Error('Quote detail not available');
  }
  // Delete generic quote (graceful fallback: try DELETE then POST to a /delete action if defined)
  async deleteGenericQuote(quoteNumber) {
    const direct = `/api/v1/public_app/quotes/${quoteNumber}`;
    try {
      return await this.makeRequest(direct, { method: 'DELETE' });
    } catch (err) {
      if (err?.status === 404) {
        // Treat missing endpoint or already-deleted quote as success (idempotent)
        if (this._debug) console.warn('[deleteGenericQuote] 404 - treating as success for', quoteNumber);
        return { deleted: true, status: 'not_found_tolerated' };
      }
      if (err?.status === 405) {
        // Try explicit delete endpoint (convention-based)
        const alt = `/api/v1/public_app/quotes/${quoteNumber}/delete`;
        try {
          return await this.makeRequest(alt, { method: 'POST' });
        } catch (e2) {
          throw e2;
        }
      }
      throw err;
    }
  }
  // List all generic (multiline) quotes (includes medical drafts awaiting manual pricing)
  async listGenericQuotes(params = {}) {
    // Skip entirely unless explicitly enabled. Manual quotes are fetched via MANUAL_QUOTES endpoints.
    if (!this._supportsGenericQuotes) {
      if (this._debug) console.log('[listGenericQuotes] Skipped (generic quotes disabled)');
      return [];
    }
    // Allow optional AbortController signal passthrough
    const { signal } = params;
    const base = API_CONFIG.ENDPOINTS.MULTILINE.QUOTES_BASE; // currently '/api/v1/public_app/quotes'
    const candidates = [base + '/', base];
    for (const url of candidates) {
      try {
        const { data } = await this.makeAuthenticatedRequest(url, 'GET', null, { signal, _suppressErrorLog: true });
        let items = [];
        if (Array.isArray(data)) items = data; else items = data?.results || data?.quotes || [];
        if (this._debug) console.log('[listGenericQuotes] url:', url, 'count:', items.length);
        if (items.length) return items;
        // If empty, continue to next candidate (maybe different formatting)
      } catch (err) {
        const msg = String(err?.message || '');
        // Swallow 404s silently across environments where /quotes is not mounted
        if (this._debug) console.warn('[listGenericQuotes] attempt failed:', url, msg);
        if (msg.includes('HTTP 404')) continue;
      }
    }
    return [];
  }

  /**
   * Unified fetch for all user quotations/policies across legacy, motor2, and generic multiline (e.g., medical)
   * Returns a flat array of raw backend objects (not mapped) with a source tag for debugging.
   */
  async getAllUserQuotes(options = {}) {
    const { signal, _suppressErrorLog } = options;
    try {
      const [legacyRes, motorRes, genericRes] = await Promise.allSettled([
        this.getQuotations({ signal, _suppressErrorLog: true }),
        this.getMotorPolicies({ signal, _suppressErrorLog: true }),
        this.listGenericQuotes({ signal })
      ]);

      const collected = [];
      if (legacyRes.status === 'fulfilled') {
        const legacyItems = Array.isArray(legacyRes.value) ? legacyRes.value : (legacyRes.value?.quotations || legacyRes.value?.results || []);
        legacyItems.forEach(item => collected.push({ ...item, __source: 'legacy' }));
      }
      if (motorRes.status === 'fulfilled' && Array.isArray(motorRes.value)) {
        motorRes.value.forEach(item => collected.push({ ...item, __source: 'motor2' }));
      }
      if (genericRes.status === 'fulfilled' && Array.isArray(genericRes.value)) {
        if (this._debug) console.log('[AllUserQuotes] generic count:', genericRes.value.length);
        genericRes.value.forEach(item => collected.push({ ...item, __source: 'generic' }));
      }

      // De-duplicate by a stable key preference order
      const map = new Map();
      for (const q of collected) {
        const baseKey = q.quote_number || q.quotation_id || q.quote_id || q.policy_number || q.id || q.uuid || q.reference || q.ref;
        // Append line/category hint to reduce accidental collisions across different product lines
        const key = baseKey ? `${baseKey}_${(q.line_key || q.line || q.product_line || 'GEN').toString().toUpperCase()}` : null;
        if (!key) {
          map.set(Symbol('rand'), q); // fallback unique
          continue;
        }
        if (!map.has(key)) map.set(key, q);
      }
      const unique = Array.from(map.values());
      if (!options._suppressDebug) {
        console.log('[AllUserQuotes] sources counts:', {
          legacy: collected.filter(c => c.__source==='legacy').length,
          motor2: collected.filter(c => c.__source==='motor2').length,
          generic: collected.filter(c => c.__source==='generic').length,
          unique: unique.length,
        });
      }
      return unique;
    } catch (err) {
      if (!_suppressErrorLog) console.error('Failed unified quotes fetch:', err);
      throw err;
    }
  }

  // ----------------------------------------
  // Authentication status helpers
  // ----------------------------------------
  /**
   * Lightweight synchronous auth status check used across the app.
   * Returns true when we currently hold an access token and the auth
   * layer is not locked after a failed refresh attempt.
   * (Some callers previously expected this to exist; added for backward compatibility.)
   */
  isAuthenticated() {
    return !!this.token && !this._authLocked;
  }

  /**
   * Optional richer status object (not yet widely used).
   */
  getAuthStatus() {
    return {
      authenticated: this.isAuthenticated(),
      hasToken: !!this.token,
      hasRefreshToken: !!this.refreshToken,
      locked: this._authLocked,
      hasAgentData: !!this.agentData,
    };
  }
}

export default new DjangoAPIService();