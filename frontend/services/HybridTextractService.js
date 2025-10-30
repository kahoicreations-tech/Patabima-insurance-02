// HybridTextractService - helpers around Django doc status/result endpoints
import DjangoAPIService from './DjangoAPIService';

const ENABLE_LIVE = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_ENABLE_AWS_DOCS === 'true');

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