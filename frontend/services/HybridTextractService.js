// HybridTextractService - helpers around Django doc status/result endpoints
import DjangoAPIService from './DjangoAPIService';

import Constants from 'expo-constants';

function asBool(v) {
  if (v === true) return true;
  if (typeof v === 'string') return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
  return false;
}

const ENABLE_LIVE = (() => {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  if (asBool(env.EXPO_PUBLIC_ENABLE_AWS_DOCS)) return true;
  const extra = Constants?.expoConfig?.extra || {};
  return asBool(extra.docsPipelineEnabled);
})();

async function ensureInit() { try { await DjangoAPIService.initialize(); } catch {} }

export const HybridTextractService = {
  pollUntilDone: async (jobId, { timeoutMs = 60000, intervalMs = 1500 } = {}) => {
    if (!ENABLE_LIVE) return { success: false, disabled: true };
    await ensureInit();
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const { data: st } = await DjangoAPIService.makeAuthenticatedRequest(`/api/v1/public_app/docs/status/${jobId}`, 'GET');
      if (st.state === 'DONE') {
        const { data: result } = await DjangoAPIService.makeAuthenticatedRequest(`/api/v1/public_app/docs/result/${jobId}`, 'GET');
        return { success: true, result };
      }
      if (st.state === 'FAILED') return { success: false, error: st.error || 'Failed' };
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return { success: false, error: 'Timeout' };
  }
};

export default HybridTextractService;