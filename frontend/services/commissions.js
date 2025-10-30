// Commissions API Service
import apiClient, { API_CONFIG } from './apiConfig';

export const commissionsAPI = {
  getSummary: async (params) => {
    const resp = await apiClient.get(API_CONFIG.ENDPOINTS.COMMISSIONS.SUMMARY, { params });
    return resp.data;
  },
  getList: async (params) => {
    const resp = await apiClient.get(API_CONFIG.ENDPOINTS.COMMISSIONS.LIST, { params });
    const data = resp.data;
    // Support both array response (DRF ListModelMixin) and wrapped { items: [...] }
    if (Array.isArray(data)) return data;
    // Also support DRF pagination default { results: [...], count, next, previous }
    if (Array.isArray(data?.results)) return data.results;
    return data?.items || [];
  },
};

export default commissionsAPI;
