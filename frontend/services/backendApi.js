// Lightweight backend API client for the Django server
import AsyncStorage from '@react-native-async-storage/async-storage';
// Default to Android emulator loopback unless EXPO_PUBLIC_API_BASE_URL or EXPO_PUBLIC_API_URL is provided
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

async function getStoredToken() {
  try {
    const saved = await AsyncStorage.getItem('user');
    return saved ? JSON.parse(saved)?.tokens?.access : undefined;
  } catch (e) {
    return undefined;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const bearer = token || (await getStoredToken());
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (isJson && data && (data.detail || data.message || data.error)) || res.statusText;
    const err = new Error(message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function login(email, password) {
  return request('/api/auth/login/', { method: 'POST', body: { email, password } });
}

export function signup(userData) {
  return request('/api/auth/register/', { method: 'POST', body: userData });
}

// Fetch authenticated profile
export function profile(token) {
  return request('/api/auth/profile/', { method: 'GET', token });
}

// Insurance: providers, quotes, policies
export function getProviders(token) {
  // Backend exposes underwriters via InsuranceViewset action
  // Full path: /api/insurance/insurance/underwriters
  return request('/api/insurance/insurance/underwriters', { method: 'GET', token });
}

export function getQuote(body, token) {
  return request('/api/insurance/policies/get_quote/', { method: 'POST', body, token });
}

export function createPolicy(body, token) {
  return request('/api/insurance/policies/', { method: 'POST', body, token });
}

export function updatePolicyStatus(policyId, body, token) {
  return request(`/api/insurance/policies/${policyId}/update_status/`, { method: 'PATCH', body, token });
}

// Dashboard + Insurance helpers
export function getDashboardOverview(token) {
  return request('/api/insurance/dashboard/overview/', { method: 'GET', token });
}

export function getPolicies(token, params = {}) {
  const query = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  return request(`/api/insurance/policies/${query}`, { method: 'GET', token });
}

export function getCalculations(token) {
  return request('/api/insurance/calculations/', { method: 'GET', token });
}

// TOR (Third Party Only Risk) Insurance functions
export function getTORQuote(body, token) {
  return request('/api/insurance/tor/quote/', { method: 'POST', body, token });
}

export async function uploadTORDocuments(formData, token) {
  // Special handling for file uploads
  const headers = {};
  const bearer = token || (await getStoredToken());
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  return fetch(`${BASE_URL}/api/insurance/tor/documents/`, {
    method: 'POST',
    headers,
    body: formData, // FormData object for file uploads
  }).then(async (res) => {
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      const message = (isJson && data && (data.detail || data.message || data.error)) || res.statusText;
      const err = new Error(message || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  });
}

export function processTORPayment(body, token) {
  return request('/api/insurance/payment/', { method: 'POST', body, token });
}

export function getTORReceipt(policyId, token) {
  return request(`/api/insurance/receipt/${policyId}/`, { method: 'GET', token });
}

// DMVIC Integration functions
export function dmvicHealth(token) {
  return request('/api/dmvic/health/', { method: 'GET', token });
}

export function verifyVehicle(body, token) {
  return request('/api/dmvic/service/verify_vehicle/', { method: 'POST', body, token });
}

export function issueCertificate(policyId, token) {
  return request(`/api/insurance/policies/${policyId}/issue_certificate/`, { method: 'POST', token });
}

export function downloadCertificate(policyId, token) {
  return request(`/api/insurance/policies/${policyId}/download_certificate/`, { method: 'GET', token });
}

export function get(path, token) {
  return request(path, { method: 'GET', token });
}

export function post(path, body, token) {
  return request(path, { method: 'POST', body, token });
}

export const API_BASE_URL = BASE_URL;